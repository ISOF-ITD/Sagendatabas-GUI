import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import SearchForm from './SearchForm';
import TopicsGraph from './TopicsGraph';
import CollectionYearsGraph from './CollectionYearsGraph';
import CategoriesGraph from './CategoriesGraph';
import BirthYearsGraph from './BirthYearsGraph';
import DocumentsList from './DocumentsList';
import AdvancedMapView from './AdvancedMapView';

import PopupWindow from './../../ISOF-React-modules/components/views/PopupWindow';

export default class Application extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			popupVisible: false
		};

		this.popupWindowShowHandler = this.popupWindowShowHandler.bind(this);
		this.popupWindowHideHandler = this.popupWindowHideHandler.bind(this);
		this.popupCloseHandler = this.popupCloseHandler.bind(this);

		window.eventBus = EventBus;
	}

	popupCloseHandler() {
		hashHistory.push('/');
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
			<div className={'container app-container'}>

				<h1>Sägendatabas</h1>

				<SearchForm ref="searchForm" />

				<hr/>

				<div className="row">

					<div className="twelve columns">
						<h2>AdvancedMapView</h2>
						<AdvancedMapView mapHeight="400" />
					</div>

				</div>

				<div className="row">

					<div className="twelve columns">
						<h2>CategoriesGraph</h2>
						<CategoriesGraph />
					</div>

				</div>

				<div className="row">

					<div className="twelve columns">
						<h2>TopicsGraph</h2>
						<TopicsGraph count="15" graphHeight="300" />
					</div>

				</div>

				<div className="row">

					<div className="twelve columns">
						<h2>TopicsGraph: type=titles</h2>
						<TopicsGraph count="15" type="titles" graphHeight="300" />
					</div>

				</div>

				<div className="row">

					<div className="twelve columns">
						<h2>CollectionYearsGraph</h2>
						<CollectionYearsGraph graphHeight="300" />
					</div>

				</div>

				<div className="row">

					<div className="twelve columns">
						<h2>BirthYearsGraph</h2>
						<BirthYearsGraph graphHeight="300" />
					</div>

				</div>

				<DocumentsList />

				<PopupWindow onShow={this.popupWindowShowHandler} onHide={this.popupWindowHideHandler} onClose={this.popupCloseHandler} closeButtonStyle="dark" disableAutoScrolling="true">
					{popup}
				</PopupWindow>

			</div>
		);
	}
}