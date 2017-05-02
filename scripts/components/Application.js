import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import SearchForm from './SearchForm';
import TopicsGraph from './TopicsGraph';
import CollectionYearsGraph from './CollectionYearsGraph';
import CategoriesGraph from './CategoriesGraph';
import BirthYearsGraph from './BirthYearsGraph';
import DocumentsList from './DocumentsList';

export default class Application extends React.Component {
	constructor(props) {
		super(props);

		window.eventBus = EventBus;
	}

	componentDidMount() {
		this.refs.searchForm.triggerSearch();
	}

	render() {
		return (
			<div className="container">

				<h1>Sägendatabas</h1>

				<SearchForm ref="searchForm" />

				<hr/>

				<h2>CategoriesGraph</h2>
				<CategoriesGraph />

				<div className="row">

					<div className="six columns">
						<h2>TopicsGraph</h2>
						<TopicsGraph count="15" graphHeight="300" />
					</div>

					<div className="six columns">
						<h2>TopicsGraph: type=titles</h2>
						<TopicsGraph count="15" type="titles" graphHeight="300" />
					</div>

				</div>

				<div className="row">

					<div className="six columns">
						<h2>CollectionYearsGraph</h2>
						<CollectionYearsGraph graphHeight="300" />
					</div>

					<div className="six columns">
						<h2>BirthYearsGraph</h2>
						<BirthYearsGraph graphHeight="300" />
					</div>

				</div>

				<DocumentsList />

			</div>
		);
	}
}