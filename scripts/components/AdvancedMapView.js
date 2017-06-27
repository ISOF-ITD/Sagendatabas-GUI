import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import L from 'leaflet';
import 'leaflet.vectorgrid';
import 'leaflet-draw';

import chroma from 'chroma-js';

import MapBase from './../../ISOF-React-modules/components/views/MapBase';
import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class AdvancedMapView extends React.Component {
	constructor(props) {
		super(props);

		this.vectorGridMouseMove = this.vectorGridMouseMove.bind(this);
		this.vectorGridMouseOut = this.vectorGridMouseOut.bind(this);
		this.vectorGridClick = this.vectorGridClick.bind(this);

		this.viewModeSelectChangeHandler = this.viewModeSelectChangeHandler.bind(this);
		this.mapModeSelectChangeHandler = this.mapModeSelectChangeHandler.bind(this);
		this.baseLayerChangeHandler = this.baseLayerChangeHandler.bind(this);

		this.mapDrawLayerCreatedHandler = this.mapDrawLayerCreatedHandler.bind(this);

		this.mapModes = [
			{
				label: 'Socken',
				name: 'socken',
				type: 'vectortile',
				layer: 'SockenStad_ExtGranskning:SockenStad_ExtGranskn_v1.0'
			},
			{
				label: 'Län',
				name: 'county',
				type: 'vectortile',
				layer: 'sverige_lan:an_riks'
			}
		];

		this.state = {
			params: null,
			data: null,
			loading: false,
			viewMode: 'absolute',
			mapMode: 'socken',
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

		this.setState({
			viewMode: viewMode
		}, function() {
			if (this.state.viewMode != currentViewMode) {
				this.renderVectorGrid();
			}
		}.bind(this));

	}

	mapModeSelectChangeHandler(event) {
		this.setMapMode(event.target.value);
	}

	baseLayerChangeHandler() {
		if (this.vectorGridLayer) {
			this.vectorGridLayer.bringToFront();
		}
	}

	setMapMode(mapMode) {
		var currentMapMode = this.state.mapMode;

		this.setState({
			mapMode: mapMode
		}, function() {
			if (this.state.mapMode != currentMapMode) {
				this.fetchData(true);
			}
		}.bind(this));

	}

	getTotalByCounty(county) {
		return _.findWhere(this.totalByCountyArray, {name: county}).doc_count;
	}

	fetchTotal() {
		fetch(config.apiUrl+config.endpoints.county)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.totalByCountyArray = json.data;
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

		fetch(config.apiUrl+this.state.mapMode+'/?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.metadata.total,
					data: json.data,
					loading: false
				}, function() {
					this.renderVectorGrid();
				}.bind(this));
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	getFeatureData(id) {
		var found = _.findWhere(this.state.data, {name: id});

		return found || false;
	}

	renderVectorGrid() {
		var minValue = _.min(_.pluck(this.state.data, 'doc_count'));
		var maxValue = _.max(_.pluck(this.state.data, 'doc_count'));

		var colorScale = chroma.scale(['#33f0c7', '#02ff00', '#f00']).domain([0, maxValue]);
//		var colorScale = chroma.scale('YlOrRd').domain([0, maxValue]);
//		var colorScale = chroma.scale(['#72ff2c', '#f00']).domain([0, maxValue]);

		if (this.vectorGridLayer) {
			this.refs.mapView.map.removeLayer(this.vectorGridLayer);
		}

		var layerName = _.findWhere(this.mapModes, {name: this.state.mapMode}).layer;

		this.vectorGridLayer = L.vectorGrid.protobuf(config.geoserverUrl+'/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER='+layerName+'&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}', {
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
						fillColor: foundFeature ? colorScale(foundFeature.doc_count).hex() : null
					}
				}.bind(this),
				sverige_socken_wgs84: function(properties, zoom) {
					var foundFeature = this.getFeatureData(properties.DISTRNAMN+' sn');

					return {
						weight: foundFeature ? 0.2 : 0,
						color: '#000',
						strokeOpacity: 0.5,
						fill: Boolean(foundFeature),
						fillOpacity: 0.8,
						fillColor: foundFeature ? colorScale(foundFeature.doc_count).hex() : null
					}
				}.bind(this),
				"SockenStad_ExtGranskn_v1.0": function(properties, zoom) {
					console.log(properties);
					var foundFeature = this.getFeatureData(properties.SnSt_Namn+' sn');

					return {
						weight: foundFeature ? 0.2 : 0,
						color: '#000',
						strokeOpacity: 0.5,
						fill: Boolean(foundFeature),
						fillOpacity: 0.8,
						fillColor: foundFeature ? colorScale(foundFeature.doc_count).hex() : null
					}
				}.bind(this)
			},
			getFeatureId: function(feature) {
				var featureName = this.state.mapMode == 'county' ? feature.properties.LANSNAMN : 
					this.state.mapMode == 'socken' ? feature.properties.SnSt_Namn : '';
				return feature.properties.LANSNAMN;
			}.bind(this)
		});

		this.vectorGridLayer.on('mousemove', this.vectorGridMouseMove);
		this.vectorGridLayer.on('mouseout', this.vectorGridMouseOut);
		this.vectorGridLayer.on('click', this.vectorGridClick);

		this.vectorGridLayer.addTo(this.refs.mapView.map);

		this.vectorGridLayer.bringToFront();
	}

	vectorGridMouseMove(event) {
		var featureName = this.state.mapMode == 'county' ? event.layer.properties.LANSNAMN : 
			this.state.mapMode == 'socken' ? event.layer.properties.SnSt_Namn+' sn' : '';
		this.setState({
			tooltip: {
				title: featureName,
				text: this.getFeatureData(featureName).doc_count,
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
		console.log(event);
	}

	render() {
		var mapModeSelectElements = this.mapModes.map(function(item, index) {
			return <option key={index} value={item.name}>{item.label}</option>;
		})
		return (
			<div className={'map-wrapper'+(this.state.loading ? ' loading' : '')} style={this.props.mapHeight ? {height: Number(this.props.mapHeight)+50} : {}} ref="container">

				<MapBase ref="mapView" className="map-container" disableSwedenMap="true" scrollWheelZoom="true" onBaseLayerChange={this.baseLayerChangeHandler} />

				<div className="map-controls">

					<select value={this.state.mapMode} onChange={this.mapModeSelectChangeHandler}>
						{mapModeSelectElements}
					</select>

					<select value={this.state.viewMode} onChange={this.viewModeSelectChangeHandler}>
						<option value="absolute">absolute</option>
						<option value="relative">relative</option>
					</select>

				</div>

				<div className="loading-overlay"></div>

				<div style={{top: this.state.tooltip.y+20, left: this.state.tooltip.x+20}} className={'graph-tooltip position-fixed'+(this.state.tooltip.title != '' ? ' visible' : '')}>
					<strong>{this.state.tooltip.title}</strong><br/>
					{this.state.tooltip.text}
				</div>

			</div>
		);
	}
}