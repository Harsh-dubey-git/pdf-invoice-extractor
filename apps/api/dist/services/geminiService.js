"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAyxe8_obTH622hMWkH_6q2T10hLqWDvv4';
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    async extractInvoiceData(pdfBuffer) {
        try {
            console.log('Starting Gemini AI extraction...');
            console.log('PDF buffer size:', pdfBuffer.length, 'bytes');
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            // Convert PDF buffer to base64 for Gemini
            const base64Pdf = pdfBuffer.toString('base64');
            console.log('PDF converted to base64, length:', base64Pdf.length);
            const prompt = `
        You are an expert at extracting invoice data from PDFs. Analyze this PDF invoice and extract the following information in JSON format. 
        Be precise and accurate. If any field is not found, use null or empty string.

        Extract the following data structure:
        {
          "vendor": {
            "name": "string (company/vendor name)",
            "address": "string (full address, optional)",
            "taxId": "string (tax ID or VAT number, optional)"
          },
          "invoice": {
            "number": "string (invoice number)",
            "date": "string (YYYY-MM-DD format)",
            "currency": "string (USD, EUR, etc., default USD)",
            "subtotal": "number (amount before tax)",
            "taxPercent": "number (tax percentage)",
            "total": "number (final total amount)",
            "poNumber": "string (purchase order number, optional)",
            "poDate": "string (purchase order date, YYYY-MM-DD format, optional)",
            "lineItems": [
              {
                "description": "string (item/service description)",
                "unitPrice": "number (price per unit)",
                "quantity": "number (quantity)",
                "total": "number (line total)"
              }
            ]
          }
        }

        IMPORTANT: Return ONLY the JSON object, no additional text, explanations, or formatting.
        Make sure all numbers are actual numbers, not strings.
      `;
            console.log('Sending request to Gemini AI...');
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Pdf,
                        mimeType: 'application/pdf'
                    }
                }
            ]);
            const response = await result.response;
            const text = response.text();
            console.log('Gemini AI response received, length:', text.length);
            console.log('Raw response:', text.substring(0, 500) + '...');
            // Clean up the response text to extract JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('No valid JSON found in Gemini response');
                throw new Error('No valid JSON found in Gemini response');
            }
            console.log('Extracted JSON:', jsonMatch[0]);
            const extractedData = JSON.parse(jsonMatch[0]);
            console.log('Parsed data:', extractedData);
            // Validate and clean the extracted data
            const cleanedData = this.validateAndCleanData(extractedData);
            console.log('Cleaned data:', cleanedData);
            return cleanedData;
        }
        catch (error) {
            console.error('Gemini extraction error:', error);
            throw new Error(`Failed to extract data from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateAndCleanData(data) {
        // Ensure required fields exist
        const cleanedData = {
            vendor: {
                name: data.vendor?.name || '',
                address: data.vendor?.address || '',
                taxId: data.vendor?.taxId || ''
            },
            invoice: {
                number: data.invoice?.number || '',
                date: data.invoice?.date || '',
                currency: data.invoice?.currency || 'USD',
                subtotal: typeof data.invoice?.subtotal === 'number' ? data.invoice.subtotal : null,
                taxPercent: typeof data.invoice?.taxPercent === 'number' ? data.invoice.taxPercent : null,
                total: typeof data.invoice?.total === 'number' ? data.invoice.total : null,
                poNumber: data.invoice?.poNumber || '',
                poDate: data.invoice?.poDate || '',
                lineItems: Array.isArray(data.invoice?.lineItems)
                    ? data.invoice.lineItems.map((item) => ({
                        description: item.description || '',
                        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
                        quantity: typeof item.quantity === 'number' ? item.quantity : 0,
                        total: typeof item.total === 'number' ? item.total : 0
                    }))
                    : []
            }
        };
        return cleanedData;
    }
}
exports.GeminiService = GeminiService;
//# sourceMappingURL=geminiService.js.map