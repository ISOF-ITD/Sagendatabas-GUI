import React from 'react';
import { hashHistory } from 'react-router';

import DocumentList from './DocumentList';
import SimpleMap from './../../ISOF-React-modules/components/views/SimpleMap';

import config from './../config';

export default class AdvancedDocumentView extends React.Component {
	constructor(props) {
		super(props);

		this.mediaImageClickHandler = this.mediaImageClickHandler.bind(this);

		this.baseRoute = this.props.route.path.indexOf('/network/') > -1 ? 'network' : 'search';

		this.state = {
			doc: null
		};
	}

	mediaImageClickHandler(event) {
		if (window.eventBus) {
			window.eventBus.dispatch('overlay.viewimage', {
				imageUrl: event.target.dataset.image
			});
		}
	}

	componentDidMount() {
		this.fetchData(this.props.params.id);
	}

	componentWillReceiveProps(props) {
		this.fetchData(props.params.id);
	}

	fetchData(id) {
		fetch(config.apiUrl+config.endpoints.document+id+'/')
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					id: json._id,
					doc: json._source
				})
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	render() {
		var topicRows = this.state.doc && this.state.doc.topics ? this.state.doc.topics.map(function(topic, index) {
			var termEls = topic.terms.map(function(term, index) {
				return <span key={index}>{term.term}, </span>;
			});

			return <div key={index}>{termEls}</div>;
		}) : [];

		var mediaItems = this.state.doc && this.state.doc.media ? this.state.doc.media.map(function(mediaItem, index) {
			if (mediaItem.type == 'image') {
				return <img className="archive-image" data-image={mediaItem.source} onClick={this.mediaImageClickHandler} src={config.imageUrl+mediaItem.source} key={index} />;
			}
		}.bind(this)) : [];

		var placeItems = this.state.doc && this.state.doc.places && this.state.doc.places.length > 0 ? this.state.doc.places.map(function(place, index) {
			return <tr key={index}>
				<td><a href={'#place/'+place.id}>{place.name+', '+place.harad}</a></td>
			</tr>;
		}) : [];

		return this.state.doc ? 
			<div className="document-view">
				<h2>{this.state.doc.title}</h2>

				<div className="row">
					
					<div className="eight columns">
						<p dangerouslySetInnerHTML={{__html: this.state.doc.text}}></p>
					</div>

					<div className="four columns">
						{
							this.state.doc.media &&
							mediaItems
						}
					</div>

				</div>

				<hr/>

				{
					placeItems.length > 0 &&
					<div>

						<div className="row">

							<div className="six columns">
								<h3>Platser</h3>

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
									this.state.doc.places && this.state.doc.places.length > 0 && this.state.doc.places[0].lat && this.state.doc.places[0].lng &&
									<SimpleMap marker={{lat: this.state.doc.places[0].lat, lng: this.state.doc.places[0].lng, label: this.state.doc.places[0].name}} />
								}
							</div>

						</div>

						<hr/>

					</div>
				}

				<div className="row">

					<div className="four columns">
						{
							this.state.doc.taxonomy.category && 
							<p><strong>Kategori:</strong><br/>
							{this.state.doc.taxonomy.category+': '+this.state.doc.taxonomy.name}</p>
						}

						<p><strong>Materialtyp:</strong><br/>
						{this.state.doc.materialtype}</p>
					</div>

					<div className="four columns">
						{
							this.state.doc.archive.archive &&
							<p><strong>Arkiv:</strong><br/>
							{this.state.doc.archive.archive}</p>
						}

						{
							this.state.doc.archive.archive_id && 
							<p><strong>Acc. nr.:</strong><br/>
							{this.state.doc.archive.archive_id}</p>
						}

						{
							this.state.doc.printed_source &&
							<p><strong>Tryckt i:</strong><br/>
							{this.state.doc.printed_source}</p>
						}
					</div>

				</div>

				<hr/>

				<br/><br/>

				<h3>Liknande sägner</h3>

				<DocumentList baseRoute={this.baseRoute} disableEventBus="true" disableSorting="true" similarDocs={this.state.id} displayScore="true" />
			</div> : 
		null;
	}
}