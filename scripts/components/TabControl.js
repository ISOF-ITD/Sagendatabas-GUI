import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

export class TabsContainer extends React.Component {
	constructor(props) {
		super(props);

		this.tabClickHandler = this.tabClickHandler.bind(this);

		this.state = {
			tabIndex: 0
		};
	}

	tabClickHandler(event) {
		this.setState({
			tabIndex: event.target.dataset.tabindex
		});
	}

	render() {
		var tabs = this.props.children.map(function(children, index) {
			return <a key={index} className={'tab tab-'+index+(index == this.state.tabIndex ? ' selected' : '')} data-tabindex={index} onClick={this.tabClickHandler}>{children.props.tabName}</a>
		}.bind(this));

		var tabPanels = this.props.children.map(function(children, index) {
			return <div key={index} className={'tab-container tab-'+index+(index == this.state.tabIndex ? ' open' : ' hidden')}>{children}</div>
		}.bind(this));

		return (
			<div className="tabs-control" ref="container">
				<div className="tabs">
					{tabs}
				</div>
				
				{tabPanels}

			</div>
		);
	}
}

export class Tab extends React.Component {
	render() {
		return (
			<div className={this.props.className}>

				{
					this.props.children
				}

			</div>
		);
	}
}