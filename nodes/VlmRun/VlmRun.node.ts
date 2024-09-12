import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import FormData from 'form-data';
import { baseUrl } from './config';

export class VlmRun implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VLM.run',
		name: 'vlmRun',
		icon: 'file:vlm-run.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]',
		description: 'Interact with VLM.run API',
		defaults: {
			name: 'VLM.run',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'vlmRunApi',
				required: true,
			},
		],

		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Doc AI',
						value: 'docAi',
					},
					{
						name: 'Image AI',
						value: 'imageAi',
					},
					{
						name: 'File',
						value: 'file',
					},
				],
				default: 'docAi',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['docAi'],
					},
				},
				options: [
					{
						name: 'Resume Parser',
						value: 'resumeParser',
					},
					{
						name: 'Invoice Parser',
						value: 'invoiceParser',
					},
					{
						name: 'Form Parser',
						value: 'formParser',
					},
					{
						name: 'Presentation Parser',
						value: 'presentationParser',
					},
					{
						name: 'AI-assisted Form Filling',
						value: 'formFilling',
					},
				],
				default: 'resumeParser',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['imageAi'],
					},
				},
				options: [
					{
						name: 'Image Cataloging',
						value: 'imageCataloging',
					},
					{
						name: 'Image Captioning',
						value: 'imageCaptioning',
					},
				],
				default: 'imageCataloging',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Upload',
						value: 'upload',
					},
					{
						name: 'Delete',
						value: 'delete',
					},
					{
						name: 'List',
						value: 'list',
					},
				],
				default: 'upload',
			},
			{
				displayName: 'File',
				name: 'file',
				type: 'string',
				default: 'data',
				required: true,
				description: 'File data from previous node',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'VLM-1',
						value: 'vlm-1',
					},
				],
				default: 'vlm-1',
				description: 'The model to use for processing',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = (await this.getCredentials('vlmRunApi')) as { apiKey: string };
		const binaryFile = this.getNodeParameter('file', 0) as string;
		const model = this.getNodeParameter('model', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'docAi') {
					if (operation === 'resumeParser') {
						// const filePath = this.getNodeParameter('file', i) as string;
						const item = items[i];
						if (!item.binary) {
							throw new NodeOperationError(this.getNode(), 'No binary data exists on item!');
						}

						const binaryData = item.binary[binaryFile];
						if (item.binary === undefined || binaryData === undefined) {
							throw new NodeOperationError(
								this.getNode(),
								`No binary data property "${binaryFile}" does not exists on item!`,
							);
						}

						// Step 1: Upload file
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryFile);

						const form = new FormData();
						// const fileContent = await this.helpers.binaryToBuffer(
						// 	await this.helpers.getBinaryDataBuffer(i, 'file'),
						// );
						form.append('file', buffer, { filename: binaryData.fileName });

						const uploadResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/files`,
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
							},
							body: form,
						});

						const fileId = uploadResponse.id;

						// Step 2: Generate structured output
						const generateResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/document/generate`,
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								model: model,
								file_id: fileId,
							}),
						});

						returnData.push({
							json: generateResponse,
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error);
			}
		}

		return [returnData];
	}
}
