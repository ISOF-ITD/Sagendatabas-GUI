import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

var d3 = require('d3');
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import paramsHelper from './../utils/paramsHelper';

import config from './../config';
import categories from './../../ISOF-React-modules/utils/sagenkartaCategories.js';

export default class CategoriesGraph extends React.Component {
	constructor(props) {
		super(props);

		this.graphMargins = {
			left: 40,
			right: 10,
			top: 10,
			bottom: 30
		};

		this.viewModeSelectChangeHandler = this.viewModeSelectChangeHandler.bind(this);
		this.windowResizeHandler = this.windowResizeHandler.bind(this);

		this.state = {
			paramString: '',
			data: [],
			total: null,

			loading: false,

			viewMode: 'absolute',

			graphContainerWidth: 800,
			graphContainerHeight: this.props.graphHeight || 400,

			graphId: 'Graph'+Math.round((new Date()).valueOf()*Math.random())
		};

		this.fetchTotalCategories();
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

	viewModeSelectChangeHandler(event) {
		this.setViewMode(event.target.value);
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

	getTotalByCategory(category) {
		return _.findWhere(this.totalByCategoryArray, {key: category}).doc_count;
	}

	fetchTotalCategories() {
		fetch(config.apiUrl+config.endpoints.categories)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.totalByCategoryArray = json.aggregations.data.buckets;
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	fetchData(params) {
		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString) {
			return;
		}

		this.setState({
			paramString: paramString,
			loading: true
		});

		fetch(config.apiUrl+config.endpoints.categories+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.hits.total,
					data: json.aggregations.data.buckets,
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
					var total = this.getTotalByCategory(d.key);

					return y(d.doc_count/total);
				}
			}.bind(this))
			.attr('height', function(d) {
				if (this.state.viewMode == 'absolute') {
					return this.graphHeight-y(d.doc_count);
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByCategory(d.key);

					return this.graphHeight-y(d.doc_count/total);
				}
			}.bind(this));
	}

	createYRange() {
		var yRangeValues = this.state.data.map(function(item) {
			if (this.state.viewMode == 'absolute') {
				return item.doc_count;
			}
			else if (this.state.viewMode == 'relative') {
				var total = this.getTotalByCategory(item.key);

				return item.doc_count/total;
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
				var total = this.getTotalByCategory(d.key);

				this.tooltip
					.style('left', d3.event.pageX + 20 + 'px')
					.style('top', d3.event.pageY + 'px')
					.style('display', 'inline-block')
					.html((d.key != ' ' ? '<strong>'+d.key+'</strong>: ' : '')+categories.getCategoryName(d.key)+'<br/>'+d.doc_count+' (total '+total+')');
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
					var total = this.getTotalByCategory(d.key);

					return y(d.doc_count/total);
				}
			}.bind(this))
			.attr('height', function(d) {
				if (this.state.viewMode == 'absolute') {
					return this.graphHeight-y(d.doc_count);
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByCategory(d.key);

					return this.graphHeight-y(d.doc_count/total);
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

				<div className="graph-container">
					<svg id={this.state.graphId} width={this.state.graphContainerWidth} height={this.state.graphContainerHeight} ref='graphContainer'/>
				</div>

				<div className="graph-controls">
					<select value={this.state.viewMode} onChange={this.viewModeSelectChangeHandler}>
						<option value="absolute">absolute</option>
						<option value="relative">relative</option>
					</select>
				</div>

				<div className="loading-overlay"></div>

			</div>
		);
	}
}