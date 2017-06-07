export default {
	buildParamString(p) {
		var params = JSON.parse(JSON.stringify(p));
		var paramStrings = [];

		for (var key in params) {
			if (params[key] != null) {
				paramStrings.push(key+'='+params[key]);
			}
		}

		return paramStrings.join('&');
	}
}