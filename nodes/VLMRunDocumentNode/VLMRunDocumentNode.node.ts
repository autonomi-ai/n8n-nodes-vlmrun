import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IHttpRequestOptions,
} from 'n8n-workflow';

export class VLMRunDocumentNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VLM Run Document Generation',
		name: 'vlmRunDocumentNode',
		group: ['transform'],
		version: 1,
		description: 'Generate documents using VLM Run API',
		defaults: {
			name: 'VLM Run Document Generation',
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
				placeholder: 'Write a short story about a robot learning to paint',
				description: 'The prompt to generate the document',
				required: true,
			},
			{
				displayName: 'Max Tokens',
				name: 'maxTokens',
				type: 'number',
				default: 1000,
				description: 'The maximum number of tokens to generate',
			},
			{
				displayName: 'Temperature',
				name: 'temperature',
				type: 'number',
				default: 0.7,
				description: 'Controls randomness. Lower values make the output more focused and deterministic',
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
				const maxTokens = this.getNodeParameter('maxTokens', i) as number;
				const temperature = this.getNodeParameter('temperature', i) as number;

				const options: IHttpRequestOptions = {
					method: 'POST',
					url: 'https://api.vlm.run/v1/document/generate',
					body: {
						prompt,
						max_tokens: maxTokens,
						temperature,
					},
					headers: {
						'Authorization': `Bearer ${credentials.apiKey}`,
					},
				};

				let response;
				try {
					response = await this.helpers.httpRequest(options);
				} catch (error) {
					console.log('VLMRunDocumentNode Error:', {
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

				if (!response.text) {
					throw new NodeOperationError(
						this.getNode(),
						'Invalid API response: Missing text content',
						{ description: 'The API response did not contain the expected text content.' }
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
