import React from 'react';
import { hashHistory, Link } from 'react-router';

import L from 'leaflet';
import 'leaflet-draw';

import EventBus from 'eventbusjs';

import CheckBoxList from './../../ISOF-React-modules/components/controls/CheckBoxList';
import Slider from './../../ISOF-React-modules/components/controls/Slider';
import AutocompleteInput from './../../ISOF-React-modules/components/controls/AutocompleteInput';
import PopulatedSelect from './../../ISOF-React-modules/components/controls/PopulatedSelect';
import DropdownMenu from './../../ISOF-React-modules/components/controls/DropdownMenu';
import MapBase from './../../ISOF-React-modules/components/views/MapBase';

import sagenkartaCategories from './../../ISOF-React-modules/utils/sagenkartaCategories';
import paramsHelper from './../utils/paramsHelper';

import config from './../config.js';

export default class SearchForm extends React.Component {
	constructor(props) {
		super(props);

		window.searchForm = this;

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

		this.mapDrawLayerCreatedHandler = this.mapDrawLayerCreatedHandler.bind(this);

		this.triggerSearch = this.triggerSearch.bind(this);

		this.addSearchClickHandler = this.addSearchClickHandler.bind(this);
		this.searchTabClickHandler = this.searchTabClickHandler.bind(this);
		this.tabCloseButtonClickHandler = this.tabCloseButtonClickHandler.bind(this);

		this.appMenuItemClickHandler = this.appMenuItemClickHandler.bind(this);

		this.sliderStartYear = config.minYear;
		this.sliderEndYear = config.maxYear;

		this.state = {
			searchInput: '',
			termsInput: '',
			titleTermsInput: '',
			selectedTypes: ['arkiv', 'tryckt'],
			selectedCategories: [],
			collectionYearsEnabled: false,
			collectionYears: [this.sliderStartYear, this.sliderEndYear],
			informantNameInput: '',
			collectorNameInput: '',
			informantsGenderInput: '',
			collectorsGenderInput: '',
			collectorsBirthYearsEnabled: false,
			collectorsBirthYears: [this.sliderStartYear, this.sliderEndYear],
			informantsBirthYearsEnabled: false,
			informantsBirthYears: [this.sliderStartYear, this.sliderEndYear],
			sockenInput: '',
			landskapInput: '',
			geoBoundingBox: null,

			searchOptions: '',

			searchIndex: 0,
			savedSearches: [],


			lastSearchParams: null,

			expanded: false,
			hasFocus: false
		};
	}

	getCurrentSearch() {
		return JSON.parse(JSON.stringify({
			searchInput: this.state.searchInput || '',
			termsInput: this.state.termsInput || '',
			titleTermsInput: this.state.titleTermsInput || '',
			selectedTypes: this.state.selectedTypes || ['arkiv', 'tryckt'],
			selectedCategories: this.state.selectedCategories || [],
			collectionYearsEnabled: this.state.collectionYearsEnabled,
			collectionYears: this.state.collectionYears || [this.sliderStartYear, this.sliderEndYear],
			informantNameInput: this.state.informantNameInput || '',
			collectorNameInput: this.state.collectorNameInput || '',
			informantsGenderInput: this.state.informantsGenderInput || '',
			collectorsGenderInput: this.state.collectorsGenderInput || '',
			collectorsBirthYearsEnabled: this.state.collectorsBirthYearsEnabled,
			collectorsBirthYears: this.state.collectorsBirthYears || [this.sliderStartYear, this.sliderEndYear],
			informantsBirthYearsEnabled: this.state.informantsBirthYearsEnabled,
			informantsBirthYears: this.state.informantsBirthYears || [this.sliderStartYear, this.sliderEndYear],
			sockenInput: this.state.sockenInput || '',
			landskapInput: this.state.landskapInput || '',
			geoBoundingBox: this.state.geoBoundingBox,

			newSearch: false
		}));
	}

