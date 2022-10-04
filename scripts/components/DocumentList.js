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

		this.pageSize = 100;

		this.filters = {};

		this.graphFilterHandler = this.graphFilterHandler.bind(this);
		this.searchHandler = this.searchHandler.bind(this);
		this.prevPage = this.prevPage.bind(this);
		this.nextPage = this.nextPage.bind(this);

		this.state = {
			total: null,
			data: [],
			loading: false,
			params: null,
			sort: '_score',
			sortOrder: 'desc',
			currentPage: 1
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
		if (this.props.person) {
			this.fetchData({
				person_id: this.props.person
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
				similar: props.similarDocs,
				min_word_length: props.min_word_length ? props.min_word_length : 5,
				min_term_freq: props.min_term_freq ? props.min_term_freq : 1,
				max_query_terms: props.max_query_terms ? props.max_query_terms : 12,
				minimum_should_match: props.max_query_terms ? props.minimum_should_match : '30%'
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
				sortOrder: sortOrder,
				// start over from page 1
				currentPage: 1,
			}, function() {
				this.fetchData();
			}.bind(this));
		}
	}

	graphFilterHandler(event, data) {
		var currentFilters = JSON.stringify(this.filters);
		this.filters[data.filter] = typeof data.value == 'array' ? data.value.join(',') : data.value;

		for (var key in this.filters) {
			if (this.filters[key] == null) {
				delete this.filters[key];
			}
		}

		if (currentFilters != JSON.stringify(this.filters)) {
			this.fetchData();
		}
	}

	searchHandler(event, data) {
		this.filters = {};

		this.setState({
			params: data.params,
			currentPage: 1
		}, function() {
			this.fetchData();
		}.bind(this));
	}

	nextPage() {
		this.setState({
			currentPage: this.state.currentPage+1
		}, function() {
			this.fetchData();
		}.bind(this));
	}

	prevPage() {
		if (this.state.currentPage == 1) {
			return;
		}
		this.setState({
			currentPage: this.state.currentPage-1
		}, function() {
			this.fetchData();
		}.bind(this));
	}

	fetchData(p) {
		var params = p || this.state.params;

		params = params ? JSON.parse(JSON.stringify(params)) : {};

		params = Object.assign(params, this.filters);
		params = Object.assign({}, config.requiredApiParams, params);

		if (!this.props.similarDocs) {
			params.sort = this.state.sort;
			params.order = this.state.sortOrder;
		}

		params.from = (this.state.currentPage-1)*this.pageSize;
		params.size = this.pageSize;

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
					total: json.metadata.total.value || (json.metadata.total.value === 0 ? 0 : json.metadata.total), // ES7 vs ES5
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
							<DropdownMenu label={'Sortering: '+l(this.state.sort)+', '+l(this.state.sortOrder)}>
								<div className="sort-item"><strong>Score</strong>: <a onClick={this.orderLinkClickHandler} data-sort="_score" data-order="asc">{l('asc')}</a>, <a onClick={this.orderLinkClickHandler} data-sort="_score" data-order="desc">{l('desc')}</a></div>
								<div className="sort-item"><strong>Uppteckningsår</strong>: <a onClick={this.orderLinkClickHandler} data-sort="year" data-order="asc">{l('asc')}</a>, <a onClick={this.orderLinkClickHandler} data-sort="year" data-order="desc">{l('desc')}</a></div>
								<div className="sort-item"><strong>Category</strong>: <a onClick={this.orderLinkClickHandler} data-sort="taxonomy.category" data-order="asc">{l('asc')}</a>, <a onClick={this.orderLinkClickHandler} data-sort="taxonomy.category" data-order="desc">{l('desc')}</a></div>
							</DropdownMenu>

							{
								paramsHelper.describeParams(this.filters, null, window.allCategories) != '' &&
								<div className="heading-info" dangerouslySetInnerHTML={{__html: 'Filtrering: '+paramsHelper.describeParams(this.filters, null, window.allCategories) }} />
							}
						</div>
					}

					<div className="items">
						{documentItems}
					</div>

					{
						this.state.total && this.state.total > 0 &&
						<div className="list-footer">
							<div className="page-info u-pull-right">{'Visar '+((this.state.currentPage*this.pageSize)-(this.pageSize-1))+'-'+(this.state.currentPage*this.pageSize > this.state.total ? this.state.total : this.state.currentPage*this.pageSize)+' av '+this.state.total}</div>
							<button className="button prev-button" disabled={this.state.currentPage == 1} onClick={this.prevPage}>Föregående</button>
							<span> </span>
							<button className="button next-button" disabled={this.state.total <= this.state.currentPage*50} onClick={this.nextPage}>Nästa</button>
						</div>
					}

					<div className="loading-overlay"></div>

				</div>
			</div>
		);
	}
}
