import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

export default class SearchForm extends React.Component {
	constructor(props) {
		super(props);

		this.searchInputChangeHandler = this.searchInputChangeHandler.bind(this);
		this.topicsInputChangeHandler = this.topicsInputChangeHandler.bind(this);

		this.searchInputKeypressHandler = this.searchInputKeypressHandler.bind(this);

		this.state = {
			searchInputValue: 'häst',
			topicsInputValue: ''
		};
	}

	searchInputChangeHandler(event) {
		this.setState({
			searchInputValue: event.target.value
		});
	}

	topicsInputChangeHandler(event) {
		this.setState({
			topicsInputValue: event.target.value
		});
	}

	searchInputKeypressHandler(event) {
		if (event.key == 'Enter') {
			this.triggerSearch();
		}
	}

	buildParams() {
		var params = {};

		if (this.state.searchInputValue != '') {
			params.search = this.state.searchInputValue;
		}

		if (this.state.topicsInputValue != '') {
			params.topics = this.state.topicsInputValue;
		}

		return params;
	}

	triggerSearch() {
		console.log('triggerSearch');

		if (window.eventBus) {
			window.eventBus.dispatch('searchForm.search', this, {
				params: this.buildParams()
			});
		}
	}

	render() {
		return (
			<div>

				<label>Söksträng:</label>
				<input type="text" onChange={this.searchInputChangeHandler} value={this.state.searchInputValue} onKeyPress={this.searchInputKeypressHandler} />


				<label>Topics:</label>
				<input type="text" onChange={this.topicsInputChangeHandler} value={this.state.topicsInputValue} onKeyPress={this.searchInputKeypressHandler} />

			</div>
		);
	}
}