	setSearch(index, discardCurrentSearch) {
		var currentSearch = this.getCurrentSearch();

		var savedSearches = this.state.savedSearches;

		if (savedSearches[this.state.searchIndex] && !discardCurrentSearch) {
			savedSearches[this.state.searchIndex] = currentSearch;
		}

		if (savedSearches[index]) {
			currentSearch = savedSearches[index];
		}

		this.setState({
			searchInput: currentSearch.searchInput,
			termsInput: currentSearch.termsInput,
			titleTermsInput: currentSearch.titleTermsInput,
			selectedTypes: currentSearch.selectedTypes,
			selectedCategories: currentSearch.selectedCategories,
			collectionYearsEnabled: currentSearch.collectionYearsEnabled,
			collectionYears: currentSearch.collectionYears,
			informantNameInput: currentSearch.informantNameInput,
			collectorNameInput: currentSearch.collectorNameInput,
			informantsGenderInput: currentSearch.informantsGenderInput,
			collectorsGenderInput: currentSearch.collectorsGenderInput,
			collectorsBirthYearsEnabled: currentSearch.collectorsBirthYearsEnabled,
			collectorsBirthYears: currentSearch.collectorsBirthYears,
			informantsBirthYearsEnabled: currentSearch.informantsBirthYearsEnabled,
			informantsBirthYears: currentSearch.informantsBirthYears,
			sockenInput: currentSearch.sockenInput,
			landskapInput: currentSearch.landskapInput,
			geoBoundingBox: currentSearch.geoBoundingBox,

			savedSearches: savedSearches,
			searchIndex: index
		}, function() {
			this.triggerSearch();
		}.bind(this));
	}

	addSearch() {
		var currentSearch = this.getCurrentSearch();

		var savedSearches = this.state.savedSearches;

		if (savedSearches[this.state.searchIndex]) {
			savedSearches[this.state.searchIndex] = currentSearch;
		}
		else {
			savedSearches.push(currentSearch);
		}

		savedSearches.push({
			searchInput: '',
			termsInput: '',
			titleTermsInput: '',
			selectedTypes: ['arkiv', 'tryckt'],
			selectedCategories: [],
			collectionYearsEnabled: false,
			collectionYears: [this.sliderStartYear, this.sliderEndYear],
			informantNameInput: '',
			collectorNameInput: '',
			informantsGenderInput: '',
			collectorsGenderInput: '',
			collectorsBirthYearsEnabled: false,
			collectorsBirthYears: [this.sliderStartYear, this.sliderEndYear],
			informantsBirthYearsEnabled: false,
			informantsBirthYears: [this.sliderStartYear, this.sliderEndYear],
			sockenInput: '',
			landskapInput: '',
			geoBoundingBox: null,

			newSearch: true
		});

		this.setState({
			searchInput: '',
			termsInput: '',
			titleTermsInput: '',
			selectedTypes: ['arkiv', 'tryckt'],
			selectedCategories: [],
			collectionYearsEnabled: false,
			collectionYears: [this.sliderStartYear, this.sliderEndYear],
			informantNameInput: '',
			collectorNameInput: '',
			informantsGenderInput: '',
			collectorsGenderInput: '',
			collectorsBirthYearsEnabled: false,
			collectorsBirthYears: [this.sliderStartYear, this.sliderEndYear],
			informantsBirthYearsEnabled: false,
			informantsBirthYears: [this.sliderStartYear, this.sliderEndYear],
			sockenInput: '',
			landskapInput: '',
			geoBoundingBox: null,

			lastSearchParams: {},

			savedSearches: savedSearches,
			searchIndex: savedSearches.length-1
		});
	}

	addSearchClickHandler() {
		this.addSearch();
	}

	searchTabClickHandler(event) {
		if (event.currentTarget.dataset.index != this.state.searchIndex) {
			this.setSearch(event.currentTarget.dataset.index);
		}
	}

	tabCloseButtonClickHandler(event) {
		event.stopPropagation();

		var tabIndex = event.currentTarget.dataset.index;

		var savedSearches = this.state.savedSearches;
		var searchIndex = this.state.searchIndex;

		savedSearches.splice(tabIndex, 1);

		searchIndex = searchIndex == 0 ? searchIndex : searchIndex >= tabIndex ? searchIndex-1 : searchIndex;

		this.setState({
			savedSearches: savedSearches,
			searchIndex: searchIndex
		}, function() {
			this.setSearch(searchIndex, true);
		}.bind(this));
	}

	appMenuItemClickHandler(event) {
		this.refs.appMenu.closeMenu();
	}

