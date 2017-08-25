import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import SearchForm from './SearchForm';

export default class AnalyticalApplicationWrapper extends React.Component {
	constructor(props) {
		super(props);

		window.eventBus = EventBus;
	}

	render() {
		const {
			main
		} = this.props;

		return (
			<div className={'app-container'}>

				<SearchForm />

				{main}

			</div>
		);
	}
}