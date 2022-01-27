export default {
	// Configuration for environment
	///////////////////////////////////////
	// Namn på localStorage som lagrar sparade sägner
	localLibraryName: 'digitalt_kulturarv',

	// For public application:
	// apiUrl: 'https://frigg-test.isof.se/sagendatabas/api/es/',
	apiUrl: 'https://frigg-test.isof.se/sagendatabas/api/es-dk/',
	// For authorized users application:
	// apiUrl: 'https://frigg-test.isof.se/sagendatabas/api/es-advanced/',
	// apiUrl: 'https://127.0.0.1:8000/sagenkarta/es/',

//TODO: varför görs anrop till oden.test

	restApiUrl: 'https://frigg-test.isof.se/sagendatabas/api/',

	// For resources as /img:
	appUrl: 'https://frigg-test.isof.se/static/js-apps/digitalt_kulturarv-publik/',


	// Base configuration for functionality
	///////////////////////////////////////
	geoserverUrl: 'https://oden-test.isof.se/geoserver',

	imageUrl: 'https://www4.isof.se/Folkminnen/Svenska_sagor_filer/',

	endpoints: {
		terms: 'terms/',
		title_terms: 'title_terms/',
		categories: 'categories/',
		category_types: 'category_types/',
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
	maxYear: 2017,

	// Needed for ISOF-React-modules/components:
	siteOptions: {
		recordList: {
			// Döljd materialtyp i RecordList, används för matkartan
			//hideMaterialType: true,

			/*
			// Dölj kategorier kolumn i RecordList, används för folkmusiken
			hideCategories: true

			// Dölj TranscriptionStatus kolumn i RecordList, används bara för crowdsource?
			hideTranscriptionStatus: true
			*/

			// Vilka kategorier vi vill visa i listan, här vill vi bara visa matkarta kategorier men dölja frågolista-kategorier
			//visibleCategories: ['tradark']
		},

		// Inaktivera länker till personer, visa bara namnet
		//disablePersonLinks: true
	},

};