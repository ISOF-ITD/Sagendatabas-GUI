import React from 'react';
import { hashHistory } from 'react-router';

import SearchForm from './SearchForm';

import EventBus from 'eventbusjs';

/*
Wrapper för hela applicationen. Innehåller SearchForm och lägger till component från router till 'main'
*/
export default class AnalyticalApplicationWrapper extends React.Component {
	constructor(props) {
		super(props);

		window.eventBus = EventBus;
	}

	render() {
		// Hämtar main parameter från router som säger om vilket component skulle synas i 'main' (AnalyticalApplicationWrapper eller NetworkApplicationWrapper)
		const {
			main
		} = this.props;

		return (
			<div className={'app-container'}>

				<div className="search-form-container">

					{
					/*

					SearchForm innehåller hela sökfältet och används av båda delar av applicationen (AnalyticalApplicationWrapper 
					och NetworkApplicationWrapper). SearchForm skickar 'searchForm.search' event via EventBus samt sökparametrar.
					Varje visualisering komponent tar emot 'searchForm.search' och parametrarna och hämtar data från API:et
					för visning.

					*/
					}

					<SearchForm />

				</div>

				{main}

			</div>
		);
	}
}
