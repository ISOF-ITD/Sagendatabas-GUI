import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import L from 'leaflet';
import 'leaflet.vectorgrid';

import chroma from 'chroma-js';

import MapBase from './../../ISOF-React-modules/components/views/MapBase';
import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class AdvancedMapView extends React.Component {
	constructor(props) {
		super(props);

		this.tooltipMouseMove = this.tooltipMouseMove.bind(this);
		this.tooltipMouseOut = this.tooltipMouseOut.bind(this);
		this.viewModeSelectChangeHandler = this.viewModeSelectChangeHandler.bind(this);
		this.mapModeSelectChangeHandler = this.mapModeSelectChangeHandler.bind(this);
		this.baseLayerChangeHandler = this.baseLayerChangeHandler.bind(this);

		this.mapModes = {
			county: {
				layer: 'sverige_lan:an_riks'
			},
			socken: {
				layer: 'sverige_socken:sverige_socken_wgs84'
			}
		}

		this.state = {
			params: null,
			data: null,
			loading: false,
			viewMode: 'absolute',
			mapMode: 'county',
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
		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
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

		this.vectorGridLayer = L.vectorGrid.protobuf('http://localhost:8084/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER='+this.mapModes[this.state.mapMode].layer+'&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}', {
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
				}.bind(this)
			},
			getFeatureId: function(feature) {
				var featureName = this.state.mapMode == 'county' ? feature.properties.LANSNAMN : 
					this.state.mapMode == 'socken' ? feature.properties.DISTRNAMN : '';
				return feature.properties.LANSNAMN;
			}.bind(this)
		});

		this.vectorGridLayer.on('mousemove', this.tooltipMouseMove);
		this.vectorGridLayer.on('mouseout', this.tooltipMouseOut);

		this.vectorGridLayer.addTo(this.refs.mapView.map);

		this.vectorGridLayer.bringToFront();
	}

	tooltipMouseMove(event) {
		var featureName = this.state.mapMode == 'county' ? event.layer.properties.LANSNAMN : 
			this.state.mapMode == 'socken' ? event.layer.properties.DISTRNAMN+' sn' : '';
		this.setState({
			tooltip: {
				title: featureName,
				text: this.getFeatureData(featureName).doc_count,
				x: event.originalEvent.x,
				y: event.originalEvent.y
			}
		});
	}

	tooltipMouseOut(event) {
		this.setState({
			tooltip: {
				title: ''
			}
		});
	}

	render() {
		return (
			<div className={'map-wrapper'+(this.state.loading ? ' loading' : '')} style={this.props.mapHeight ? {height: Number(this.props.mapHeight)+50} : {}} ref="container">

				<MapBase ref="mapView" className="map-container" disableSwedenMap="true" onBaseLayerChange={this.baseLayerChangeHandler} />

				<div className="map-controls">

					<select value={this.state.mapMode} onChange={this.mapModeSelectChangeHandler}>
						<option value="county">Län</option>
						<option value="landskap">Landskap</option>
						<option value="socken">Socken</option>
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