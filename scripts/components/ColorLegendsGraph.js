import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

export default class ColorLegendsGraph extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			colorScale: null
		};
	}

	componentDidMount() {
		if (this.props.colorScale) {
			this.setState({
				colorScale: this.props.colorScale
			});
		}
	}

	componentWillReceiveProps(props) {
		if (props.colorScale && (!this.state.colorScale || (this.state.colorScale.domain()[0] != props.colorScale.domain()[0] || this.state.colorScale.domain()[1] != props.colorScale.domain()[1]))) {
			this.setState({
				colorScale: props.colorScale
			});
		}
	}

	render() {
		if (this.state.colorScale) {
			var increment = (this.state.colorScale.domain()[1] - this.state.colorScale.domain()[0]) / 5;
			
			var colorEls = [];

			if (increment > 0) {
				for (var i = this.state.colorScale.domain()[0]; i<=this.state.colorScale.domain()[1]; i += increment) {
					colorEls.push(
						<div key={i} className="color-item">
							<div className="color" style={{backgroundColor: this.state.colorScale(i).hex()}}></div>
							<span className="label">{this.state.colorScale.domain()[1] <= 1 ? Math.round(i*100)+'%' : Math.ceil(i)}</span>
						</div>
					);
				}
			}
		}

		return (
			<div className="color-legends">
				{
					this.state.colorScale &&
					colorEls
				}
			</div>
		);
	}
}