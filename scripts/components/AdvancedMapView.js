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

import ColorLegendsGraph from './ColorLegendsGraph';

import config from './../config';

export default class AdvancedMapView extends React.Component {
	constructor(props) {
		super(props);

		window.mapView = this;

		this.vectorGridMouseMove = this.vectorGridMouseMove.bind(this);
		this.vectorGridMouseOut = this.vectorGridMouseOut.bind(this);
		this.vectorGridClick = this.vectorGridClick.bind(this);

		this.viewModeSelectChangeHandler = this.viewModeSelectChangeHandler.bind(this);
		this.mapModeSelectChangeHandler = this.mapModeSelectChangeHandler.bind(this);
		this.baseLayerChangeHandler = this.baseLayerChangeHandler.bind(this);

		this.mapDrawLayerCreatedHandler = this.mapDrawLayerCreatedHandler.bind(this);

		this.searchHandler = this.searchHandler.bind(this);
		this.timerangeChangeHandler = this.timerangeChangeHandler.bind(this);
		this.sliderGraphChangeHandler = this.sliderGraphChangeHandler.bind(this);

		this.timerangeSliderSlideHandler = this.timerangeSliderSlideHandler.bind(this);
		this.inputChangeHandler = this.inputChangeHandler.bind(this);

		this.fullScreenButtonClickHandler = this.fullScreenButtonClickHandler.bind(this);

		this.mapModes = [
			{
				label: 'Heatmap',
				name: 'heatmap',
				filterField: 'socken',
				totalFieldName: 'socken',
				endpoint: config.endpoints.socken,
				type: 'heatmap'
			},
			{
				label: 'Polygoner',
				name: 'socken',
				filterField: 'socken',
				totalFieldName: 'socken',
				idField: 'SnSt_Id',
				endpoint: config.endpoints.socken,
				type: 'vectorgrid',
				layer: 'SockenStad_ExtGranskning-clipped:SockenStad_ExtGranskn_v1.0_clipped'
			},
			/*
			{
				label: 'Län',
				name: 'county',
				endpoint: config.endpoints.county,
				type: 'vectorgrid',
				layer: 'sverige_lan:an_riks'
			},
			*/
			{
				label: 'Cirklar',
				name: 'circles',
				filterField: 'socken',
				totalFieldName: 'socken',
				endpoint: config.endpoints.socken,
				type: 'circles'
			}
		];

		this.total = {
			socken: [],
			landskap: []
		};

		this.state = {
			params: null,
			data: null,
			loading: false,
			viewMode: 'absolute',
			mapMode: this.mapModes[0],
			colorScale: null,
			sliderStartYear: config.minYear,
			sliderEndYear: config.maxYear,
			fullScreen: false,
			limitMapToPeriod: false,
			tooltip: {
				title: '',
				text: '',
				x: 0,
				y: 0
			}
		}

//		this.fetchTotal();
	}

