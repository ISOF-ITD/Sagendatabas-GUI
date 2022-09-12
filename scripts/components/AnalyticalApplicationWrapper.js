import React from 'react';
import { Route, Switch } from 'react-router-dom';

import EventBus from 'eventbusjs';

import TermsGraph from './TermsGraph';
import CollectionYearsGraph from './CollectionYearsGraph';
import CategoriesGraph from './CategoriesGraph';
import CategoryTypesGraph from './CategoryTypesGraph';
import BirthYearsGraph from './BirthYearsGraph';
import DocumentList from './DocumentList';
import PersonList from './PersonList';
import AdvancedMapView from './AdvancedMapView';
import GenderGraphDisplay from './GenderGraphDisplay';
import TypesGraph from './TypesGraph';
// Extended app:
// import NetworkGraph from './NetworkGraph';

import TextHighlightList from './TextHighlightList';
import ImageOverlay from './../../ISOF-React-modules/components/views/ImageOverlay';

import {TabsContainer, Tab} from './../../ISOF-React-modules/components/controls/TabControl';

import PopupWindow from './../../ISOF-React-modules/components/controls/PopupWindow';
import AdvancedDocumentView from './AdvancedDocumentView';
import AdvancedPersonView from './AdvancedPersonView';

import IntroApplication from './IntroApplication';

import config from './../config';

/*

Wrapper component för hela applicationen

*/

export default class AnalyticalApplicationWrapper extends React.Component {
	constructor(props) {
		console.log('AnalyticalApplicationWrapper.js constructor');
		super(props);

		this.state = {
			popupVisible: false
		};

		this.popupWindowShowHandler = this.popupWindowShowHandler.bind(this);
		this.popupWindowHideHandler = this.popupWindowHideHandler.bind(this);
		this.popupCloseHandler = this.popupCloseHandler.bind(this);

		window.eventBus = EventBus;
	}

	// Lägger till normal route när PopupWindow stängt
	popupCloseHandler() {
		// Lägg till rätt route när användaren stänger popuprutan
		this.props.history.push('/search/analyse');
	}

	popupWindowShowHandler() {
		document.body.classList.add('has-overlay');
	}

	popupWindowHideHandler() {
		document.body.classList.remove('has-overlay');
	}

	render() {
		// Hämtar popup parameter från router som säger om vilket component skulle synas i PopupWindow
		//const {
		//	popup
		//} = this.props;

		// Checkar om PopupWindow skulle synas
		//var popupVisible = Boolean(popup);
		var popupVisible = false;

		// Check if popup should be visible
		if (this.props && this.props.match && this.props.match.url.indexOf('document') > -1) popupVisible = true;
		if (this.props && this.props.match && this.props.match.url.indexOf('person') > -1) popupVisible = true;

		return (
			<div className={'app-container'}>

				<TabsContainer className="content-width">
					<AdvancedMapView mapHeight="700" tabName="Karta" />
{/*
	extended app:
*/}
{/*					<NetworkGraph graphHeight="800" 
						hideControls={true}
						min_doc_count="1" 
						vertices_size="800" 
						sample_size="50000" 
						strength="-10" 
						filterField="person" 
						url={config.apiUrl+config.endpoints.persons_graph} 
						hideLabels={true}
						tabName="Person nätverk" />
*/}				
					<IntroApplication mapHeight="700" tabName="Om" />
				</TabsContainer>

				<div className="container">

					<div className="row">

						<div className="twelve columns">

							<TabsContainer>
								<Tab tabName="Huvudkategorier">
									<CategoryTypesGraph graphHeight="300" />
								</Tab>
								<Tab tabName="Kategorier">
									<CategoriesGraph graphHeight="300" />
								</Tab>
								<Tab tabName="Typ">
									<TypesGraph graphHeight="300" />
								</Tab>
								{/* <Tab tabName="Topic terms">
									<TermsGraph count="15" graphHeight="300" />
								</Tab>
								<Tab tabName="Rubrik på källa (Titel topic terms)">
									<TermsGraph count="15" type="titles" graphHeight="300" />
								</Tab> */}
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

						<DocumentList tabName="Dokument" />
						<TextHighlightList history={this.props.history} tabName="Markerade meningar" />
						<PersonList tabName="Personer" />

					</TabsContainer>

				</div>

				<PopupWindow windowOpen={popupVisible} onShow={this.popupWindowShowHandler} onHide={this.popupWindowHideHandler} onClose={this.popupCloseHandler} closeButtonStyle="dark" disableAutoScrolling="true">
					<Switch>
					<Route path={[
							"/search/analyse/document/:id",
						]}
						render={(props) =>
							<AdvancedDocumentView
								{...props}	
							/>
						}/>
						<Route path={[
							"/search/analyse/person/:id",
						]}
						render={(props) =>
							<AdvancedPersonView
								{...props}	
							/>
						}/>
					</Switch>
					{/*	
					//TODO: Not needed anymore
					{popup}
					 */}
				</PopupWindow>

				<ImageOverlay />

			</div>
		);
	}
}