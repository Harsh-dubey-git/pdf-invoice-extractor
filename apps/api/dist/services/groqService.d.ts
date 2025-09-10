import { InvoiceDocument } from "@flowbit/shared";
export declare class GroqService {
    constructor();
    extractInvoiceData(pdfBuffer: Buffer): Promise<Partial<InvoiceDocument>>;
    private validateAndCleanData;
}
//# sourceMappingURL=groqService.d.ts.map