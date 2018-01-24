import sagenkartaCategories from './../../ISOF-React-modules/utils/sagenkartaCategories';
import _ from 'underscore';

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

	describeParams(params, disableHtml, allCategories) {
		var params = JSON.parse(JSON.stringify(params));

		var formatParam = function(s) {
			return (disableHtml ? '' : '<strong>')+s+(disableHtml ? '' : '</strong>');
		}

		var getCategoryName = function(category) {
			return category+': '+_.findWhere(allCategories, {category: category}).name;
		}

		if (params) {
			var searchTerms = [];

			if (params.search && params.search != '') {
				searchTerms.push('Söksträng: '+formatParam(params.search));
			}

			if (params.category && params.category != '') {
				var categories = params.category.split(',');

				searchTerms.push(categories.length == 0 ? 'Kategori: ' : 'Kategorier: '+formatParam(
					categories.map(function(category) {
						return getCategoryName(category);
					}).join(', ')
				));
			}

			if (params.terms && params.terms != '') {
				searchTerms.push('Terms: '+formatParam(params.terms.split(',').join(', ')));
			}

			if (params.title_terms && params.title_terms != '') {
				searchTerms.push('Titel terms: '+formatParam(params.title_terms.split(',').join(', ')));
			}

			if (params.collection_years && (params.collection_years != '' || typeof params.collection_years.join)) {
				if (params.collection_years.join) {
					searchTerms.push('Uppteckningsår: '+formatParam(params.collection_years.join('-')));
				}
				else {
					searchTerms.push('Uppteckningsår: '+formatParam(params.collection_years.split(',').join('-')));
				}
			}

			if (params.birth_years && (params.birth_years != '' || typeof params.birth_years.join)) {
				if (params.birth_years.join) {
					searchTerms.push('Födelseår: '+formatParam(params.birth_years.join('-')));
				}
				else {
					searchTerms.push('Födelseår: '+formatParam(params.birth_years.split(',').join('-')));
				}
			}

			if (params.informants_birth_years && (params.informants_birth_years != '' || typeof params.informants_birth_years.join)) {
				if (params.informants_birth_years.join) {
					searchTerms.push('Födelseår, informant: '+formatParam(params.informants_birth_years.join('-')));
				}
				else {
					searchTerms.push('Födelseår, informant: '+formatParam(params.informants_birth_years.split(',').join('-')));
				}
			}

			if (params.collectors_birth_years && (params.collectors_birth_years != '' || typeof params.collectors_birth_years.join)) {
				if (params.collectors_birth_years.join) {
					searchTerms.push('Födelseår, upptecknare: '+formatParam(params.collectors_birth_years.join('-')));
				}
				else {
					searchTerms.push('Födelseår, upptecknare: '+formatParam(params.collectors_birth_years.split(',').join('-')));
				}
			}

			if (params.collector && params.collector != '') {
				searchTerms.push('Upptecknare: '+formatParam(params.collector));
			}

			if (params.informant && params.informant != '') {
				searchTerms.push('Informant: '+formatParam(params.informant));
			}
			
			if (params.gender && params.gender != '') {
				searchTerms.push('Kön: '+formatParam((params.gender == 'female' ? 'kvinnor' : params.gender == 'male' ? 'män' : params.gender == 'unknown' ? 'okänt' : '')));
			}

			if (params.informants_gender && params.informants_gender != '') {
				searchTerms.push('Informants kön: '+formatParam((params.informants_gender == 'female' ? 'kvinnor' : params.informants_gender == 'male' ? 'män' : params.informants_gender == 'unknown' ? 'okänt' : '')));
			}

			if (params.collectors_gender && params.collectors_gender != '') {
				searchTerms.push('Upptecknare kön: '+formatParam((params.collectors_gender == 'female' ? 'kvinnor' : params.collectors_gender == 'male' ? 'män' : params.collectors_gender == 'unknown' ? 'okänt' : '')));
			}

			if (params.socken && params.socken != '') {
				searchTerms.push('Socken: '+formatParam(params.socken));
			}

			if (params.landskap && params.landskap != '') {
				searchTerms.push('Landskap: '+formatParam(params.landskap));
			}

			if (params.geo_box) {
				var latLngs = params.geo_box.split ? params.geo_box.split(',') : params.geo_box;
				latLngs = latLngs.map(function(n) {
					return Math.round(n*100)/100;
				});
				searchTerms.push('Geografiskt område: '+formatParam('title="'+latLngs[0]+','+latLngs[1]+';'+latLngs[2]+','+latLngs[3]+'">[...]'))
			}

			if (params.type && params.type != '') {
				searchTerms.push('Typ: '+formatParam(params.type.split(',').join(', ')));
			}

			return params ? searchTerms.join(', ') : '';
		}
		else {
			return '';
		}
	}
}