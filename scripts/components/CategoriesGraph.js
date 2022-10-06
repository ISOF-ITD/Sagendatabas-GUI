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

		this.barWidth = 30;

		this.viewModeSelectChangeHandler = this.viewModeSelectChangeHandler.bind(this);
		this.categoryTypeSelectChangeHandler = this.categoryTypeSelectChangeHandler.bind(this);

		this.windowResizeHandler = this.windowResizeHandler.bind(this);
		this.barClickHandler = this.barClickHandler.bind(this);

		this.searchHandler = this.searchHandler.bind(this);

		this.state = {
			paramString: null,
			data: [],
			total: null,
			originalData: [],
			categoryTypes: [],

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
		}.bind(this));
		this.renderGraphBase();

		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler);
		}

		window.addEventListener('resize', this.windowResizeHandler);
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('searchForm.search', this.searchHandler);
		}
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

	getTotalByCategory(category) {
		return _.findWhere(this.totalByCategoryArray, {key: category}).doc_count;
	}

	getCategoryName(category) {
		return window.allCategories && _.findWhere(window.allCategories, {key: category}) ? _.findWhere(window.allCategories, {key: category}).name+' ('+_.findWhere(window.allCategories, {key: category}).type+')' : category;
	}

	fetchTotalCategories() {
		fetch(config.apiUrl+config.endpoints.categories+'?'+paramsHelper.buildParamString(config.requiredApiParams))
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.totalByCategoryArray = json.data;
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	fetchData(params) {
		this.selectedBar = null;

		var queryParams = Object.assign({}, config.requiredApiParams, params);
		var paramString = paramsHelper.buildParamString(queryParams);

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
				var categoryTypes = json.data.length > 0 ? ['Alla'].concat(_.compact(_.uniq(_.pluck(json.data, 'type')))) : [];
				this.setState({
					categoryTypes: categoryTypes,
					total: json.metadata.total.value || (json.metadata.total.value === 0 ? 0 : json.metadata.total), // ES7 vs ES5
					originalData: json.data,
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

	categoryTypeSelectChangeHandler(event) {
		if (this.state.originalData.length == 0) {
			return;
		}

		var data = event.currentTarget.value == 'Alla' ? this.state.originalData : _.filter(this.state.originalData, function(item) {
			return item.type == event.currentTarget.value;
		});

		this.setState({
			data: data
		}, function() {
			this.renderGraph();
		}.bind(this))
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
						return `${d*100 < 1 ? d*100 : Math.round(d*100)}%`;
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

	renderGraph(disableAnimation) {
		d3.selectAll('svg#'+this.state.graphId+' > *').remove();

		if (this.state.data.length == 0) {
			return;
		}

		this.graphWidth = (this.state.data.length * this.barWidth < this.state.graphContainerWidth ? this.state.graphContainerWidth : this.state.data.length * this.barWidth)-this.graphMargins.left-this.graphMargins.right;
		this.graphHeight = this.state.graphContainerHeight-this.graphMargins.top-this.graphMargins.bottom;

		var x = d3.scaleBand()
			.rangeRound([0, this.graphWidth])
			.padding(0.1);

		x.domain(this.state.data.map(function(d) {
			return d.key;
		}));

		var y = this.createYRange();

		//var colorScale = d3.scaleOrdinal(d3.schemeCategory20)
		var colorScale = d3.scaleOrdinal(d3ScaleChromatic.schemeDark2)

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
			.attr('class', 'bar clickable')
			.attr('data-key', function(d) {
				return d.key;
			})
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
				return colorScale(i);
			})
			.attr('opacity', function(d, i) {
				return this.selectedBar && this.selectedBar != d.key ? 0.2 : 1;
			}.bind(this))
			.on('mousemove', function(d) {

				var total = this.getTotalByCategory(d.key);

				this.tooltip
					.style('left', d3.event.pageX + 20 + 'px')
					.style('top', d3.event.pageY + 'px')
					.style('display', 'inline-block')
					.html(
						this.state.viewMode === 'absolute' ?
						(
							'<strong>'+this.getCategoryName(d.key)+'</strong>'+(d.key != ' ' ? ' ('+d.key+')' : '')+'<br/>'+d.doc_count+' (total '+total+')'
						)
						:
						(
							`<strong>${this.getCategoryName(d.key)}</strong>${(d.key != ' ' ? ' ('+d.key+')' : '')}<br/>${Math.round(d.doc_count/total*100*10)/10}% (${d.doc_count}/${total})`
						)
						);//+
						// this.state.viewMode === 'relative' ? (' ' + Math.round(d.doc_count/total*10000)/100 + '%') : '');
			}.bind(this))
			.on('mouseout', function(d) {
				this.tooltip.style('display', 'none');
			}.bind(this))
			.on('click', this.barClickHandler);

		this.vis.selectAll('.bar')
			.transition()
			.duration(disableAnimation ? 0 : 1000)
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

	barClickHandler(event) {
		if (this.selectedBar && this.selectedBar == event.key) {
			this.vis.selectAll('.bar')
				.transition()
				.duration(200)
				.attr('opacity', 1);

			this.selectedBar = null;
		}
		else {
			this.selectedBar = event.key;

			var bar = this.vis.select('.bar[data-key="'+event.key+'"]');

			this.vis.selectAll('.bar:not([data-key="'+event.key+'"])')
				.transition()
				.duration(200)
				.attr('opacity', 0.2);

			bar.transition()
				.duration(200)
				.attr('opacity', 1);
		}

		if (window.eventBus) {
			window.eventBus.dispatch('graph.filter', this, {
				filter: 'category',
				value: this.selectedBar
			});
		}
	}

	render() {
		var categoryTypeOptions = _.map(this.state.categoryTypes, function(type) {
			return <option key={type} value={type}>{type}</option>;
		})

		return (
			<div className={'graph-wrapper'+(this.state.loading ? ' loading' : '')} ref="container">

				{
					this.state.total &&
					<div className="total-number">Total: {this.state.total}</div>
				}

				<div className="graph-container horizontal-scroll">
					<svg id={this.state.graphId} width={this.state.data.length > 0 ? (this.state.data.length * this.barWidth < this.state.graphContainerWidth ? this.state.graphContainerWidth : this.state.data.length * this.barWidth) : this.state.graphContainerWidth} height={this.state.graphContainerHeight} ref='graphContainer'/>
				</div>

				<div className="graph-controls">

					<select value={this.state.viewMode} onChange={this.viewModeSelectChangeHandler}>
						<option value="absolute">absoluta tal</option>
						<option value="relative">relativa tal</option>
					</select>

					{
						categoryTypeOptions.length > 0 &&
						<select onChange={this.categoryTypeSelectChangeHandler}>
							{categoryTypeOptions}
						</select>
					}

				</div>

				<div className="loading-overlay"></div>

			</div>
		);
	}
}
