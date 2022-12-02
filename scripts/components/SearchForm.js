import React from 'react';
import { hashHistory, Link } from 'react-router-dom';

import L from 'leaflet';
import 'leaflet-draw';

import EventBus from 'eventbusjs';
import _ from 'underscore';

import CheckBoxList from './../../ISOF-React-modules/components/controls/CheckBoxList';
// import PopulatedCheckBoxList from './../../ISOF-React-modules/components/controls/PopulatedCheckBoxList';
import PopulatedCheckBoxList from './PopulatedCheckBoxList';
import Slider from './../../ISOF-React-modules/components/controls/Slider';
import AutocompleteInput from './../../ISOF-React-modules/components/controls/AutocompleteInput';
import PopulatedSelect from './../../ISOF-React-modules/components/controls/PopulatedSelect';
import DropdownMenu from './../../ISOF-React-modules/components/controls/DropdownMenu';
import MapBase from './../../ISOF-React-modules/components/views/MapBase';

import sagenkartaCategories from './../../ISOF-React-modules/utils/sagenkartaCategories';
import paramsHelper from './../utils/paramsHelper';

import config from './../config.js';
import { tickStep } from 'd3';

export default class SearchForm extends React.Component {
	constructor(props) {
		super(props);

		window.searchForm = this;

		this.inputChangeHandler = this.inputChangeHandler.bind(this);
		this.recordTypeListChangeHandler = this.recordTypeListChangeHandler.bind(this);
		this.typeListChangeHandler = this.typeListChangeHandler.bind(this);
		this.categoryListChangeHandler = this.categoryListChangeHandler.bind(this);

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
		this.sliderClickHandler = this.sliderClickHandler.bind(this);

		// Förberedar state objectet som innehåller alla sökparams
		this.state = {
			searchInput: '',
			termsInput: '',
			searchTypeInput: 'all',
			titleTermsInput: '',
			availableRecordTypes: ['one_record', 'one_accession_row'],
			selectedRecordTypes: ['one_record'],
			selectedTypes: ['arkiv'], 
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

			phraseSearchOptions: '',
			rawTextSearch: false,

			searchIndex: 0,
			savedSearches: [],


			lastSearchParams: null,

			expanded: false,
			hasFocus: false
		};
	}

