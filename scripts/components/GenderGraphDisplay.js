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

		this.viewModeSelectChangeHandler = this.viewModeSelectChangeHandler.bind(this);

		this.searchHandler = this.searchHandler.bind(this);

		this.fetchTotalByGender();

		this.state = {
			paramString: null,
			data: [],
			total: null,
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

	fetchTotalByGender() {
		fetch(config.apiUrl+config.endpoints.gender)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: {
						all: json.data.all,
						informants: json.data.informants,
						collectors: json.data.collectors
					}
				});
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

		fetch(config.apiUrl+config.endpoints.gender+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.metadata.total,
					data: json.data,
					loading: false
				});
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	render() {
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

					<div className="four columns">
						<GenderGraph label="Alla" total={this.state.total.all} viewMode={this.state.viewMode} graphHeight="200" data={this.state.data.all || []} />
					</div>

					<div className="four columns">
						<GenderGraph label="Informanter" total={this.state.total.informants} viewMode={this.state.viewMode} graphHeight="200" data={this.state.data.informants || []} />
					</div>

					<div className="four columns">
						<GenderGraph label="Upptecknare" total={this.state.total.collectors} viewMode={this.state.viewMode} graphHeight="200" data={this.state.data.collectors || []} />
					</div>

				</div>
	
			</div>
		);
	}
}