import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory, Redirect } from 'react-router'

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
		<Route path="/graph" component={NetworkApplication} />
		<Route path="/" component={Application}>
			<Route path="/document/:id" components={{popup: AdvancedDocumentView}} />
		</Route>
	</Router>,
	document.getElementById('app')
);