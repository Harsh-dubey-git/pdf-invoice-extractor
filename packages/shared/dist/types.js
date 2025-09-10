"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractResponseSchema = exports.ExtractRequestSchema = exports.UploadResponseSchema = exports.InvoiceDocumentSchema = exports.InvoiceSchema = exports.VendorSchema = exports.LineItemSchema = void 0;
const zod_1 = require("zod");
// Line Item Schema
exports.LineItemSchema = zod_1.z.object({
    description: zod_1.z.string(),
    unitPrice: zod_1.z.number(),
    quantity: zod_1.z.number(),
    total: zod_1.z.number(),
});
// Vendor Schema
exports.VendorSchema = zod_1.z.object({
    name: zod_1.z.string(),
    address: zod_1.z.string().optional(),
    taxId: zod_1.z.string().optional(),
});
// Invoice Schema
exports.InvoiceSchema = zod_1.z.object({
    number: zod_1.z.string(),
    date: zod_1.z.string(),
    currency: zod_1.z.string().optional(),
    subtotal: zod_1.z.number().optional(),
    taxPercent: zod_1.z.number().optional(),
    total: zod_1.z.number().optional(),
    poNumber: zod_1.z.string().optional(),
    poDate: zod_1.z.string().optional(),
    lineItems: zod_1.z.array(exports.LineItemSchema),
});
// Complete Invoice Document Schema
exports.InvoiceDocumentSchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    fileId: zod_1.z.string(),
    fileName: zod_1.z.string(),
    vendor: exports.VendorSchema,
    invoice: exports.InvoiceSchema,
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string().optional(),
});
// API Response Schemas
exports.UploadResponseSchema = zod_1.z.object({
    fileId: zod_1.z.string(),
    fileName: zod_1.z.string(),
});
exports.ExtractRequestSchema = zod_1.z.object({
    fileId: zod_1.z.string(),
    model: zod_1.z.enum(['gemini', 'groq']),
});
exports.ExtractResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: exports.InvoiceDocumentSchema.omit({ _id: true, fileId: true, fileName: true, createdAt: true, updatedAt: true }).optional(),
    error: zod_1.z.string().optional(),
});
//# sourceMappingURL=types.js.map