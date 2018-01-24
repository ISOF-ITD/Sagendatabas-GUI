export default {
//	apiUrl: 'http://frigg-test.sprakochfolkminnen.se/sagendatabas/api/es/',
	apiUrl: 'http://127.0.0.1:8000/sagenkarta/es/',

	restApiUrl: 'http://frigg.sprakochfolkminnen.se/sagendatabas/api/',

	appUrl: 'http://www4.sprakochfolkminnen.se/sagner/avancerad/',

	geoserverUrl: 'https://oden-test.sprakochfolkminnen.se/geoserver',

	imageUrl: 'http://www4.sprakochfolkminnen.se/Folkminnen/Svenska_sagor_filer/',

	endpoints: {
		terms: 'terms/',
		title_terms: 'title_terms/',
		categories: 'categories/',
		collection_years: 'collection_years/',
		birth_years: 'birth_years/',
		documents: 'documents/',
		persons: 'persons/',
		informants: 'informants/',
		collectors: 'collectors/',
		gender: 'gender/',
		types: 'types/',
		texts: 'texts/',
		letters: 'letters/',

		document: 'document/',

		terms_graph: 'terms_graph/',
		persons_graph: 'persons_graph/',

		county: 'county/',
		landskap: 'landskap/',
		socken: 'socken/',


		terms_autocomplete: 'autocomplete/terms/',
		title_terms_autocomplete: 'autocomplete/title_terms/',
		persons_autocomplete: 'autocomplete/persons/',
		socken_autocomplete: 'autocomplete/socken/'
	},

	requiredApiParams: {
		country: 'sweden'
	},

	minYear: 1750,
	maxYear: 2017
};