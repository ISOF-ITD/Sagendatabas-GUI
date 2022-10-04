import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import config from './../config';
import DocumentList from './DocumentList';

import paramsHelper from '../utils/paramsHelper';

export default class PersonListItem extends React.Component {
	constructor(props) {
		super(props);

		this.headerClickHandler = this.headerClickHandler.bind(this);

		this.state = {
			open: false,
			data: null,
			loading: true,
		};
	}

	componentDidMount() {
		this.setState({
			data: this.props.data
		});
	}

	componentWillReceiveProps(props) {
		this.setState({
			open: false,
			data: props.data
		});
	}

	headerClickHandler() {
		this.setState({
			open: !this.state.open
		});
	}

	getParamsForDocumentList() {
		const paramsObject = paramsHelper.getJsonFromParamString(this.props.paramString)
		paramsObject['person_id'] = this.props.data.id;
		paramsObject['size'] = 5;
		return paramsObject;
	}

	render() {
		return this.state.data ? (
			<div className={'item'+(this.state.open ? ' open' : '')}>
				<div className="header" onClick={this.headerClickHandler}>
					<span className="title">{this.state.data.name}
						{
							this.state.data.birth_year &&
							<span className="light"> ({this.state.data.birth_year})</span>
						}
					</span>

					<span className="props">
						{this.state.data.doc_count}
						{
							this.state.data.home &&
							<span className="prop">{this.state.data.home.name}</span>
						}
					</span>

					<div className="u-cf" />
				</div>

				<div className="content">
					<DocumentList params={this.getParamsForDocumentList()} open={this.state.open} />
					<a className="button" href={'#/'+(this.props.baseRoute ? this.props.baseRoute : 'search/analyse')+'/person/'+this.state.data.id}>Visa personen</a>
				</div>

			</div>
		) : null;
	}
}