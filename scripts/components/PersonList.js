import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import paramsHelper from './../utils/paramsHelper';

import PersonListItem from './PersonListItem';

import config from './../config';

export default class PersonList extends React.Component {
	constructor(props) {
		super(props);

		this.listTypeChangeHandler = this.listTypeChangeHandler.bind(this);

		this.state = {
			total: null,
			data: [],
			loading: false,
			params: null,
			listType: 'persons'
		};
	}

	componentDidMount() {
		if (window.eventBus && !this.props.disableEventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
		}
	}

	listTypeChangeHandler(event) {
		var currentType = this.state.listType;

		this.setState({
			listType: event.target.dataset.type
		}, function() {
			if (currentType != this.state.listType) {
				this.fetchData(null, true);
			}
		});
	}

	searchHandler(event, data) {
		this.setState({
			params: data.params
		}, function() {
			this.fetchData();
		}.bind(this));
	}

	fetchData(params, force) {
		var params = params || this.state.params;

		params.count = 100;

		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString && !force) {
			return;
		}

		this.setState({
			paramString: paramString,
			loading: true
		});

		var endpoint = this.state.listType == 'informants' ? config.endpoints.informants :
			this.state.listType == 'collectors' ? config.endpoints.collectors : config.endpoints.persons;

		fetch(config.apiUrl+endpoint+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.metadata.total,
					data: json.data,
					loading: false
				});
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex);
			})
		;
	}

	render() {
		var personItems = this.state.data.map(function(item) {
			return <PersonListItem key={item.id} data={item} />
		}.bind(this));

		return (
			<div className="documents-list-wrapper">
				<div className={'documents-list'+(this.state.loading ? ' loading' : '')}>
					<div className="list-heading">
						<button className={this.state.listType == 'informants' ? ' selected' : ''} onClick={this.listTypeChangeHandler} data-type="informants">Informantar</button> <button className={this.state.listType == 'collectors' ? ' selected' : ''} onClick={this.listTypeChangeHandler} data-type="collectors">Upptäckare</button> <button className={this.state.listType == 'persons' ? ' selected' : ''} onClick={this.listTypeChangeHandler} data-type="persons">Båda</button>
					</div>

					<div className="items">
						{personItems}
					</div>

					<div className="loading-overlay"></div>

				</div>
			</div>
		);
	}
}