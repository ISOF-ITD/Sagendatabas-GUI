import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory, Redirect } from 'react-router'

import IntroApplication from './components/IntroApplication';
import Application from './components/Application';
import AnalyticalApplicationWrapper from './components/AnalyticalApplicationWrapper';
import NetworkApplicationWrapper from './components/NetworkApplicationWrapper';
import AdvancedDocumentView from './components/AdvancedDocumentView';
import AdvancedPersonView from './components/AdvancedPersonView';

import SearchForm from './components/SearchForm';

console.log('Digitalt kulturarv running React.js version '+React.version);

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

ReactDOM.render(
	<Router history={hashHistory}>
		<Route path="/" component={IntroApplication} />
		<Route path="/search" component={Application}>
			<Route path="/search/analyse" components={{searchForm: SearchForm, main: AnalyticalApplicationWrapper}}>
				<Route path="/search/analyse/document/:id" components={{popup: AdvancedDocumentView}} />
				<Route path="/search/analyse/person/:id" components={{popup: AdvancedPersonView}} />
			</Route>
			<Route path="/search/network" components={{searchForm: SearchForm, main: NetworkApplicationWrapper}}>
				<Route path="/search/network/document/:id" components={{popup: AdvancedDocumentView}} />
				<Route path="/search/network/person/:id" components={{popup: AdvancedPersonView}} />
			</Route>
		</Route>
	</Router>,
	document.getElementById('app')
);