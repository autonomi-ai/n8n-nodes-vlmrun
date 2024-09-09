import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { VLMRunImageNode } from '../nodes/VLMRunImageNode/VLMRunImageNode.node';
import { VLMRunDocumentNode } from '../nodes/VLMRunDocumentNode/VLMRunDocumentNode.node';



jest.mock('n8n-workflow');

describe('VLM Run Integration', () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  let httpRequestSpy: jest.SpyInstance;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getInputData: jest.fn().mockReturnValue([{}]),
      getCredentials: jest.fn().mockResolvedValue({ apiKey: 'test-api-key' }),
      helpers: {
        httpRequest: jest.fn(),
      },
      continueOnFail: jest.fn(),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node', type: 'n8n-nodes-base.testNode' }),
    } as unknown as jest.Mocked<IExecuteFunctions>;

    httpRequestSpy = jest.spyOn(mockExecuteFunctions.helpers, 'httpRequest');
  });

  describe('VLMRunImageNode', () => {
    let imageNode: VLMRunImageNode;

    beforeEach(() => {
      imageNode = new VLMRunImageNode();
      jest.clearAllMocks();
    });

    it('should make a POST request to the image generation API', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('test prompt')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(512)
        .mockReturnValueOnce(512);

      httpRequestSpy.mockResolvedValueOnce({
        images: ['base64_encoded_image']
      });

      const result = await imageNode.execute.call(mockExecuteFunctions);

      expect(httpRequestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.vlm.run/v1/image/generate',
        body: {
          prompt: 'test prompt',
          num_images: 1,
          width: 512,
          height: 512,
        },
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      expect(result).toEqual([[{ json: { images: ['base64_encoded_image'] } }]]);
    });

    it('should handle NodeOperationError when continueOnFail is false', async () => {
      const mockHttpError = new Error('Bad Request');
      (mockHttpError as any).response = {
        statusCode: 400,
        statusMessage: 'Bad Request',
      };
      httpRequestSpy.mockRejectedValueOnce(mockHttpError);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('test prompt')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(512)
        .mockReturnValueOnce(512);

      try {
        await imageNode.execute.call(mockExecuteFunctions);
        fail('Expected an error to be thrown');
      } catch (error) {
        console.log('Caught error:', error);
        expect(error).toBeInstanceOf(NodeOperationError);
        expect(error.message).toBe('HTTP request failed: Bad Request');
        expect(error.description).toBe('Failed to make request to VLM Run API');
        expect(error.context).toEqual({
          description: 'Failed to make request to VLM Run API',
          itemIndex: 0
        });
      }

      expect(mockExecuteFunctions.continueOnFail).toHaveBeenCalledTimes(1);
      expect(httpRequestSpy).toHaveBeenCalledTimes(1);

      // Reset mocks and verify that a second execution also throws
      jest.clearAllMocks();
      httpRequestSpy.mockRejectedValueOnce(mockHttpError);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      await expect(imageNode.execute.call(mockExecuteFunctions)).rejects.toThrow(NodeOperationError);

      expect(mockExecuteFunctions.continueOnFail).toHaveBeenCalledTimes(1);
      expect(httpRequestSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle other errors when continueOnFail is false', async () => {
      const mockError = new Error('Generic error');
      httpRequestSpy.mockRejectedValueOnce(mockError);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('test prompt')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(512)
        .mockReturnValueOnce(512);

      await expect(imageNode.execute.call(mockExecuteFunctions)).rejects.toThrow(NodeOperationError);

      expect(mockExecuteFunctions.continueOnFail).toHaveBeenCalledTimes(1);
      expect(httpRequestSpy).toHaveBeenCalledTimes(1);

      try {
        await imageNode.execute.call(mockExecuteFunctions);
      } catch (error) {
        expect(error).toBeInstanceOf(NodeOperationError);
        expect(error.message).toBe('HTTP request failed: Generic error');
        expect(error.description).toBe('Failed to make request to VLM Run API');
        expect(error.context).toEqual({
          description: 'Failed to make request to VLM Run API',
        });
      }

      // Reset mocks for the next test
      jest.clearAllMocks();
    });

    it('should handle errors when continueOnFail is true', async () => {
      httpRequestSpy.mockRejectedValueOnce(new Error('API Error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('test prompt')
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(512)
        .mockReturnValueOnce(512);

      const result = await imageNode.execute.call(mockExecuteFunctions);
      expect(result).toEqual([[{ json: { error: 'API Error' } }]]);
    });
  });

  describe('VLMRunDocumentNode', () => {
    let documentNode: VLMRunDocumentNode;

    beforeEach(() => {
      documentNode = new VLMRunDocumentNode();
      jest.clearAllMocks();
    });

    it('should make a POST request to the document generation API', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('test prompt')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(0.7);

      httpRequestSpy.mockResolvedValueOnce({
        text: 'Generated document content'
      });

      const result = await documentNode.execute.call(mockExecuteFunctions);

      expect(httpRequestSpy).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.vlm.run/v1/document/generate',
        body: {
          prompt: 'test prompt',
          max_tokens: 1000,
          temperature: 0.7,
        },
        headers: {
          'Authorization': 'Bearer test-api-key',
        },
      });

      expect(result).toEqual([[{ json: { text: 'Generated document content' } }]]);
    });

    it('should handle NodeOperationError when continueOnFail is false', async () => {
      const mockHttpError: any = new Error('Bad Request');
      mockHttpError.response = {
        statusCode: 400,
        statusMessage: 'Bad Request',
      };
      httpRequestSpy.mockRejectedValueOnce(mockHttpError);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('test prompt')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(0.7);

      await expect(documentNode.execute.call(mockExecuteFunctions)).rejects.toThrow(NodeOperationError);

      expect(mockExecuteFunctions.continueOnFail).toHaveBeenCalledTimes(1);
      expect(httpRequestSpy).toHaveBeenCalledTimes(1);

      // Reset mocks for the second execution attempt
      jest.clearAllMocks();
      httpRequestSpy.mockRejectedValueOnce(mockHttpError);

      try {
        await documentNode.execute.call(mockExecuteFunctions);
      } catch (error) {
        expect(error).toBeInstanceOf(NodeOperationError);
        expect(error.message).toBe('HTTP request failed: Bad Request');
        expect(error.description).toBe('Failed to make request to VLM Run API');
        expect(error.context).toEqual({
          description: 'Failed to make request to VLM Run API',
          itemIndex: 0
        });
      }

      // Verify that the error is thrown and not caught internally when continueOnFail is false
      expect(mockExecuteFunctions.continueOnFail).toHaveBeenCalledTimes(1);
      expect(httpRequestSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle other errors when continueOnFail is false', async () => {
      const mockError = new Error('Generic error');
      httpRequestSpy.mockRejectedValueOnce(mockError);
      mockExecuteFunctions.continueOnFail.mockReturnValue(false);

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('test prompt')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(0.7);

      await expect(documentNode.execute.call(mockExecuteFunctions)).rejects.toThrow(NodeOperationError);

      expect(mockExecuteFunctions.continueOnFail).toHaveBeenCalledTimes(1);
      expect(httpRequestSpy).toHaveBeenCalledTimes(1);

      try {
        await documentNode.execute.call(mockExecuteFunctions);
      } catch (error) {
        expect(error).toBeInstanceOf(NodeOperationError);
        expect(error.message).toBe('HTTP request failed: Generic error');
        expect(error.description).toBe('Failed to make request to VLM Run API');
        expect(error.context).toEqual({
          description: 'Failed to make request to VLM Run API',
        });
      }
    });

    it('should handle errors when continueOnFail is true', async () => {
      httpRequestSpy.mockRejectedValueOnce(new Error('API Error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('test prompt')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(0.7);

      const result = await documentNode.execute.call(mockExecuteFunctions);
      expect(result).toEqual([[{ json: { error: 'API Error' } }]]);
    });
  });
});
