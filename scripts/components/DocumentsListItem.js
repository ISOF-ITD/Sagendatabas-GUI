import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import config from './../config';

export default class DocumentsListItem extends React.Component {
	constructor(props) {
		super(props);

		this.headerClickHandler = this.headerClickHandler.bind(this);

		this.state = {
			open: false,
			doc: null
		};
	}

	componentDidMount() {
		this.setState({
			doc: this.props.doc
		});
	}

	componentWillReceiveProps(props) {
		if (this.state.doc._id != props.doc._id) {
			this.setState({
				open: false,
				doc: props.doc
			})
		}
	}

	headerClickHandler() {
		this.setState({
			open: !this.state.open
		});
	}

	render() {
		return this.state.doc ? (
			<div className={'item'+(this.state.open ? ' open' : '')}>
				<div className="header" onClick={this.headerClickHandler}>
					<span className="title">{this.state.doc._source.title}</span>

					<span className="props">
						<span className="prop">{this.state.doc._source.materialtype}</span>
						{
							this.state.doc._source.taxonomy.category && 
							<span className="prop">{this.state.doc._source.taxonomy.category+': '+this.state.doc._source.taxonomy.name}</span>
						}
						{
							this.props.displayScore && 
							<span className="prop"><div className="score-view">&nbsp;<span className="score" style={{width: this.state.doc._score+'%'}}></span></div></span>
						}
					</span>

					<div className="u-cf"></div>
				</div>

				<div className="content">
					{
						this.state.doc &&
						<p className={'text-viewer'+(this.state.doc._source.text.length > 1500 ? ' trimmed' : '')} dangerouslySetInnerHTML={{__html: this.state.doc.highlight ? this.state.doc.highlight.text[0] : this.state.doc._source.text}}></p>
					}
					<a className="button" href={'#/document/'+this.state.doc._id}>Visa</a>
				</div>

			</div>
		) : null;
	}
}