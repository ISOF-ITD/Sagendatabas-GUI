import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, hashHistory, Redirect } from 'react-router'

import Application from './components/Application';

// IE 11 backwards compatibility
import 'whatwg-fetch';
import Promise from 'promise-polyfill'; 
if (!window.Promise) {
	window.Promise = Promise;
}

ReactDOM.render(
	<Router history={hashHistory}>
		<Route path="/" component={Application}>
		</Route>
	</Router>,
	document.getElementById('app')
);