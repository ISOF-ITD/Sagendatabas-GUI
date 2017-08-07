import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

var d3 = require('d3');
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class BirthYearsGraph extends React.Component {
	constructor(props) {
		super(props);

		this.graphMargins = {
			left: 40,
			right: 10,
			top: 10,
			bottom: 30
		};

		this.lineColors = [
			'#9ecae1',
			'#ff7f0e',
			'#2ca02c'
		];

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

		return found ? found.person_count : 0;
	}

	fetchTotalCategories() {
		fetch(config.apiUrl+config.endpoints.birth_years)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.totalByYearArray = json.data.all;
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

		fetch(config.apiUrl+config.endpoints.birth_years+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				var allData = [];

				for (var i = config.minYear; i<config.maxYear; i++) {
					var dataItem = _.find(json.data.all, function(item) {
						return item.year == i;
					});

					allData.push(dataItem ? dataItem : {
						year: i,
						doc_count: 0,
						person_count: 0
					});
				}

				var informantsData = [];

				for (var i = config.minYear; i<config.maxYear; i++) {
					var dataItem = _.find(json.data.informants, function(item) {
						return item.year == i;
					});

					informantsData.push(dataItem ? dataItem : {
						year: i,
						doc_count: 0,
						person_count: 0
					});
				}

				var collectorsData = [];

				for (var i = config.minYear; i<config.maxYear; i++) {
					var dataItem = _.find(json.data.collectors, function(item) {
						return item.year == i;
					});

					collectorsData.push(dataItem ? dataItem : {
						year: i,
						doc_count: 0,
						person_count: 0
					});
				}

				this.setState({
					total: json.metadata.total,
					data: allData,
					informantsData: informantsData,
					collectorsData: collectorsData,
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
					return this.yRange(d.person_count);
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByYear(d.year);

					return this.yRange(total == 0 ? 0 : d.person_count/total);
				}
			}.bind(this));

		this.vis.selectAll('path.line')
			.transition()
			.duration(1000)
			.attr('d', lineValue);
	}

	createXRange() {
		var x = d3.scaleTime().range([0,this.graphWidth]);

		var xRangeValues = _.union(
			this.state.data.map(function(item) {
				return item.year;
			}),
			this.state.informantsData.map(function(item) {
				return item.year;
			}),
			this.state.collectorsData.map(function(item) {
				return item.year;
			})
		);

		x.domain(d3.extent(xRangeValues, function(d) {
			return d;
		}));

		return x;
	}

	createYRange() {
		var yRangeValues = _.union(
			this.state.data.map(function(item) {
				if (this.state.viewMode == 'absolute') {
					return item.person_count;
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByYear(item.year);

					return item.person_count/total;
				}
			}.bind(this)),
			this.state.informantsData.map(function(item) {
				if (this.state.viewMode == 'absolute') {
					return item.person_count;	
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByYear(item.year);

					return item.person_count/total;
				}
			}.bind(this)),
			this.state.collectorsData.map(function(item) {
				if (this.state.viewMode == 'absolute') {
					return item.person_count;
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByYear(item.year);

					return item.person_count/total;
				}
			}.bind(this))
		);

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

		var addLine = function(data, lineIndex) {
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
						return this.yRange(d.person_count);
					}
					else if (this.state.viewMode == 'relative') {
						var total = this.getTotalByYear(d.year);

						return this.yRange(d.person_count/total);
					}
				}.bind(this));

			this.vis.append('path')
				.data([data])
				.attr('class', 'line line-'+lineIndex)
				.attr('d', flatLineValue)
				.attr('stroke', function() {
					return this.lineColors[lineIndex];
				}.bind(this))

			this.vis.select('path.line-'+lineIndex)
				.transition()
				.duration(disableAnimation ? 0 : 1000)
				.attr('d', lineValue);
			
		}.bind(this);

		this.axisMarker = this.vis.append('line')
			.attr('class', 'x axis-marker')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', this.graphHeight)
			.style('display', 'none');

		addLine(this.state.informantsData, 1);
		addLine(this.state.collectorsData, 2);

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
			var d = x0 - d0.year > d1.year - x0 ? d1 : d0 || null;

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
						filter: 'birth_years',
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
			function getTotalByType(year, type) {
				var found = _.findWhere(view.state[type], {year: year});
				return found ? found.person_count : 0;
			}

			var yearData = getTotalYearData(d3.mouse(this)[0]);

			view.tooltip
				.style('left', d3.event.pageX + 20 + 'px')
				.style('top', d3.event.pageY + 'px')
				.style('display', 'inline-block')
				.html('<strong>'+yearData.year+'</strong><br/>'+
					'Informanter: '+getTotalByType(yearData.year, 'informantsData')+'<br/>'+
					'Upptecknare: '+getTotalByType(yearData.year, 'collectorsData')+'<br/>'+
					'Total: '+yearData.person_count
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
					<svg id={this.state.graphId} width={this.state.graphContainerWidth} height={this.state.graphContainerHeight} ref="graphContainer"/>
				</div>

				<div className="graph-controls">

					<h3>{this.props.title}</h3>

					<select value={this.state.viewMode} onChange={this.viewModeSelectChangeHandler}>
						<option value="absolute">absolute</option>
						<option value="relative">relative</option>
					</select>
				</div>

				<div className="loading-overlay"></div>

				<div className="legends">
					<div className="legend"><div className="color" style={{backgroundColor: 'rgb(255, 127, 14)'}}/> Informanter</div>
					<div className="legend"><div className="color" style={{backgroundColor: 'rgb(44, 160, 44)'}}/> Upptecknare</div>
				</div>

			</div>
		);
	}
}