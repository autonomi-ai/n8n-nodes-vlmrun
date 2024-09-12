import { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class VlmRunApi implements ICredentialType {
	name = 'vlmRunApi';
	displayName = 'VLM.run API';
	documentationUrl = 'https://docs.vlm.run/api-reference/v1/health';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
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
}
