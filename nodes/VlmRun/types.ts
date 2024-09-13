import { IDataObject } from 'n8n-workflow';

export interface DocumentRequest {
	fileId: string;
	model: string;
	domain?: Domain;
	batch?: boolean;
}

export interface ImageRequest {
	fileId?: string;
	image: string;
	mimeType: string;
	model: string;
	domain?: Domain;
}

export interface PredictionResponse extends IDataObject {
	id: string;
	created_at: string;
	completed_at?: string;
	response?: any;
	status: string;
}

export interface FileResponse {
	id: string;
	filename: string;
	bytes: number;
	purpose: string;
	created_at: string;
	object?: string;
}

export const Resource = {
	DOCUMENT_AI: 'documentAi',
	IMAGE_AI: 'imageAi',
	AGENT_AI: 'agentAi',
	FILE: 'file',
};

export const Operation = {
	RESUME_PARSER: 'resumeParser',
	INVOICE_PARSER: 'invoiceParser',
	PRESENTATION_PARSER: 'presentationParser',
	FORM_FILLING: 'formFilling',
	IMAGE_CATALOGING: 'imageCataloging',
	IMAGE_CAPTIONING: 'imageCaptioning',
	FILE_LIST: 'fileList',
	GITHUB_AGENT: 'githubAgent',
	LINKEDIN_AGENT: 'linkedinAgent',
};

export enum Domain {
	// Public schemas
	DocumentGenerative = 'document.generative',
	DocumentPresentation = 'document.presentation',
	DocumentVisualGrounding = 'document.visual-grounding',

	// Document extraction
	DocumentInvoice = 'document.invoice',
	DocumentResume = 'document.resume',
	DocumentHealthInsuranceCard = 'document.health-insurance-card',
	DocumentDriversLicense = 'document.drivers-license',
	DocumentReceipt = 'document.receipt',

	// Document schema extraction
	DocumentSchemaCreation = 'document.schema-creation',

	// Document with paragraphs, tables, charts, etc.
	DocumentPdf = 'document.pdf',
	DocumentFile = 'document.file',
	DocumentPdfAutofill = 'document.pdf-autofill',
	DocumentHardwareSpecSheet = 'document.hardware-spec-sheet',

	// Audio
	AudioTranscription = 'audio.transcription',

	// Image
	ImageEmbeddings = 'image.embeddings',
	ImageCaptioning = 'image.caption',
	// Video
	VideoTranscription = 'video.transcription',
	VideoEmbeddings = 'video.embeddings',
	VideoGenerativeEmbeddings = 'video.generative-embeddings',

	// Experimental / sports
	SportsNfl = 'sports.nfl',
	SportsNba = 'sports.nba',
	SportsSoccer = 'sports.soccer',

	// Experimental / TV
	VideoTvNews = 'video.tv-news',
	VideoTvIntelligence = 'video.tv-intelligence',

	// Experimental / web + social
	WebEcommerceProductCatalog = 'web.ecommerce-product-catalog',
	WebGithubDeveloperStats = 'web.github-developer-stats',
	SocialTwitterCard = 'social.twitter-card',

	// Experimental / multi-modal RAG
	DocumentMultimodalEmbeddings = 'document.multimodal-embeddings',
	DocumentMultimodalRag = 'document.multimodal-rag',
}

//create operation to domain mapping
export const OperationToDomain = {
	[Operation.RESUME_PARSER]: Domain.DocumentResume,
	[Operation.INVOICE_PARSER]: Domain.DocumentInvoice,
	[Operation.PRESENTATION_PARSER]: Domain.DocumentPresentation,
	[Operation.FORM_FILLING]: Domain.DocumentPdfAutofill,
	[Operation.IMAGE_CAPTIONING]: Domain.ImageCaptioning,
};