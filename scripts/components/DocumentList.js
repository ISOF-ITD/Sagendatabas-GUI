import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import paramsHelper from './../utils/paramsHelper';

import DropdownMenu from './../../ISOF-React-modules/components/controls/DropdownMenu';

import DocumentListItem from './DocumentListItem';

import config from './../config';

export default class DocumentList extends React.Component {
	constructor(props) {
		super(props);

		this.filters = {};

		this.graphFilterHandler = this.graphFilterHandler.bind(this);
		this.searchHandler = this.searchHandler.bind(this);

		this.state = {
			total: null,
			data: [],
			loading: false,
			params: null,
			sort: '_score',
			sortOrder: 'asc'
		};

		if (window.eventBus) {
			window.eventBus.addEventListener('graph.filter', this.graphFilterHandler);
		}
	}

	componentDidMount() {
		if (window.eventBus && !this.props.disableEventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler);
		}

		this.orderLinkClickHandler = this.orderLinkClickHandler.bind(this);

		if (this.props.similarDocs) {
			this.fetchData({
				similar: this.props.similarDocs
			});
		}
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('searchForm.search', this.searchHandler);
			window.eventBus.removeEventListener('graph.filter', this.graphFilterHandler);
		}
	}

	componentWillReceiveProps(props) {
		if (props.similarDocs) {
			this.fetchData({
				similar: props.similarDocs
			});
		}
	}

	orderLinkClickHandler(event) {
		this.setSortOrder(event.target.dataset.sort, event.target.dataset.order);
	}

	setSortOrder(sort, sortOrder) {
		if (sort != this.state.sort || sortOrder != this.state.sortOrder) {
			this.setState({
				sort: sort,
				sortOrder: sortOrder
			}, function() {
				this.fetchData();
			}.bind(this));
		}
	}

	graphFilterHandler(event, data) {
		this.filters[data.filter] = typeof data.value == 'array' ? data.value.join(',') : data.value;

		for (var key in this.filters) {
			if (this.filters[key] == null) {
				delete this.filters[key];
			}
		}

		this.fetchData();
	}

	searchHandler(event, data) {
		this.filters = {};
		
		this.setState({
			params: data.params
		}, function() {
			this.fetchData();
		}.bind(this));
	}

	fetchData(p) {
		var params = p || this.state.params;

		params = params ? JSON.parse(JSON.stringify(params)) : {};

		params = Object.assign(params, this.filters);

		if (!this.props.similarDocs) {
			params.sort = this.state.sort;
			params.order = this.state.sortOrder;
		}

		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString) {
			return;
		}

		this.setState({
			paramString: paramString,
			loading: true
		});

		fetch(config.apiUrl+config.endpoints.documents+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.metadata.total,
					data: json.data,
					loading: false
				});
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	render() {
		var documentItems = this.state.data.map(function(item) {
			return <DocumentListItem baseRoute={this.props.baseRoute} hideAttributes={this.props.hideAttributes} key={item._id} data={item} displayScore={this.props.displayScore} />
		}.bind(this));

		return (
			<div className="documents-list-wrapper">
				<div className={'documents-list'+(this.state.loading ? ' loading' : '')+(this.props.disableContainerStyle ? ' container-style-disabled' : '')}>
					{
						!this.props.disableSorting &&
						<div className="list-heading">
							<DropdownMenu label={'Sortering: '+this.state.sort+', '+this.state.sortOrder}>
								<div className="sort-item"><strong>Score</strong>: <a onClick={this.orderLinkClickHandler} data-sort="_score" data-order="asc">asc</a> <a onClick={this.orderLinkClickHandler} data-sort="_score" data-order="desc">desc</a></div>
								<div className="sort-item"><strong>Uppteckningsår</strong>: <a onClick={this.orderLinkClickHandler} data-sort="year" data-order="asc">asc</a>, <a onClick={this.orderLinkClickHandler} data-sort="year" data-order="desc">desc</a></div>
								<div className="sort-item"><strong>Category</strong>: <a onClick={this.orderLinkClickHandler} data-sort="taxonomy.category" data-order="asc">asc</a>, <a onClick={this.orderLinkClickHandler} data-sort="taxonomy.category" data-order="desc">desc</a></div>
							</DropdownMenu>

							{
								paramsHelper.describeParams(this.filters) != '' &&
								<div className="heading-info" dangerouslySetInnerHTML={{__html: 'Filtrering: '+paramsHelper.describeParams(this.filters) }} />
							}
						</div>
					}

					<div className="items">
						{documentItems}
					</div>

					<div className="loading-overlay"></div>

				</div>
			</div>
		);
	}
}