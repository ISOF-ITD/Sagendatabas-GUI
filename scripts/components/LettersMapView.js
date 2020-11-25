import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import L from 'leaflet';
import './../../ISOF-React-modules/lib/leaflet-heat';
import 'leaflet.vectorgrid';
import 'leaflet-draw';

import chroma from 'chroma-js';

import MapBase from './../../ISOF-React-modules/components/views/MapBase';
import paramsHelper from './../utils/paramsHelper';
import Slider from './../../ISOF-React-modules/components/controls/Slider';
import CollectionYearsGraph from './CollectionYearsGraph';

import config from './../config';

export default class LettersMapView extends React.Component {
	constructor(props) {
		super(props);

		window.mapView = this;

		this.collectionYearsGraphRef = React.createRef();
		//TODO Maybe use a React way instead of ref for React-component MapBase instead of get this to work with MapBase and other components using MapBase:
		//this.mapViewRef = React.createRef();
		this.timerangeSliderRef = React.createRef();

		this.baseLayerChangeHandler = this.baseLayerChangeHandler.bind(this);

		this.searchHandler = this.searchHandler.bind(this);
		this.timerangeChangeHandler = this.timerangeChangeHandler.bind(this);
		this.sliderGraphChangeHandler = this.sliderGraphChangeHandler.bind(this);

		this.timerangeSliderSlideHandler = this.timerangeSliderSlideHandler.bind(this);
		this.fullScreenButtonClickHandler = this.fullScreenButtonClickHandler.bind(this);

		this.state = {
			params: null,
			data: null,
			loading: false,
			sliderStartYear: config.minYear,
			sliderEndYear: config.maxYear,
			fullScreen: false,
			tooltip: {
				title: '',
				text: '',
				x: 0,
				y: 0
			}
		}
	}

