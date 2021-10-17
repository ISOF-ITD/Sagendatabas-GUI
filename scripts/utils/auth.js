export default {
	authHeaders: {
		headers: new Headers({
			'Authorization': 'Token '+(localStorage.authtoken || '')
		})
	},

	checkAuthentication(response) {
		if (response.status == 401) {
			window.eventBus.dispatch('overlay.intro');
		}
	}
}
