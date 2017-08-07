import React from 'react';
import EventBus from 'eventbusjs';
import _ from 'underscore';

var d3 = require('d3');

import paramsHelper from './../utils/paramsHelper';

import config from './../config';

export default class TermsNetworkGraph extends React.Component {
	constructor(props) {
		super(props);

		this.windowResizeHandler = this.windowResizeHandler.bind(this);
		this.getStrokeWidth = this.getStrokeWidth.bind(this);

		this.graphNodeDragStartedHandler = this.graphNodeDragStartedHandler.bind(this);
		this.graphNodeDraggedHandler = this.graphNodeDraggedHandler.bind(this);
		this.graphNodeDragEndedHandler = this.graphNodeDragEndedHandler.bind(this);
		this.graphNodeClickHandler = this.graphNodeClickHandler.bind(this);

		this.zoom = 1;

		this.graphMargins = {
			left: 0,
			right: 0,
			top: 0,
			bottom: 0
		};

		this.state = {
			paramString: null,
			data: null,
			total: null,
			selectedNodes: [],

			loading: false,

			viewMode: 'absolute',

			graphContainerWidth: 800,
			graphContainerHeight: this.props.graphHeight || 400,

			graphId: 'Graph'+Math.round((new Date()).valueOf()*Math.random())
		};
	}

	componentDidMount() {
		this.setState({
			graphContainerWidth: this.refs.container.clientWidth
		}, function() {
			this.renderGraphBase();
		}.bind(this));

		if (window.eventBus) {
			window.eventBus.addEventListener('searchForm.search', this.searchHandler.bind(this));
		}

		window.addEventListener('resize', this.windowResizeHandler);
	}

	windowResizeHandler() {
		this.setState({
			graphContainerWidth: this.refs.container.clientWidth
		}, function() {
			this.renderGraph(true);
		}.bind(this));
	}

	searchHandler(event, data) {
		this.fetchData(data.params);
	}

	fetchData(params) {
		var paramString = paramsHelper.buildParamString(params);

		if (paramString == this.state.paramString) {
			return;
		}

		this.setState({
			paramString: paramString,
			loading: true,
			total: null,
			selectedNodes: []
		});

		fetch(config.apiUrl+config.endpoints.terms_graph+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					data: json.data,
					loading: false
				}, function() {
					this.renderGraph();
				}.bind(this));
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;

