import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import CheckBoxList from './../../ISOF-React-modules/components/views/CheckBoxList';
import sagenkartaCategories from './../../ISOF-React-modules/utils/sagenkartaCategories';
import AutocompleteInput from './../../ISOF-React-modules/components/views/AutocompleteInput';

import config from './../config.js';

export default class SearchForm extends React.Component {
	constructor(props) {
		super(props);

		this.searchInputChangeHandler = this.searchInputChangeHandler.bind(this);
		this.topicsInputChangeHandler = this.topicsInputChangeHandler.bind(this);
		this.titleTopicsInputChangeHandler = this.titleTopicsInputChangeHandler.bind(this);
		this.typeListChangeHandler = this.typeListChangeHandler.bind(this);
		this.categoryListChangeHandler = this.categoryListChangeHandler.bind(this);

		this.expandButtonClickHandler = this.expandButtonClickHandler.bind(this);

		this.searchInputKeypressHandler = this.searchInputKeypressHandler.bind(this);

		this.triggerSearch = this.triggerSearch.bind(this);

		this.state = {
			searchInputValue: '',
			topicsInputValue: '',
			titleTopicsInputValue: '',
			selectedTypes: ['arkiv', 'tryckt'],
			selectedCategories: [],

			expanded: false
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

	titleTopicsInputChangeHandler(event) {
		this.setState({
			titleTopicsInputValue: event.target.value
		});
	}

	typeListChangeHandler(event) {
		this.setState({
			selectedTypes: event
		});
	}

	categoryListChangeHandler(event) {
		this.setState({
			selectedCategories: event
		});
	}

	expandButtonClickHandler() {
		this.setState({
			expanded: !this.state.expanded
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

		if (this.state.titleTopicsInputValue != '') {
			params.title_topics = this.state.titleTopicsInputValue;
		}

		if (this.state.selectedTypes.length > 0) {
			params.type = this.state.selectedTypes.join(',');
		}

		if (this.state.selectedCategories.length > 0) {
			params.category = this.state.selectedCategories.join(',');
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

	topicsAutocompleteFormatListLabel(item) {
		return item.topic+' ('+item.doc_count+')';
	}

	render() {
		return (
			<div className={'advanced-search-form'+(this.state.expanded ? ' expanded' : '')}>

				<div className="row">

					<div className="search-input-wrapper ten columns">
						<input className="search-input u-full-width" type="text" onChange={this.searchInputChangeHandler} value={this.state.searchInputValue} onKeyPress={this.searchInputKeypressHandler} />

						<button className="expand-button" onClick={this.expandButtonClickHandler}><span>...</span></button>
					</div>

					<div className="two columns">
						<button className="search-button button-primary u-pull-right u-full-width" onClick={this.triggerSearch}>Sök</button>
					</div>

				</div>

				<div className="expanded-content">

					<div className="row">

						<div className="four columns">
							<label>Topics:</label>
							<AutocompleteInput searchUrl={config.apiUrl+config.endpoints.topics_autocomplete+'?search='} 
								valueField="topic"
								inputClassName="u-full-width" 
								onChange={this.topicsInputChangeHandler} 
								value={this.state.topicsInputValue} 
								onEnter={this.triggerSearch}
								listLabelFormatFunc={this.topicsAutocompleteFormatListLabel} />

							<label>Titel topics:</label>
							<AutocompleteInput searchUrl={config.apiUrl+config.endpoints.title_topics_autocomplete+'?search='} 
								valueField="topic"
								inputClassName="u-full-width" 
								onChange={this.titleTopicsInputChangeHandler} 
								value={this.state.titleTopicsInputValue} 
								onEnter={this.triggerSearch}
								listLabelFormatFunc={this.topicsAutocompleteFormatListLabel} />
							<AutocompleteInput searchUrl={'http://localhost:8000/sagenkarta/es/persons/?person='} 
								valueField="name"
								inputClassName="u-full-width" />
						</div>

						<div className="four columns">
							<label>Typ:</label>

							<CheckBoxList values={['arkiv', 'tryckt', 'register']} selectedItems={this.state.selectedTypes} onChange={this.typeListChangeHandler} />
						</div>

						<div className="four columns">
							<label>Kategorier:</label>

							<CheckBoxList values={sagenkartaCategories.categories} valueField="letter" labelField="label" selectedItems={this.state.selectedCategories} onChange={this.categoryListChangeHandler} />

						</div>

					</div>

				</div>

			</div>
		);
	}
}