import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import SearchForm from './SearchForm';
import TopicsGraph from './TopicsGraph';
import CategoriesGraph from './CategoriesGraph';

export default class Application extends React.Component {
	constructor(props) {
		super(props);

		window.eventBus = EventBus;
	}

	render() {
		return (
			<div className="container">

				<h1>Sägendatabas</h1>

				<SearchForm />

				<hr/>

				<h2>CategoriesGraph</h2>
				<CategoriesGraph />

				<h2>TopicsGraph</h2>
				<TopicsGraph />

				<h2>TopicsGraph: type=titles</h2>
				<TopicsGraph type="titles" />

			</div>
		);
	}
}