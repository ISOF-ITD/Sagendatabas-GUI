import React from 'react';
import { hashHistory } from 'react-router';

import DocumentList from './DocumentList';

import config from './../config';

export default class AdvancedDocumentView extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			doc: null
		};
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

		console.log(topicRows);

		return this.state.doc ? 
			<div className="document-view">
				<h2>{this.state.doc.title}</h2>
				<p dangerouslySetInnerHTML={{__html: this.state.doc.text}}></p>

				<hr/>

				<div>
					{topicRows}
				</div>

				<hr/>

				<div className="row">
					<div className="four columns">
						{
							this.state.doc.taxonomy.category && 
							<p><strong>Kategori:</strong> {this.state.doc.taxonomy.category+': '+this.state.doc.taxonomy.name}</p>
						}

						<p><strong>Materialtyp:</strong> {this.state.doc.materialtype}</p>
					</div>
				</div>

				<hr/>

				<br/><br/>

				<h3>Liknande sägner</h3>

				<DocumentList disableEventBus="true" disableSorting="true" similarDocs={this.state.id} displayScore="true" />
			</div> : 
		null;
	}
}