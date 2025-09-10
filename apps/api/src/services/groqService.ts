import { InvoiceDocument } from "@flowbit/shared";

interface GroqChatCompletionResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

export class GroqService {
  constructor() {}

  async extractInvoiceData(
    pdfBuffer: Buffer
  ): Promise<Partial<InvoiceDocument>> {
    try {
      const apiKey = (
        process.env.GROQ_API_KEY ||
        process.env.GROK_API_KEY ||
        ""
      ).trim();
      if (!apiKey) throw new Error("GROQ_API_KEY not configured");

      console.log("Starting Groq AI extraction...");
      console.log("PDF buffer size:", pdfBuffer.length, "bytes");

      const base64Pdf = pdfBuffer.toString("base64");

      const systemPrompt = `You are an expert at extracting invoice data from PDFs. Analyze this PDF invoice and extract the following information in JSON format. 
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
Make sure all numbers are actual numbers, not strings.`;

      const userContent = `PDF (base64): ${base64Pdf}`;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent },
            ],
            temperature: 0,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Groq API error: ${response.status} ${text}`);
      }

      const data = (await response.json()) as GroqChatCompletionResponse;
      const text: string = data?.choices?.[0]?.message?.content || "";
      if (!text) {
        throw new Error("Empty response from Groq");
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in Groq response");
      }

      const extracted = JSON.parse(jsonMatch[0]);
      return this.validateAndCleanData(extracted);
    } catch (error) {
      console.error("Groq extraction error:", error);
      throw new Error(
        `Failed to extract data from PDF via Groq: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private validateAndCleanData(data: any): Partial<InvoiceDocument> {
    const toNumber = (val: any): number => {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const n = parseFloat(val.replace(/[^0-9.\-]/g, ""));
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };

    const toISODate = (val: any): string => {
      if (!val) return "";
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val))
        return val;
      const d = new Date(val);
      if (isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const cleaned: Partial<InvoiceDocument> = {
      vendor: {
        name: data.vendor?.name || "",
        address: data.vendor?.address || "",
        taxId: data.vendor?.taxId || "",
      },
      invoice: {
        number: data.invoice?.number || "",
        date: toISODate(data.invoice?.date || ""),
        currency: data.invoice?.currency || "USD",
        subtotal: toNumber(data.invoice?.subtotal),
        taxPercent: toNumber(data.invoice?.taxPercent),
        total: toNumber(data.invoice?.total),
        poNumber: data.invoice?.poNumber || "",
        poDate: toISODate(data.invoice?.poDate || ""),
        lineItems: Array.isArray(data.invoice?.lineItems)
          ? data.invoice.lineItems.map((item: any) => ({
              description: item.description || "",
              unitPrice: toNumber(item.unitPrice),
              quantity: toNumber(item.quantity),
              total: toNumber(item.total),
            }))
          : [],
      },
    };

    return cleaned;
  }
}
