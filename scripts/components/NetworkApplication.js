
import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import SearchForm from './SearchForm';
import DocumentList from './DocumentList';
import TermsNetworkGraph from './TermsNetworkGraph';
import {TabsContainer, Tab} from './TabControl';
import PopupWindow from './../../ISOF-React-modules/components/controls/PopupWindow';

import config from './../config';

export default class NetworkApplication extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			popupVisible: false,
			hasFilters: false
		};

		this.popupWindowShowHandler = this.popupWindowShowHandler.bind(this);
		this.popupWindowHideHandler = this.popupWindowHideHandler.bind(this);
		this.popupCloseHandler = this.popupCloseHandler.bind(this);

		window.eventBus = EventBus;

		window.eventBus.addEventListener('graph.filter', this.graphFilterHandler.bind(this));
	}

	graphFilterHandler(event, data) {
		this.setState({
			hasFilters: Boolean(data.value)
		});
	}

	popupCloseHandler() {
		hashHistory.push('/network');
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

				<SearchForm />

				<div className={'graph-sidebar'+(this.state.hasFilters ? ' visible' : '')}>
					<DocumentList baseRoute="network" hideAttributes="true" />
				</div>

				<TermsNetworkGraph />

				<PopupWindow onShow={this.popupWindowShowHandler} onHide={this.popupWindowHideHandler} onClose={this.popupCloseHandler} closeButtonStyle="dark" disableAutoScrolling="true">
					{popup}
				</PopupWindow>

			</div>
		);
	}
}