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
		document: 'document/',
		persons: 'persons/',
		informants: 'informants/',
		collectors: 'collectors/',
		county: 'county/',
		topics_autocomplete: 'topics_autocomplete/',
		title_topics_autocomplete: 'title_topics_autocomplete/',
		gender: 'gender/',
		persons_autocomplete: 'persons_autocomplete/',
		types: 'types/',
		topics_graph: 'graph/'
	},

	minYear: 1750,
	maxYear: 1960
};