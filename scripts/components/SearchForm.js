import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import CheckBoxList from './../../ISOF-React-modules/components/controls/CheckBoxList';
import Slider from './../../ISOF-React-modules/components/controls/Slider';
import sagenkartaCategories from './../../ISOF-React-modules/utils/sagenkartaCategories';
import AutocompleteInput from './../../ISOF-React-modules/components/controls/AutocompleteInput';

import config from './../config.js';

export default class SearchForm extends React.Component {
	constructor(props) {
		super(props);

		this.inputChangeHandler = this.inputChangeHandler.bind(this);
		this.typeListChangeHandler = this.typeListChangeHandler.bind(this);
		this.categoryListChangeHandler = this.categoryListChangeHandler.bind(this);
		this.collectionYearSliderChangeHandler = this.collectionYearSliderChangeHandler.bind(this);

		this.expandButtonClickHandler = this.expandButtonClickHandler.bind(this);
		this.mouseEnterHandler = this.mouseEnterHandler.bind(this);
		this.mouseLeaveHandler = this.mouseLeaveHandler.bind(this);
		this.searchInputKeypressHandler = this.searchInputKeypressHandler.bind(this);
		this.searchInputFocusHandler = this.searchInputFocusHandler.bind(this);
		this.searchInputBlurHandler = this.searchInputBlurHandler.bind(this);

		this.triggerSearch = this.triggerSearch.bind(this);

		this.sliderStartYear = 1830;
		this.sliderEndYear = 1985;

		this.state = {
			searchInput: '',
			topicsInput: '',
			titleTopicsInput: '',
			selectedTypes: ['arkiv', 'tryckt', 'register'],
			selectedCategories: [],
			collectionYearsEnabled: false,
			collectionYearFrom: this.sliderStartYear,
			collectionYearTo: this.sliderEndYear,

			lastSearchParams: null,

			expanded: false,
			hasFocus: false
		};
	}

	inputChangeHandler(event) {
		var value = event.target.type && event.target.type == 'checkbox' ? event.target.checked : event.target.value;

		this.setState({
			[event.target.name]: value
		});
	}

	searchInputFocusHandler() {
		this.setState({
			hasFocus: true,
			expanded: true
		});
	}

	searchInputBlurHandler() {
		this.setState({
			hasFocus: false
		});
	}

	mouseEnterHandler() {
/*
		this.setState({
			expanded: true
		});
*/
		if (this.mouseIdleTimer) {
			clearTimeout(this.mouseIdleTimer);
		}
	}

	mouseLeaveHandler() {
		if (!this.state.hasFocus) {
			this.mouseIdleTimer = setTimeout(this.mouseIdleHandler.bind(this), 1000);
		}
	}

