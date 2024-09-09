import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VLMRunApi implements ICredentialType {
	name = 'vlmRunApi';
	displayName = 'VLM Run API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The API key for VLM Run',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.vlm.run',
			url: '/v1/image/generate',
			method: 'POST',
			body: {
				prompt: 'Test image',
				num_images: 1,
				width: 512,
				height: 512,
			},
		},
	};
}
