import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom'

import IntroApplication from './components/IntroApplication';
import Application from './components/Application';
import AnalyticalApplicationWrapper from './components/AnalyticalApplicationWrapper';
import NetworkApplicationWrapper from './components/NetworkApplicationWrapper';
import AdvancedDocumentView from './components/AdvancedDocumentView';
import AdvancedPersonView from './components/AdvancedPersonView';

console.log(`Digitalt kulturarv  running React.js version ${React.version} and ReactDOM version ${ReactDOM.version}`);

/*
Object.assign polyfill
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
*/
if (typeof Object.assign != 'function') {
	// Must be writable: true, enumerable: false, configurable: true
	Object.defineProperty(Object, "assign", {
		value: function assign(target, varArgs) { // .length of function is 2
			'use strict';
			if (target == null) { // TypeError if undefined or null
				throw new TypeError('Cannot convert undefined or null to object');
			}

			var to = Object(target);

			for (var index = 1; index < arguments.length; index++) {
				var nextSource = arguments[index];

				if (nextSource != null) { // Skip over if undefined or null
					for (var nextKey in nextSource) {
						// Avoid bugs when hasOwnProperty is shadowed
						if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
			}
			return to;
		},
		writable: true,
		configurable: true
	});
}

// IE 11 backwards compatibility
import 'whatwg-fetch';
import Promise from 'promise-polyfill'; 
if (!window.Promise) {
	window.Promise = Promise;
}

/*

Här har vi bara två huvud routes, /search/analyse och /search/network
För varje har vi sen rotues for visning av documents och personer, routern lägger till component i
'main' delen av Application componentet och 'popup' delen av AnalyticalApplicationWrapper 
och NetworkApplicationWrapper componenten

I början öppnas IntroApplication modulen

*/

ReactDOM.render(
	<HashRouter>
		<Route exact path="/" component={IntroApplication} />
		<Route path={[
			"/search",
			"/search/analyse",
			"/search/analyse/document/:id",
			"/search/analyse/person/:id",
			"/search/network",
			"/search/network/document/:id",
			"/search/network/person/:id",	
			]}
				 component={Application}>
			{/*
			<Route path="/search/analyse" components={{main: AnalyticalApplicationWrapper}}>
				<Route path="/search/analyse/document/:id" components={{popup: AdvancedDocumentView}} />
				<Route path="/search/analyse/person/:id" components={{popup: AdvancedPersonView}} />
			</Route>
			<Route path="/search/network" components={{main: NetworkApplicationWrapper}}>
				<Route path="/search/network/document/:id" components={{popup: AdvancedDocumentView}} />
				<Route path="/search/network/person/:id" components={{popup: AdvancedPersonView}} />
			</Route>
			*/}
		</Route>
	</HashRouter>,
	document.getElementById('app')
);