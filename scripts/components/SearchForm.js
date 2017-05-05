import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import CheckBoxList from './CheckBoxList';

export default class SearchForm extends React.Component {
	constructor(props) {
		super(props);

		this.searchInputChangeHandler = this.searchInputChangeHandler.bind(this);
		this.topicsInputChangeHandler = this.topicsInputChangeHandler.bind(this);
		this.typeListChangeHandler = this.typeListChangeHandler.bind(this);

		this.searchInputKeypressHandler = this.searchInputKeypressHandler.bind(this);

		this.triggerSearch = this.triggerSearch.bind(this);

		this.state = {
			searchInputValue: 'häst',
			topicsInputValue: '',
			selectedTypes: ['arkiv', 'tryckt']
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

	typeListChangeHandler(event) {
		this.setState({
			selectedTypes: event
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

		if (this.state.selectedTypes.length > 0) {
			params.type = this.state.selectedTypes.join(',');
		}

		return params;
	}

	triggerSearch() {
		if (window.eventBus) {
			window.eventBus.dispatch('searchForm.search', this, {
				params: this.buildParams()
			});
		}
	}

	render() {
		return (
			<div className="row">

				<div className="four columns">
					<label>Söksträng:</label>
					<input type="text" onChange={this.searchInputChangeHandler} value={this.state.searchInputValue} onKeyPress={this.searchInputKeypressHandler} />
				</div>

				<div className="four columns">
					<label>Topics:</label>
					<input type="text" onChange={this.topicsInputChangeHandler} value={this.state.topicsInputValue} onKeyPress={this.searchInputKeypressHandler} />
				</div>

				<div className="four columns">
					<label>Typ:</label>

					<CheckBoxList values={['arkiv', 'tryckt', 'register']} selectedItems={this.state.selectedTypes} onChange={this.typeListChangeHandler} />
				</div>

				<button className="button-primary" onClick={this.triggerSearch}>Sök</button>

			</div>
		);
	}
}