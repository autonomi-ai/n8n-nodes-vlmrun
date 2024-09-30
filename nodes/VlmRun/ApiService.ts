import {
	IExecuteFunctions,
	IDataObject,
	NodeOperationError,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { MAX_ATTEMPTS, RETRY_DELAY } from './config';
import FormData from 'form-data';
import {
	DocumentRequest,
	PredictionResponse,
	FileResponse,
	ImageRequest,
	WebpagePredictionRequest,
	AudioRequest,
} from './types';

async function getCommonHeaders(ef: IExecuteFunctions, contentType: 'json' | 'form' = 'json') {
	const credentials = (await ef.getCredentials('vlmRunApi')) as { apiKey: string };
	return {
		'Content-Type': contentType === 'json' ? 'application/json' : 'multipart/form-data',
		Accept: 'application/json',
		Authorization: `Bearer ${credentials.apiKey}`,
	};
}

async function getBaseUrl(ef: IExecuteFunctions): Promise<string> {
	const credentials = (await ef.getCredentials('vlmRunApi')) as { apiBaseUrl: string };
	return credentials.apiBaseUrl.trim();
}

export async function uploadFile(
	ef: IExecuteFunctions,
	buffer: any,
	fileName: string,
): Promise<FileResponse> {
	const headers = await getCommonHeaders(ef, 'form');
	const baseUrl = await getBaseUrl(ef);

	const form = new FormData();
	form.append('file', buffer, { filename: fileName });

	try {
		const uploadResponse = await ef.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/files`,
			headers: headers,
			body: form,
		});
		console.log('File uploaded...');
		return uploadResponse as FileResponse;
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(ef.getNode(), `API Error: ${error.response.data.detail}`);
		} else {
			throw new Error('Failed to upload file: ' + error.message);
		}
	}
}

export async function getFiles(ef: IExecuteFunctions): Promise<FileResponse[]> {
	const headers = await getCommonHeaders(ef);
	const baseUrl = await getBaseUrl(ef);
	const skip = 0;
	const limit = 10;

	const queryParams = new URLSearchParams();
	if (skip !== undefined) queryParams.append('skip', skip.toString());
	if (limit !== undefined) queryParams.append('limit', limit.toString());

	try {
		const filesResponse = await ef.helpers.httpRequest({
			method: 'GET',
			url: `${baseUrl}/files${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
			headers: headers,
		});

		return filesResponse as FileResponse[];
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(ef.getNode(), `API Error: ${error.response.data.detail}`);
		} else {
			throw new Error('Failed to fetch files: ' + error.message);
		}
	}
}

