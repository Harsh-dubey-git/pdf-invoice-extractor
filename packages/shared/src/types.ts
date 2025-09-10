import { z } from 'zod';

// Line Item Schema
export const LineItemSchema = z.object({
  description: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  total: z.number(),
});

// Vendor Schema
export const VendorSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

// Invoice Schema
export const InvoiceSchema = z.object({
  number: z.string(),
  date: z.string(),
  currency: z.string().optional(),
  subtotal: z.number().optional(),
  taxPercent: z.number().optional(),
  total: z.number().optional(),
  poNumber: z.string().optional(),
  poDate: z.string().optional(),
  lineItems: z.array(LineItemSchema),
});

// Complete Invoice Document Schema
export const InvoiceDocumentSchema = z.object({
  _id: z.string().optional(),
  fileId: z.string(),
  fileName: z.string(),
  vendor: VendorSchema,
  invoice: InvoiceSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

// API Response Schemas
export const UploadResponseSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
});

export const ExtractRequestSchema = z.object({
  fileId: z.string(),
  model: z.enum(['gemini', 'groq']),
});

export const ExtractResponseSchema = z.object({
  success: z.boolean(),
  data: InvoiceDocumentSchema.omit({ _id: true, fileId: true, fileName: true, createdAt: true, updatedAt: true }).optional(),
  error: z.string().optional(),
});

// Type exports
export type LineItem = z.infer<typeof LineItemSchema>;
export type Vendor = z.infer<typeof VendorSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceDocument = z.infer<typeof InvoiceDocumentSchema>;
export type UploadResponse = z.infer<typeof UploadResponseSchema>;
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;
export type ExtractResponse = z.infer<typeof ExtractResponseSchema>;

// API Error Response
export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

// API Success Response
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;