	componentDidMount() {
		if (window.eventBus) {
			if (!this.props.disableEventBus) {
				window.eventBus.addEventListener('searchForm.search', this.searchHandler);
			}
			window.eventBus.addEventListener('collectionYears.timerangeChanged', this.timerangeChangeHandler);
		}

		this.featureLayer = L.featureGroup();
		this.featureLayer.addTo(this.refs.mapView.map);
		//this.featureLayer.addTo(this.mapViewRef.map);

		if (this.props.person) {
			this.fetchData({
				person_id: this.props.person
			});
		}
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('searchForm.search', this.searchHandler);
		}
	}

	fullScreenButtonClickHandler() {
		this.setState({
			fullScreen: !this.state.fullScreen
		}, function() {
			this.refs.mapView.map.invalidateSize();
		}.bind(this));
	}

	sliderGraphChangeHandler(event) {
		if (event == null) {
			this.timerangeSliderRef.slider.set([this.state.sliderStartYear, this.state.sliderEndYear]);
		}
		else {
			this.timerangeSliderRef.slider.set(event);
		}
	}

	timerangeChangeHandler(event, data) {
		console.log('timerangeChangeHandler');
		console.log(data);

		if (isFinite(data.min) && isFinite(data.max)) {
			this.refs.timerangeSlider.slider.set([data.min, data.max]);

			this.setState({
				sliderStartYear: data.min,
				sliderEndYear: data.max
			});

			this.collectionYearsGraphRef.setTimeOverlay([data.min, data.max]);
		}
	}

	searchHandler(event, data) {
		this.setState({
			params: data.params
		}, function() {
			this.fetchData();
		}.bind(this));
	}

	timerangeSliderSlideHandler(event) {
		// Väntar tills vi har laddad data
		if (this.waitingForSlider) {
			return;
		}

		// Kopierar params object, annars kan det krocka med params i SearchSearch
		var params = this.state.params ? JSON.parse(JSON.stringify(this.state.params)) : {};
		params.collection_years = event.target.value.join(',');

		if (this.props.person) {
			params.person_id = this.props.person;
		}

		this.waitingForSlider = true;

		this.setState({
			params: params
		}, function() {
			this.fetchData(false, function() {
				this.waitingForSlider = false;
			}.bind(this));
		}.bind(this));

		setTimeout(function() {
			// Om inget händer om en sekund slutar vi vänta och fortsätter
			this.waitingForSlider = false;
		}.bind(this), 1000);

		this.collectionYearsGraphRef.setTimeOverlay(event.target.value);
	}

	baseLayerChangeHandler() {
		if (this.dataLayer) {
			this.dataLayer.bringToFront();
		}
	}

	updateMap() {
		this.featureLayer.clearLayers();

		var markerPoints = [];

		_.each(this.state.data, function(dispatchPlace) {
			var markerClone = JSON.parse(JSON.stringify(dispatchPlace));
			delete markerClone.destinations;

			markerPoints.push(markerClone);

			_.each(dispatchPlace.destinations, function(destination) {
				markerPoints.push(destination);
			});
		});

		markerPoints = _.uniq(markerPoints, function(item) {
			return item.id;
		});

		_.each(markerPoints, function(markerPoint) {
			var marker = L.marker(markerPoint.location, {
				title: markerPoint.name
			});

			this.featureLayer.addLayer(marker);
		}.bind(this));

		_.each(this.state.data, function(dispatchPlace) {
			if (dispatchPlace.destinations.length > 0) {
				_.each(dispatchPlace.destinations, function(destination) {
					if (destination.location) {
						var line = L.polyline([dispatchPlace.location, destination.location], {
							className: 'letter-path'
						});
						this.featureLayer.addLayer(line);
					}
				}.bind(this));
			}
		}.bind(this));

		var bounds = _.pluck(markerPoints, 'location');
		console.log(bounds);

		if (bounds.length > 0) {
			this.refs.mapView.map.fitBounds(bounds, {
				paddingTopLeft: [20, 20],
				paddingBottomRight: [210, 20]
			});
		}
	}

	fetchData(p) {
		var params = Object.assign({}, config.requiredApiParams, p || this.state.params);

		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString) {
			return;
		}

		this.setState({
			paramString: paramString,
//			loading: true
		});


		fetch(config.apiUrl+config.endpoints.letters+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.metadata.total,
					data: json.data,
				}, function() {
					this.updateMap();
				}.bind(this));
			}.bind(this));
	}

	render() {
		return (
			<div className={'map-wrapper no-padding'+(this.state.loading ? ' loading' : '')+(this.state.fullScreen ? ' full-screen' : '')} style={this.props.mapHeight ? {height: Number(this.props.mapHeight)} : {}} ref="container">

				<MapBase ref="mapView" className="map-container" disableSwedenMap="true" scrollWheelZoom={false} onBaseLayerChange={this.baseLayerChangeHandler} />

				<div className="map-timeline-container" style={{opacity: this.state.data == null ? 0.4 : 1}}>

					<CollectionYearsGraph name="mapCollectionGraph" ref={this.collectionYearsGraphRef} 
						graphHeight="100" 
						simpleGraph={true} 
						listenForTimerangeChange={true}
						defaultRangeSelectAction="onChange" 
						onlyGeography={true}
						onChange={this.sliderGraphChangeHandler} />

					<Slider ref={this.timerangeSliderRef}
						inputName="collectionYears" 
						enabled={this.state.data != null}
						start={[this.state.sliderStartYear, this.state.sliderEndYear]} 
						rangeMin={this.state.sliderStartYear} 
						rangeMax={this.state.sliderEndYear}
						onChange={this.timerangeSliderSlideHandler} 
						onSlide={this.timerangeSliderSlideHandler} />
				</div>

				<div className="loading-overlay"></div>

				<div style={{top: this.state.tooltip.y+20, left: this.state.tooltip.x+20}} className={'graph-tooltip position-fixed'+(this.state.tooltip.title != '' && this.state.tooltip.text ? ' visible' : '')}>
					<strong>{this.state.tooltip.title}</strong><br/>
					<span dangerouslySetInnerHTML={{__html: this.state.tooltip.text}}></span>
				</div>

			</div>
		);
	}
}