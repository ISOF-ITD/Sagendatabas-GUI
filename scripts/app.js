import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory, Redirect } from 'react-router'

import IntroApplication from './components/IntroApplication';
import Application from './components/Application';
import AnalyticalApplicationWrapper from './components/AnalyticalApplicationWrapper';
import NetworkApplicationWrapper from './components/NetworkApplicationWrapper';
import AdvancedDocumentView from './components/AdvancedDocumentView';
import AdvancedPersonView from './components/AdvancedPersonView';

// IE 11 backwards compatibility
import 'whatwg-fetch';
import Promise from 'promise-polyfill'; 
if (!window.Promise) {
	window.Promise = Promise;
}

console.log('Digitalt kulturarv running React.js version '+React.version);

ReactDOM.render(
	<Router history={hashHistory}>
		<Route path="/" component={IntroApplication} />
		<Route path="/search" component={Application}>
			<Route path="/search/analyse" components={{main: AnalyticalApplicationWrapper}}>
				<Route path="/search/analyse/document/:id" components={{popup: AdvancedDocumentView}} />
				<Route path="/search/analyse/person/:id" components={{popup: AdvancedPersonView}} />
			</Route>
			<Route path="/search/network" components={{main: NetworkApplicationWrapper}}>
				<Route path="/search/network/document/:id" components={{popup: AdvancedDocumentView}} />
				<Route path="/search/network/person/:id" components={{popup: AdvancedPersonView}} />
			</Route>
		</Route>
	</Router>,
	document.getElementById('app')
);