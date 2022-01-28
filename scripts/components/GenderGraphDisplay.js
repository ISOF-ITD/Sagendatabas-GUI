import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

var d3 = require('d3');
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import GenderGraph from './GenderGraph';

import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class GenderGraphDisplay extends React.Component {
	constructor(props) {
		super(props);

		this.roleLabels = {
			i: 'Informanter',
			c: 'Upptecknare',
			sender: 'Avsändare',
			receiver: 'Mottagare',
			all: 'Alla'
		};

		this.viewModeSelectChangeHandler = this.viewModeSelectChangeHandler.bind(this);

		this.searchHandler = this.searchHandler.bind(this);

		this.state = {
			paramString: null,
			data: [],
			viewMode: 'absolute',
			total: {
				all: [],
				informants: [],
				collectors: []
			}
		};
	}

	componentDidMount() {
		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler);
		}
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('searchForm.search', this.searchHandler);
		}
	}

	viewModeSelectChangeHandler(event) {
		this.setViewMode(event.target.value);
	}

	setViewMode(viewMode) {
		this.setState({
			viewMode: viewMode
		});
	}

	searchHandler(event, data) {
		this.fetchData(data.params);
	}

	fetchTotalByGender(typeParams, callBack) {
		fetch(config.apiUrl+config.endpoints.gender+'?'+paramsHelper.buildParamString(config.requiredApiParams))
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.data
				}, function() {
					if (callBack) {
						callBack();
					}
				}.bind(this));
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	fetchData(params) {
		var queryParams = Object.assign({}, config.requiredApiParams, params);

		var paramString = paramsHelper.buildParamString(queryParams);

		if (paramString == this.state.paramString) {
			return;
		}

		this.setState({
			paramString: paramString,
			loading: true
		});

		var totalParams = {};
		if (params.type) {
			totalParams.type = params.type;
		}

		this.fetchTotalByGender(totalParams, function() {
			fetch(config.apiUrl+config.endpoints.gender+'?'+paramString)
				.then(function(response) {
					return response.json()
				}).then(function(json) {
					//TODO: why "totalRecords"?
					this.setState({
						totalRecords: json.metadata.total.value || (json.metadata.total.value === 0 ? 0 : json.metadata.total), // ES7 vs ES5
						data: json.data,
						loading: false
					});
				}.bind(this)).catch(function(ex) {
					console.log('parsing failed', ex)
				})
			;
		}.bind(this));
	}

	render() {
		var graphElements = [];

		for (var item in this.state.data) {
			graphElements.push(<div key={item} className="four columns">
				<GenderGraph label={this.roleLabels[item]} total={this.state.total[item]} viewMode={this.state.viewMode} graphHeight="200" data={this.state.data[item] || []} />
			</div>);
		}

		return (
			<div className="graph-wrapper">

				<div className="graph-controls">
					<h3>{this.props.title}</h3>

					<select value={this.state.viewMode} onChange={this.viewModeSelectChangeHandler}>
						<option value="absolute">absolute</option>
						<option value="relative">relative</option>
					</select>
				</div>

				<div className="row">

					{graphElements}

				</div>

			</div>
		);
	}
}
