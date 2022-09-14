import React from 'react';
import { hashHistory } from 'react-router';

import DocumentList from './DocumentList';
import LettersMapView from './LettersMapView';
import AdvancedMapView from './AdvancedMapView';
import SimpleMap from './../../ISOF-React-modules/components/views/SimpleMap';

import config from './../config';

export default class AdvancedPersonView extends React.Component {
	constructor(props) {
		super(props);

		this.baseRoute = props.match.url.indexOf('/network/') > -1 ? 'search/network' : 'search/analyse';

		this.state = {
			data: null
		};
	}

	componentDidMount() {
		this.fetchData(this.props.match.params.id);
	}

	componentWillReceiveProps(props) {
		this.fetchData(this.props.match.params.id);
	}

	fetchData(id) {
		fetch(config.restApiUrl+'persons/'+id+'/')
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					data: json
				})
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	render() {
		var placeItems = this.state.data && this.state.data.places && this.state.data.places.length > 0 ? this.state.data.places.map(function(place, index) {
			return <tr key={index}>
				<td><a href={'#place/'+place.id}>{place.name+', '+place.harad}</a></td>
			</tr>;
		}) : [];

		return this.state.data ? 
			<div className="document-view">
				<h2>{this.state.data.name}</h2>

				{
					this.state.data.birth_year &&
					<p>Föddes {this.state.data.birth_year}</p>
				}

				{
					placeItems.length > 0 &&
					<div className="row">

						<div className="six columns">
							<h3>Födelseort</h3>

							<div className="table-wrapper">
								<table width="100%">

									<thead>
										<tr>
											<th>Namn</th>
										</tr>
									</thead>

									<tbody>
										{placeItems}
									</tbody>

								</table>
							</div>

						</div>

						<div className="six columns">
							{
								this.state.data.places && this.state.data.places.length > 0 &&
								<SimpleMap marker={{lat: this.state.data.places[0].location.lat, lng: this.state.data.places[0].location.lon, label: this.state.data.places[0].name}} />
							}
						</div>
					</div>
				}

				{/* <LettersMapView person={this.state.data.id} disableEventBus={true} mapHeight={600} /> */}
				<AdvancedMapView params={{'person_id': this.state.data.id}} disableEventBus={true} mapHeight={600} disableSlider={true}/>

				<DocumentList baseRoute={this.baseRoute} disableEventBus={true} disableSorting={true} person={this.state.data.id} />
			</div> : 
		null;
	}
}