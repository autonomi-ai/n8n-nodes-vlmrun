import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { baseUrl, MAX_ATTEMPTS, RETRY_DELAY } from './config';
import FormData from 'form-data';
import { DocumentRequest, PredictionResponse, FileResponse, ImageRequest } from './types';

export async function uploadFile(
	ef: IExecuteFunctions,
	buffer: any,
	fileName: string,
): Promise<FileResponse> {
	const credentials = (await ef.getCredentials('vlmRunApi')) as { apiKey: string };

	const form = new FormData();
	form.append('file', buffer, { filename: fileName });

	const uploadResponse = await ef.helpers.httpRequest({
		method: 'POST',
		url: `${baseUrl}/files`,
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
		},
		body: form,
	});

	return uploadResponse as FileResponse;
}

export async function generateDocumentRequest(
	executeFunctions: IExecuteFunctions,
	request: DocumentRequest,
): Promise<PredictionResponse> {
	const credentials = (await executeFunctions.getCredentials('vlmRunApi')) as { apiKey: string };
	console.log('Generating document...');
	console.log('Request - ', request);
	const generateResponse = await executeFunctions.helpers.httpRequest({
		method: 'POST',
		url: `${baseUrl}/document/generate`,
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: request.model,
			file_id: request.fileId,
			domain: request.domain,
		}),
	});
	console.log('Document generated...');

	return generateResponse as PredictionResponse;
}

export async function getDocumentResponse(
	executeFunctions: IExecuteFunctions,
	documentId: string,
): Promise<IDataObject> {
	const credentials = (await executeFunctions.getCredentials('vlmRunApi')) as { apiKey: string };

	let attempts = 0;
	while (attempts < MAX_ATTEMPTS) {
		console.log(`Getting document response, attempt : ${attempts}`);
		const documentResponse = await executeFunctions.helpers.request({
			method: 'GET',
			url: `${baseUrl}/document/${documentId}`,
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${credentials.apiKey}`,
			},
			json: true,
		});

		console.log(`Document Status - ${documentResponse.status}`);

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
	const credentials = (await ef.getCredentials('vlmRunApi')) as { apiKey: string };

	const payload = {
		image: `data:${request.mimeType};base64,${request.image}`,
		model: request.model,
		domain: request.domain,
	};

	const response = await ef.helpers.request({
		method: 'POST',
		url: `${baseUrl}/image/generate`,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Authorization: `Bearer ${credentials.apiKey}`,
		},
		body: JSON.stringify(payload),
		json: true,
	});

	return response as PredictionResponse;
}