	componentDidMount() {
		L.drawLocal.draw.toolbar.buttons.rectangle = 'Rita rektangel';

		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler);
			window.eventBus.addEventListener('collectionYears.timerangeChanged', this.timerangeChangeHandler);
		}

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

						window.eventBus.dispatch('graph.filter', this, {
							filter: 'geo_box',
							value: null
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

		// do not render vector grid onMount, but later
		// this.renderVectorGrid();
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
			this.refs.timerangeSlider.slider.set([this.state.sliderStartYear, this.state.sliderEndYear]);
		}
		else {
			this.refs.timerangeSlider.slider.set(event);
		}
	}

	timerangeChangeHandler(event, data) {
		if (isFinite(data.min) && isFinite(data.max)) {
			this.refs.timerangeSlider.slider.set([data.min, data.max]);

			this.setState({
				sliderStartYear: data.min,
				sliderEndYear: data.max
			});

			this.refs.collectionYearsGraph.setTimeOverlay([data.min, data.max]);
		}
	}

	inputChangeHandler(event) {
		var targetName = event.target.name;
		var value = event.target.type && event.target.type == 'checkbox' ? event.target.checked : event.target.value;

		this.setState({
			[targetName]: value
		}, function() {
			if (targetName == 'limitMapToPeriod') {
				this.limitMapToPeriodChange();
			}
		});
	}

	mapDrawLayerCreatedHandler(event) {
		var layer = event.layer;

		this.drawLayer.addLayer(layer);

		var geoBoundingBox = {
			topLeft: {
				lat: event.layer._bounds._northEast.lat,
				lng: event.layer._bounds._southWest.lng
			},
			bottomRight: {
				lat: event.layer._bounds._southWest.lat,
				lng: event.layer._bounds._northEast.lng
			}
		};

		if (window.eventBus) {
			window.eventBus.dispatch('graph.filter', this, {
				filter: 'geo_box',
				value: [geoBoundingBox.topLeft.lat, geoBoundingBox.topLeft.lng, geoBoundingBox.bottomRight.lat, geoBoundingBox.bottomRight.lng]
			});
		}
	}

	searchHandler(event, data) {
		this.setState({
			params: data.params
		}, function() {
			this.fetchData();
		}.bind(this));
	}

	limitMapToPeriodChange() {
		this.fetchData(true);
	}

	timerangeSliderSlideHandler(event) {
		// Väntar tills vi har laddad data
		if (this.waitingForSlider) {
			return;
		}

		// Kopierar params object, annars kan det krocka med params i SearchSearch
		var params = this.state.params ? JSON.parse(JSON.stringify(this.state.params)) : {};
		params.collection_years = event.target.value.join(',');

		this.waitingForSlider = true;

		this.setState({
			params: params
		}, function() {
			if (this.state.limitMapToPeriod) {
				this.fetchData(false, function() {
					this.waitingForSlider = false;
				}.bind(this));
			}
		}.bind(this));

		setTimeout(function() {
			// Om inget händer om en sekund slutar vi vänta och fortsätter
			this.waitingForSlider = false;
		}.bind(this), 1000);

		this.refs.collectionYearsGraph.setTimeOverlay(event.target.value);
	}

	viewModeSelectChangeHandler(event) {
		this.setViewMode(event.target.value);
	}

	setViewMode(viewMode) {
		var currentViewMode = this.state.viewMode;

		if (viewMode == currentViewMode) {
			return;
		}

		this.setState({
			viewMode: viewMode
		}, function() {
			if (this.state.mapMode.type == 'vectorgrid') {
				this.renderVectorGrid();
			}
			if (this.state.mapMode.type == 'heatmap') {
				this.renderHeatmap();
			}
			if (this.state.mapMode.type == 'circles') {
				this.renderCircleLayer();
			}
		}.bind(this));

	}

	mapModeSelectChangeHandler(event) {
		this.setMapMode(event.target.value);
	}

	baseLayerChangeHandler() {
		if (this.dataLayer) {
			this.dataLayer.bringToFront();
		}
	}

	setMapMode(mapMode) {
		var currentMapMode = this.state.mapMode.name;

		this.setState({
			mapMode: _.findWhere(this.mapModes, {name: mapMode})
		}, function() {
			if (this.state.mapMode.name != currentMapMode) {
				this.fetchData(true);
			}
		}.bind(this));

	}

	getTotal(dataType, id) {
		var found = _.findWhere(this.total[dataType], {id: id});
		return found ? found.doc_count : 0;
	}

	fetchTotal(typeParams, callBack) {
		var params = Object.assign({}, config.requiredApiParams, typeParams);

		fetch(config.apiUrl+config.endpoints.socken+'?'+paramsHelper.buildParamString(params))
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.total.socken = json.data;

				if (callBack) {
					callBack();
				}
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	fetchData(forceFetch, callBack) {
		if (!this.state.params) {
			return;
		}

		var params = JSON.parse(JSON.stringify(this.state.params));

		if (!this.state.limitMapToPeriod && params.collection_years) {
			delete params.collection_years;
		}

		this.drawLayer.clearLayers();

		params = Object.assign({}, config.requiredApiParams, params);

		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString && !forceFetch) {
			return;
		}

		this.setState({
			paramString: paramString,
//			loading: true
		});

		var totalParams = {};
		if (params.type) {
			totalParams.type = params.type;
		}

		this.fetchTotal(totalParams, function() {
			fetch(config.apiUrl+this.state.mapMode.endpoint+'/?'+paramString)
				.then(function(response) {
					return response.json()
				}).then(function(json) {
					this.setState({
						total: json.metadata.total.value || (json.metadata.total.value === 0 ? 0 : json.metadata.total), // ES7 vs ES5
						data: json.data,
					}, function() {
						if (this.state.mapMode.type == 'vectorgrid') {
							this.updateVectorGrid();
						}

						if (this.state.mapMode.type == 'heatmap') {
							this.renderHeatmap();
						}

						if (this.state.mapMode.type == 'circles') {
							this.renderCircleLayer();
						}
					}.bind(this));

					if (callBack) {
						callBack();
					}
				}.bind(this)).catch(function(ex) {
					console.log('parsing failed', ex)
				})
			;
		}.bind(this));
	}

	getFeatureData(id) {
		var found = _.findWhere(this.state.data, {lm_id: id});

		return found || false;
	}

	renderHeatmap() {
		if (this.dataLayer) {
			this.refs.mapView.map.removeLayer(this.dataLayer);
		}

		var minValue = _.min(_.pluck(this.state.data, 'doc_count'));
		var maxValue = this.state.viewMode == 'relative' ?
				_.max(_.map(this.state.data, function(item) {
					return item.doc_count/this.getTotal(this.state.mapMode.totalFieldName, item.id);
				}.bind(this))) :
				this.state.viewMode == 'page_count' ?
				_.max(_.pluck(this.state.data, 'page_count')) :
				_.max(_.pluck(this.state.data, 'doc_count'));

		this.dataLayer = L.heatLayer([], {
			minOpacity: 0.35,
			maxZoom: 0,
			radius: 18,
			max: maxValue,
			blur: 15
		});

		this.dataLayer.addTo(this.refs.mapView.map);

		var latLngs = _.map(this.state.data, function(mapItem) {
			var intensity = this.state.viewMode == 'relative' ?
				mapItem.doc_count/this.getTotal(this.state.mapMode.totalFieldName, mapItem.id) :
				this.state.viewMode == 'page_count' ?
				mapItem.page_count :
				mapItem.doc_count;

			return [mapItem.location[0], mapItem.location[1], Number(intensity)];
		}.bind(this));

		this.dataLayer.setLatLngs(latLngs);
	}

	renderCircleLayer() {
		if (this.dataLayer) {
			this.refs.mapView.map.removeLayer(this.dataLayer);
		}

		var minValue = _.min(_.pluck(this.state.data, 'doc_count'));
		var maxValue = this.state.viewMode == 'relative' ?
				_.max(_.map(this.state.data, function(item) {
					return item.doc_count/this.getTotal(this.state.mapMode.totalFieldName, item.id);
				}.bind(this))) :
				this.state.viewMode == 'page_count' ?
				_.max(_.pluck(this.state.data, 'page_count')) :
				_.max(_.pluck(this.state.data, 'doc_count'));

		this.dataLayer = L.featureGroup();

		this.dataLayer.addTo(this.refs.mapView.map);

		_.each(this.state.data, function(mapItem) {
			if (mapItem.location.length > 0) {
				var sizeValue = this.state.viewMode == 'relative' ?
					mapItem.doc_count/this.getTotal(this.state.mapMode.totalFieldName, mapItem.id) :
					this.state.viewMode == 'page_count' ?
					mapItem.page_count :
					mapItem.doc_count;

				var marker = L.circleMarker(mapItem.location, {
					radius: ((sizeValue/maxValue)*20)+2,
					fillColor: "#047bff",
					fillOpacity: 0.4,
					color: '#000',
					weight: 0.8,
					sockenObj: mapItem
				});

				marker.on('click', function(event) {
					console.log(event);
					window.eventBus.dispatch('graph.filter', this, {
						filter: this.state.mapMode.filterField,
						value: event.target.options.sockenObj.name
					});
				}.bind(this));

				this.dataLayer.addLayer(marker);
			}
		}.bind(this));
	}

	createVectorStyle(feature, selected) {
		return {
			weight: feature ? 0.1 : 0,
			color: '#000',
			strokeOpacity: 0.5,
			fill: Boolean(feature),
			fillOpacity: selected ? 1 : 0.9,
			fillColor: selected ? '#1f77b4' : feature ? this.state.colorScale(
				(
					this.state.viewMode == 'relative' ?
					feature.doc_count/this.getTotal(this.state.mapMode.totalFieldName, feature.id) :
					this.state.viewMode == 'page_count' ?
					feature.page_count :
					feature.doc_count
				)
			).hex() : null
		};
	}

	getColorScale() {
		var minValue;
		var maxValue;

		if (this.state.viewMode == 'absolute') {
			minValue = _.min(_.pluck(this.state.data, 'doc_count'));
			maxValue = _.max(_.pluck(this.state.data, 'doc_count'));
		}
		if (this.state.viewMode == 'relative') {
			var values = this.state.data.map(function(item) {
				return item.doc_count/this.getTotal(this.state.mapMode.totalFieldName, item.id);
			}.bind(this));

			minValue = _.min(values);
			maxValue = _.max(values);
		}
		if (this.state.viewMode == 'page_count') {
			minValue = _.min(_.pluck(this.state.data, 'page_count'));
			maxValue = _.max(_.pluck(this.state.data, 'page_count'));
		}

//		var colorScale = chroma.scale(['#02ff00', '#f00']).domain([0, maxValue]);
//		var colorScale = chroma.scale('Spectral').domain([minValue, maxValue]);
		var colorScale = chroma.scale('YlOrRd').domain([minValue, maxValue]);

		return colorScale;
	}

	updateVectorGrid() {
		if (!this.dataLayer.setFeatureStyle) {
			this.renderVectorGrid();
		}
		else {
			this.selectedPolygon = null;

			var colorScale = this.getColorScale();

			this.setState({
				colorScale: colorScale
			}, function() {
				_.each(this.total.socken, function(socken) {
					this.dataLayer.setFeatureStyle(socken.lm_id, this.createVectorStyle(this.getFeatureData(socken.lm_id)));
				}.bind(this));
			}.bind(this));
		}
	}

	renderVectorGrid() {
		this.selectedPolygon = null;

		if (this.dataLayer) {
			this.refs.mapView.map.removeLayer(this.dataLayer);
		}

		var colorScale = this.getColorScale();

		this.setState({
			colorScale: colorScale
		});

//		this.colorScale = chroma.scale(['#72ff2c', '#f00']).domain([minValue, maxValue]);

		var layerBounds = [];

		this.dataLayer = L.vectorGrid.protobuf(config.geoserverUrl+'/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER='+this.state.mapMode.layer+'&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}', {
			interactive: true,
			vectorTileLayerStyles: {
				an_riks: function(properties, zoom) {
					var foundFeature = this.getFeatureData(properties.LANSNAMN);

					var value = this.state.viewMode == 'relative' ?
						foundFeature.doc_count/this.getTotal(this.state.mapMode.totalFieldName, item.id) :
						this.state.viewMode == 'page_count' ?
						foundFeature.page_count :
						foundFeature.doc_count;

					return {
						weight: foundFeature ? 0.2 : 0,
						color: '#000',
						strokeOpacity: 0.5,
						fill: Boolean(foundFeature),
						fillOpacity: 0.8,
						fillColor: foundFeature ? colorScale(value).hex() : null
					}
				}.bind(this),
				sverige_socken_wgs84: function(properties, zoom) {
					var foundFeature = this.getFeatureData(properties.DISTRNAMN+' sn');

					return {
						weight: foundFeature ? 0.2 : 0,
						color: '#000',
						strokeOpacity: 0.5,
						fill: Boolean(foundFeature),
						fillOpacity: 0.9,
						fillColor: foundFeature ? colorScale(colorValue).hex() : null
					}
				}.bind(this),
				'SockenStad_ExtGranskn_v1.0_clipped': function(properties, zoom) {
					var foundFeature = this.getFeatureData(properties.SnSt_Id);

					if (foundFeature) {
						layerBounds.push(foundFeature.location);
					}

					return this.createVectorStyle(foundFeature, null);
				}.bind(this)
			},
			getFeatureId: function(feature) {
				var featureId = feature.properties[this.state.mapMode.idField];
				return featureId;
			}.bind(this)
		});

		this.dataLayer.on('load', function(event) {
//			this.refs.mapView.map.fitBounds(layerBounds, 20);
		}.bind(this))

		this.dataLayer.on('mousemove', this.vectorGridMouseMove);
		this.dataLayer.on('mouseout', this.vectorGridMouseOut);
		this.dataLayer.on('click', this.vectorGridClick);

		this.dataLayer.addTo(this.refs.mapView.map);

		this.dataLayer.bringToFront();
	}

	vectorGridMouseMove(event) {
		var featureName = this.state.mapMode.name == 'county' ? event.layer.properties.LANSNAMN :
			this.state.mapMode.name == 'socken' ? event.layer.properties.SnSt_Namn : '';
		var featureId = event.layer.properties[this.state.mapMode.idField];

		var featureData = this.getFeatureData(featureId);

		this.setState({
			tooltip: {
				title: featureName,
				text: featureData ? featureData.doc_count+' (total '+this.getTotal(this.state.mapMode.totalFieldName, featureData.id)+')' : '0',
				x: event.originalEvent.x,
				y: event.originalEvent.y
			}
		});
	}

	vectorGridMouseOut(event) {
		this.setState({
			tooltip: {
				title: ''
			}
		});
	}

	vectorGridClick(event) {
		var featureData = this.getFeatureData(event.layer.properties[this.state.mapMode.idField]);

		if (!featureData || featureData.doc_count == 0) {
			return;
		}

		_.each(this.state.data, function(item) {
			this.dataLayer.resetFeatureStyle(item.lm_id)
		}.bind(this));

//		this.dataLayer.redraw();

		if (this.selectedPolygon == featureData.name) {
			this.selectedPolygon = null;
		}
		else {
			this.dataLayer.setFeatureStyle(event.layer.properties[this.state.mapMode.idField], this.createVectorStyle(featureData, true));
			this.selectedPolygon = featureData.name;
		}

		window.eventBus.dispatch('graph.filter', this, {
			filter: this.state.mapMode.filterField,
			value: this.selectedPolygon
		});
	}

	render() {
		var mapModeSelectElements = this.mapModes.map(function(item, index) {
			return <option key={index} value={item.name}>{item.label}</option>;
		})

		return (
			<div className={'map-wrapper'+(this.state.loading ? ' loading' : '')+(this.state.fullScreen ? ' full-screen' : '')} style={this.props.mapHeight ? {height: Number(this.props.mapHeight)+50} : {}} ref="container">

				<MapBase ref="mapView" className="map-container" disableLocateControl={true} disableSwedenMap={true} scrollWheelZoom={false} onBaseLayerChange={this.baseLayerChangeHandler} />

				{
					this.state.mapMode.type == 'vectorgrid' &&
					<ColorLegendsGraph colorScale={this.state.colorScale} />
				}

				<div className="map-controls graph-controls">

					<a onClick={this.fullScreenButtonClickHandler} className={this.state.fullScreen ? 'selected' : ''}>Fullskärm</a>

					<select value={this.state.mapMode.name} onChange={this.mapModeSelectChangeHandler}>
						{mapModeSelectElements}
					</select>

					<select value={this.state.viewMode} onChange={this.viewModeSelectChangeHandler}>
						<option value="absolute">Antal dokument</option>
						<option value="relative">Antal dokument relativt det totala antalet</option>
						<option value="page_count">Antal sidor</option>
					</select>

				</div>

				<div className={'map-timeline-container'+(!this.state.limitMapToPeriod ? ' minimized' : '')+(this.state.data == null ? ' disabled' : '')}>

					<div style={{position: 'relative', float: 'right', marginTop: 10, marginRight: 10, zIndex: 10}}>
						<label><input type="checkbox" name="limitMapToPeriod" checked={this.state.limitMapToPeriod} onChange={this.inputChangeHandler} /> Begränsa kartvy till en period</label>
					</div>

					<CollectionYearsGraph name="mapCollectionGraph" ref="collectionYearsGraph"
						graphHeight="100"
						simpleGraph={true}
						listenForTimerangeChange={true}
						defaultRangeSelectAction="onChange"
						onlyGeography={true}
						onChange={this.sliderGraphChangeHandler} />

					<Slider ref="timerangeSlider"
						inputName="collectionYears"
						enabled={this.state.data != null && this.state.limitMapToPeriod}
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
