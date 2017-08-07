import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

export default class IntroApplication extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className={'app-container'}>

				<div className="advanced-search-form fixed">

					<div className="container">

						<h1>Digitalt kulturarv</h1>

						<nav className="app-nav">
							<a href="#/search">Sök</a>
							<a href="#/network">Topic terms nätverk</a>
						</nav>
		
					</div>
	
				</div>
		
			</div>
		);
	}
}