	componentDidMount() {
		L.drawLocal.draw.toolbar.buttons.rectangle = 'Rita rektangel';
		
		L.Control.RemoveAll = L.Control.extend({
			options: {
				position: 'topleft',
			},

			onAdd: function (map) {
				var controlDiv = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-draw-toolbar');
				var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove', controlDiv);
				controlUI.title = 'Ta bort valt område';
				controlUI.setAttribute('href', '#');

				L.DomEvent
					.addListener(controlUI, 'click', L.DomEvent.stopPropagation)
					.addListener(controlUI, 'click', L.DomEvent.preventDefault)
					.addListener(controlUI, 'click', function () {
						this.drawLayer.clearLayers();

						this.setState({
							geoBoundingBox: null
						});
					}.bind(this));
				return controlDiv;
			}.bind(this)
		});

		var removeAllControl = new L.Control.RemoveAll();

		this.drawLayer = new L.FeatureGroup();
		this.refs.mapView.map.addLayer(this.drawLayer);

		var drawControl = new L.Control.Draw({
			draw: {
				polyline: false,
				polygon: false,
				circle: false,
				marker: false
			}
		});

		this.refs.mapView.map.addControl(drawControl);
		this.refs.mapView.map.addControl(removeAllControl);

		this.refs.mapView.map.on(L.Draw.Event.CREATED, this.mapDrawLayerCreatedHandler);

		this.refs.mapView.map.on(L.Draw.Event.DRAWSTART, function(event) {
			this.drawLayer.clearLayers();
		}.bind(this));
	}

