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

		this.mapModes = [
			{
				label: 'Polygoner',
				name: 'socken',
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
				label: 'Heatmap',
				name: 'heatmap',
				endpoint: config.endpoints.socken,
				type: 'heatmap'
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
			tooltip: {
				title: '',
				text: '',
				x: 0,
				y: 0
			}
		}

		this.fetchTotal();
	}

	componentDidMount() {
		L.drawLocal.draw.toolbar.buttons.rectangle = 'Rita rektangel';

		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
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
		return _.findWhere(this.total[dataType], {id: id}).doc_count;
	}

	fetchTotal() {
		fetch(config.apiUrl+config.endpoints.socken)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.total.socken = json.data;
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	fetchData(forceFetch) {
		if (!this.state.params) {
			return;
		}

		this.drawLayer.clearLayers();

		var params = this.state.params;

		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString && !forceFetch) {
			return;
		}

		this.setState({
			paramString: paramString,
			loading: true
		});

		fetch(config.apiUrl+this.state.mapMode.endpoint+'/?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.metadata.total,
					data: json.data,
					loading: false
				}, function() {
					if (this.state.mapMode.type == 'vectorgrid') {
						this.renderVectorGrid();
					}

					if (this.state.mapMode.type == 'heatmap') {
						this.renderHeatmap();
					}
				}.bind(this));
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
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
		var maxValue = _.max(_.pluck(this.state.data, 'doc_count'));

		this.dataLayer = L.heatLayer([], {
			minOpacity: 0.35,
			radius: 18,
			max: maxValue,
			blur: 15
		});

		this.dataLayer.addTo(this.refs.mapView.map);

		var latLngs = _.map(this.state.data, function(mapItem) {
			console.log('doc_count: '+mapItem.doc_count+' / maxValue: '+maxValue+' = '+mapItem.doc_count/maxValue);
			return [mapItem.location[0], mapItem.location[1], Number(mapItem.doc_count)];
		}.bind(this));

		this.dataLayer.setLatLngs(latLngs);
	}

	createVectorStyle(foundFeature, selected) {
		return {
			weight: foundFeature ? 0.1 : 0,
			color: '#000',
			strokeOpacity: 0.5,
			fill: Boolean(foundFeature),
			fillOpacity: selected ? 1 : 0.9,
			fillColor: selected ? '#1f77b4' : foundFeature ? this.state.colorScale(
				(
					this.state.viewMode == 'relative' ?
					foundFeature.doc_count/this.getTotal(this.state.mapMode.name, foundFeature.id) :
					foundFeature.doc_count
				)
			).hex() : null
		};
	}

	renderVectorGrid() {
		this.selectedPolygon = null;

		if (this.dataLayer) {
			this.refs.mapView.map.removeLayer(this.dataLayer);
		}

		var minValue;
		var maxValue;

		if (this.state.viewMode == 'absolute') {
			minValue = _.min(_.pluck(this.state.data, 'doc_count'));
			maxValue = _.max(_.pluck(this.state.data, 'doc_count'));
		}
		if (this.state.viewMode == 'relative') {
			var values = this.state.data.map(function(item) {
				return item.doc_count/this.getTotal(this.state.mapMode.name, item.id);
			}.bind(this));

			minValue = _.min(values);
			maxValue = _.max(values);
		}

//		this.colorScale = chroma.scale(['#33f0c7', '#02ff00', '#f00']).domain([0, maxValue]);
		var colorScale = chroma.scale('YlOrRd').domain([minValue, maxValue]);

		console.log('set colorScale');
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

					return {
						weight: foundFeature ? 0.2 : 0,
						color: '#000',
						strokeOpacity: 0.5,
						fill: Boolean(foundFeature),
						fillOpacity: 0.8,
						fillColor: foundFeature ? colorScale(this.state.viewMode == 'relative' ? foundFeature.doc_count/this.getTotal(this.state.mapMode.name, item.id) : foundFeature.doc_count).hex() : null
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
				text: featureData ? featureData.doc_count+' (total '+this.getTotal(this.state.mapMode.name, featureData.id)+')' : '',
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
			filter: this.state.mapMode.name,
			value: this.selectedPolygon
		});
	}

	render() {
		var mapModeSelectElements = this.mapModes.map(function(item, index) {
			return <option key={index} value={item.name}>{item.label}</option>;
		})
		return (
			<div className={'map-wrapper'+(this.state.loading ? ' loading' : '')} style={this.props.mapHeight ? {height: Number(this.props.mapHeight)+50} : {}} ref="container">

				<MapBase ref="mapView" className="map-container" disableSwedenMap="true" scrollWheelZoom="true" onBaseLayerChange={this.baseLayerChangeHandler} />

				{
					this.state.mapMode.type == 'vectorgrid' &&
					<ColorLegendsGraph colorScale={this.state.colorScale} />
				}

				<div className="map-controls">

					<select value={this.state.mapMode.name} onChange={this.mapModeSelectChangeHandler}>
						{mapModeSelectElements}
					</select>

					<select value={this.state.viewMode} onChange={this.viewModeSelectChangeHandler}>
						<option value="absolute">absolute</option>
						<option value="relative">relative</option>
					</select>

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