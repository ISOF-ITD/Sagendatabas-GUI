import React from 'react';
import CheckBoxList from '../../ISOF-React-modules/components/controls/CheckBoxList';
import _ from 'underscore';
import config from '../config';

// Main CSS: ui-components/checkbox-list.less

export default class PopulatedCheckBoxList extends React.Component {
	constructor(props) {
		super(props);

		this.checkBoxListChangeHandler = this.checkBoxListChangeHandler.bind(this);
		this.bulkClickHandler = this.bulkClickHandler.bind(this)

		this.state = {
			selectedItems: this.props.selectedItems || [],
			values: []
		};
	}

	static getDerivedStateFromProps(props, state) {
		if (props.selectedItems) {
			return{
				selectedItems: props.selectedItems
			}
		} else {
			// trad16 måste väljas för one_accession_row
			let selectedItems = props.selectedRecordTypes.includes('one_accession_row') ? state.selectedItems.filter(x => x !== 'trad16').concat('trad16') : state.selectedItems.filter(x => x !== 'trad16');
			// trad11 måste väljas för tryckt
			selectedItems = props.selectedTypes.includes('tryckt') ? selectedItems.filter(x => x !== 'trad11').concat('trad11') : selectedItems;
			return {
				selectedItems: selectedItems
			}
		}
	}

	getValues() {
		let values = []
		if (this.props.filteredBy ==='type' && config.predefinedCategoryType) {
			values =  _.filter(this.state.data, function(item) {
				return(
					item[this.props.filteredBy] == config.predefinedCategoryType
					// quick fix: Filtrera bort "Ej kategoriserat"
					&& item['key'] !== 'trad16'
				);
			}.bind(this));
			values = _.sortBy(values, 'name');

			// values = this.getValues();
		} else if (this.props.filteredBy && this.state.filterOptions) {
			values = _.filter(this.state.data, function(item) {
				return item[this.props.filteredBy] == this.state.currentFilter;
			}.bind(this));

		}
		return values
	}

	componentDidMount() {
		this.fetchData();
	}

	fetchData() {
		fetch(this.props.dataUrl)
			.then(function(response) {
				return response.json()
			})
			.then(function(json) {
				var state = {
					data: json.data || json.results
				};

				if (this.props.filteredBy) {
					state.filterOptions = _.uniq(_.pluck(json.data || json.results, this.props.filteredBy));
					state.currentFilter = state.filterOptions[0];
				}

				if (this.props.onFetch) {
					this.props.onFetch(state.data);
				}

				this.setState(state);
				this.setState({
					values: this.getValues()
				})
			}.bind(this))
			.catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	checkBoxListChangeHandler(event) {
		this.setState({
			selectedItems: event
		}, function() {
			if (this.props.onSelectionChange) {
				this.props.onSelectionChange(this.state.selectedItems);
			}
		}.bind(this));
	}

	bulkClickHandler(event) {
		event.preventDefault();
		let selection = event.target.dataset.selection;
		let selectedItems = [];
		switch (selection) {
			case "none":
				// this.setState({
				selectedItems = []
				// });
				break;
			case "all":
				selectedItems = _.map(this.getValues(), function(v, i) {
					return v['key']
				})
				break;
			default:
				break;
		}
		this.checkBoxListChangeHandler(selectedItems);
	}

	render() {
		if (this.props.filteredBy ==='type' && config.predefinedCategoryType) {

			return <div>
				<small><a href="" onClick={this.bulkClickHandler} data-selection="all">Alla</a> | <a href="" onClick={this.bulkClickHandler} data-selection="none">Inga</a></small>
				<div className="checkbox-list">
				<CheckBoxList values={this.state.values}
					valueField={this.props.valueField}
					labelField={this.props.labelField}
					labelFunction={this.props.labelFunction}
					selectedItems={this.state.selectedItems}
					onSelectionChange={this.checkBoxListChangeHandler}
					/>
				</div>
			</div>;

		}
		else if (this.props.filteredBy && this.state.filterOptions) {

			var selectElementStyle = {
				float: 'right',
				marginTop: '-40px',
				marginBottom: 0
			};

			return <div>
				<select style={selectElementStyle} onChange={function(event) {this.setState({currentFilter: event.target.value})}.bind(this)} value={this.state.currentFilter}>
					{
						_.map(this.state.filterOptions, function(item, index) {
							return <option key={index}>{item}</option>
						})
					}
				</select>
				<CheckBoxList values={this.state.values}
					valueField={this.props.valueField}
					labelField={this.props.labelField}
					labelFunction={this.props.labelFunction}
					selectedItems={this.state.selectedItems}
					onSelectionChange={this.checkBoxListChangeHandler} />
			</div>;
		}
		else {
			return <CheckBoxList values={this.state.values}
				valueField={this.props.valueField}
				labelField={this.props.labelField}
				labelFunction={this.props.labelFunction}
				selectedItems={this.state.selectedItems}
				onSelectionChange={this.checkBoxListChangeHandler} />
		}
	}
}