export async function generateDocumentRequest(
	executeFunctions: IExecuteFunctions,
	request: DocumentRequest,
): Promise<PredictionResponse> {
	const headers = await getCommonHeaders(executeFunctions);
	const baseUrl = await getBaseUrl(executeFunctions);
	console.log('Generating document...');
	try {
		const generateResponse = await executeFunctions.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/document/generate`,
			headers: headers,
			body: JSON.stringify({
				model: request.model,
				file_id: request.fileId,
				domain: request.domain,
				batch: request.batch,
			}),
		});
		console.log('Document generated...');

		return generateResponse as PredictionResponse;
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`API Error: ${error.response.data.detail}`,
			);
		} else {
			throw new Error('Failed to generate document: ' + error.message);
		}
	}
}

export async function generateAudioRequest(
	ef: IExecuteFunctions,
	request: AudioRequest,
): Promise<PredictionResponse> {
	const headers = await getCommonHeaders(ef);
	const baseUrl = await getBaseUrl(ef);

	const payload = {
		file_id: request.fileId,
		model: request.model,
		domain: request.domain,
		batch: request.batch,
	};

	try {
		const response = await ef.helpers.request({
			method: 'POST',
			url: `${baseUrl}/audio/generate`,
			headers: headers,
			body: JSON.stringify(payload),
			json: true,
		});

		return response as PredictionResponse;
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(ef.getNode(), `API Error: ${error.response.data.detail}`);
		} else {
			throw new Error('Failed to generate audio: ' + error.message);
		}
	}
}

export async function generateDocumentEmbedding(
	executeFunctions: IExecuteFunctions,
	request: DocumentRequest,
): Promise<PredictionResponse> {
	const headers = await getCommonHeaders(executeFunctions);
	const baseUrl = await getBaseUrl(executeFunctions);
	console.log('Generating document embedding...');
	try {
		const generateResponse = await executeFunctions.helpers.httpRequest({
			method: 'POST',
			url: `${baseUrl}/experimental/document/embeddings`,
			headers: headers,
			body: JSON.stringify({
				model: request.model,
				file_id: request.fileId,
				batch: request.batch,
			}),
		});
		console.log('Document embedding generated...');

		return generateResponse as PredictionResponse;
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`API Error: ${error.response.data.detail}`,
			);
		} else {
			throw new Error('Failed to generate document: ' + error.message);
		}
	}
}

export async function getResponse(
	executeFunctions: IExecuteFunctions,
	responseId: string,
): Promise<IDataObject> {
	const headers = await getCommonHeaders(executeFunctions);
	const baseUrl = await getBaseUrl(executeFunctions);

	console.log(`Getting response for - ${responseId}`);
	try {
		const response = await executeFunctions.helpers.request({
			method: 'GET',
			url: `${baseUrl}/response/${responseId}`,
			headers: headers,
			json: true,
		});

		console.log(`Response Status - ${response.status}`);

		return response;
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(
				executeFunctions.getNode(),
				`API Error: ${error.response.data.detail}`,
			);
		} else {
			throw new Error('Failed to get document response: ' + error.message);
		}
	}
}

export async function getResponseWithRetry(
	executeFunctions: IExecuteFunctions,
	responseId: string,
): Promise<IDataObject> {
	let attempts = 0;
	while (attempts < MAX_ATTEMPTS) {
		console.log(`Getting response, attempt : ${attempts}`);

		const response = await getResponse(executeFunctions, responseId);

		if (response.status === 'completed') {
			return response;
		} else {
			attempts++;
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
		}
	}

	throw new Error('Response processing timed out');
}

export async function generateImageRequest(
	ef: IExecuteFunctions,
	request: ImageRequest,
): Promise<PredictionResponse> {
	const headers = await getCommonHeaders(ef);
	const baseUrl = await getBaseUrl(ef);

	const payload = {
		image: `data:${request.mimeType};base64,${request.image}`,
		model: request.model,
		domain: request.domain,
	};

	try {
		const response = await ef.helpers.request({
			method: 'POST',
			url: `${baseUrl}/image/generate`,
			headers: headers,
			body: JSON.stringify(payload),
			json: true,
		});

		return response as PredictionResponse;
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(ef.getNode(), `API Error: ${error.response.data.detail}`);
		} else {
			throw new Error('Failed to generate image: ' + error.message);
		}
	}
}

export async function generateImageEmbedding(
	ef: IExecuteFunctions,
	request: ImageRequest,
): Promise<PredictionResponse> {
	const headers = await getCommonHeaders(ef);
	const baseUrl = await getBaseUrl(ef);

	const payload = {
		image: `data:${request.mimeType};base64,${request.image}`,
		model: request.model,
		domain: request.domain,
	};

	try {
		const response = await ef.helpers.request({
			method: 'POST',
			url: `${baseUrl}/experimental/image/embeddings`,
			headers: headers,
			body: JSON.stringify(payload),
			json: true,
		});

		return response as PredictionResponse;
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(ef.getNode(), `API Error: ${error.response.data.detail}`);
		} else {
			throw new Error('Failed to generate image embedding: ' + error.message);
		}
	}
}

export async function generateWebpageRequest(
	ef: IExecuteFunctions,
	request: WebpagePredictionRequest,
): Promise<PredictionResponse> {
	const headers = await getCommonHeaders(ef);
	const baseUrl = await getBaseUrl(ef);

	const payload = {
		url: request.url,
		model: request.model,
		domain: request.domain,
		mode: request.mode,
	};
	try {
		const response = await ef.helpers.request({
			method: 'POST',
			url: `${baseUrl}/web/generate`,
			headers: headers,
			body: JSON.stringify(payload),
			json: true,
		});

		return response as PredictionResponse;
	} catch (error) {
		if (error.response && error.response.data && error.response.data.detail) {
			throw new NodeOperationError(ef.getNode(), `API Error: ${error.response.data.detail}`);
		} else {
			throw new Error('Failed to generate webpage: ' + error.message);
		}
	}
}

export async function makeCustomApiCall(ef: IExecuteFunctions) {
	let url = ef.getNodeParameter('url', 0) as string;
	const isHeaderRequired = ef.getNodeParameter('isHeaderRequired', 0) as boolean;
	const isQueryParamRequired = ef.getNodeParameter('isQueryParamRequired', 0) as boolean;
	let isBodyRequired = false;

	if (ef.getNodeParameter('operation', 0) == 'POST') {
		isBodyRequired = ef.getNodeParameter('isBodyRequired', 0) as boolean;
	}

	const credentials = (await ef.getCredentials('vlmRunApi')) as { apiKey: string };

	let headers;
	let typeofData: string;
	let queryParams;
	let headersObj: Record<string, any> = {};
	let body;
	let formData;
	const baseUrl = await getBaseUrl(ef);
	url = `${baseUrl}${url}`;

	// Validate the URL
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		console.log("URL exception: ", url);
		throw new NodeOperationError(
			ef,
			'Invalid URL. Please include the protocol (http:// or https://).',
		);
	}

	if (isHeaderRequired) {
		headers = (ef.getNodeParameter('headers', 0) as any).header;

		if (!headers) {
			throw new NodeOperationError(ef, 'Header is required.');
		}

		console.log("Headers: ", headers);

		headers.forEach((header: any) => {
			const headerKeyLower = header.key.toLowerCase();
			if (!(headerKeyLower === 'content-type')) {
				headersObj[header.key] = header.value;
			}
		});
	}

	if (isQueryParamRequired) {
		queryParams = (ef.getNodeParameter('params', 0) as any).param;

		if (!queryParams) {
			throw new NodeOperationError(ef, 'Query params are required.');
		}

		console.log("QueryParams: ", queryParams);

		const queryString = queryParams
			.map(
				(param: any) =>
					`${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`,
			)
			.join('&');
		url = queryString ? `${url}?${queryString}` : url;
	}

	if (isBodyRequired) {
		typeofData = ef.getNodeParameter('typeofData', 0) as string;

		if (typeofData === 'jsonData') {
			let bodyData = (ef.getNodeParameter('jsonBody', 0) as any).json;
			if (!bodyData) {
				throw new NodeOperationError(ef, "Provide reuqest body.");
			}

			const jsonBody: Record<string, any> = {};
			bodyData.forEach((item: { key: string; value: any }) => {
				if (typeof item.value === 'string') {
					try {
						jsonBody[item.key] = JSON.parse(item.value);
					} catch {
						jsonBody[item.key] = item.value;
					}
				} else {
					jsonBody[item.key] = item.value;
				}
			});

			body = JSON.stringify(jsonBody);
		} else if (typeofData === 'formData') {

			let bodyData = (ef.getNodeParameter('formBody', 0) as any).form;
			if (!bodyData) {
				throw new NodeOperationError(ef, "Provide reuqest body.");
			}

			console.log("Form Body", bodyData);

			const fileBuffer = ef.getInputData()[0].binary?.file;

			formData = {
				file: {
					value: Buffer.from(fileBuffer!.data, 'base64'),
					options: {
						filename: fileBuffer!.fileName,
						contentType: fileBuffer!.mimeType,
					},
				},
			};
		}
	}

	headersObj['Authorization'] = `Bearer ${credentials.apiKey}`;

	const requestOption = {
		method: ef.getNodeParameter('operation', 0) as IHttpRequestMethods,
		url,
		headers: headersObj,
		body,
		formData,
		json: true,
	}

	const response = await ef.helpers.request(requestOption);

	return response;
}