		fetch(config.apiUrl+config.endpoints.types+'?'+paramString)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				this.setState({
					total: json.metadata.total
				});
			}.bind(this)).catch(function(ex) {
				console.log('parsing failed', ex)
			})
		;
	}

	renderGraphBase() {
		this.svg = d3.select('#'+this.state.graphId);

		this.tooltip = d3.select('body').append('div').attr('class', 'graph-tooltip');
	}

	updateGraph() {
	}

	graphNodeDragStartedHandler(d) {
		if (!d3.event.active) {
			this.simulation.alphaTarget(0.3).restart();
		}
		d.fx = d.x;
		d.fy = d.y;
	}

	graphNodeDraggedHandler(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	graphNodeDragEndedHandler(d) {
		if (!d3.event.active) {
			this.simulation.alphaTarget(0);
		}
		d.fx = null;
		d.fy = null;
	}

	graphNodeClickHandler(event) {
		var selectedNodes = this.state.selectedNodes;

		if (selectedNodes.indexOf(event.term) == -1) {
			selectedNodes.push(event.term);
		}
		else {
			selectedNodes.splice(selectedNodes.indexOf(event.term), 1);
		}

		this.setState({
			selectedNodes: selectedNodes
		}, function() {
			if (window.eventBus) {
				window.eventBus.dispatch('graph.filter', this, {
					filter: 'terms',
					value: this.state.selectedNodes.length == 0 ? null : this.state.selectedNodes.join(',')
				});
			}
		}.bind(this));
	}

	getStrokeWidth(d, modifier, add) {
		var strokeWidth = ((d/this.maxDocCount)*2)+0.2;

		if (modifier) {
			strokeWidth = strokeWidth*modifier;
		}

		if (add) {
			strokeWidth = strokeWidth+add;
		}

		return strokeWidth/this.zoom;
	}

	renderGraph() {
		d3.selectAll('svg#'+this.state.graphId+' > *').remove();

		if (!this.state.data || this.state.data.length == 0) {
			return;
		}

		this.graphWidth = this.state.graphContainerWidth-this.graphMargins.left-this.graphMargins.right;
		this.graphHeight = this.state.graphContainerHeight-this.graphMargins.top-this.graphMargins.bottom;

		this.zoom = 1;

		this.simulation = d3.forceSimulation()
			.force('link', d3.forceLink().id(function(d) {
				return d.index;
			}))
			.force('charge', d3.forceManyBody().strength(-100))
			.force('center', d3.forceCenter(this.graphWidth / 2, this.graphHeight / 2));

		var graph = this.svg.append("g");

		this.maxDocCount = d3.max(this.state.data.connections, function(d) {
			return d.doc_count;
		});

		var linkedByIndex = {};
		this.state.data.connections.forEach(function(d) {
			linkedByIndex[d.source + ',' + d.target] = true;
		});

		function isConnected(a, b) {
			return linkedByIndex[a.index + ',' + b.index] || linkedByIndex[b.index + ',' + a.index] || a.index == b.index;
		}

		function hasConnections(a) {
			for (var property in linkedByIndex) {
				s = property.split(',');

				if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) {
					return true;
				}
			}
			return false;
		}

		var link = graph.append('g')
			.attr('class', 'links')
			.selectAll('line')
			.data(this.state.data.connections)
			.enter().append('line')
			.style('stroke-width', function(d) {
				return this.getStrokeWidth(d.doc_count);
			}.bind(this));

		var node = graph.append('g')
			.attr('class', 'nodes')
			.selectAll('circle')
			.data(this.state.data.vertices)
			.enter().append('circle')
			.attr('r', function() {
				return 3/this.zoom;
			}.bind(this))
			.style('stroke-width', function() {
				return 20/this.zoom;
			}.bind(this))
			.call(d3.drag()
				.on('start', this.graphNodeDragStartedHandler.bind(this))
				.on('drag', this.graphNodeDraggedHandler.bind(this))
				.on('end', this.graphNodeDragEndedHandler.bind(this)));

		var label = graph.append('g')
			.attr('class', 'labels')
			.selectAll('text')
			.data(this.state.data.vertices)
			.enter().append('text')
			.attr('class', 'label')
			.text(function(d) {
				return d.term;
			});

		node.on('mouseover', function(d) {
			link
				.style('stroke-width', function(l) {
					var ret;
					if (d === l.source || d === l.target) {
						return this.getStrokeWidth(l.doc_count, 2, 0.5);
					}
					else {
						return this.getStrokeWidth(l.doc_count);
					}

					return ret;
				}.bind(this))
				.style('stroke-opacity', function(l) {
					if (d === l.source || d === l.target)
						return 1;
					else
						return 0.3;
				}.bind(this))
				.style('stroke', function(l) {
					if (d === l.source || d === l.target) {
						return '#FF3D00';
					}
					else {
						return '#666';
					}
				});

			node.attr('r', function(n) {
				if (isConnected(d, n)) {
					return 3.5/this.zoom;
				}
				else {
					return 0.5/this.zoom;
				}
			}.bind(this));

			label.style('visibility', function(n) {
				if (isConnected(d, n)) {
					return 'visble';
				}
				else {
					return 'hidden';
				}
			});

		}.bind(this));

		node.on('mouseout', function() {
			link.style('stroke-width', function(d) {
					return this.getStrokeWidth(d.doc_count);
				}.bind(this))
				.style('stroke-opacity', 1)
				.style('stroke', '#333');

			node.attr('r', function() {
				return 3/this.zoom;
			}.bind(this));

			label.style('visibility', 'visible');
		}.bind(this));

		node.on('click', this.graphNodeClickHandler);
		
		this.simulation
			.nodes(this.state.data.vertices)
			.on('tick', ticked.bind(this));

		this.simulation.force('link')
			.links(this.state.data.connections);

		function ticked() {
			link
				.attr('x1', function(d) {
					return d.source.x;
				})
				.attr('y1', function(d) {
					return d.source.y;
				})
				.attr('x2', function(d) {
					return d.target.x;
				})
				.attr('y2', function(d) {
					return d.target.y;
				});

			node
				.attr('cx', function(d) {
					return d.x;
				}.bind(this))
				.attr('cy', function(d) {
					return d.y;
				}.bind(this));

			label
				.attr('x', function(d) {
					return d.x + (8/this.zoom);
				}.bind(this))
				.attr('y', function(d) {
					return d.y + (3/this.zoom);
				}.bind(this));
		}

		var initZoom = d3.zoom()
			.on("zoom", graphZoomHandler.bind(this));

		initZoom(this.svg);

		function graphZoomHandler() {
			this.zoom = d3.event.transform.k;
			graph.attr("transform", d3.event.transform);

			label.style('font-size', function() {
					return 14/d3.event.transform.k
				})
				.attr('x', function(d) {
					return d.x + (8/this.zoom);
				}.bind(this))
				.attr('y', function(d) {
					return d.y + (3/this.zoom);
				}.bind(this));

			link.style('stroke-width', function(l) {
				return this.getStrokeWidth(l.doc_count);
			}.bind(this));

			node.attr('r', function() {
				return 3/d3.event.transform.k
			})
			.style('stroke-width', function() {
				return 20/this.zoom;
			}.bind(this));
		}

	}

	render() {
		return (
			<div className={'network-graph-wrapper '+(this.state.loading ? ' loading' : '')+(!this.state.data ? ' empty' : '')} ref="container">

				<div className="graph-container">
					<svg id={this.state.graphId} ref='graphContainer'/>
				</div>

				{
					this.state.total &&
					<div className="graph-heading">
						Total: {this.state.total}
					</div>
				}

				<div className="loading-overlay"></div>

			</div>
		);
	}
}