import React from 'react';
import { hashHistory } from 'react-router';

import EventBus from 'eventbusjs';

import TermsGraph from './TermsGraph';
import CollectionYearsGraph from './CollectionYearsGraph';
import CategoriesGraph from './CategoriesGraph';
import BirthYearsGraph from './BirthYearsGraph';
import DocumentList from './DocumentList';
import PersonList from './PersonList';
import AdvancedMapView from './AdvancedMapView';
import GenderGraphDisplay from './GenderGraphDisplay';
import TypesGraph from './TypesGraph';
import NetworkGraph from './NetworkGraph';

import TextHighlightList from './TextHighlightList';
import ImageOverlay from './../../ISOF-React-modules/components/views/ImageOverlay';

import {TabsContainer, Tab} from './../../ISOF-React-modules/components/controls/TabControl';

import PopupWindow from './../../ISOF-React-modules/components/controls/PopupWindow';

import config from './../config';

export default class AnalyticalApplicationWrapper extends React.Component {
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
		hashHistory.push('/search/analyse');
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

		var popupVisible = Boolean(popup);

		return (
			<div className={'app-container'}>

				<TabsContainer className="content-width">
					<AdvancedMapView mapHeight="700" tabName="Karta" />
					<NetworkGraph graphHeight="800" 
						hideControls={true}
						min_doc_count="1" 
						vertices_size="800" 
						sample_size="50000" 
						strength="-10" 
						filterField="person" 
						url={config.apiUrl+config.endpoints.persons_graph} 
						hideLabels={true}
						tabName="Person nätverk" />
				</TabsContainer>

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
								<Tab tabName="Titel topic terms">
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
								<CollectionYearsGraph title="Uppteckningsår" 
									graphHeight="250"
									dispatchTimerange={true} />
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
						<TextHighlightList tabName="Markerade meningar" />
						<PersonList tabName="Personer" />

					</TabsContainer>

				</div>

				<PopupWindow windowOpen={popupVisible} onShow={this.popupWindowShowHandler} onHide={this.popupWindowHideHandler} onClose={this.popupCloseHandler} closeButtonStyle="dark" disableAutoScrolling="true">
					{popup}
				</PopupWindow>

				<ImageOverlay />

			</div>
		);
	}
}