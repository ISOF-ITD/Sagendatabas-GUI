import React from 'react';
import { hashHistory } from 'react-router';

import SearchForm from './SearchForm';

import OverlayWindow from './../../ISOF-React-modules/components/controls/OverlayWindow';

/*
Wrapper för hela applicationen. Innehåller SearchForm och lägger till component från router till 'main'
*/
export default class AnalyticalApplicationWrapper extends React.Component {
	constructor(props) {
		console.log('Application.js constructor');
		super(props);

		this.state = {
			overlayVisible: true,
			firsttime: true,
		};
	}

	render() {
		console.log('Application.js render');

		// Hämtar main parameter från router som säger om vilket component skulle synas i 'main' (AnalyticalApplicationWrapper eller NetworkApplicationWrapper)
		const {
			main
		} = this.props;

			//<div className={'app-container'}>
		return (
			<div className={'app-container' +(this.state.overlayVisible ? ' has-overlay' : '')}>

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
