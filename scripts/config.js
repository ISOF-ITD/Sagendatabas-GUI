export default {
	apiUrl: 'http://127.0.0.1:8000/sagenkarta/es/',
//	apiUrl: 'http://130.238.49.182:8000/sagenkarta/es/',

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
		gender: 'gender/'
	},

	minYear: 1750,
	maxYear: 1960
};