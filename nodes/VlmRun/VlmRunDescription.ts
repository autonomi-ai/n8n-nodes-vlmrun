import { INodeProperties } from 'n8n-workflow';
import { Operation, Resource } from './types';

export const vlmRunResources: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	options: [
		{
			name: 'Doc AI',
			value: Resource.DOCUMENT_AI,
		},
		{
			name: 'Image AI',
			value: Resource.IMAGE_AI,
		},
		{
			name: 'Audio AI',
			value: Resource.AUDIO_AI,
		},
		{
			name: 'Agent AI',
			value: Resource.AGENT_AI,
		},
		{
			name: 'Experimental',
			value: Resource.EXPERIMENTAL,
		},
		{
			name: 'File',
			value: Resource.FILE,
		},
		{
			name: 'HTTP',
			value: Resource.HTTP,
		},
	],
	default: 'documentAi',
	noDataExpression: true,
};

export const vlmRunOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.DOCUMENT_AI],
			},
		},
		options: [
			{
				name: 'Resume Parser',
				value: Operation.RESUME_PARSER,
			},
			{
				name: 'Invoice Parser',
				value: Operation.INVOICE_PARSER,
			},
			{
				name: 'Presentation Parser',
				value: Operation.PRESENTATION_PARSER,
			},
			{
				name: 'AI Assisted Form Filling',
				value: Operation.FORM_FILLING,
			},
		],
		default: 'resumeParser',
		noDataExpression: true,
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.IMAGE_AI],
			},
		},
		options: [
			{
				name: 'Image Captioning',
				value: Operation.IMAGE_CAPTIONING,
			},
		],
		default: 'imageCaptioning',
		noDataExpression: true,
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.AUDIO_AI],
			},
		},
		options: [
			{
				name: 'Audio Transcription',
				value: Operation.AUDIO_TRANSCRIPTION,
			},
		],
		default: 'audioTranscription',
		noDataExpression: true,
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.FILE],
			},
		},
		options: [
			{
				name: 'List',
				value: Operation.FILE_LIST,
			},
			{
				name: 'Upload',
				value: Operation.FILE_UPLOAD,
			},
		],
		default: 'fileList',
		noDataExpression: true,
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.AGENT_AI],
			},
		},
		options: [
			{
				name: 'Github',
				value: Operation.GITHUB_AGENT,
			},
			{
				name: 'Linkedin',
				value: Operation.LINKEDIN_AGENT,
			},
			{
				name: 'Market Research',
				value: Operation.MARKET_RESEARCH_AGENT,
			},
		],
		default: 'githubAgent',
		noDataExpression: true,
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.EXPERIMENTAL],
			},
		},
		options: [
			{
				name: 'Image Embeddings',
				value: Operation.IMAGE_EMBEDDING,
			},
			{
				name: 'Document Embeddings',
				value: Operation.DOCUMENT_EMBEDDING,
			},
		],
		default: 'imageEmbedding',
		noDataExpression: true,
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.HTTP],
			},
		},
		options: [
			{
				name: 'Custom GET',
				value: Operation.GET,
				displayName: 'Perform a GET call.',
			},
			{
				name: 'Custom POST',
				value: Operation.POST,
				displayName: 'Perform a POST call.',
			},
		],
		default: 'GET',
		noDataExpression: true,
	},
];

export const vlmRunOptions: INodeProperties[] = [
	{
		displayName: 'File',
		name: 'file',
		type: 'string',
		displayOptions: {
			show: {
				resource: [
					Resource.DOCUMENT_AI,
					Resource.IMAGE_AI,
					Resource.AUDIO_AI,
					Resource.EXPERIMENTAL,
				],
			},
		},
		default: 'data',
		required: true,
		description: 'File data from previous node',
	},
	{
		displayName: 'File',
		name: 'file',
		type: 'string',
		displayOptions: {
			show: {
				resource: [Resource.FILE],
				operation: [Operation.FILE_UPLOAD],
			},
		},
		default: 'data',
		required: true,
		description: 'File data from previous node',
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		displayOptions: {
			show: {
				resource: [Resource.AGENT_AI],
			},
		},
		default: '',
		required: true,
		description: 'URL to generate webpage',
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.DOCUMENT_AI, Resource.IMAGE_AI, Resource.AUDIO_AI, Resource.AGENT_AI],
			},
		},
		options: [
			{
				name: 'VLM-1',
				value: 'vlm-1',
			},
		],
		default: 'vlm-1',
		description: 'The model to use for processing',
		noDataExpression: true,
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.EXPERIMENTAL],
			},
		},
		options: [
			{
				name: 'VLM-1 Embeddings',
				value: 'vlm-1-embeddings',
			},
		],
		default: 'vlm-1-embeddings',
		description: 'The model to use for embeddings',
		noDataExpression: true,
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		displayOptions: {
			show: {
				resource: [Resource.AGENT_AI],
			},
		},
		options: [
			{
				name: 'Fast',
				value: 'fast',
			},
			{
				name: 'Accurate',
				value: 'accurate',
			},
		],
		default: 'accurate',
		description: 'The mode to use for web generation',
	},
];

const createKeyValuePair = (
	groupName: string,
	keyName: string,
	valueName: string,
	keyPlaceholder: string = 'Enter key',
	valuePlaceholder: string = 'Enter value',
): INodeProperties[] => {
	const createProperty = (
		displayName: string,
		name: string,
		placeholder: string,
	): INodeProperties => ({
		displayName,
		name,
		type: 'string',
		default: '',
		placeholder,
		required: true,
		description: `${displayName} of the ${groupName}`,
	});

	return [
		createProperty('Key', keyName, keyPlaceholder),
		createProperty('Value', valueName, valuePlaceholder),
	];
};

