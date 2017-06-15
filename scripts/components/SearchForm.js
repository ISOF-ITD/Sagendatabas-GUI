import React from 'react';
import { hashHistory } from 'react-router';

import L from 'leaflet';
import 'leaflet-draw';

import EventBus from 'eventbusjs';

import CheckBoxList from './../../ISOF-React-modules/components/controls/CheckBoxList';
import Slider from './../../ISOF-React-modules/components/controls/Slider';
import sagenkartaCategories from './../../ISOF-React-modules/utils/sagenkartaCategories';
import AutocompleteInput from './../../ISOF-React-modules/components/controls/AutocompleteInput';
import DropdownMenu from './../../ISOF-React-modules/components/controls/DropdownMenu';
import MapBase from './../../ISOF-React-modules/components/views/MapBase';

import paramsHelper from './../utils/paramsHelper';

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

		this.mapDrawLayerCreatedHandler = this.mapDrawLayerCreatedHandler.bind(this);

		this.triggerSearch = this.triggerSearch.bind(this);

		this.sliderStartYear = config.minYear;
		this.sliderEndYear = config.maxYear;

		this.state = {
			searchInput: '',
			topicsInput: '',
			titleTopicsInput: '',
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

			geoBoundingBox: null,

			lastSearchParams: null,

			expanded: false,
			hasFocus: false
		};
	}

	componentDidMount() {
		L.Control.RemoveAll = L.Control.extend({
			options: {
				position: 'topleft',
			},

			onAdd: function (map) {
				var controlDiv = L.DomUtil.create('div', 'leaflet-control leaflet-bar leaflet-draw-toolbar');
				var controlUI = L.DomUtil.create('a', 'leaflet-draw-edit-remove', controlDiv);
				controlUI.title = 'Remove all drawn items';
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
		}, function() {
			console.log(this.state);
		}.bind(this));
	}

	inputChangeHandler(event) {
		var value = event.target.type && event.target.type == 'checkbox' ? event.target.checked : event.target.value;

		console.log(event.target.name);
		console.log(value);

		this.setState({
			[event.target.name]: value
		}, function() {
			console.log(this.state);
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
		console.log(event);
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
			params.collection_years = this.state.collectionYears.join(',');
		}

		if (this.state.collectorNameInput != '') {
			params.collector = this.state.collectorNameInput;
		}

		if (this.state.informantNameInput != '') {
			params.informant = this.state.informantNameInput;
		}

		if (this.state.collectorsGenderInput != '') {
			params.collectors_gender = this.state.collectorsGenderInput;
		}

		if (this.state.informantsGenderInput != '') {
			params.informants_gender = this.state.informantsGenderInput;
		}

		if (this.state.collectorsBirthYearsEnabled) {
			params.collectors_birth_years = this.state.collectorsBirthYears.join(',');
		}

		if (this.state.informantsBirthYearsEnabled) {
			params.informants_birth_years = this.state.informantsBirthYears.join(',');
		}

		if (this.state.geoBoundingBox) {
			params.geo_box = this.state.geoBoundingBox.topLeft.lat+','+this.state.geoBoundingBox.topLeft.lng+','+this.state.geoBoundingBox.bottomRight.lat+','+this.state.geoBoundingBox.bottomRight.lng;
		}

		return params;
	}

	triggerSearch() {
		this.setState({
			expanded: false
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

	topicsAutocompleteFormatListLabel(item) {
		return item.topic+' ('+item.doc_count+')';
	}

	personsAutocompleteFormatListLabel(item) {
		return item.name+' ('+item.doc_count+')';
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