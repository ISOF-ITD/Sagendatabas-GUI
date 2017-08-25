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
					<span className="title">{this.state.data._source.title}</span>

					{
						!this.props.hideAttributes &&
						<span className="props">
							{this.state.data._source.year}
							<span className="prop">{this.state.data._source.materialtype}</span>
							{
								this.state.data._source.taxonomy.category && 
								<span className="prop">{this.state.data._source.taxonomy.category+': '+this.state.data._source.taxonomy.name}</span>
							}
							{
								this.props.displayScore && 
								<span className="prop"><div className="score-view">&nbsp;<span className="score" style={{width: this.state.data._score+'%'}}></span></div></span>
							}
						</span>
					}

					<div className="u-cf"></div>
				</div>

				<div className="content">
					{
						this.state.data &&
						<p className={'text-viewer'+(this.state.data._source.text && this.state.data._source.text.length > 1500 ? ' trimmed' : '')} dangerouslySetInnerHTML={{__html: this.state.data.highlight ? this.state.data.highlight.text[0] : this.state.data._source.text}}></p>
					}
					<a className="button" href={'#/'+(this.props.baseRoute ? this.props.baseRoute : 'search/analyse')+'/document/'+this.state.data._id}>Visa</a>
				</div>

			</div>
		) : null;
	}
}