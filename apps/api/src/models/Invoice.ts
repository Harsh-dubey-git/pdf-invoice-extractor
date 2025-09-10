import mongoose, { Document, Schema } from 'mongoose';
import { InvoiceDocument } from '@flowbit/shared';

// Line Item Schema
const LineItemSchema = new Schema({
  description: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

// Vendor Schema
const VendorSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
  taxId: { type: String },
}, { _id: false });

// Invoice Schema
const InvoiceSchema = new Schema({
  number: { type: String, required: true },
  date: { type: String, required: true },
  currency: { type: String, default: 'USD' },
  subtotal: { type: Number },
  taxPercent: { type: Number },
  total: { type: Number },
  poNumber: { type: String },
  poDate: { type: String },
  lineItems: [LineItemSchema],
}, { _id: false });

// Main Invoice Document Schema
const InvoiceDocumentSchema = new Schema({
  fileId: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  vendor: { type: VendorSchema, required: true },
  invoice: { type: InvoiceSchema, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String },
}, {
  timestamps: false, // We're handling timestamps manually
  collection: 'invoices'
});

// Indexes for better query performance
InvoiceDocumentSchema.index({ fileId: 1 });
InvoiceDocumentSchema.index({ 'vendor.name': 1 });
InvoiceDocumentSchema.index({ 'invoice.number': 1 });
InvoiceDocumentSchema.index({ createdAt: -1 });

// Create and export the model
export interface IInvoiceDocument extends Omit<InvoiceDocument, '_id'>, Document {}

export const InvoiceModel = mongoose.model<IInvoiceDocument>('Invoice', InvoiceDocumentSchema);
