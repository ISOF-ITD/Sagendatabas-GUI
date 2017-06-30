export default {
//	apiUrl: 'http://uuc-isof003-t.its.uu.se/sagenkarta/es/',
	apiUrl: 'http://127.0.0.1:8000/sagenkarta/es/',

	appUrl: 'http://www4.sprakochfolkminnen.se/sagner/avancerad/',

	geoserverUrl: 'https://oden-test.sprakochfolkminnen.se/geoserver',

	imageUrl: 'http://www4.sprakochfolkminnen.se/Folkminnen/Svenska_sagor_filer/',

	endpoints: {
		topics: 'topics/',
		title_topics: 'title_topics/',
		categories: 'categories/',
		collection_years: 'collection_years/',
		birth_years: 'birth_years/',
		documents: 'documents/',
		persons: 'persons/',
		informants: 'informants/',
		collectors: 'collectors/',
		gender: 'gender/',
		types: 'types/',

		document: 'document/',

		topics_graph: 'graph/',

		county: 'county/',
		landskap: 'landskap/',
		socken: 'socken/',


		topics_autocomplete: 'autocomplete/topics/',
		title_topics_autocomplete: 'autocomplete/title_topics/',
		persons_autocomplete: 'autocomplete/persons/',
		socken_autocomplete: 'autocomplete/socken/'
	},

	minYear: 1750,
	maxYear: 1960
};