export default {
	buildParamString(params) {

		var paramStrings = [];
		for (var key in params) {
			paramStrings.push(key+'='+params[key]);
		}

		return paramStrings.join('&');
	}
}