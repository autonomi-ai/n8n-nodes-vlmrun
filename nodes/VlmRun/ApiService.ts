import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { baseUrl, MAX_ATTEMPTS, RETRY_DELAY } from './config';
import FormData from 'form-data';
import {
	DocumentRequest,
	PredictionResponse,
	FileResponse,
	ImageRequest,
	WebpagePredictionRequest,
} from './types';

async function getCommonHeaders(ef: IExecuteFunctions, contentType: 'json' | 'form' = 'json') {
	const credentials = (await ef.getCredentials('vlmRunApi')) as { apiKey: string };
	return {
		'Content-Type': contentType === 'json' ? 'application/json' : 'multipart/form-data',
		Accept: 'application/json',
		Authorization: `Bearer ${credentials.apiKey}`,
	};
}

export async function uploadFile(
	ef: IExecuteFunctions,
	buffer: any,
	fileName: string,
): Promise<FileResponse> {
	const headers = await getCommonHeaders(ef, 'form');

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

export async function getDocumentResponse(
	executeFunctions: IExecuteFunctions,
	documentId: string,
): Promise<IDataObject> {
	const headers = await getCommonHeaders(executeFunctions);

	console.log(`Getting document response for - ${documentId}`);
	try {
		const documentResponse = await executeFunctions.helpers.request({
			method: 'GET',
			url: `${baseUrl}/document/${documentId}`,
			headers: headers,
			json: true,
		});

		console.log(`Document Status - ${documentResponse.status}`);

		return documentResponse;
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

export async function getDocumentResponseWithRetry(
	executeFunctions: IExecuteFunctions,
	documentId: string,
): Promise<IDataObject> {
	let attempts = 0;
	while (attempts < MAX_ATTEMPTS) {
		console.log(`Getting document response, attempt : ${attempts}`);

		const documentResponse = await getDocumentResponse(executeFunctions, documentId);

		if (documentResponse.status === 'completed') {
			return documentResponse;
		} else {
			attempts++;
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
		}
	}

	throw new Error('Document processing timed out');
}

export async function generateImageRequest(
	ef: IExecuteFunctions,
	request: ImageRequest,
): Promise<PredictionResponse> {
	const headers = await getCommonHeaders(ef);

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

export async function generateWebpageRequest(
	ef: IExecuteFunctions,
	request: WebpagePredictionRequest,
): Promise<PredictionResponse> {
	const headers = await getCommonHeaders(ef);

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
