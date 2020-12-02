import React from 'react';
import { Route, Switch } from 'react-router-dom'
import { hashHistory } from 'react-router';

import AnalyticalApplicationWrapper from './AnalyticalApplicationWrapper';
import NetworkApplicationWrapper from './NetworkApplicationWrapper';

//Test use PlaceView for places:
// TODO handle url-paths record/document: record/:record_id vs /search/analyse/document/:record_id
import RoutePopupWindow from './../../ISOF-React-modules/components/controls/RoutePopupWindow';
import PlaceView from './../../ISOF-React-modules/components/views/PlaceView';
//import routeHelper from './../utils/routeHelper';

//import PopupWindow from './../../ISOF-React-modules/components/controls/PopupWindow';
//import AdvancedDocumentView from './AdvancedDocumentView';
//import AdvancedPersonView from './AdvancedPersonView';

import SearchForm from './SearchForm';

import OverlayWindow from './../../ISOF-React-modules/components/controls/OverlayWindow';

import EventBus from 'eventbusjs';

/*
Wrapper för hela applicationen. Innehåller SearchForm och lägger till component från router till 'main'
*/
export default class Application extends React.Component {
	constructor(props) {
		console.log('Application.js constructor');
		super(props);

		window.eventBus = EventBus;

		this.state = {
			overlayVisible: true,
			firsttime: true,
			//popupVisible: false
		};

		this.popupWindowShowHandler = this.popupWindowShowHandler.bind(this);
		this.popupWindowHideHandler = this.popupWindowHideHandler.bind(this);
		this.popupCloseHandler = this.popupCloseHandler.bind(this);

		// Bind all event handlers to this (the actual component) to make component variables available inside the functions
		this.introOverlayCloseButtonClickHandler = this.introOverlayCloseButtonClickHandler.bind(this);
	}

	componentDidMount() {
		console.log('application.js componentDidMount');
		if (window.eventBus) {
			if (this.state.firsttime) {
				eventBus.dispatch('overlay.intro');
				console.log('Introapplication.js overlay.intro');
				this.state.firsttime = false;
			} else {
				console.log('Introapplication.js overlay.intro:');
			}
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

	// Test use PlaceView for places, uses PopupWindow:
	// Lägger till normal route när PopupWindow stängt
	popupCloseHandler() {
		// Lägg till rätt route när användaren stänger popuprutan
		this.props.history.push('/search/analyse');
	}

	popupWindowShowHandler() {
		document.body.classList.add('has-overlay');
	}

	popupWindowHideHandler() {
		document.body.classList.remove('has-overlay');
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

				<Switch>
{/*					<Route path={[
						"/search/analyse/document/:id",
					]}
						>
								<AdvancedDocumentView match={this.props.match}/>
					</Route>
					<Route path={[
						"/search/analyse/person/:id",
					]}
						>
							<AdvancedPersonView/>
					</Route>
*/}					<Route path={[
						"/search/analyse/document/:id",
						"/search/analyse/person/:id",
						"/search/analyse",
					]}
						render={(props) =>
							<AnalyticalApplicationWrapper
								{...props}
							/>
						}/>
				{/*
						>
							<AnalyticalApplicationWrapper/>
					</Route>
				*/}
					<Route path={[
						"/search/network/document/:id",
						"/search/network/person/:id",
						"/search/network",
					]}
						render={(props) =>
							<NetworkApplicationWrapper
								{...props}	
							/>
						}/>
				{/*
							<NetworkApplicationWrapper/>
					</Route>
				*/}
				{/*
					//Test use PlaceView for places, uses PopupWindow:
				*/}
					<Route 
						path={[
							"/place/:place_id([0-9]+)",
						]}
						render={(props) =>
							<RoutePopupWindow
								onShow={this.popupWindowShowHandler}
								onHide={this.popupWindowHideHandler}
								onClose={this.popupCloseHandler}
								router={this.context.router}>
									<PlaceView 
										{...props}	
										//match={this.props.match}
									/>
							</RoutePopupWindow>
						}/>
				</Switch>
				{/*
				{main}
				*/}

{/*				<OverlayWindow title="Välkommen till digitalt kulturarv" showClose={false}>
					<div>
						<hr className="margin-bottom-35"/>
						<div className="user-box">
							<input id="user-field" placeholder="Användare" type="text"  />
							<br/>
							<input id="losen-field" placeholder="Lösen" type="password"  />
						</div>
						<button className="button-primary margin-bottom-0" onClick={this.introOverlayCloseButtonClickHandler}>{'Logga in'}</button>
					</div>
				</OverlayWindow>
*/}				{ console.log('application.js render /OverlayWindow') }
			</div>
		);
	}
}
