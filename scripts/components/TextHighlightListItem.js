import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';
import { hashHistory } from 'react-router';

import config from './../config';

export default class TextHighlightListItem extends React.Component {
	constructor(props) {
		super(props);

		this.itemClickHandler = this.itemClickHandler.bind(this);

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

	itemClickHandler() {
		hashHistory.push((this.props.baseRoute ? this.props.baseRoute : 'search/analyse')+'/document/'+this.state.data._id)
	}

	render() {
		return this.state.data ? (
			<tr onClick={this.itemClickHandler} dangerouslySetInnerHTML={{__html: this.state.data.highlight}} />
		) : null;
	}
}