	// Get nuvarande sökparams, använder JSON.parse(JSON.stringify()) för att klona objektet
 	getCurrentSearch() {
		return JSON.parse(JSON.stringify({
			searchInput: this.state.searchInput || '',
			termsInput: this.state.termsInput || '',
			searchTypeInput: this.state.searchTypeInput || 'all',
			titleTermsInput: this.state.titleTermsInput || '',
			selectedRecordTypes: this.state.selectedRecordTypes || ['one_record'],
			availableTypes: this.state.availableTypes || (this.state.selectedTypes && this.state.selectedTypes.includes('arkiv') && ['one_record']) || [],
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
		// Byter till en sparade sökning

		// Hämtar nuvarande sökparams
		var currentSearch = this.getCurrentSearch();

		// Hämtar sparade sökningar
		var savedSearches = this.state.savedSearches;

		// Uppdaterar nuvarande sökning till savedSearches
		if (savedSearches[this.state.searchIndex] && !discardCurrentSearch) {
			savedSearches[this.state.searchIndex] = currentSearch;
		}

		// Hämtar sparade sökning utifrån index (index av savedSearches)
		if (savedSearches[index]) {
			currentSearch = savedSearches[index];
		}

		// Uppdaterar state objektet med hämtade sökningen
		this.setState({
			searchInput: currentSearch.searchInput,
			termsInput: currentSearch.termsInput,
			searchTypeInput: currentSearch.searchTypeInput,
			titleTermsInput: currentSearch.titleTermsInput,
			selectedRecordTypes: currentSearch.selectedRecordTypes,
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
		// Lägger till en ny sökning som visas som en tabb ovanför sökfältet

		// Sparar nuvarande sökning till ett objekt
		var currentSearch = this.getCurrentSearch();

		// Hämtar alla sparade sökningar
		var savedSearches = this.state.savedSearches;

		// Lägger nuvarande sökning (currentSearch) till savedSearches
		if (savedSearches[this.state.searchIndex]) {
			savedSearches[this.state.searchIndex] = currentSearch;
		}
		else {
			savedSearches.push(currentSearch);
		}

		// Lägger till en ny 'tom' sökning till savedSearches
		savedSearches.push({
			searchInput: '',
			termsInput: '',
			searchTypeInput: 'all',
			titleTermsInput: '',
			selectedRecordTypes: ['one_record'],
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

		// Sparar state objected med ny 'tom' sökning samt uppdaterad savedSearches objekt
		this.setState({
			searchInput: '',
			termsInput: '',
			searchTypeInput: 'all',
			titleTermsInput: '',
			selectedRecordTypes: ['one_record'],
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
		// Lägger till ny sökning som en tabb ovanför sökfältet
		this.addSearch();
	}

	searchTabClickHandler(event) {
		// Byter till en annan sökning med att klicka på en tabb
		if (event.currentTarget.dataset.index != this.state.searchIndex) {
			this.setSearch(event.currentTarget.dataset.index);
		}
	}

	tabCloseButtonClickHandler(event) {
		// Stänger ner en sökning och raderar den från savedSearches

		event.stopPropagation();

		// Hämtar tabIndex = vilken tabb man klickade på
		var tabIndex = event.currentTarget.dataset.index;

		var savedSearches = this.state.savedSearches;
		var searchIndex = this.state.searchIndex;

		// Raderar sökningen från savedSearches
		savedSearches.splice(tabIndex, 1);

		// Uppdaterar searchIndex
		searchIndex = searchIndex == 0 ? searchIndex : searchIndex >= tabIndex ? searchIndex-1 : searchIndex;

		// Sparar state objektet
		this.setState({
			savedSearches: savedSearches,
			searchIndex: searchIndex
		}, function() {
			// När state har sparas, hämtar ny sökning från searchIndex utifrån ny searchIndex
			this.setSearch(searchIndex, true);
		}.bind(this));
	}

	appMenuItemClickHandler(event) {
		this.refs.appMenu.closeMenu();
	}

	sliderClickHandler(event) {
		// activate year range
		this.setState({
			collectionYearsEnabled: true
		});
	}

	componentDidMount() {
		// Förberedar gränsnittet när komponentet är redo i DOM

		/*
		Gränsnitt för kartan i sökformuläret
		Kartan gör att man kan rita en reklangel för att söka bara inom det området
		Här lägger vi till ny controls till Leaflet för att kunna rita och ta bort ritad reklangle
		*/
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

		// Anropar mapDrawLayerCreatedHandler när vi har ritat en rektangle
		this.refs.mapView.map.on(L.Draw.Event.CREATED, this.mapDrawLayerCreatedHandler);

		this.refs.mapView.map.on(L.Draw.Event.DRAWSTART, function(event) {
			this.drawLayer.clearLayers();
		}.bind(this));
	}

	mapDrawLayerCreatedHandler(event) {
		// Sparar geografiska gränser av rektangel som har ritas som sökparam i state objektet
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
		/*
		En input change handler för alla sökfält, sparar sökfältets värde till ett värde i state objektet
		som har samma namn som sökfältet.
		Exempel: <input type="text" name="search" /> sparas till 'state.search'
		*/
		var value = event.target.type && event.target.type == 'checkbox' ? event.target.checked : event.target.value;

		this.setState({
			[event.target.name]: value
		});
	}

	searchInputFocusHandler() {
		// Expanderar sökformuläret när searchInput fältet får fokus
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
		if (this.mouseIdleTimer) {
			clearTimeout(this.mouseIdleTimer);
		}
	}

	mouseLeaveHandler() {
		/*
		När musen lämnar sökformuläret vänter vi i en sekund, om musen inte kommer tillbaka förminskar vi
		sökformuläret (mouseIdleHandler)
		*/
		// if (!this.state.hasFocus) {
		// 	this.mouseIdleTimer = setTimeout(this.mouseIdleHandler.bind(this), 1000);
		// }
	}

	mouseIdleHandler() {
		this.setState({
			expanded: false
		});
	}

	recordTypeListChangeHandler(event) {
		// Uppdaterar state objektet med ny recordtyp som man har valt i recordtyp fältet
		this.setState({
			selectedRecordTypes: event
		});
		if(this.state.selectedRecordTypes.includes('one_record') || this.state.selectedRecordTypes.includes('one_accession_row')){
			this.setState({
				// add 'arkiv' to selectedTypes if it is not already in list
				selectedTypes: this.state.selectedTypes.includes('arkiv') ? this.state.selectedTypes : this.state.selectedTypes.concat('arkiv'),				
			});
			// if(!this.state.selectedCategories.includes('trad16')) {
			// 	this.setState({
			// 		selectedCategories: this.state.selectedCategories.concat(['trad16']),
			// 	});
			// }
		}
		else {
			this.setState({
				// remove 'arkiv' from selectedTypes if it is in list
				selectedTypes: this.state.selectedTypes.includes('arkiv') ? this.state.selectedTypes.filter(x => x !== 'arkiv') : this.state.selectedTypes,
				// selectedCategories: this.state.selectedCategories.filter(x => x !== 'trad16'),
			});
		}
		// if 'one_record' is not in list 'record_type_list', set state for selectedCategories to []		
		if (!this.state.selectedRecordTypes.includes('one_record')) {
			this.setState({
				selectedCategories: []
			});
		}
	}

	typeListChangeHandler(event) {
		// Uppdaterar state objektet med ny materialtyp som man har valt i materialtyp fältet
		// och: trycker man 'arkiv' får man välja mellan uppteckning och/eller accession
		let selectedTypes = event;
		// let availableRecordTypes =[];
		// if (selectedTypes.includes('arkiv')) {
			// availableRecordTypes = ['one_record', 'one_accession_row'];
		// }
		this.setState({
			// availableRecordTypes: availableRecordTypes,
			selectedTypes: selectedTypes,
		});
	}

	categoryListChangeHandler(event) {
		// Uppdaterar state objektet med ny kategori som man har valt i kategori fältet
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
		// Utför sökning när man trycker på enter i sökfältet
		if (event.key == 'Enter') {
			this.triggerSearch();
		}
	}

	buildParams(searchParams) {
		// Bygger upp och förberedar parametrar som ska skickas via eventBus till visualiserings komponenter
		var params = {};

		searchParams = searchParams || this.state;

		if (searchParams.searchInput != '') {
			params.search = searchParams.searchInput;
		}

		if (searchParams.termsInput != '') {
			params.terms = searchParams.termsInput;
		}
		if (searchParams.searchTypeInput != '') {
			switch (searchParams.searchTypeInput) {
				case 'title':
					params.search_title = 'true';
					break;
				case 'content':
					params.search_content = 'true';
			}
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

		if (searchParams.selectedRecordTypes.length > 0) {
			params.recordtype = searchParams.selectedRecordTypes.join(',');
		}

		if (searchParams.selectedTypes.length > 0) {
			params.type = searchParams.selectedTypes.join(',');
		}

		if (searchParams.geoBoundingBox) {
			params.geo_box = searchParams.geoBoundingBox.topLeft.lat+','+searchParams.geoBoundingBox.topLeft.lng+','+searchParams.geoBoundingBox.bottomRight.lat+','+searchParams.geoBoundingBox.bottomRight.lng;
		}

		if (searchParams.rawTextSearch != '') {
			params.search_raw = true;
		}

		params.phrase_options = this.state.phraseSearchOptions;

		return params;
	}

	triggerSearch() {
		/*
		Utför ny sökning
		*/

		// Hämtar nuvarande sökparams och sparar i savedSearches
		var currentSearch = this.getCurrentSearch();
		var savedSearches = this.state.savedSearches;
		if (savedSearches[this.state.searchIndex]) {
			savedSearches[this.state.searchIndex] = currentSearch;
		}

		this.setState({
			expanded: false,
			savedSearches: savedSearches
		});

		// Checkar om eventBus finns
		if (window.eventBus) {
			// Förberedar parametrar som ska skickas
			var params = this.buildParams();

			// Skickar parametrar via eventBus till visualiserings komponenter
			// OBS! Inte optimalt, kringgår den egentliga React-logiken (top-down data-flöde)
			window.eventBus.dispatch('searchForm.search', this, {
				params: params
			});
			// send search query to matomo
			window.eventBus.dispatch('searchForm.matomo', this, {
				search: params.search
			});

			// Sparar parametrarna till 'lastSearchParams' som används för att beskriva parametrara i gränsnittet som text
			this.setState({
				lastSearchParams: params
			});
		}
	}

	// Formatterings funktioner för Autocomplete och PopulatedSelect komponenterna
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

	categoriesList() {
		// if state.selectedRecordTypes has element 'one_record'
		if (this.state.selectedRecordTypes.indexOf('one_record') > -1) {
			return(
				<div className="four columns">
					<label>Kategorier för uppteckningar:</label>

					{/* Filtrerad PopuplatedCheckBoxList som innehåller alla kategorier */}
					<div >
						<PopulatedCheckBoxList ref="categoryList" dataUrl={config.apiUrl+config.endpoints.categories}
							filteredBy="type"
							valueField="key"
							labelField="name"
							selectedRecordTypes={this.state.selectedRecordTypes}
							selectedTypes={this.state.selectedTypes}
							// labelFunction={function(item) {return item.key.toUpperCase()+': '+item.name+' ('+item.type+')'}}
							labelFunction={function(item) {return `${item.name} (${item.key.toLowerCase()})`} }
							// selectedItems={this.state.selectedCategories}
							onSelectionChange={this.categoryListChangeHandler} onFetch={function(data) {
								window.allCategories = data;
							}.bind(this)} />
					</div>

				</div>
			)
		} else {
			return null;
		}
	}

	render() {
		// Bygger upp lista över html elements för söknings tabbarna
		var searchTabs = this.state.savedSearches.length > 0 ? this.state.savedSearches.map(function(searchItem, index) {
			// Beskriver sökparametrarna som text för visning i gränsnittet
			var paramsDescription = searchItem.newSearch ? 'Ny sökning' : paramsHelper.describeParams(this.buildParams(searchItem), true, this.refs.categoryList ? this.refs.categoryList.state.data : null);

			return <a key={index} onClick={this.searchTabClickHandler} data-index={index} className={'tab'+(index == this.state.searchIndex ? ' selected' : '')} title={paramsDescription}>{searchItem.newSearch ? 'Ny sökning' : (paramsDescription.length > 15 ? paramsDescription.substr(0, 15)+'...' : paramsDescription)}<span className="close-button" data-index={index} onClick={this.tabCloseButtonClickHandler}></span></a>
		}.bind(this)) : [
			<a key="0" onClick={this.searchTabClickHandler} data-index="0" className="tab selected">Sökning</a>
		];

		return (
			<div className={'advanced-search-form'+(this.state.expanded ? ' expanded' : '')+(this.state.hasFocus || !this.state.lastSearchParams ? ' has-focus' : '')}
				onMouseEnter={this.mouseEnterHandler}
				onMouseLeave={this.mouseLeaveHandler}>

				<div className="container">

					{/* Meny för applicationen */}
					{/* <div className="main-menu">
						<DropdownMenu ref="appMenu">
							<nav className="app-nav">
								<Link to="/">Hem</Link>
								<Link onClick={this.appMenuItemClickHandler} to="/search/analyse">Sök</Link>
								
								//extended app:
								//<Link onClick={this.appMenuItemClickHandler} to="/search/network">Topic terms nätverk</Link>
								
							</nav>
						</DropdownMenu>
					</div> */}

					<div class="logo">

						<div id="Logo" className="isof-app-header">

							<a href="https://www.isof.se/arkiv-och-insamling/digitala-arkivtjanster/folke"><img alt="Folke på Institutet för språk och folkminnen" className="sv-noborder" style={{maxWidth:326,maxHeight:50}} src="img/folkelogga.svg" /></a>
							<div id="about">

							</div>
							
						</div>

					</div>

					<div className="row">

						<div className="ten columns">
							<div className={'search-input-wrapper'+(this.state.hasFocus ? ' focused' : '')}>

								<div className="search-tabs tabs-control">

									{/* Tabbar för att byta mellan olika sökningar */}
									<div className="tabs">
										{searchTabs}
										<a className="tab" onClick={this.addSearchClickHandler}>+</a>
									</div>

								</div>

								{/* Sökfältet, först search-label som innehåller text beskrivning av sökningen */}
								<div className="search-label" title={paramsHelper.describeParams(this.state.lastSearchParams, true, this.refs.categoryList ? this.refs.categoryList.state.data : null)} dangerouslySetInnerHTML={{__html: paramsHelper.describeParams(this.state.lastSearchParams, false, this.refs.categoryList ? this.refs.categoryList.state.data : null)}}></div>
								<input name="searchInput"
									placeholder="Söksträng"
									className="search-input u-full-width"
									type="text"
									onChange={this.inputChangeHandler}
									onFocus={this.searchInputFocusHandler}
									onBlur={this.searchInputBlurHandler}
									onKeyPress={this.searchInputKeypressHandler}
									value={this.state.searchInput} />

								{/* Knapp som expanderar sökformuläret */}
								<button className="expand-button" onClick={this.expandButtonClickHandler}><span>...</span></button>
							</div>
						</div>

						<div className="two columns">
							{/* Sökknappen */}
							<button className="search-button button-primary u-pull-right u-full-width" onClick={this.triggerSearch}>Sök</button>
						</div>

					</div>

					<div className="expanded-content">

						{/* Inställningar för olika metoder av fritext sökning */}
						<div className="radio-list-inline" style={{float: 'left'}}>
							<label><input type="checkbox"
								name="rawTextSearch"
								checked={this.state.rawTextSearch}
								onChange={this.inputChangeHandler} /> Exakt sökning</label>
						</div>

						{/* Choose search all, search only title or only content */}
						<div className="radio-list-inline" style={{float: 'left'}}>
							<label><input type="radio"
								name="searchTypeInput"
								value="all"
								checked={this.state.searchTypeInput == 'all'}
								onChange={this.inputChangeHandler} /> Allt</label>
							<label><input type="radio"
								name="searchTypeInput"
								value="title"
								checked={this.state.searchTypeInput == 'title'}
								onChange={this.inputChangeHandler} /> Titel</label>
							<label><input type="radio"
								name="searchTypeInput"
								value="content"
								checked={this.state.searchTypeInput == 'content'}
								onChange={this.inputChangeHandler} /> Avskriven text</label>
						</div>

						{/* Inställningar för fras-sökning */}
						{/* Deaktiverat, fungerar inte just nu */}
						{/* <div className="radio-list-inline">
							<div className="list-heading">Fras-sökning inställningar: </div>
							<label><input type="radio" checked={this.state.phraseSearchOptions == ''} name="phraseSearchOptions" onChange={this.inputChangeHandler} value="" /> Exakt</label>
							<label><input type="radio" checked={this.state.phraseSearchOptions == 'nearer'} name="phraseSearchOptions" onChange={this.inputChangeHandler} value="nearer" /> Närmare</label>
							<label><input type="radio" checked={this.state.phraseSearchOptions == 'near'} name="phraseSearchOptions" onChange={this.inputChangeHandler} value="near" /> Nära</label>
						</div> */}

						{/* <hr /> */}

						<div className="row">

							{/* <div className="three columns">
								<label>Terms:</label> */}
								{/* AutocompleteInput för sökning av topic terms */}
								{/* <AutocompleteInput inputName="termsInput"
									searchUrl={config.apiUrl+config.endpoints.terms_autocomplete+'?search=$s'}
									valueField="term"
									inputClassName="u-full-width"
									onChange={this.inputChangeHandler}
									value={this.state.termsInput}
									onEnter={this.triggerSearch}
									listLabelFormatFunc={this.termsAutocompleteFormatListLabel} />

								<label>Rubrik på källa:</label> */}
								{/* AutocompleteInput för sökning av titel topic terms */}
								{/* <AutocompleteInput inputName="titleTermsInput"
									searchUrl={config.apiUrl+config.endpoints.title_terms_autocomplete+'?search=$s'}
									valueField="term"
									inputClassName="u-full-width"
									onChange={this.inputChangeHandler}
									value={this.state.titleTermsInput}
									onEnter={this.triggerSearch}
									listLabelFormatFunc={this.termsAutocompleteFormatListLabel} />

							</div> */}

							{/* <div className="four columns">
								<label>Typ:</label> */}

								{/* CheckBoxList som innehåller alla typer av material. Todo: byta till PopulatetCheckBoxList */}
								{/* <CheckBoxList values={[
													'arkiv',
													'tryckt',
													// 'register',
													// 'matkarta',
													// 'inspelning',
													// 'frågelista',
													// 'accessionsregister',
													// 'brev',
													// 'webbfrågelista',
													// 'snd',
												]}
									selectedItems={this.state.selectedTypes}
									onSelectionChange={this.typeListChangeHandler} /> */}
							{/* </div> */}

							<div className="four columns">
								<label>Dokumenttyp:</label>

								{/* CheckBoxList som innehåller alla typer av material. Todo: byta till PopulatetCheckBoxList */}
								<div className="checkbox-list">
									<CheckBoxList values={this.state.availableRecordTypes}
													// {[
													// 	'one_record',
													// 	'one_accession_row',
													// 	// 'register',
													// 	// 'matkarta',
													// 	// 'inspelning',
													// 	// 'frågelista',
													// 	// 'accessionsregister',
													// 	// 'brev',
													// 	// 'webbfrågelista',
													// 	// 'snd',
													// ]}
										selectedItems={this.state.selectedRecordTypes}
										onSelectionChange={this.recordTypeListChangeHandler} />
										<CheckBoxList values={[
														// 'arkiv',
														'tryckt',
														// 'register',
														// 'matkarta',
														// 'inspelning',
														// 'frågelista',
														// 'accessionsregister',
														// 'brev',
														// 'webbfrågelista',
														// 'snd',
													]}
										selectedItems={this.state.selectedTypes}
										onSelectionChange={this.typeListChangeHandler} />
									</div>
							</div>
							{this.categoriesList()}

						</div>

						<hr />

						<div className="row">

							<div className="six columns" onClick={this.sliderClickHandler}>
								<label><input name="collectionYearsEnabled"
									onChange={this.inputChangeHandler}
									className="bottom-margin-0"
									type="checkbox"
									checked={this.state.collectionYearsEnabled} /> Uppteckningsår:</label>

								{/* Slider för uppteckningsår */}
								<Slider inputName="collectionYears"
									start={[this.sliderStartYear, this.sliderEndYear]}
									enabled={this.state.collectionYearsEnabled}
									rangeMin={this.sliderStartYear}
									rangeMax={this.sliderEndYear}
									onChange={this.inputChangeHandler} />
							</div>

							<div className="six columns">
								<label>Geografiskt område:</label>
								{/* Karta var det är möjligt att rita en rektangel för att söka inom speciellt område */}
								<DropdownMenu label="Välj område" dropdownHeight="350" dropdownWidth="400" onOpen={function() {
									this.refs.mapView.invalidateSize();
								}.bind(this)}>
									<MapBase ref="mapView" disableSwedenMap="true" mapHeight="350" />
								</DropdownMenu>

								<br/>

								<div className="row">

									<div className="six columns">
										<label>Socken:</label>

										{/* Select input för socken */}
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
	
										{/* Select input för landskap */}
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

										{/* AutocompleteInput för sökning efter upptecknares namn */}
										<AutocompleteInput inputName="collectorNameInput"
											// narrow down persons to having idprefix=acc,crwd when "Tryckt" is not selected
											searchUrl={config.apiUrl+config.endpoints.persons_autocomplete+'?search=$s&relation=c'+ (_.contains(this.state.selectedTypes,'tryckt') ? '' : '&idprefix=acc,crwd') }
											valueField="name"
											inputClassName="u-full-width"
											onChange={this.inputChangeHandler}
											value={this.state.collectorNameInput}
											onEnter={this.triggerSearch}
											listLabelFormatFunc={this.personsAutocompleteFormatListLabel} />
									</div>

									<div className="four columns">
										<label>Upptecknare kön:</label>

										{/* Upptecknare kön */}
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

								{/* Upptecknare födelseår */}
								<Slider inputName="collectorsBirthYears"
									start={[this.sliderStartYear, this.sliderEndYear]}
									enabled={this.state.collectorsBirthYearsEnabled}
									rangeMin={this.sliderStartYear}
									rangeMax={this.sliderEndYear}
									onChange={this.inputChangeHandler} />

							</div>

							<div className="six columns">

								<div className="row">

									<div className="eight columns">
										<label>Informant:</label>

										{/* AutocompleteInput för sökning efter upptecknares namn */}
										<AutocompleteInput inputName="informantNameInput"
											searchUrl={config.apiUrl+config.endpoints.persons_autocomplete+'?search=$s&relation=i&idprefix=acc,crwd'}
											valueField="name"
											inputClassName="u-full-width"
											onChange={this.inputChangeHandler}
											value={this.state.informantNameInput}
											onEnter={this.triggerSearch}
											listLabelFormatFunc={this.personsAutocompleteFormatListLabel} />
									</div>

									<div className="four columns">
										<label>Informant kön:</label>

										{/* Informant kön */}
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


								{/* Informant födelseår */}
								<Slider inputName="informantsBirthYears"
									start={[this.sliderStartYear, this.sliderEndYear]}
									enabled={this.state.informantsBirthYearsEnabled}
									rangeMin={this.sliderStartYear}
									rangeMax={this.sliderEndYear}
									onChange={this.inputChangeHandler} />

							</div>

						</div>

					</div>

				</div>

			</div>
		);
	}
}
