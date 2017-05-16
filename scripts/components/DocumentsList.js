import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import paramsHelper from './../utils/paramsHelper';

import DocumentsListItem from './DocumentsListItem';

import config from './../config';

export default class DocumentsList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			total: null,
			data: [],
			loading: false
		};
	}

	componentDidMount() {
		if (window.eventBus && !this.props.disableEventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
		}

		console.log(this.props);
		if (this.props.similarDocs) {
			console.log('load similar');
			this.fetchData({
				similar: this.props.similarDocs
			});
		}
	}

	componentWillReceiveProps(props) {
		if (props.similarDocs) {
			this.fetchData({
				similar: props.similarDocs
			});
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

		fetch(config.apiUrl+config.endpoints.documents+'?'+paramString)
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
		var documentItems = this.state.data.map(function(item) {
			return <DocumentsListItem key={item._id} doc={item} displayScore={this.props.displayScore} />
		}.bind(this));

		return (
			<div className={'documents-list'+(this.state.loading ? ' loading' : '')}>

				<div className="items">
					{documentItems}
				</div>

				<div className="loading-overlay"></div>

			</div>
		);
	}
}