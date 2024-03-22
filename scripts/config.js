const hostname = window.location.hostname
const is_dev = ['127.0.0.1', 'localhost', '0.0.0.0'].some(element => hostname.includes(element))
const is_test = ['-test.'].some(element => hostname.includes(element))
const ENV =  is_dev ? 'dev' : (is_test ? 'test' : 'prod')

console.log(`ENV=${ENV}`)

const api_url = {
	// 'dev': 'http://localhost:5000/api/es/', // feel free to change according to your local environment
	'dev': 'https://garm-test.isof.se/folkeservice/api/es/', // feel free to change according to your local environment
	'test': 'https://garm-test.isof.se/folkeservice/api/es/',
	'prod': 'https://garm.isof.se/folkeservice/api/es/',
}

const rest_api_url = {
	// 'dev': 'http://localhost:5000/api/', // feel free to change according to your local environment
	'dev': 'https://garm-test.isof.se/folkeservice/api/', // feel free to change according to your local environment
	'test': 'https://garm-test.isof.se/folkeservice/api/',
	'prod': 'https://garm.isof.se/folkeservice/api/',
}

const app_url = {
	'dev': window.location.origin,
	'test': 'https://forska.folke-test.isof.se/',
	'prod': 'https://forska.folke.isof.se/',
}

const pdf_url = {
	'dev': '',
	'test': 'https://forska.folke-test.isof.se/arkivfiler/publik/',
	'prod': 'https://forska.folke.isof.se/arkivfiler/publik/',
}

export default {
	// Configuration for environment
	///////////////////////////////////////
	// Namn på localStorage som lagrar sparade sägner
	localLibraryName: 'digitalt_kulturarv',

	// For public application:
	apiUrl: api_url[ENV],

	restApiUrl: rest_api_url[ENV],

	// For resources as /img:
	appUrl: app_url[ENV],
	
	// Base configuration for functionality
	///////////////////////////////////////
	// Proxy:  https://garm-test.isof.se/geoserver' -> https://oden-test.isof.se/geoserver
	// Proxy does not work yet!
	// geoserverUrl: 'https://oden-test.isof.se/geoserver',
	geoserverUrl: 'https://oden.isof.se/geoserver',

	imageUrl: 'https://www4.isof.se/Folkminnen/Svenska_sagor_filer/',

	pdfUrl: pdf_url[ENV],

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
		// country: 'sweden',
		// recordtype: 'one_record',
		publishstatus: 'published',
		categorytypes: 'tradark',
		transcriptionstatus: 'published,accession'
	},

	// pre-selected (and immutable) category type in search form
	// if undefined, list of all category_types will be shown
	predefinedCategoryType: 'tradark',

	minYear: 1800,
	maxYear: new Date().getFullYear(),

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