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

		this.state = {
			data: null,
			loading: false,
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
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
		}
	}

	searchHandler(event, data) {
		this.fetchData(data.params);
	}

	fetchData(params) {
		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString) {
			return;
		}

		this.setState({
			paramString: paramString,
			loading: true
		});

		fetch(config.apiUrl+config.endpoints.county+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.hits.total,
					data: json.aggregations.data.data.buckets,
					loading: false
				}, function() {
					console.log(_.pluck(this.state.data, 'key'));
					this.renderVectorGrid();
				}.bind(this));
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	getFeatureData(id) {
		var found = _.findWhere(this.state.data, {key: id});

		if (!found) {
			console.log('not found: '+id);
		}
		return found || false;
	}

	renderVectorGrid() {
		console.log('AdvancedMapView: renderVectorGrid');
		var minValue = _.min(_.pluck(this.state.data, 'doc_count'));
		var maxValue = _.max(_.pluck(this.state.data, 'doc_count'));

		var colorScale = chroma.scale(['#33f0c7', '#02ff00', '#f00']).domain([0, maxValue]);
//		var colorScale = chroma.scale('YlOrRd').domain([0, maxValue]);
//		var colorScale = chroma.scale(['#72ff2c', '#f00']).domain([0, maxValue]);

		if (this.vectorGridLayer) {
			this.refs.mapView.map.removeLayer(this.vectorGridLayer);
		}

		this.vectorGridLayer = L.vectorGrid.protobuf('http://localhost:8084/geoserver/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=sverige_lan:an_riks&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}', {
			interactive: true,
			vectorTileLayerStyles: {
				an_riks: function(properties, zoom) {
					console.log(properties.LANSNAMN);
					var foundFeature = this.getFeatureData(properties.LANSNAMN);

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
				return feature.properties.LANSNAMN;
			}
		});

		this.vectorGridLayer.on('mousemove', this.tooltipMouseMove);
		this.vectorGridLayer.on('mouseout', this.tooltipMouseOut);

		this.vectorGridLayer.addTo(this.refs.mapView.map);
	}

	tooltipMouseMove(event) {
		this.setState({
			tooltip: {
				title: event.layer.properties.LANSNAMN,
				text: this.getFeatureData(event.layer.properties.LANSNAMN).doc_count,
				x: event.originalEvent.pageX,
				y: event.originalEvent.pageY
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

				<MapBase ref="mapView" className="map-container" disableSwedenMap="true" />

				<div className="loading-overlay"></div>

				<div style={{top: this.state.tooltip.y, left: this.state.tooltip.x}} className={'graph-tooltip position-fixed'+(this.state.tooltip.title != '' ? ' visible' : '')}>
					<strong>{this.state.tooltip.title}</strong><br/>
					{this.state.tooltip.text}
				</div>

			</div>
		);
	}
}