	mouseIdleHandler() {
		this.setState({
			expanded: false
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

	collectionYearSliderChangeHandler(event) {
		this.setState({
			collectionYearFrom: Math.round(event[0]),
			collectionYearTo: Math.round(event[1])
		});
	}

	buildParams() {
		var params = {};

		if (this.state.searchInput != '') {
			params.search = this.state.searchInput;
		}

		if (this.state.topicsInput != '') {
			params.topics = this.state.topicsInput;
		}

		if (this.state.titleTopicsInput != '') {
			params.title_topics = this.state.titleTopicsInput;
		}

		if (this.state.selectedTypes.length > 0) {
			params.type = this.state.selectedTypes.join(',');
		}

		if (this.state.selectedCategories.length > 0) {
			params.category = this.state.selectedCategories.join(',');
		}

		if (this.state.collectionYearsEnabled) {
			params.collection_years = this.state.collectionYearFrom+','+this.state.collectionYearTo;
		}

		return params;
	}

	triggerSearch() {
		if (window.eventBus) {
			var params = this.buildParams();

			window.eventBus.dispatch('searchForm.search', this, {
				params: params
			});

			this.setState({
				lastSearchParams: params
			});
		}
	}

	topicsAutocompleteFormatListLabel(item) {
		return item.topic+' ('+item.doc_count+')';
	}

	describeSearch() {
		var lastSearchParams = JSON.parse(JSON.stringify(this.state.lastSearchParams));

		if (lastSearchParams) {
			var searchTerms = [];

			if (lastSearchParams.search && lastSearchParams.search != '') {
				searchTerms.push('Söksträng: <strong>'+lastSearchParams.search+'</strong>');
			}
			if (lastSearchParams.type && lastSearchParams.type != '') {
				searchTerms.push('Typ: <strong>'+lastSearchParams.type.split(',').join(', ')+'</strong>');
			}
			if (lastSearchParams.category && lastSearchParams.category != '') {
				var categories = lastSearchParams.category.split(',');

				searchTerms.push(categories.length == 0 ? 'Kategori: ' : 'Kategorier: <strong>'+(
					categories.map(function(category) {
						return sagenkartaCategories.getCategoryName(category);
					}).join(', ')
				)+'</strong>');
			}
			if (lastSearchParams.topics && lastSearchParams.topics != '') {
				searchTerms.push('Topics: <strong>'+lastSearchParams.topics.split(',').join(', ')+'</strong>');
			}
			if (lastSearchParams.title_topics && lastSearchParams.title_topics != '') {
				searchTerms.push('Titel topics: <strong>'+lastSearchParams.title_topics.split(',').join(', ')+'</strong>');
			}
			if (lastSearchParams.collection_years && lastSearchParams.collection_years != '') {
				searchTerms.push('Uppteckningsår: <strong>'+lastSearchParams.collection_years.split(',').join('-')+'</strong>');
			}

			return this.state.lastSearchParams ? searchTerms.join(', ') : '';
		}
		else {
			return '';
		}
	}

	render() {
		return (
			<div className={'advanced-search-form fixed'+(this.state.expanded ? ' expanded' : '')+(this.state.hasFocus || !this.state.lastSearchParams ? ' has-focus' : '')}
				onMouseEnter={this.mouseEnterHandler} 
				onMouseLeave={this.mouseLeaveHandler}>

				<div className="container">

					<h1>Digitalt kulturarv</h1>

					<div className="row">

						<div className="ten columns">
							<div className={'search-input-wrapper'+(this.state.hasFocus ? ' focused' : '')}>
								<div className="search-label" dangerouslySetInnerHTML={{__html: this.describeSearch()}}></div>
								<input name="searchInput" 
									placeholder="Söksträng" 
									className="search-input u-full-width" 
									type="text" 
									onChange={this.inputChangeHandler} 
									onFocus={this.searchInputFocusHandler} 
									onBlur={this.searchInputBlurHandler} 
									onKeyPress={this.searchInputKeypressHandler} 
									value={this.state.searchInput} />

								<button className="expand-button" onClick={this.expandButtonClickHandler}><span>...</span></button>
							</div>
						</div>

						<div className="two columns">
							<button className="search-button button-primary u-pull-right u-full-width" onClick={this.triggerSearch}>Sök</button>
						</div>

					</div>

					<div className="expanded-content">

						<div className="row">

							<div className="four columns">
								<label>Topics:</label>
								<AutocompleteInput inputName="topicsInput" 
									searchUrl={config.apiUrl+config.endpoints.topics_autocomplete+'?search=$s'} 
									valueField="topic"
									inputClassName="u-full-width" 
									onChange={this.inputChangeHandler} 
									value={this.state.topicsInput} 
									onEnter={this.triggerSearch}
									listLabelFormatFunc={this.topicsAutocompleteFormatListLabel} />

								<label>Titel topics:</label>
								<AutocompleteInput inputName="titleTopicsInput" 
									searchUrl={config.apiUrl+config.endpoints.title_topics_autocomplete+'?search=$s'} 
									valueField="topic" 
									inputClassName="u-full-width" 
									onChange={this.inputChangeHandler} 
									value={this.state.titleTopicsInput} 
									onEnter={this.triggerSearch} 
									listLabelFormatFunc={this.topicsAutocompleteFormatListLabel} />

							</div>

							<div className="four columns">
								<label>Typ:</label>

								<CheckBoxList values={['arkiv', 'tryckt', 'register', 'inspelning']} 
									selectedItems={this.state.selectedTypes} 
									onChange={this.typeListChangeHandler} />
							</div>

							<div className="four columns">
								<label>Kategorier:</label>

								<CheckBoxList values={sagenkartaCategories.categories} 
									valueField="letter" 
									labelField="label" 
									selectedItems={this.state.selectedCategories} 
									onChange={this.categoryListChangeHandler} />

							</div>

						</div>

						<div className="row">

							<div className="six columns">
								<label><input name="collectionYearsEnabled" 
									onChange={this.inputChangeHandler} 
									className="bottom-margin-0" 
									type="checkbox" 
									checked={this.state.collectionYearsEnabled} /> Uppteckningsår:</label>
								<Slider start={[this.sliderStartYear, this.sliderEndYear]} 
									enabled={this.state.collectionYearsEnabled} 
									range={{min: this.sliderStartYear, max: this.sliderEndYear}} 
									onChange={this.collectionYearSliderChangeHandler} />
							</div>
						</div>

					</div>

				</div>

			</div>
		);
	}
}