const headerCollection: INodeProperties = {
	displayName: 'Headers',
	name: 'headers',
	type: 'fixedCollection',
	placeholder: 'Add Header',
	typeOptions: {
		multipleValues: true,
	},
	default: {},
	required: true,
	description: 'Headers to send with the request',
	displayOptions: {
		show: {
			isHeaderRequired: [true],
		},
	},
	options: [
		{
			name: 'header',
			displayName: 'Header',
			values: [...createKeyValuePair('header', 'key', 'value')],
		},
	],
};

const queryParamCollection: INodeProperties = {
	displayName: 'Query Parameters',
	name: 'params',
	type: 'fixedCollection',
	placeholder: 'Add Parameter',
	typeOptions: {
		multipleValues: true,
	},
	default: {},
	required: true,
	description: "The request's query parameters",
	displayOptions: {
		show: {
			isQueryParamRequired: [true],
		},
	},
	options: [
		{
			name: 'param',
			displayName: 'Parameter',
			values: [...createKeyValuePair('query parameter', 'key', 'value')],
		},
	],
};

const jsonKeyValueCollection: INodeProperties = {
	displayName: 'Body Parameter',
	name: 'jsonKeyValueBody',
	type: 'fixedCollection',
	placeholder: 'Add Field',
	typeOptions: {
		multipleValues: true,
	},
	default: {},
	required: true,
	description: "The request's JSON properties",
	displayOptions: {
		show: {
			resource: [Resource.HTTP],
			operation: [Operation.POST],
			typeofData: ['jsonData'],
			specifyBody: ['usingFields'],
		},
	},
	options: [
		{
			name: 'json',
			displayName: 'Body Parameter',
			displayOptions: {
				show: {
					specifyBody: ['usingFields'],
				},
			},
			values: [...createKeyValuePair('JSON property', 'key', 'value')],
		},
	],
};

const formDataCollection: INodeProperties = {
	displayName: 'Form Data',
	name: 'formBody',
	type: 'fixedCollection',
	placeholder: 'Add Field',
	default: {},
	required: true,
	description: "The request's form data properties",
	displayOptions: {
		show: {
			resource: [Resource.HTTP],
			operation: [Operation.POST],
			typeofData: ['formData'],
		},
	},
	options: [
		{
			name: 'form',
			displayName: 'Form Data',
			values: [
				...createKeyValuePair(
					'form data',
					'key',
					'value',
					'Key of the file parameter',
					'Enter a binary file',
				),
			],
		},
	],
};

const bodyContentOptions = [
	{
		name: 'JSON',
		value: 'jsonData',
	},
	{
		name: 'Form Data',
		value: 'formData',
	},
];

const specifyBodyOptions = [
	{
		name: 'Using Fields Below',
		value: 'usingFields',
	},
	{
		name: 'Using JSON',
		value: 'usingJson',
	},
];

export const httpCustomOperation: INodeProperties[] = [
	// URL Field
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'e.g. /files, /models',
		required: true,
		description: 'The URL to send the request to',
		displayOptions: {
			show: {
				resource: [Resource.HTTP],
			},
		},
	},
	// Send Header Toggle
	{
		displayName: 'Send Header',
		name: 'isHeaderRequired',
		type: 'boolean',
		default: false,
		required: true,
		description: 'Whether to send headers with the request',
		displayOptions: {
			show: {
				resource: [Resource.HTTP],
			},
		},
	},
	// Headers Collection
	headerCollection,
	// Send Query Params Toggle
	{
		displayName: 'Send Query Params',
		name: 'isQueryParamRequired',
		type: 'boolean',
		default: false,
		required: true,
		description: 'Whether to send query parameters with the request',
		displayOptions: {
			show: {
				resource: [Resource.HTTP],
			},
		},
	},
	// Query Parameters Collection
	queryParamCollection,
	// Send Body Toggle
	{
		displayName: 'Send Body',
		name: 'isBodyRequired',
		type: 'boolean',
		default: false,
		required: true,
		description: 'Whether to send a request body',
		displayOptions: {
			show: {
				resource: [Resource.HTTP],
				operation: [Operation.POST],
			},
		},
	},
	// Body Content Type
	{
		displayName: 'Body Content Type',
		name: 'typeofData',
		type: 'options',
		default: '',
		description: 'Select type of data to send [JSON, Form Data]',
		options: bodyContentOptions,
		required: true,
		displayOptions: {
			show: {
				isBodyRequired: [true],
			},
		},
	},
	// Specify Body
	{
		displayName: 'Specify Body',
		name: 'specifyBody',
		type: 'options',
		default: '',
		options: specifyBodyOptions,
		displayOptions: {
			show: {
				typeofData: ['jsonData'],
			},
		},
		description: 'Choose how to specify the JSON body',
	},
	// JSON Body via Fields
	jsonKeyValueCollection,
	// JSON Body via JSON Input
	{
		displayName: 'JSON',
		name: 'rawJsonBody',
		type: 'json',
		default: '',
		description: 'Provide JSON content for the request body',
		displayOptions: {
			show: {
				specifyBody: ['usingJson'],
			},
		},
	},
	// Form Data Collection
	formDataCollection,
];
