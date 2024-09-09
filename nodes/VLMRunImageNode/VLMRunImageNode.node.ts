import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IHttpRequestOptions,
} from 'n8n-workflow';

export class VLMRunImageNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VLM Run Image Generation',
		name: 'vlmRunImageNode',
		group: ['transform'],
		version: 1,
		description: 'Generate images using VLM Run API',
		defaults: {
			name: 'VLM Run Image Generation',
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
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				placeholder: 'A beautiful sunset over the ocean',
				description: 'The prompt to generate the image',
				required: true,
			},
			{
				displayName: 'Number of Images',
				name: 'numImages',
				type: 'number',
				default: 1,
				description: 'The number of images to generate',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 512,
				description: 'The width of the generated image',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 512,
				description: 'The height of the generated image',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('vlmRunApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const prompt = this.getNodeParameter('prompt', i) as string;
				const numImages = this.getNodeParameter('numImages', i) as number;
				const width = this.getNodeParameter('width', i) as number;
				const height = this.getNodeParameter('height', i) as number;

				const options: IHttpRequestOptions = {
					method: 'POST',
					url: 'https://api.vlm.run/v1/image/generate',
					body: {
						prompt,
						num_images: numImages,
						width,
						height,
					},
					headers: {
						'Authorization': `Bearer ${credentials.apiKey}`,
					},
				};

				let response;
				try {
					response = await this.helpers.httpRequest(options);
				} catch (error) {
					console.log('VLMRunImageNode Error:', {
						message: error.message,
						stack: error.stack,
						response: error.response,
						requestOptions: {
							method: options.method,
							url: options.url,
							body: options.body,
						},
					});
					console.log('Error type:', error.constructor.name);
					console.log('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
					throw new NodeOperationError(
						this.getNode(),
						`HTTP request failed: ${error.message}`,
						{
							description: 'Failed to make request to VLM Run API',
							itemIndex: i,
						}
					);
				}

				if (response.statusCode && response.statusCode >= 400) {
					throw new NodeOperationError(
						this.getNode(),
						`HTTP request failed: ${response.statusMessage}`,
						{ description: 'Failed to make request to VLM Run API' }
					);
				}

				if (!response.images || response.images.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'Invalid API response: No images were generated',
						{ description: 'The API response did not contain any generated images.' }
					);
				}

				returnData.push({
					json: response,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}

				if (!(error instanceof NodeOperationError)) {
					error = new NodeOperationError(
						this.getNode(),
						'HTTP request failed: ' + error.message,
						{
							description: 'Failed to make request to VLM Run API',
						}
					);
				}

				throw error;
			}
		}

		return [returnData];
	}
}
