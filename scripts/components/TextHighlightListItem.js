import React from 'react';
import _ from 'underscore';

export default class TextHighlightListItem extends React.Component {
	constructor(props) {
		super(props);

		this.itemClickHandler = this.itemClickHandler.bind(this);

		this.state = {
			open: false,
			data: null
		};
	}

	componentDidMount() {
		this.setState({
			data: this.props.data
		});
	}

	componentWillReceiveProps(props) {
		if (this.state.data._id != props.data._id || this.state.data.highlight != props.data.highlight) {
			this.setState({
				open: false,
				data: props.data
			})
		}
	}

	itemClickHandler() {
		this.props.history.push('/' + (this.props.baseRoute ? this.props.baseRoute : 'search/analyse')+'/document/'+this.state.data._id)

	}

	formatHtml(html) {
		var el = document.createElement('tr');
		el.innerHTML = html;

		var maxFirstLineLength = 80;

		var cells = [];
		var lastCell = '';

		_.each(el.children, function(child, index) {
			if (index < 2) {
				cells.push('<td>'+(index == 0 && child.innerHTML.length > maxFirstLineLength ? '...'+child.innerHTML.substr(0, maxFirstLineLength) : child.innerHTML)+'</td>');
			}
			else {
				lastCell += child.innerHTML;
			}
		});

		cells.push('<td>'+lastCell+'</td>');

		return cells.join('');
	}

	render() {
		if (this.state.data) {
			// Formatera html så att <table> elementet ser bra ut, vi vill att första markerade orden syns i samma kolumn
			var html = this.formatHtml(this.state.data.highlight);
		}

		return this.state.data ? (
			<tr onClick={this.itemClickHandler} dangerouslySetInnerHTML={{__html: html}} />
		) : null;
	}
}