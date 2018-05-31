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
							<a href="#/search/analyse">Sök</a>
							<a href="#/search/network">Topic terms nätverk</a>
						</nav>
		
					</div>
	
				</div>

				<div className="container">

					<div className="row">
						<div className="eight columns">

							<h2>Institutet för språk och folkminnen: Digitalt kulturarv</h2>
							<p>Sökgränssnitt för institutets databas.</p>

						</div>

						<div className="four columns">
							<img src="img/isof-logo.png" width="140" style={{float: 'right'}} />
						</div>
						
					</div>

				</div>
		
			</div>
		);
	}
}