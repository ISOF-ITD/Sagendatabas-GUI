import React from 'react';
import { Route, Switch } from 'react-router-dom';

import EventBus from 'eventbusjs';

import DocumentList from './DocumentList';
import NetworkGraph from './NetworkGraph';
import {TabsContainer, Tab} from './../../ISOF-React-modules/components/controls/TabControl';

import PopupWindow from './../../ISOF-React-modules/components/controls/PopupWindow';
import AdvancedDocumentView from './AdvancedDocumentView';
import AdvancedPersonView from './AdvancedPersonView';

import config from './../config';

export default class NetworkApplicationWrapper extends React.Component {
	constructor(props) {
		console.log('NetworkApplicationWrapper.js constructor');
		super(props);

		this.state = {
			popupVisible: false,
			hasFilters: false
		};

		this.popupWindowShowHandler = this.popupWindowShowHandler.bind(this);
		this.popupWindowHideHandler = this.popupWindowHideHandler.bind(this);
		this.popupCloseHandler = this.popupCloseHandler.bind(this);
		this.graphFilterHandler = this.graphFilterHandler.bind(this);

		window.eventBus = EventBus;

		window.eventBus.addEventListener('graph.filter', this.graphFilterHandler);
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('graph.filter', this.graphFilterHandler);
		}
	}

	graphFilterHandler(event, data) {
		this.setState({
			hasFilters: Boolean(data.value)
		});
	}

	popupCloseHandler() {
		hashHistory.push('/search/network');
	}

	popupWindowShowHandler() {
		document.body.classList.add('has-overlay');
	}

	popupWindowHideHandler() {
		document.body.classList.remove('has-overlay');
	}

	render() {
		//const {
		//	popup
		//} = this.props;

		// Checkar om PopupWindow skulle synas
		//var popupVisible = Boolean(popup);
		var popupVisible = false;

		// Check if popup should be true
		if (this.props && this.props.match && this.props.match.url.indexOf('document') > -1) popupVisible = true;
		if (this.props && this.props.match && this.props.match.url.indexOf('person') > -1) popupVisible = true;


		return (
			<div className={'app-container'}>

				<div className={'graph-sidebar'+(this.state.hasFilters ? ' visible' : '')}>
					<DocumentList baseRoute="search/network" hideAttributes="true" />
				</div>

				<NetworkGraph url={config.apiUrl+config.endpoints.terms_graph} />

				<PopupWindow windowOpen={popupVisible} onShow={this.popupWindowShowHandler} onHide={this.popupWindowHideHandler} onClose={this.popupCloseHandler} closeButtonStyle="dark" disableAutoScrolling="true">
					<Switch>
					<Route path={[
							"/search/network/document/:id",
						]}
						render={(props) =>
							<AdvancedDocumentView
								{...props}	
							/>
						}/>
						<Route path={[
							"/search/network/person/:id",
						]}
						render={(props) =>
							<AdvancedPersonView
								{...props}	
							/>
						}/>
					</Switch>
				</PopupWindow>

			</div>
		);
	}
}