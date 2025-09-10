import express from 'express';
import { GeminiService } from '../services/geminiService';
import { GroqService } from '../services/groqService';
import { ApiResponse, ExtractRequest, ExtractResponse } from '@flowbit/shared';
import { readBufferFromGridFS } from '../utils/files';

const router = express.Router();
const geminiService = new GeminiService();
const groqService = new GroqService();

// POST /api/extract
router.post('/', async (req, res) => {
  try {
    const { fileId, model }: ExtractRequest = req.body;

    if (!fileId) {
      const response: ApiResponse = {
        success: false,
        error: 'fileId is required'
      };
      return res.status(400).json(response);
    }

    if (!model || !['gemini', 'groq'].includes(model)) {
      const response: ApiResponse = {
        success: false,
        error: 'model must be either "gemini" or "groq"'
      };
      return res.status(400).json(response);
    }

    // Validate model-specific configuration
    if (model === 'gemini' && !process.env.GEMINI_API_KEY) {
      const response: ApiResponse<ExtractResponse> = {
        success: false,
        error: 'GEMINI_API_KEY not configured on server',
      };
      return res.status(400).json(response);
    }
    if (model === 'groq' && !(process.env.GROQ_API_KEY || process.env.GROK_API_KEY)) {
      const response: ApiResponse<ExtractResponse> = {
        success: false,
        error: 'GROQ_API_KEY not configured on server',
      };
      return res.status(400).json(response);
    }

    // Load PDF from GridFS
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await readBufferFromGridFS(fileId);
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF buffer is empty');
      }
    } catch (e) {
      const response: ApiResponse<ExtractResponse> = {
        success: true,
        data: {
          success: false,
          error: 'File not found or empty. Please upload the PDF first.'
        }
      };
      return res.status(404).json(response);
    }

    let extractedData;
    
    if (model === 'gemini') {
      extractedData = await geminiService.extractInvoiceData(pdfBuffer);
    } else if (model === 'groq') {
      extractedData = await groqService.extractInvoiceData(pdfBuffer);
      // Fallback to Gemini if Groq returns mostly empty fields
      const isMostlyEmpty = !extractedData?.vendor?.name &&
        (!extractedData?.invoice?.number) &&
        (!extractedData?.invoice?.total || extractedData.invoice.total === 0);
      if (isMostlyEmpty) {
        console.warn('Groq returned minimal data, attempting Gemini fallback');
        try {
          const geminiData = await geminiService.extractInvoiceData(pdfBuffer);
          if (geminiData) {
            extractedData = geminiData;
          }
        } catch (fallbackError) {
          console.warn('Gemini fallback failed, returning Groq result as-is:', fallbackError instanceof Error ? fallbackError.message : fallbackError);
        }
      }
    }

    const response: ApiResponse<ExtractResponse> = {
      success: true,
      data: {
        success: true,
        data: extractedData as any // Type assertion to handle the partial data
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Extraction error:', error);
    
    const response: ApiResponse<ExtractResponse> = {
      success: true,
      data: {
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed'
      }
    };
    
    res.status(500).json(response);
  }
});

export default router;
