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

		this.topicsCount = this.props.count || 20;

		this.sortSelectChangeHandler = this.sortSelectChangeHandler.bind(this);
		this.windowResizeHandler = this.windowResizeHandler.bind(this);

		this.state = {
			paramString: null,
			params: null,
			data: [],
			total: null,

			loading: false,

			sort: 'parent_doc_count',

			graphContainerWidth: 800,
			graphContainerHeight: this.props.graphHeight || 400,

			graphId: 'Graph'+Math.round((new Date()).valueOf()*Math.random())
		};
	}

	componentDidMount() {
		this.setState({
			graphContainerWidth: this.refs.container.clientWidth
		}, function() {
			this.renderGraphBase();
		}.bind(this));

		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
		}

		window.addEventListener('resize', this.windowResizeHandler);
	}

	windowResizeHandler() {
		this.setState({
			graphContainerWidth: this.refs.container.clientWidth
		}, function() {
			this.renderGraph();
		}.bind(this));
	}

	sortSelectChangeHandler(event) {
		this.setSortOrder(event.target.value);
	}

	setSortOrder(sort) {
		var currentSort = this.state.sort;

		this.setState({
			sort: sort
		}, function() {
			if (this.state.sort != currentSort) {
				this.fetchData();
			}
		}.bind(this));

	}

	searchHandler(event, data) {
		if (JSON.stringify(data.params) == JSON.stringify(this.state.params)) {
			return;
		}

		this.setState({
			params: data.params
		}, function() {
			this.fetchData();
		}.bind(this));
	}

	fetchData() {
		var params = this.state.params;
		params.sort = this.state.sort;

		var paramString = paramsHelper.buildParamString(this.state.params);

		this.setState({
			paramString: paramString,
			loading: true
		});

		fetch(config.apiUrl+(this.props.type == 'titles' ? config.endpoints.title_topics : config.endpoints.topics)+'?'+paramString+'&count='+this.topicsCount)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.metadata.total,
					data: json.data,
					loading: false
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
					return d;
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
				if (this.state.sort == 'parent_doc_count') {
					return y(d.doc_count);
				}
				else if (this.state.sort == '_count') {
					return y(d.terms);
				}
			}.bind(this))
			.attr('height', function(d) {
				if (this.state.sort == 'parent_doc_count') {
					return this.graphHeight-y(d.doc_count);
				}
				else if (this.state.sort == '_count') {
					return this.graphHeight-y(d.terms);
				}
			}.bind(this));
	}

	createYRange() {
		var yRangeValues = this.state.data.map(function(item) {
			if (this.state.sort == 'parent_doc_count') {
				return item.doc_count;
			}
			else if (this.state.sort == '_count') {
				return item.terms;
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
			return d.topic;
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
					return d;
				}.bind(this))
				.tickSizeInner([-this.graphWidth])
			);

		this.vis.selectAll('.bar')
			.data(this.state.data)
			.enter().append('rect')
			.attr('class', 'bar')
			.attr('x', function(d) {
				return x(d.topic);
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
			})
			.on('mousemove', function(d) {
				var html = '<strong>'+d.topic+'</strong><br/>'+
					'Terms: '+d.terms+'<br/>'+
					'Documents: '+d.doc_count+'<br/>';
				this.tooltip
					.style('left', d3.event.pageX + 20 + 'px')
					.style('top', d3.event.pageY + 'px')
					.style('display', 'inline-block')
					.html(html);
				}.bind(this))
				.on('mouseout', function(d) {
					this.tooltip.style('display', 'none');
				}.bind(this));

		this.vis.selectAll('.bar')
			.transition()
			.duration(1000)
			.attr('y', function(d) {
				if (this.state.sort == 'parent_doc_count') {
					return y(d.doc_count);
				}
				else if (this.state.sort == '_count') {
					return y(d.terms);
				}
			}.bind(this))
			.attr('height', function(d) {
				if (this.state.sort == 'parent_doc_count') {
					return this.graphHeight-y(d.doc_count);
				}
				else if (this.state.sort == '_count') {
					return this.graphHeight-y(d.terms);
				}
			}.bind(this));
	}

	render() {
		return (
			<div className={'graph-wrapper'+(this.state.loading ? ' loading' : '')} ref="container">

				{
					this.state.total &&
					<div className="total-number">Total: {this.state.total}</div>
				}

				<div className='graph-container'>
					<svg id={this.state.graphId} width={this.state.graphContainerWidth} height={this.state.graphContainerHeight} ref='graphContainer'/>
				</div>

				<div className="graph-controls">
					<select value={this.state.sort} onChange={this.sortSelectChangeHandler}>
						<option value="parent_doc_count">document</option>
						<option value="_count">term</option>
					</select>
				</div>

				<div className="loading-overlay"></div>

			</div>
		);
	}
}