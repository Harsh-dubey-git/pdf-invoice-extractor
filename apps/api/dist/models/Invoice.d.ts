import mongoose, { Document } from 'mongoose';
import { InvoiceDocument } from '@flowbit/shared';
export interface IInvoiceDocument extends Omit<InvoiceDocument, '_id'>, Document {
}
export declare const InvoiceModel: mongoose.Model<IInvoiceDocument, {}, {}, {}, mongoose.Document<unknown, {}, IInvoiceDocument, {}, {}> & IInvoiceDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Invoice.d.ts.map