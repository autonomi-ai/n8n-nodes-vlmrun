import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import FormData from 'form-data';

export class VlmRun implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VLM.run',
		name: 'vlmRun',
		icon: 'file:vlm-run.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
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
					{
						name: 'Multi-modal RAG',
						value: 'multimodalRag',
					},
				],
				default: 'resumeParser',
			},
			{
				displayName: 'File',
				name: 'file',
				type: 'string',
				default: '',
				required: true,
				description: 'The file to be processed (path to file)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const credentials = (await this.getCredentials('vlmRunApi')) as { apiKey: string };

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'docAi') {
					if (operation === 'resumeParser') {
						// const filePath = this.getNodeParameter('file', i) as string;

						// Step 1: Upload file
						const form = new FormData();
						const fileContent = await this.helpers.binaryToBuffer(
							await this.helpers.getBinaryDataBuffer(i, 'file'),
						);
						const fileName = this.getNodeParameter('file', i) as string;
						form.append('file', fileContent, { filename: fileName });

						const uploadResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: 'https://api.vlm.run/v1/files',
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
							},
							body: form,
						});

						const fileId = uploadResponse.file_id;

						// Step 2: Generate structured output
						const generateResponse = await this.helpers.httpRequest({
							method: 'POST',
							url: 'https://api.vlm.run/v1/document/generate',
							headers: {
								Authorization: `Bearer ${credentials.apiKey}`,
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
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