	mapDrawLayerCreatedHandler(event) {
		var layer = event.layer;

		this.drawLayer.addLayer(layer);

		this.setState({
			geoBoundingBox: {
				topLeft: {
					lat: event.layer._bounds._northEast.lat,
					lng: event.layer._bounds._southWest.lng
				},
				bottomRight: {
					lat: event.layer._bounds._southWest.lat,
					lng: event.layer._bounds._northEast.lng
				}
			}
		});
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

	buildParams(searchParams) {
		var params = {};

		searchParams = searchParams || this.state;

		if (searchParams.searchInput != '') {
			params.search = searchParams.searchInput;
		}

		if (searchParams.termsInput != '') {
			params.terms = searchParams.termsInput;
		}

		if (searchParams.titleTermsInput != '') {
			params.title_terms = searchParams.titleTermsInput;
		}

		if (searchParams.selectedCategories.length > 0) {
			params.category = searchParams.selectedCategories.join(',');
		}

		if (searchParams.collectionYearsEnabled) {
			params.collection_years = searchParams.collectionYears.join(',');
		}

		if (searchParams.collectorNameInput != '') {
			params.collector = searchParams.collectorNameInput;
		}

		if (searchParams.informantNameInput != '') {
			params.informant = searchParams.informantNameInput;
		}

		if (searchParams.collectorsGenderInput != '') {
			params.collectors_gender = searchParams.collectorsGenderInput;
		}

		if (searchParams.informantsGenderInput != '') {
			params.informants_gender = searchParams.informantsGenderInput;
		}

		if (searchParams.collectorsBirthYearsEnabled) {
			params.collectors_birth_years = searchParams.collectorsBirthYears.join(',');
		}

		if (searchParams.informantsBirthYearsEnabled) {
			params.informants_birth_years = searchParams.informantsBirthYears.join(',');
		}

		if (searchParams.landskapInput != '') {
			params.landskap = searchParams.landskapInput;
		}

		if (searchParams.sockenInput != '') {
			params.socken = searchParams.sockenInput;
		}

		if (searchParams.selectedTypes.length > 0) {
			params.type = searchParams.selectedTypes.join(',');
		}

		if (searchParams.geoBoundingBox) {
			params.geo_box = searchParams.geoBoundingBox.topLeft.lat+','+searchParams.geoBoundingBox.topLeft.lng+','+searchParams.geoBoundingBox.bottomRight.lat+','+searchParams.geoBoundingBox.bottomRight.lng;
		}

		if (searchParams.searchOptions != '') {
			params.search_options = searchParams.searchOptions;
		}

		return params;
	}

	triggerSearch() {
		var currentSearch = this.getCurrentSearch();

		var savedSearches = this.state.savedSearches;

		if (savedSearches[this.state.searchIndex]) {
			savedSearches[this.state.searchIndex] = currentSearch;
		}

		this.setState({
			expanded: false,
			savedSearches: savedSearches
		});

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

	termsAutocompleteFormatListLabel(item) {
		return item.term+' ('+item.doc_count+')';
	}

	personsAutocompleteFormatListLabel(item) {
		return item.name+' ('+item.doc_count+')';
	}

	sockenAutocompleteFormatListLabel(item) {
		return item.name+', '+item.lan;
	}

	landskapSelectFormatListLabel(item) {
		return item.name;
	}

	render() {
		var searchTabs = this.state.savedSearches.length > 0 ? this.state.savedSearches.map(function(searchItem, index) {
			var paramsDescription = searchItem.newSearch ? 'Ny sökning' : paramsHelper.describeParams(this.buildParams(searchItem), true);

			return <a key={index} onClick={this.searchTabClickHandler} data-index={index} className={'tab'+(index == this.state.searchIndex ? ' selected' : '')} title={paramsDescription}>{searchItem.newSearch ? 'Ny sökning' : (paramsDescription.length > 15 ? paramsDescription.substr(0, 15)+'...' : paramsDescription)}<span className="close-button" data-index={index} onClick={this.tabCloseButtonClickHandler}></span></a>
		}.bind(this)) : [
			<a key="0" onClick={this.searchTabClickHandler} data-index="0" className="tab selected">Sökning</a>
		];

		return (
			<div className={'advanced-search-form fixed'+(this.state.expanded ? ' expanded' : '')+(this.state.hasFocus || !this.state.lastSearchParams ? ' has-focus' : '')}
				onMouseEnter={this.mouseEnterHandler} 
				onMouseLeave={this.mouseLeaveHandler}>

				<div className="container">

					<div className="main-menu">
						<DropdownMenu ref="appMenu">
							<nav className="app-nav">
								<Link to="/">Hem</Link>
								<Link onClick={this.appMenuItemClickHandler} to="/search/analyse">Sök</Link>
								<Link onClick={this.appMenuItemClickHandler} to="/search/network">Topic terms nätverk</Link>
							</nav>
						</DropdownMenu>
					</div>

					<h1>Digitalt kulturarv</h1>

					<div className="row">

						<div className="ten columns">
							<div className={'search-input-wrapper'+(this.state.hasFocus ? ' focused' : '')}>

								<div className="search-tabs tabs-control">

									<div className="tabs">
										{searchTabs}
										<a className="tab" onClick={this.addSearchClickHandler}>+</a>
									</div>

								</div>

								<div className="search-label" dangerouslySetInnerHTML={{__html: paramsHelper.describeParams(this.state.lastSearchParams)}}></div>
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

						<div className="radio-list-inline">
							<div className="list-heading">Fras-sökning inställningar: </div>
							<label><input type="radio" checked={this.state.searchOptions == ''} name="searchOptions" onChange={this.inputChangeHandler} value="" /> Exakt</label>
							<label><input type="radio" checked={this.state.searchOptions == 'nearer'} name="searchOptions" onChange={this.inputChangeHandler} value="nearer" /> Närmare</label>
							<label><input type="radio" checked={this.state.searchOptions == 'near'} name="searchOptions" onChange={this.inputChangeHandler} value="near" /> Nära</label>
						</div>

						<hr />

						<div className="row">

							<div className="four columns">
								<label>Terms:</label>
								<AutocompleteInput inputName="termsInput" 
									searchUrl={config.apiUrl+config.endpoints.terms_autocomplete+'?search=$s'} 
									valueField="term"
									inputClassName="u-full-width" 
									onChange={this.inputChangeHandler} 
									value={this.state.termsInput} 
									onEnter={this.triggerSearch}
									listLabelFormatFunc={this.termsAutocompleteFormatListLabel} />

								<label>Titel terms:</label>
								<AutocompleteInput inputName="titleTermsInput" 
									searchUrl={config.apiUrl+config.endpoints.title_terms_autocomplete+'?search=$s'} 
									valueField="term" 
									inputClassName="u-full-width" 
									onChange={this.inputChangeHandler} 
									value={this.state.titleTermsInput} 
									onEnter={this.triggerSearch} 
									listLabelFormatFunc={this.termsAutocompleteFormatListLabel} />

							</div>

							<div className="four columns">
								<label>Typ:</label>

								<CheckBoxList values={['arkiv', 'tryckt', 'register', 'inspelning', 'frågelista']} 
									selectedItems={this.state.selectedTypes} 
									onChange={this.typeListChangeHandler} />
							</div>

							<div className="four columns">
								<label>Kategorier:</label>

								<CheckBoxList values={sagenkartaCategories.categories_advanced} 
									valueField="letter" 
									labelField="label" 
									labelFunction={function(item) {return item.letter.toUpperCase()+': '+item.label}}
									selectedItems={this.state.selectedCategories} 
									onChange={this.categoryListChangeHandler} />

							</div>

						</div>

						<hr />

						<div className="row">

							<div className="six columns">
								<label><input name="collectionYearsEnabled" 
									onChange={this.inputChangeHandler} 
									className="bottom-margin-0" 
									type="checkbox" 
									checked={this.state.collectionYearsEnabled} /> Uppteckningsår:</label>
								<Slider inputName="collectionYears" 
									start={[this.sliderStartYear, this.sliderEndYear]} 
									enabled={this.state.collectionYearsEnabled} 
									range={{min: this.sliderStartYear, max: this.sliderEndYear}} 
									onChange={this.inputChangeHandler} />
							</div>

							<div className="six columns">
								<label>Geografiskt område:</label>
								<DropdownMenu label="Välj område" dropdownHeight="350" dropdownWidth="400" onOpen={function() {
									this.refs.mapView.invalidateSize();
								}.bind(this)}>
									<MapBase ref="mapView" disableSwedenMap="true" mapHeight="350" />
								</DropdownMenu>

								<br/>

								<div className="row">

									<div className="six columns">
										<label>Socken:</label>
										<PopulatedSelect inputName="sockenInput" 
											dataUrl={config.apiUrl+config.endpoints.socken} 
											valueField="name"
											sortOptions="true"
											inputClassName="u-full-width" 
											onChange={this.inputChangeHandler} 
											value={this.state.sockenInput} 
											onEnter={this.triggerSearch}
											listLabelFormatFunc={this.sockenAutocompleteFormatListLabel} />
									</div>

									<div className="six columns">
										<label>Landskap:</label>
										<PopulatedSelect inputName="landskapInput" 
											dataUrl={config.apiUrl+config.endpoints.landskap} 
											valueField="name"
											sortOptions="true"
											inputClassName="u-full-width" 
											onChange={this.inputChangeHandler} 
											value={this.state.landskapInput} 
											onEnter={this.triggerSearch}
											listLabelFormatFunc={this.landskapSelectFormatListLabel} />
									</div>
								</div>

							</div>
							
						</div>

						<hr />

						<div className="row">

							<div className="six columns">

								<div className="row">

									<div className="eight columns">
										<label>Upptecknare:</label>
										<AutocompleteInput inputName="collectorNameInput" 
											searchUrl={config.apiUrl+config.endpoints.persons_autocomplete+'?search=$s&relation=collector'} 
											valueField="name"
											inputClassName="u-full-width" 
											onChange={this.inputChangeHandler} 
											value={this.state.collectorNameInput} 
											onEnter={this.triggerSearch}
											listLabelFormatFunc={this.personsAutocompleteFormatListLabel} />
									</div>

									<div className="four columns">
										<label>Upptecknare kön:</label>
										<select name="collectorsGenderInput"
											onChange={this.inputChangeHandler}
											value={this.state.collectorsGenderInput}
										>
											<option value=""></option>
											<option value="female">kvinnor</option>
											<option value="male">män</option>
											<option value="unknown">okänt</option>
										</select>
									</div>

								</div>
										
								<label><input name="collectorsBirthYearsEnabled" 
									onChange={this.inputChangeHandler} 
									className="bottom-margin-0" 
									type="checkbox" 
									checked={this.state.collectorsBirthYearsEnabled} /> Födelseår, upptecknare:</label>
								<Slider inputName="collectorsBirthYears" 
									start={[this.sliderStartYear, this.sliderEndYear]} 
									enabled={this.state.collectorsBirthYearsEnabled} 
									range={{min: this.sliderStartYear, max: this.sliderEndYear}} 
									onChange={this.inputChangeHandler} />

							</div>

							<div className="six columns">

								<div className="row">

									<div className="eight columns">
										<label>Informant:</label>
										<AutocompleteInput inputName="informantNameInput" 
											searchUrl={config.apiUrl+config.endpoints.persons_autocomplete+'?search=$s&relation=informant'} 
											valueField="name"
											inputClassName="u-full-width" 
											onChange={this.inputChangeHandler} 
											value={this.state.informantNameInput} 
											onEnter={this.triggerSearch}
											listLabelFormatFunc={this.personsAutocompleteFormatListLabel} />
									</div>

									<div className="four columns">
										<label>Informant kön:</label>
										<select name="informantsGenderInput"
											onChange={this.inputChangeHandler}
											value={this.state.informantsGenderInput}
										>
											<option value=""></option>
											<option value="female">kvinnor</option>
											<option value="male">män</option>
											<option value="unknown">okänt</option>
										</select>
									</div>

								</div>

								<label><input name="informantsBirthYearsEnabled" 
									onChange={this.inputChangeHandler} 
									className="bottom-margin-0" 
									type="checkbox" 
									checked={this.state.informantsBirthYearsEnabled} /> Födelseår, informant:</label>
								<Slider inputName="informantsBirthYears" 
									start={[this.sliderStartYear, this.sliderEndYear]} 
									enabled={this.state.informantsBirthYearsEnabled} 
									range={{min: this.sliderStartYear, max: this.sliderEndYear}} 
									onChange={this.inputChangeHandler} />

							</div>
						
						</div>

					</div>

				</div>

			</div>
		);
	}
}