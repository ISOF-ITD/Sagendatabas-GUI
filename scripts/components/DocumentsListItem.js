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
		this.setState({
			open: false,
			doc: props.doc
		})
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
						<span className="prop">{this.state.doc._source.taxonomy.category ? (this.state.doc._source.taxonomy.category+': '+this.state.doc._source.taxonomy.name) : ''}</span>
					</span>

					<div className="u-cf"></div>
				</div>

				<div className="content">
					{
						this.props &&
						<p dangerouslySetInnerHTML={{__html: this.state.doc.highlight ? this.state.doc.highlight.text[0] : this.pros.doc._source.text}}></p>
					}
				</div>

			</div>
		) : null;
	}
}