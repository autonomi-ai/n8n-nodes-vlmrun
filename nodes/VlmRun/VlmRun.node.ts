import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	IDataObject,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import {
	generateDocumentRequest,
	generateImageRequest,
	generateWebpageRequest,
	getDocumentResponseWithRetry,
	getFiles,
	uploadFile,
} from './ApiService';
import {
	DocumentRequest,
	Resource,
	Operation,
	ImageRequest,
	OperationToDomain,
	WebpagePredictionRequest,
} from './types';
import { vlmRunOperations, vlmRunOptions, vlmRunResources } from './VlmRunDescription';

export class VlmRun implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VLM Run',
		name: 'vlmRun',
		icon: 'file:vlm-run.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]',
		description: 'Interact with VLM.run API',
		defaults: {
			name: 'VLM Run',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'vlmRunApi',
				required: true,
			},
		],

		properties: [vlmRunResources, ...vlmRunOperations, ...vlmRunOptions],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === Resource.DOCUMENT_AI) {
					const validDocumentOperations = [
						Operation.RESUME_PARSER,
						Operation.INVOICE_PARSER,
						Operation.PRESENTATION_PARSER,
						Operation.FORM_FILLING,
					];
					const model = this.getNodeParameter('model', 0) as string;
					if (validDocumentOperations.includes(operation)) {
						console.log('Started Operation - ', operation);
						const item = items[i];

						const { buffer, fileName } = await processFile(this, item, i);

						// Step 1: Upload file
						const fileResponse = await uploadFile(this, buffer, fileName);
						this.sendMessageToUI('File uploaded...');

						// Step 2: Generate structured output
						// If batch is false, response is returned synchronously, otherwise asynchronously
						const documentRequest: DocumentRequest = {
							fileId: fileResponse.id,
							model: model,
							domain: OperationToDomain[operation],
							batch: false,
						};
						const initialResponse = await generateDocumentRequest(this, documentRequest);
						console.log('Initial Response - ', initialResponse);
						if (initialResponse.status === 'completed') {
							returnData.push({
								json: initialResponse,
							});
							continue;
						}

						// Step 3: Check response every RETRY_DELAY milliseconds for MAX_ATTEMPTS
						const documentResponse = await getDocumentResponseWithRetry(this, initialResponse.id);

						returnData.push({
							json: documentResponse,
						});
					}
				} else if (resource === Resource.IMAGE_AI) {
					if (
						operation === Operation.IMAGE_CATALOGING ||
						operation === Operation.IMAGE_CAPTIONING
					) {
						console.log('Started Operation - ', operation);
						const item = items[i];
						const imageResponse = await processImage(this, item);
						returnData.push({
							json: imageResponse,
						});
					}
				} else if (resource === Resource.AGENT_AI) {
					const model = this.getNodeParameter('model', 0) as string;
					if (operation === Operation.GITHUB_AGENT) {
						console.log('Started Operation - ', operation);
						const url = this.getNodeParameter('url', 0) as string;
						const mode = this.getNodeParameter('mode', 0) as 'fast' | 'accurate';

						const webpageRequest: WebpagePredictionRequest = {
							url: url,
							model: model,
							domain: OperationToDomain[operation],
							mode: mode,
						};
						const webpageResponse = await generateWebpageRequest(this, webpageRequest);
						returnData.push({
							json: webpageResponse,
						});
					}
				} else if (resource === Resource.FILE) {
					if (operation === Operation.FILE_LIST) {
						const files = await getFiles(this);
						returnData.push({
							json: { files: files },
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

async function processFile(
	ef: IExecuteFunctions,
	nodeData: INodeExecutionData,
	i: number,
): Promise<{ buffer: any; fileName: any }> {
	const binaryFile = ef.getNodeParameter('file', 0) as string;

	if (!nodeData.binary) {
		throw new NodeOperationError(ef.getNode(), 'No binary data exists on item!');
	}

	const binaryData = nodeData.binary[binaryFile];
	if (binaryData === undefined) {
		throw new NodeOperationError(
			ef.getNode(),
			`No binary data property "${binaryFile}" does not exists on item!`,
		);
	}

	const buffer = await ef.helpers.getBinaryDataBuffer(i, binaryFile);
	const fileName = binaryData.fileName;
	return { buffer, fileName };
}

async function processImage(ef: IExecuteFunctions, item: INodeExecutionData): Promise<IDataObject> {
	const model = ef.getNodeParameter('model', 0) as string;
	const operation = ef.getNodeParameter('operation', 0) as string;

	const binaryData = item.binary?.data;

	if (!binaryData) {
		throw new NodeOperationError(ef.getNode(), 'No binary data found!');
	}
	const imageRequest: ImageRequest = {
		image: binaryData.data,
		mimeType: binaryData.mimeType,
		model: model,
		domain: OperationToDomain[operation],
	};
	console.log('imageRequest - ', imageRequest);
	return await generateImageRequest(ef, imageRequest);
}
