import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

var d3 = require('d3');
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class TopicsGraph extends React.Component {
	constructor(props) {
		super(props);

		this.graphMargins = {
			left: 40,
			right: 10,
			top: 10,
			bottom: 30
		};

		this.topicsCount = 20;

		this.toggleViewModeButtonClickHandler = this.toggleViewModeButtonClickHandler.bind(this);

		this.state = {
			paramString: '',
			data: [],
			total: null,

			viewMode: 'absolute',

			graphContainerWidth: 800,
			graphContainerHeight: 400,

			graphId: 'Graph'+Math.round((new Date()).valueOf()*Math.random())
		};
	}

	componentDidMount() {
		this.renderGraphBase();

		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
		}
	}

	toggleViewModeButtonClickHandler() {
		this.setViewMode(this.state.viewMode == 'absolute' ? 'relative' : 'absolute');
	}

	setViewMode(viewMode) {
		var currentViewMode = this.state.viewMode;

		this.setState({
			viewMode: viewMode
		}, function() {
			if (this.state.viewMode != currentViewMode) {
				this.updateGraph();
			}
		}.bind(this));

	}

	searchHandler(event, data) {
		this.fetchData(data.params);
	}

	fetchData(params) {
		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString) {
			return;
		}

		this.setState({
			paramString: paramString
		});

		fetch(config.apiUrl+(this.props.type == 'titles' ? config.endpoints.title_topics : config.endpoints.topics)+'?'+paramString+'&count='+this.topicsCount)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.hits.total,
					data: json.aggregations.data.data.data.buckets
				}, function() {
					this.renderGraph();
				}.bind(this));
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	renderGraphBase() {
		this.svg = d3.select('#'+this.state.graphId);

		this.tooltip = d3.select('body').append('div').attr('class', 'graph-tooltip');
	}

	updateGraph() {
		this.updateYAxis();
		this.updateBars();
	}

	updateYAxis() {
		var y = this.createYRange();
		this.vis.selectAll('g.y.axis')
			.call(d3.axisLeft(y)
				.ticks(5)
				.tickFormat(function(d) {
					if (this.state.viewMode == 'absolute') {
						return d;
					}
					else if (this.state.viewMode == 'relative') {
						return d*100 < 1 ? d*100 : Math.round(d*100);
					}
				}.bind(this))
				.tickSizeInner([-this.graphWidth])
			);
	}

	updateBars() {
		var y = this.createYRange();

		this.vis.selectAll('.bar')
			.transition()
			.duration(1000)
			.attr('y', function(d) {
				if (this.state.viewMode == 'absolute') {
					return y(d.doc_count);
				}
				else if (this.state.viewMode == 'relative') {
				}
			}.bind(this))
			.attr('height', function(d) {
				if (this.state.viewMode == 'absolute') {
					return this.graphHeight-y(d.doc_count);
				}
				else if (this.state.viewMode == 'relative') {
				}
			}.bind(this));
	}

	createYRange() {
		var yRangeValues = this.state.data.map(function(item) {
			if (this.state.viewMode == 'absolute') {
				return item.doc_count;
			}
			else if (this.state.viewMode == 'relative') {
			}
		}.bind(this));

		var y = d3.scaleLinear()
			.range([this.graphHeight, 0]);

		
		y.domain([0, d3.max(yRangeValues)]);

		return y;
	}

	renderGraph() {
		d3.selectAll('svg#'+this.state.graphId+' > *').remove();

		if (this.state.data.length == 0) {
			return;
		}

		this.graphWidth = this.state.graphContainerWidth-this.graphMargins.left-this.graphMargins.right;
		this.graphHeight = this.state.graphContainerHeight-this.graphMargins.top-this.graphMargins.bottom;

		var x = d3.scaleBand()
			.rangeRound([0, this.graphWidth])
			.padding(0.1);

		x.domain(this.state.data.map(function(d) {
			return d.key;
		}));

		var y = this.createYRange();

		var colorScale = d3.scaleOrdinal(d3.schemeCategory20)

		this.vis = this.svg.append('g')
			.attr('transform', 'translate('+this.graphMargins.left + ','+this.graphMargins.top+')');

		this.vis.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, '+this.graphHeight+')')
			.call(d3.axisBottom(x));

		this.vis.append('g')
			.attr('class', 'y axis')
			.call(d3.axisLeft(y)
				.ticks(5)
				.tickFormat(function(d) {
					if (this.state.viewMode == 'absolute') {
						return d;
					}
					else if (this.state.viewMode == 'relative') {
						return d*100 < 1 ? d*100 : Math.round(d*100);
					}
				}.bind(this))
				.tickSizeInner([-this.graphWidth])
			);

		this.vis.selectAll('.bar')
			.data(this.state.data)
			.enter().append('rect')
			.attr('class', 'bar')
			.attr('x', function(d) {
				return x(d.key);
			})
			.attr('width', x.bandwidth())
			.attr('y', function(d) {
				return y(0);
			}.bind(this))
			.attr('height', function(d) {
				return this.graphHeight-y(0);
			}.bind(this))
			.attr('fill', function(d, i) {
				return colorScale(d.doc_count);
			}).on('mousemove', function(d) {
				this.tooltip
					.style('left', d3.event.pageX - 50 + 'px')
					.style('top', d3.event.pageY - 70 + 'px')
					.style('display', 'inline-block')
					.html('<strong>'+d.key+'</strong>: '+d.doc_count);
				}.bind(this))
				.on('mouseout', function(d) {
					this.tooltip.style('display', 'none');
				}.bind(this));

		this.vis.selectAll('.bar')
			.transition()
			.duration(1000)
			.attr('y', function(d) {
				if (this.state.viewMode == 'absolute') {
					return y(d.doc_count);
				}
				else if (this.state.viewMode == 'relative') {
				}
			}.bind(this))
			.attr('height', function(d) {
				if (this.state.viewMode == 'absolute') {
					return this.graphHeight-y(d.doc_count);
				}
				else if (this.state.viewMode == 'relative') {
				}
			}.bind(this));
	}

	render() {
		return (
			<div className="graph-wrapper">

				{
					this.state.total &&
					<p>Total: {this.state.total}</p>
				}

				<div className='graph-container'>
					<svg id={this.state.graphId} width={this.state.graphContainerWidth} height={this.state.graphContainerHeight} ref='graphContainer'/>
				</div>

				<button onClick={this.toggleViewModeButtonClickHandler}>viewMode: {this.state.viewMode}</button>

			</div>
		);
	}
}