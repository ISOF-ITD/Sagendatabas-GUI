import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

var d3 = require('d3');
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class CollectionYearsGraph extends React.Component {
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
			paramString: null,
			data: [],
			total: null,

			loading: false,

			viewMode: 'absolute',

			graphContainerWidth: 800,
			graphContainerHeight: this.props.graphHeight || 400,

			graphId: 'Graph'+Math.round((new Date()).valueOf()*Math.random())
		};

		this.fetchTotalByYear();
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
		console.log('windowResizeHandler');
		this.setState({
			graphContainerWidth: this.refs.container.clientWidth
		}, function() {
			this.renderGraph(true);
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

	getTotalByYear(year) {
		var found = _.findWhere(this.totalByYearArray, {year: year});

		return found ? found.doc_count : 0;
	}

	fetchTotalByYear() {
		fetch(config.apiUrl+config.endpoints.collection_years)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.totalByYearArray = json.data;
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

		this.timeOverlay = null;

		this.setState({
			paramString: paramString,
			loading: true
		});

		fetch(config.apiUrl+config.endpoints.collection_years+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				var data = [];

				for (var i = config.minYear; i<config.maxYear; i++) {
					var dataItem = _.find(json.data, function(item) {
						return item.year == i;
					});

					data.push(dataItem ? dataItem : {
						year: i,
						doc_count: 0
					});
				}

				this.setState({
					total: json.metadata.total,
					data: data,
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
		this.updateLines();
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

	updateLines() {
		this.xRange = this.createXRange();
		this.yRange = this.createYRange();

		var lineValue = d3.line()
			.x(function(d) {
				return this.xRange(Number(d.year));
			}.bind(this))
			.y(function(d) {
				if (this.state.viewMode == 'absolute') {
					return this.yRange(d.doc_count);
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByYear(d.year);

					return this.yRange(total == 0 ? 0 : d.doc_count/total);
				}
			}.bind(this));

		this.vis.selectAll('path.line')
			.transition()
			.duration(1000)
			.attr('d', lineValue);
	}

	createXRange() {
		var x = d3.scaleTime().range([0,this.graphWidth]);

		x.domain(d3.extent(this.state.data, function(d) {
			return d.year;
		}));

		return x;
	}

	createYRange() {
		var yRangeValues = this.state.data.map(function(item) {
			if (this.state.viewMode == 'absolute') {
				return item.doc_count;
			}
			else if (this.state.viewMode == 'relative') {
				var total = this.getTotalByYear(item.year);

				return item.doc_count/total;
			}
		}.bind(this));

		var y = d3.scaleLinear()
			.range([this.graphHeight, 0]);

		y.domain([0, d3.max(yRangeValues)]);

		return y;
	}

	renderGraph(disableAnimation) {
		d3.selectAll('svg#'+this.state.graphId+' > *').remove();

		if (this.state.data.length == 0) {
			return;
		}

		this.graphWidth = this.state.graphContainerWidth-this.graphMargins.left-this.graphMargins.right;
		this.graphHeight = this.state.graphContainerHeight-this.graphMargins.top-this.graphMargins.bottom;

		this.xRange = this.createXRange();

		this.yRange = this.createYRange();

		var colorScale = d3.scaleOrdinal(d3.schemeCategory20);

		this.vis = this.svg.append('g')
			.attr('transform', 'translate('+this.graphMargins.left + ','+this.graphMargins.top+')');

		this.vis.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, '+this.graphHeight+')')
			.call(d3.axisBottom(this.xRange)
				.tickFormat(d3.format(5, '+%'))
			);

		this.vis.append('g')
			.attr('class', 'y axis')
			.call(d3.axisLeft(this.yRange)
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

		this.axisMarker = this.vis.append('line')
			.attr('class', 'x axis-marker')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', this.graphHeight)
			.style('display', 'none');

		var flatLineValue = d3.line()
			.x(function(d) {
				return this.xRange(Number(d.year));
			}.bind(this))
			.y(this.graphHeight);

		var lineValue = d3.line()
			.x(function(d) {
				return this.xRange(Number(d.year));
			}.bind(this))
			.y(function(d) {
				if (this.state.viewMode == 'absolute') {
					return this.yRange(d.doc_count);
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByYear(d.year);

					return this.yRange(d.doc_count/total);
				}
			}.bind(this));

		this.vis.append('path')
			.data([this.state.data])
			.attr('class', 'line')
			.attr('d', flatLineValue)
			.attr('stroke', '#2ca02c');

		this.vis.selectAll('path.line')
			.transition()
			.duration(disableAnimation ? 0 : 1000)
			.attr('d', lineValue);
		this.vis.append('rect')
			.attr('class', 'time-overlay')
			.attr('width', this.graphWidth)
			.attr('height', this.graphHeight)
			.style('opacity', 0);

		this.vis.append('rect')
			.attr('class', 'overlay')
			.attr('width', this.graphWidth)
			.attr('height', this.graphHeight)
			.on('mouseover', function() {
				this.tooltip.style('display', null);
				this.axisMarker.style('display', null);
			}.bind(this))
			.on('mouseout', function() {
				this.tooltip.style('display', 'none');
				this.axisMarker.style('display', 'none');
			}.bind(this))
			.on('mousedown', mouseDownHandler)
			.on('mouseup', mouseUpHandler)
			.on('mousemove', mouseMoveHandler);

		if (this.timeOverlay) {
			this.setTimeOverlay(this.timeOverlay);
		}

		var bisectDate = d3.bisector(function(d) {
			return d.year;
		}).left;

		var view = this;

		function getTotalYearData(mousePos) {
			var x0 = view.xRange.invert(Math.round(mousePos));
			var i = bisectDate(view.state.data, x0, 1);
			var d0 = view.state.data[i - 1];
			var d1 = view.state.data[i];
			if (d0 && d1) {
				var d = x0 - d0.year > d1.year - x0 ? d1 : d0 || null;
			}
			else {
				var d = 0;
			}

			return d;
		}

		function mouseDownHandler() {
			var year = getTotalYearData(d3.mouse(this)[0]).year;

			view.dragStarted = false;

			view.dragStart = year;
		}

		function mouseUpHandler() {
			if (view.dragStart) {
				var year = getTotalYearData(d3.mouse(this)[0]).year;

				if (window.eventBus) {
					window.eventBus.dispatch('graph.filter', this, {
						filter: 'collection_years',
						value: !view.dragStarted || view.dragStart == year ? null : [view.dragStart < year ? view.dragStart : year, view.dragStart > year ? view.dragStart : year]
					});
				}

				if (!view.dragStarted) {
					view.timeOverlay = null;

					view.vis.select('rect.time-overlay')
						.transition()
						.duration(100)
						.style('opacity', 0);
				}

				view.dragStart = undefined;
			}
		}

		function mouseMoveHandler() {

			var yearData = getTotalYearData(d3.mouse(this)[0]);

			view.tooltip
				.style('left', d3.event.pageX + 20 + 'px')
				.style('top', d3.event.pageY + 'px')
				.style('display', 'inline-block')
				.html('<strong>'+yearData.year+'</strong><br/>'+
					'Antal: '+yearData.doc_count+'<br/>'+
					'Total: '+view.getTotalByYear(yearData.year)
				);

			view.axisMarker.attr('transform', 'translate('+d3.mouse(this)[0]+', 0)');

			if (view.dragStart) {
				view.dragStarted = true;

				view.setTimeOverlay([view.dragStart < yearData.year ? view.dragStart : yearData.year, view.dragStart > yearData.year ? view.dragStart : yearData.year]);
			}
		}
	}

	setTimeOverlay(values) {
		this.timeOverlay = values;

		if (this.timeOverlay[0] == this.startYear && this.timeOverlay[1] == this.endYear) {
			this.vis.select('rect.time-overlay')
				.transition()
				.duration(100)
				.style('opacity', 0);
		}
		else {

			this.vis.select('rect.time-overlay')
				.attr('x', this.xRange(Number(values[0])+0.2))
				.attr('width', this.xRange(Number(values[1])-0.2)-this.xRange(Number(values[0])+0.2))
				.transition()
				.duration(100)
				.style('opacity', 0.1);			
		}
	}

	render() {
		return (
			<div className={'graph-wrapper disable-component-frame'+(this.state.loading ? ' loading' : '')} ref="container">

				<div className="graph-container">
					<svg id={this.state.graphId} width={this.state.graphContainerWidth} height={this.state.graphContainerHeight} ref='graphContainer'/>
				</div>

				<div className="graph-controls">
					<h3>{this.props.title}</h3>

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