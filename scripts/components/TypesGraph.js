import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

var d3 = require('d3');
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class TypesGraph extends React.Component {
	constructor(props) {
		super(props);

		this.graphMargins = {
			left: 40,
			right: 10,
			top: 10,
			bottom: 30
		};

		this.windowResizeHandler = this.windowResizeHandler.bind(this);
		this.barClickHandler = this.barClickHandler.bind(this);

		this.searchHandler = this.searchHandler.bind(this);

		this.state = {
			paramString: null,
			params: null,
			data: [],
			total: null,

			loading: false,

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
		this.selectedBar = null;

		var params = this.state.params;

		var paramString = paramsHelper.buildParamString(this.state.params);

		this.setState({
			paramString: paramString,
			loading: true
		});

		fetch(config.apiUrl+config.endpoints.types+'?'+paramString)
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
				return y(d.doc_count);
			}.bind(this))
			.attr('height', function(d) {
				return this.graphHeight-y(d.doc_count);
			}.bind(this));
	}

	createYRange() {
		var yRangeValues = this.state.data.map(function(item) {
			return item.doc_count;
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

		var x = d3.scaleBand()
			.rangeRound([0, this.graphWidth])
			.padding(0.1);

		x.domain(this.state.data.map(function(d) {
			return d.type;
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
			.attr('class', 'bar clickable')
			.attr('data-key', function(d) {
				return d.type;
			})
			.attr('x', function(d) {
				return x(d.type);
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
			.attr('opacity', function(d, i) {
				return this.selectedBar && this.selectedBar != d.type ? 0.2 : 1;
			}.bind(this))
			.on('mousemove', function(d) {
				var html = '<strong>'+d.type+'</strong><br/>'+
					'Dokument: '+d.doc_count+'<br/>';
				this.tooltip
					.style('left', d3.event.pageX + 20 + 'px')
					.style('top', d3.event.pageY + 'px')
					.style('display', 'inline-block')
					.html(html);
				}.bind(this))
				.on('mouseout', function(d) {
					this.tooltip.style('display', 'none');
				}.bind(this))
				.on('click', this.barClickHandler);

		this.vis.selectAll('.bar')
			.transition()
			.duration(disableAnimation ? 0 : 1000)
			.attr('y', function(d) {
				return y(d.doc_count);
			}.bind(this))
			.attr('height', function(d) {
				return this.graphHeight-y(d.doc_count);
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
			this.selectedBar = event.type;	

			var bar = this.vis.select('.bar[data-key="'+this.selectedBar+'"]');

			this.vis.selectAll('.bar:not([data-key="'+this.selectedBar+'"])')
				.transition()
				.duration(200)
				.attr('opacity', 0.2);			

			bar.transition()
				.duration(200)
				.attr('opacity', 1);
		}

		if (window.eventBus) {
			window.eventBus.dispatch('graph.filter', this, {
				filter: 'type',
				value: this.selectedBar
			});
		}
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
				</div>

				<div className="loading-overlay"></div>

			</div>
		);
	}
}