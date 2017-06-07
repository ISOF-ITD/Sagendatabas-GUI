import React from 'react';
import _ from 'underscore';

var d3 = require('d3');
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class GenderGraph extends React.Component {
	constructor(props) {
		super(props);

		this.graphMargins = {
			left: 40,
			right: 10,
			top: 10,
			bottom: 30
		};

		this.genderLabels = {
			female: 'Kvinnor',
			male: 'Män',
			unknown: 'Okänt'
		};

		this.genderLabelsReverse = {
			'Kvinnor': 'female',
			'Män': 'male',
			'Okänt': 'unknown'
		};

		this.windowResizeHandler = this.windowResizeHandler.bind(this);

		this.state = {
			paramString: '',
			data: [],

			graphContainerWidth: 800,
			graphContainerHeight: this.props.graphHeight || 400,

			loading: false,
			viewMode: 'absolute',

			graphId: 'Graph'+Math.round((new Date()).valueOf()*Math.random())
		};
	}

	componentDidMount() {
		this.setState({
			graphContainerWidth: this.refs.container.clientWidth
		}, function() {
			this.renderGraphBase();
		}.bind(this));

		window.addEventListener('resize', this.windowResizeHandler);
	}

	componentWillReceiveProps(props) {
		if (props.data) {
			this.setState({
				data: props.data,
				viewMode: props.viewMode
			}, function() {
				this.renderGraph();
			}.bind(this))
		}

		if (props.total && props.total.length > 0) {
			this.setState({
				total: props.total
			});
		}
	}

	windowResizeHandler() {
		this.setState({
			graphContainerWidth: this.refs.container.clientWidth
		}, function() {
			this.renderGraph(true);
		}.bind(this));

	}

	getTotalByGender(gender) {
		return _.findWhere(this.state.total, {gender: gender}).person_count;
	}

	renderGraphBase() {
		this.svg = d3.select('#'+this.state.graphId);

		this.tooltip = d3.select('body').append('div').attr('class', 'graph-tooltip');
	}

	createYRange() {
		var yRangeValues = this.state.data.map(function(item) {
			if (this.state.viewMode == 'absolute') {
				return item.person_count;
			}
			else if (this.state.viewMode == 'relative') {
				var total = this.getTotalByGender(item.gender);

				return item.person_count/total;
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

		var x = d3.scaleBand()
			.rangeRound([0, this.graphWidth])
			.padding(0.1);

		x.domain(this.state.data.map(function(d) {
			return d.gender;
		}));

		var y = this.createYRange();

		var colorScale = d3.scaleOrdinal(d3.schemeCategory20)

		this.vis = this.svg.append('g')
			.attr('transform', 'translate('+this.graphMargins.left + ','+this.graphMargins.top+')');

		this.vis.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, '+this.graphHeight+')')
			.call(d3.axisBottom(x)
				.tickFormat(function(d) {
					return this.genderLabels[d];
				}.bind(this)
			));

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
				return x(d.gender);
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
			}).on('mousemove', function(d) {
//				var total = this.getTotalByGender(d.gender);

				this.tooltip
					.style('left', d3.event.pageX + 20 + 'px')
					.style('top', d3.event.pageY + 'px')
					.style('display', 'inline-block')
					.html((d.gender != ' ' ? '<strong>'+this.genderLabels[d.gender]+'</strong>: ' : '')+d.person_count);
			}.bind(this))
			.on('mouseout', function(d) {
				this.tooltip.style('display', 'none');
			}.bind(this));

		this.vis.selectAll('.bar')
			.transition()
			.duration(disableAnimation ? 0 : 1000)
			.attr('y', function(d) {
				if (this.state.viewMode == 'absolute') {
					return y(d.person_count);
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByGender(d.gender);

					console.log(d);
					console.log(d.person_count);
					console.log('Total: '+total);
					return y(d.person_count/total);
				}
			}.bind(this))
			.attr('height', function(d) {
				if (this.state.viewMode == 'absolute') {
					return this.graphHeight-y(d.person_count);
				}
				else if (this.state.viewMode == 'relative') {
					var total = this.getTotalByGender(d.gender);

					return this.graphHeight-y(d.person_count/total);
				}
			}.bind(this));
	}

	render() {
		return (
			<div className={'graph-wrapper disable-component-frame'+(this.state.loading ? ' loading' : '')} ref="container">

				<div className="graph-header">{this.props.label}</div>

				<div className="graph-container">
					<svg id={this.state.graphId} width={this.state.graphContainerWidth} height={this.state.graphContainerHeight} ref='graphContainer'/>
				</div>

				<div className="loading-overlay"></div>

			</div>
		);
	}
}