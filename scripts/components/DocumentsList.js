import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class DocumentsList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			total: null,
			data: []
		};
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
			paramString: paramString
		});

		fetch(config.apiUrl+config.endpoints.documents+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.hits.total,
					data: json.hits.hits
				});
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	render() {
		var documents = this.state.data.map(function(item) {
			return <div key={item._id}>{item._source.title}</div>
		});

		return (
			<div>

				{documents}>

			</div>
		);
	}
}