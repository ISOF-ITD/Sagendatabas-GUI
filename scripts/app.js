import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory, Redirect } from 'react-router'

import IntroApplication from './components/IntroApplication';
import Application from './components/Application';
import NetworkApplication from './components/NetworkApplication';
import AdvancedDocumentView from './components/AdvancedDocumentView';

// IE 11 backwards compatibility
import 'whatwg-fetch';
import Promise from 'promise-polyfill'; 
if (!window.Promise) {
	window.Promise = Promise;
}

ReactDOM.render(
	<Router history={hashHistory}>
		<Route path="/" component={IntroApplication} />
		<Route path="/network" component={NetworkApplication}>
			<Route path="/network/document/:id" components={{popup: AdvancedDocumentView}} />
		</Route>
		<Route path="/search" component={Application}>
			<Route path="/search/document/:id" components={{popup: AdvancedDocumentView}} />
		</Route>
	</Router>,
	document.getElementById('app')
);