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
			name: 'Agent AI',
			value: Resource.AGENT_AI,
		},
		{
			name: 'File',
			value: Resource.FILE,
		},
	],
	default: Resource.DOCUMENT_AI,
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
				name: 'AI-assisted Form Filling',
				value: Operation.FORM_FILLING,
			},
		],
		default: Operation.RESUME_PARSER,
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
		default: Operation.IMAGE_CATALOGING,
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
		],
		default: Operation.FILE_LIST,
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
		],
		default: Operation.GITHUB_AGENT,
	},
];

export const vlmRunOptions: INodeProperties[] = [
	{
		displayName: 'File',
		name: 'file',
		type: 'string',
		displayOptions: {
			show: {
				resource: [Resource.DOCUMENT_AI, Resource.IMAGE_AI],
			},
		},
		default: 'data',
		required: true,
		description: 'File data from previous node',
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		options: [
			{
				name: 'VLM-1',
				value: 'vlm-1',
			},
		],
		default: 'vlm-1',
		description: 'The model to use for processing',
	},
];
