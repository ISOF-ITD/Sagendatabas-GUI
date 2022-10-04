import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

import paramsHelper from './../utils/paramsHelper';

import DropdownMenu from './../../ISOF-React-modules/components/controls/DropdownMenu';

import TextHighlightListItem from './TextHighlightListItem';

import config from './../config';

export default class TextHighlightList extends React.Component {
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
			sortOrder: 'asc',
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
	}

	componentWillUnmount() {
		if (window.eventBus) {
			window.eventBus.removeEventListener('searchForm.search', this.searchHandler);
			window.eventBus.removeEventListener('graph.filter', this.graphFilterHandler);
		}
	}

	componentWillReceiveProps(props) {
		if (props.similarDocs) {
			this.fetchData();
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

		if (!params || !params.search) {
			this.setState({
				total: 0,
				data: [],
				loading: false
			});

			return;
		}

		params = params ? JSON.parse(JSON.stringify(params)) : {};

		params.search_exclude_title = true;

		params = Object.assign(params, this.filters);
		params = Object.assign({}, config.requiredApiParams, params);

		params.from = (this.state.currentPage-1)*this.pageSize;
		params.size = this.pageSize;

		params.sort = this.state.sort;
		params.order = this.state.sortOrder;

		if (params['recordtype'].includes('one_record')){
			params['recordtype'] = 'one_record'
		} else {
			// abort if one_record is not in params.
			return;
		}
		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString) {
			return;
		}

		this.setState({
			paramString: paramString,
			loading: true
		});

		fetch(config.apiUrl+config.endpoints.texts+'?'+paramString)
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
		var documentItems = this.state.data.map(function(item, index) {
			return <TextHighlightListItem baseRoute={this.props.baseRoute} hideAttributes={this.props.hideAttributes} key={item._id+'-'+index} data={item} displayScore={this.props.displayScore} history={this.props.history} />
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

					<div style={{overflowX: 'scroll'}}>
						<table className="highlight-table">
							<tbody>
								{documentItems}
							</tbody>
						</table>
					</div>

					{
						this.state.total && this.state.total > 0 &&
						<div className="list-footer">
							<p className="page-info u-pull-right">{'Visar '+((this.state.currentPage*this.pageSize)-(this.pageSize-1))+'-'+(this.state.currentPage*this.pageSize > this.state.total ? this.state.total : this.state.currentPage*this.pageSize)+' av '+this.state.total}</p>
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
