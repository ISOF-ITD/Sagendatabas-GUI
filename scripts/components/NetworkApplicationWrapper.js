
import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import DocumentList from './DocumentList';
import TermsNetworkGraph from './TermsNetworkGraph';
import {TabsContainer, Tab} from './TabControl';
import PopupWindow from './../../ISOF-React-modules/components/controls/PopupWindow';

import config from './../config';

export default class NetworkApplicationWrapper extends React.Component {
	constructor(props) {
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
		const {
			popup
		} = this.props;

		return (
			<div className={'app-container'}>

				<div className={'graph-sidebar'+(this.state.hasFilters ? ' visible' : '')}>
					<DocumentList baseRoute="search/network" hideAttributes="true" />
				</div>

				<TermsNetworkGraph />

				<PopupWindow onShow={this.popupWindowShowHandler} onHide={this.popupWindowHideHandler} onClose={this.popupCloseHandler} closeButtonStyle="dark" disableAutoScrolling="true">
					{popup}
				</PopupWindow>

			</div>
		);
	}
}