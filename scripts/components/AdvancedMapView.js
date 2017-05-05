import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import MapBase from './../../ISOF-React-modules/components/views/MapBase';
import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class AdvancedMapView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: null,
			loading: false
		}
	}

	componentDidMount() {
		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
		}
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
			paramString: paramString,
			loading: true
		});
/*
		fetch(config.apiUrl+config.endpoints.birth_years+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.hits.total,
					data: json.aggregations.data.data.buckets,
					informantsData: json.aggregations.informants.data.data.buckets,
					collectorsData: json.aggregations.collectors.data.data.buckets,
					loading: false
				}, function() {
					this.renderGraph();
				}.bind(this));
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
*/
	}

	render() {
		return (
			<div className={'map-wrapper'+(this.state.loading ? ' loading' : '')} style={this.props.mapHeight ? {height: Number(this.props.mapHeight)+50} : {}} ref="container">

				<MapBase className="map-container" />

				<div className="loading-overlay"></div>

			</div>
		);
	}
}