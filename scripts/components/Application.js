import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

export default class AnalyticalApplicationWrapper extends React.Component {
	constructor(props) {
		super(props);

		window.eventBus = EventBus;
	}

	render() {
		const {
			main,
			searchForm
		} = this.props;

		return (
			<div className={'app-container'}>

				<div className="search-form-container">{searchForm}</div>

				{main}

			</div>
		);
	}
}
