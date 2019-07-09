import React from 'react';
import { hashHistory } from 'react-router';

import SearchForm from './SearchForm';

import OverlayWindow from './../../ISOF-React-modules/components/controls/OverlayWindow';

import EventBus from 'eventbusjs';

/*
Wrapper för hela applicationen. Innehåller SearchForm och lägger till component från router till 'main'
*/
export default class AnalyticalApplicationWrapper extends React.Component {
	constructor(props) {
		console.log('Application.js constructor');
		super(props);

		window.eventBus = EventBus;

		this.state = {
			overlayVisible: true
		};

		// Bind all event handlers to this (the actual component) to make component variables available inside the functions
		this.introOverlayCloseButtonClickHandler = this.introOverlayCloseButtonClickHandler.bind(this);
	}

	componentDidMount() {
		console.log('application.js componentDidMount');
		if (window.eventBus) {
			eventBus.dispatch('overlay.intro');
			console.log('Introapplication.js overlay.intro');
		}
	}

	introOverlayCloseButtonClickHandler() {
		console.log('application.js introOverlayCloseButtonClickHandler');
		let user = document.getElementById("user-field");
		let losen = document.getElementById("losen-field");
		console.log(user.value);

		// Skickar overlay.hide via globala eventBus, OverlayWindow tar emot det
		if (user.value.length > 0) {
			if (losen.value.length > 0) {
				let lose = 'kultur arv';
				let los = lose.split(' ');
				let splitString = los[0].split('');
				let splitString1 = los[1].split('');
				let reverseArray = splitString.reverse();
				let reverseArray1 = splitString1.reverse();
				let joinArray = reverseArray.join("");
				let joinArray1 = reverseArray1.join("");
				let use = joinArray + joinArray.length + joinArray1+ joinArray1.length;
				// use = "1";
				if ((user.value == 'forska') && (losen.value == use)) {
						eventBus.dispatch('overlay.hide');
						console.log('Introapplication.js overlay.hide');
				}
			}
		}
		//Removed: Always show on start
		// Registrerar till localStorage om användaren har valt att inte visa intro igen
		//if (this.state.neverShowIntro) {
			//localStorage.setItem('neverShowIntro', true);
		//}
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

				<OverlayWindow title="Välkommen till digitalt kulturarv" showClose={false}>
					<div>
						<hr className="margin-bottom-35"/>
						<div className="user-box">
							<input id="user-field" placeholder="Användare" type="text"  />
							<br/>
							<input id="losen-field" placeholder="Lösen" type="text"  />
						</div>
						<button className="button-primary margin-bottom-0" onClick={this.introOverlayCloseButtonClickHandler}>{'Logga in'}</button>
					</div>
				</OverlayWindow>
				{ console.log('application.js render /OverlayWindow') }
			</div>
		);
	}
}
