import { InvoiceDocument } from '@flowbit/shared';
export declare class GeminiService {
    private genAI;
    constructor();
    extractInvoiceData(pdfBuffer: Buffer): Promise<Partial<InvoiceDocument>>;
    private validateAndCleanData;
}
//# sourceMappingURL=geminiService.d.ts.map