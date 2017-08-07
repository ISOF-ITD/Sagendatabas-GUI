import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import SearchForm from './SearchForm';
import TermsGraph from './TermsGraph';
import CollectionYearsGraph from './CollectionYearsGraph';
import CategoriesGraph from './CategoriesGraph';
import BirthYearsGraph from './BirthYearsGraph';
import DocumentList from './DocumentList';
import PersonList from './PersonList';
import AdvancedMapView from './AdvancedMapView';
import GenderGraphDisplay from './GenderGraphDisplay';
import TypesGraph from './TypesGraph';
import ImageOverlay from './../../ISOF-React-modules/components/views/ImageOverlay';

import {TabsContainer, Tab} from './TabControl';

import PopupWindow from './../../ISOF-React-modules/components/controls/PopupWindow';

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
		hashHistory.push('/search');
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

				<AdvancedMapView mapHeight="500" />

				<div className="container">

					<div className="row">

						<div className="twelve columns">

							<TabsContainer>
								<Tab tabName="Kategorier">
									<CategoriesGraph graphHeight="300" />
								</Tab>
								<Tab tabName="Topic terms">
									<TermsGraph count="15" graphHeight="300" />
								</Tab>
								<Tab tabName="Titel topic termss">
									<TermsGraph count="15" type="titles" graphHeight="300" />
								</Tab>
								<Tab tabName="Typ">
									<TypesGraph graphHeight="300" />
								</Tab>
							</TabsContainer>
					
						</div>

					</div>

					<div className="row">

						<div className="twelve columns">

							<div className="graph-wrapper no-header">
								<CollectionYearsGraph title="Uppteckningsår" graphHeight="250" />
								<BirthYearsGraph title="Födelseår" graphHeight="250" />	
							</div>

						</div>

					</div>

					<div className="row">

						<div className="twelve columns">
							<GenderGraphDisplay title="Kön" />
						</div>

					</div>


					<TabsContainer>

						<DocumentList tabName="Dokumenter" />
						<PersonList tabName="Personer" />

					</TabsContainer>

				</div>

				<PopupWindow onShow={this.popupWindowShowHandler} onHide={this.popupWindowHideHandler} onClose={this.popupCloseHandler} closeButtonStyle="dark" disableAutoScrolling="true">
					{popup}
				</PopupWindow>

				<ImageOverlay />

			</div>
		);
	}
}