import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import config from './../config';

export default class DocumentListItem extends React.Component {
	constructor(props) {
		super(props);

		this.headerClickHandler = this.headerClickHandler.bind(this);

		this.state = {
			open: false,
			data: null
		};
	}

	componentDidMount() {
		this.setState({
			data: this.props.data
		});
	}

	componentWillReceiveProps(props) {
		if (this.state.data._id != props.data._id) {
			this.setState({
				open: false,
				data: props.data
			})
		}
	}

	headerClickHandler() {
		this.setState({
			open: !this.state.open
		});
	}

	render() {
		return this.state.data ? (
			<div className={'item'+(this.state.open ? ' open' : '')}>
				<div className="header" onClick={this.headerClickHandler}>
					<span className="title" title={this.state.data._source.title || `[${this.state.data._source.contents}]`}>{this.state.data._source.title || `[${this.state.data._source.contents}]`}</span>

					{
						!this.props.hideAttributes &&
						<span className="props">
							{this.state.data._source.year}
							{
								this.state.data._source.places && this.state.data._source.places.length > 0 &&
								this.state.data._source.places.map(function(place) {
									return <span className="prop" key={place.name+'-'+place.landskap}>{place.name+', '+place.landskap}</span>
								})
							}
							<span className="prop">{l(this.state.data._source.recordtype)}</span>
							<span className="prop">{l(this.state.data._source.materialtype)}</span>
							{
								this.state.data._source.taxonomy && this.state.data._source.taxonomy.category &&
								<span className="prop">{this.state.data._source.taxonomy.category+': '+this.state.data._source.taxonomy.name}</span>
							}
							{
								this.props.displayScore &&
								<span className="prop"><div className="score-view"  title={`Relevans: ${Math.round(this.state.data._score * 10) / 10}%`}>&nbsp;<span className="score" style={{width: this.state.data._score+'%'}}></span></div></span>
							}
						</span>
					}

					<div className="u-cf"></div>
				</div>

				<div className="content row">

					<div className="eight columns">
						{
							this.state.data &&
							<p className={'text-viewer'+(this.state.data._source.text && this.state.data._source.text.length > 1500 ? ' trimmed' : '')} dangerouslySetInnerHTML={{__html:
								// Visa det första highlight-elementet, annars visa texten
									this.state.data.highlight ? (Object.values(this.state.data.highlight)[0][0]) : this.state.data._source.text
							}}></p>
						}
						<a className="button" href={'#/'+(this.props.baseRoute ? this.props.baseRoute : 'search/analyse')+'/document/'+this.state.data._id}>Visa</a>
					</div>

					<div className="four columns">
						{
							this.state.data._source.archive.archive &&
							<p><strong>Arkiv:</strong><br/>
							{this.state.data._source.archive.archive}</p>
						}

						{
							this.state.data._source.archive.archive_id && 
							<p><strong>Acc. nr.:</strong><br/>
							{this.state.data._source.archive.archive_id}</p>
						}
					</div>

				</div>

			</div>
		) : null;
	}
}
