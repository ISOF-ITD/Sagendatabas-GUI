import React from 'react';

export default class CheckBoxList extends React.Component {
	constructor(props) {
		super(props);

		this.checkBoxChangeHandler = this.checkBoxChangeHandler.bind(this);

		this.state = {
			selectedItems: this.props.selectedItems || []
		};
	}

	componentWillReceiveProps(props) {
		console.log('componentWillReceiveProps');
		console.log(props);

		if (props.selectedItems) {
			this.setState({
				selectedItems: props.selectedItems
			});
		}
	}

	checkBoxChangeHandler(event) {
		var value = event.target.value;
		var selectedItems = this.state.selectedItems;

		if (this.state.selectedItems.indexOf(value) == -1) {
			selectedItems.push(value);
		}
		else {
			selectedItems.splice(this.state.selectedItems.indexOf(value), 1);
		}

		this.setState({
			selectedItems: selectedItems
		}, function() {
			console.log('CheckBoxList: selectedItems');
			console.log(this.state.selectedItems);
			if (this.props.onChange) {
				this.props.onChange(this.state.selectedItems);
			}
		}.bind(this));
	}

	render() {
		var items = this.props.values ? this.props.values.map(function(value, index) {
			return <label key={index} className="item"><input type="checkbox" value={value} checked={this.state.selectedItems.indexOf(value) > -1} onChange={this.checkBoxChangeHandler} /> {value}</label>
		}.bind(this)) : [];
		return (
			<div className="checkbox-list">
				{items}
			</div>
		);
	}
}