import sagenkartaCategories from './../../ISOF-React-modules/utils/sagenkartaCategories';

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
	},

	describeParams(params) {
		var params = JSON.parse(JSON.stringify(params));

		if (params) {
			var searchTerms = [];

			if (params.search && params.search != '') {
				searchTerms.push('Söksträng: <strong>'+params.search+'</strong>');
			}

			if (params.type && params.type != '') {
				searchTerms.push('Typ: <strong>'+params.type.split(',').join(', ')+'</strong>');
			}

			if (params.category && params.category != '') {
				var categories = params.category.split(',');

				searchTerms.push(categories.length == 0 ? 'Kategori: ' : 'Kategorier: <strong>'+(
					categories.map(function(category) {
						return sagenkartaCategories.getCategoryName(category);
					}).join(', ')
				)+'</strong>');
			}

			if (params.topics && params.topics != '') {
				searchTerms.push('Topics: <strong>'+params.topics.split(',').join(', ')+'</strong>');
			}

			if (params.title_topics && params.title_topics != '') {
				searchTerms.push('Titel topics: <strong>'+params.title_topics.split(',').join(', ')+'</strong>');
			}

			if (params.collection_years && (params.collection_years != '' || typeof params.collection_years.join)) {
				if (params.collection_years.join) {
					searchTerms.push('Uppteckningsår: <strong>'+params.collection_years.join('-')+'</strong>');
				}
				else {
					searchTerms.push('Uppteckningsår: <strong>'+params.collection_years.split(',').join('-')+'</strong>');
				}
			}

			if (params.birth_years && (params.birth_years != '' || typeof params.birth_years.join)) {
				if (params.birth_years.join) {
					searchTerms.push('Födelseår: <strong>'+params.birth_years.join('-')+'</strong>');
				}
				else {
					searchTerms.push('Födelseår: <strong>'+params.birth_years.split(',').join('-')+'</strong>');
				}
			}

			if (params.informants_birth_years && (params.informants_birth_years != '' || typeof params.informants_birth_years.join)) {
				if (params.informants_birth_years.join) {
					searchTerms.push('Födelseår, informant: <strong>'+params.informants_birth_years.join('-')+'</strong>');
				}
				else {
					searchTerms.push('Födelseår, informant: <strong>'+params.informants_birth_years.split(',').join('-')+'</strong>');
				}
			}

			if (params.collectors_birth_years && (params.collectors_birth_years != '' || typeof params.collectors_birth_years.join)) {
				if (params.collectors_birth_years.join) {
					searchTerms.push('Födelseår, upptecknare: <strong>'+params.collectors_birth_years.join('-')+'</strong>');
				}
				else {
					searchTerms.push('Födelseår, upptecknare: <strong>'+params.collectors_birth_years.split(',').join('-')+'</strong>');
				}
			}

			if (params.collector && params.collector != '') {
				searchTerms.push('Upptecknare: <strong>'+params.collector+'</strong>');
			}

			if (params.informant && params.informant != '') {
				searchTerms.push('Informant: <strong>'+params.informant+'</strong>');
			}
			
			if (params.informants_gender && params.informants_gender != '') {
				searchTerms.push('Informants kön: <strong>'+(params.informants_gender == 'female' ? 'kvinnor' : params.informants_gender == 'male' ? 'män' : params.informants_gender == 'unknown' ? 'okänt' : '')+'</strong>');
			}

			if (params.collectors_gender && params.collectors_gender != '') {
				searchTerms.push('Upptecknare kön: <strong>'+(params.collectors_gender == 'female' ? 'kvinnor' : params.collectors_gender == 'male' ? 'män' : params.collectors_gender == 'unknown' ? 'okänt' : '')+'</strong>');
			}

			if (params.geo_box) {
				var latLngs = params.geo_box.split ? params.geo_box.split(',') : params.geo_box;
				latLngs = latLngs.map(function(n) {
					return Math.round(n*100)/100;
				});
				searchTerms.push('Geografiskt område: <strong title="'+latLngs[0]+','+latLngs[1]+';'+latLngs[2]+','+latLngs[3]+'">[...]</strong>')
			}

			return params ? searchTerms.join(', ') : '';
		}
		else {
			return '';
		}
	}
}