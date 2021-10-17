import React from 'react';
import OverlayWindow from './../../ISOF-React-modules/components/controls/OverlayWindow';

import config from './../config';
import auth from './../utils/auth';

// Main CSS: ui-components/overlay.less

export default class LoginWindow extends React.Component {
	constructor(props) {
		//console.log('OverlayWindow constructor');
		super(props);

		this.state = {
			authenticated: false,
			usernameInput: '',
			passwordInput: ''
		}

		this.inputChangeHandler = this.inputChangeHandler.bind(this);
	}

	componentDidMount() {
		fetch(config.apiUrl+config.endpoints.check_authentication, auth.authHeaders)
			.then(function(response) {
				return response.json()
			}).then(function(json) {
				if (!json.authenticated) {
					window.eventBus.dispatch('overlay.intro');
				}
				else {
					window.eventBus.dispatch('overlay.hide');

					this.setState({
						authenticated: true,
						authenticatedUser: json.user
					});
				}
			}.bind(this));
	}

	login() {
		fetch(config.apiUrl+config.endpoints.authenticate, {
				body: 'username='+this.state.usernameInput+'&password='+this.state.passwordInput,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				method: 'post'
			})
			.then((res) => res.json())
			.then((json) => {
				console.log(json)
				if (json.non_field_errors) {
					this.setState({
						error: 'Fel användarnamn eller lösenord'
					});
				}
				if (json.token) {
					this.setState({
						error: null
					});

					localStorage.authtoken = json.token;

					window.location.reload();
				}
			})
			.catch((error) => {
				this.setState({
					error: 'Fel användarnamn eller lösenord'
				});
			})
	}

	inputChangeHandler(event) {
		var value = event.target.type && event.target.type == 'checkbox' ? event.target.checked : event.target.value;

		this.setState({
			[event.target.name]: value
		});
	}

	render() {
		return <div>
			<OverlayWindow title="Välkommen till digitalt kulturarv" showClose={false}>
				<div>
					<hr className="margin-bottom-35"/>
					<div className="user-box">
						<input name="usernameInput" onChange={this.inputChangeHandler} onKeyDown={(event) => {
							if (event.keyCode == 13) {
								this.login();
							}
						}} placeholder="Användare" type="text" />
						<br/>
						<input name="passwordInput" onChange={this.inputChangeHandler} onKeyDown={(event) => {
							if (event.keyCode == 13) {
								this.login();
							}
						}} placeholder="Lösen" type="password" />
					</div>
					{
						this.state.error &&
						<p><strong>{this.state.error}</strong></p>
					}
					<button disabled={this.state.usernameInput == '' || this.state.passwordInput == ''} className="button-primary margin-bottom-0" onClick={() => {
						this.login();
					}}>{'Logga in'}</button>
				</div>
			</OverlayWindow>
			{
				this.state.authenticated && this.state.authenticatedUser &&
				<div className="login-info">Inloggad: {this.state.authenticatedUser}</div>
			}
		</div>;
	}
}
