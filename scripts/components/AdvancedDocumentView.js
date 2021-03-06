import React from 'react';
import { hashHistory } from 'react-router';

import DocumentList from './DocumentList';
import SimpleMap from './../../ISOF-React-modules/components/views/SimpleMap';
import Slider from './../../ISOF-React-modules/components/controls/Slider';

import config from './../config';

export default class AdvancedDocumentView extends React.Component {
	constructor(props) {
		super(props);

		this.mediaImageClickHandler = this.mediaImageClickHandler.bind(this);
		this.inputChangeHandler = this.inputChangeHandler.bind(this);

		this.baseRoute = this.props.route.path.indexOf('/network/') > -1 ? 'search/network' : 'search/analyse';

		this.state = {
			doc: null,
			min_word_length:  5,
			min_term_freq: 1,
			max_query_terms: 25
		};
	}

	inputChangeHandler(event) {
		var value = event.target.type && event.target.type == 'checkbox' ? event.target.checked : event.target.value;

		this.setState({
			[event.target.name]: event.target.name == 'minimum_should_match' ? value+'%' : value
		}, function() {
			console.log(this.state);
		}.bind(this));
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
				<td><a href={'#place/'+place.id}>{place.name+', '+place.harad}</a> ({place.type})</td>
			</tr>;
		}) : [];

		var personItems = this.state.doc && this.state.doc.persons && this.state.doc.persons.length > 0 ? this.state.doc.persons.map(function(person, index) {
			return <tr key={index}>
				<td><a href={'#'+(this.props.baseRoute ? this.props.baseRoute : 'search/analyse/')+'person/'+person.id}>{person.name}</a></td>
				<th>{person.birth_year ? person.birth_year : ''}</th>
				<th>{person.relation == 'c' ? 'Upptecknare' : person.relation == 'i' ? 'Informant' : ''}</th>
			</tr>;
		}.bind(this)) : [];

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
									this.state.doc.places && this.state.doc.places.length > 0 &&
									<SimpleMap marker={{lat: this.state.doc.places[0].location.lat, lng: this.state.doc.places[0].location.lon, label: this.state.doc.places[0].name}} />
								}
							</div>

						</div>

						<hr/>

					</div>
				}

				<div className="row">

					{
						personItems.length > 0 &&
						<div className="six columns">
							<h3>Personer</h3>

							<div className="table-wrapper">
								<table width="100%">

									<thead>
										<tr>
											<th>Namn</th>
											<th>Födelseår</th>
											<th>Roll</th>
										</tr>
									</thead>

									<tbody>
										{personItems}
									</tbody>

								</table>
							</div>
						</div>
					}

					<div className="three columns">
						{
							this.state.doc.taxonomy && this.state.doc.taxonomy.category && 
							<p><strong>Kategori:</strong><br/>
							{this.state.doc.taxonomy.category+': '+this.state.doc.taxonomy.name}</p>
						}

						<p><strong>Materialtyp:</strong><br/>
						{this.state.doc.materialtype}</p>
					</div>

					<div className="three columns">
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

				{
					this.state.doc.metadata && this.state.doc.metadata.length > 0 &&
					<hr/>
				}

				{
					this.state.doc.metadata && this.state.doc.metadata.length > 0 &&
					<div className="row">
						<h3>Metadata</h3>

						{
							this.state.doc.metadata.map(function(item) {
								return <div className="table-wrapper">
									<p><strong>{item.type}</strong><br/>
									<span dangerouslySetInnerHTML={{__html: item.value}} /></p>
								</div>;
							})
						}
					</div>
				}

				<hr/>

				<h3>Liknande upptekningar</h3>

				<div className="row table-wrapper">

					<div className="three columns">
						<br/>
						<label>min_word_length</label>
						<Slider inputName="min_word_length" 
							start={4} 
							rangeMin={0} 
							rangeMax={10} 
							onChange={this.inputChangeHandler} />
					</div>

					<div className="three columns">
						<br/>
						<label>min_term_freq</label>
						<Slider inputName="min_term_freq" 
							start={1} 
							rangeMin={0} 
							rangeMax={10} 
							onChange={this.inputChangeHandler} />
					</div>

					<div className="three columns">
						<br/>
						<label>max_query_terms</label>
						<Slider inputName="max_query_terms" 
							start={25} 
							rangeMin={0} 
							rangeMax={50} 
							onChange={this.inputChangeHandler} />
					</div>

					<div className="three columns">
						<br/>
						<label>minimum_should_match</label>
						<Slider inputName="minimum_should_match" 
							start={30} 
							rangeMin={0} 
							rangeMax={100} 
							onChange={this.inputChangeHandler} />
					</div>

				</div>

				<DocumentList 
					baseRoute={this.baseRoute} 
					disableEventBus="true" 
					disableSorting="true" 
					similarDocs={this.state.id} 
					min_word_length={this.state.min_word_length} 
					min_term_freq={this.state.min_term_freq} 
					max_query_terms={this.state.max_query_terms} 
					minimum_should_match={this.state.minimum_should_match} 
					displayScore="true" />
			</div> : 
		null;
	}
}