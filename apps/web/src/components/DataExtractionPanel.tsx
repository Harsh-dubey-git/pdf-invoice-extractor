import { useState, useEffect } from "react";
import {
  Bot,
  Save,
  Trash2,
  Edit3,
  CheckCircle,
  Loader2,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { InvoiceDocument } from "@flowbit/shared";

interface DataExtractionPanelProps {
  selectedFile: File | null;
  initialInvoice?: InvoiceDocument | null;
  onInvoiceSaved?: (invoice: InvoiceDocument) => void;
}

const DataExtractionPanel: React.FC<DataExtractionPanelProps> = ({
  selectedFile,
  initialInvoice,
  onInvoiceSaved,
}) => {
  const { toast } = useToast();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiModel, setAiModel] = useState<"gemini" | "groq">("gemini");
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [fileId, setFileId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [data, setData] = useState<Partial<InvoiceDocument>>({
    vendor: { name: "", address: "", taxId: "" },
    invoice: {
      number: "",
      date: "",
      currency: "USD",
      subtotal: 0,
      taxPercent: 0,
      total: 0,
      poNumber: "",
      poDate: "",
      lineItems: [{ description: "", unitPrice: 0, quantity: 0, total: 0 }],
    },
  });

  // Prefill when editing an existing invoice
  useEffect(() => {
    if (initialInvoice) {
      setData({
        vendor: initialInvoice.vendor,
        invoice: initialInvoice.invoice,
      });
      setFileId(initialInvoice.fileId);
      setInvoiceId(initialInvoice._id || null);
      setExistingFileName(initialInvoice.fileName || null);
    }
  }, [initialInvoice]);

  const handleExtract = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please upload a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting AI extraction with model:', aiModel);
      setIsExtracting(true);
      setExtractionProgress(0);

      // Upload the PDF file first
      console.log('Uploading PDF file...');
      const uploadResult = await apiClient.uploadPdf(selectedFile);
      console.log('PDF uploaded successfully:', uploadResult);
      setFileId(uploadResult.fileId);
      setExtractionProgress(30);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExtractionProgress((prev) => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            return 80;
          }
          return prev + 10;
        });
      }, 200);

      // Extract data using AI
      console.log('Extracting data with AI...');
      const extractResult = await apiClient.extractData(uploadResult.fileId, aiModel);
      console.log('AI extraction result:', extractResult);
      clearInterval(progressInterval);
      setExtractionProgress(100);

      if (extractResult.success && extractResult.data) {
        console.log('Extracted data:', extractResult.data);
        setData(extractResult.data);
        setIsExtracted(true);
        // Ensure fileId is preserved for viewing later
        setFileId((prev) => prev || uploadResult.fileId);
        toast({
          title: "Extraction Complete",
          description: `Invoice data extracted successfully using ${aiModel.toUpperCase()} AI.`,
        });
      } else {
        throw new Error(extractResult.error || 'Extraction failed');
      }

    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : 'Failed to extract data from PDF',
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const addLineItem = () => {
    setData((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice!,
        lineItems: [
          ...(prev.invoice?.lineItems || []),
          { description: "", unitPrice: 0, quantity: 0, total: 0 },
        ],
      },
    }));
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    setData((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice!,
        lineItems: (prev.invoice?.lineItems || []).map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  const removeLineItem = (index: number) => {
    setData((prev) => ({
      ...prev,
      invoice: {
        ...prev.invoice!,
        lineItems: (prev.invoice?.lineItems || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = async () => {
    // Edit existing invoice
    if (invoiceId && fileId) {
      try {
        setIsSaving(true);

        const updatePayload: Partial<InvoiceDocument> = {
          vendor: data.vendor!,
          invoice: data.invoice!,
        } as Partial<InvoiceDocument>;

        const updated = await apiClient.updateInvoice(invoiceId, updatePayload);

        toast({
          title: "Invoice Updated",
          description: "Invoice changes have been saved.",
        });

        if (onInvoiceSaved) {
          onInvoiceSaved(updated);
        }
      } catch (error) {
        console.error('Update error:', error);
        toast({
          title: "Update Failed",
          description: error instanceof Error ? error.message : 'Failed to update invoice',
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Create new invoice from extracted data
    if (!fileId || !selectedFile) {
      toast({
        title: "Save Failed",
        description: "No file or extraction data available to save.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const invoiceData = {
        fileId,
        fileName: selectedFile.name,
        vendor: data.vendor!,
        invoice: data.invoice!,
        createdAt: new Date().toISOString(),
      };

      const savedInvoice = await apiClient.createInvoice(invoiceData);
      
      toast({
        title: "Invoice Saved",
        description: "Invoice data has been successfully saved to the database.",
      });

      if (onInvoiceSaved) {
        onInvoiceSaved(savedInvoice);
      }

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Failed to save invoice',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-background shadow-xl border border-border/50">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b bg-surface-primary/30">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-sm">AI Data Extraction</span>
            {isExtracted && (
              <div className="flex items-center gap-2 mt-0.5">
                <CheckCircle className="h-3 w-3 text-accent" />
                <Badge variant="outline" className="text-xs text-accent">
                  Extracted
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedFile && !isExtracting && (
            <Select
              value={aiModel}
              onValueChange={(value: "gemini" | "groq") => setAiModel(value)}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Gemini
                  </div>
                </SelectItem>
                <SelectItem value="groq">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-3 w-3" />
                    Groq
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleExtract}
            disabled={!selectedFile || isExtracting}
            className="bg-gradient-primary hover:bg-primary-hover transition-all duration-300 shadow-lg hover:shadow-glow"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting {extractionProgress}%
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Extract with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6 scrollbar-hide">
        {!selectedFile && !initialInvoice ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Edit3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Upload a PDF to start extracting invoice data
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Vendor Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
                Vendor Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="vendor-name">Vendor Name</Label>
                  <Input
                    id="vendor-name"
                    value={data.vendor?.name || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        vendor: { ...prev.vendor!, name: e.target.value },
                      }))
                    }
                    placeholder="Enter vendor name"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-address">Address</Label>
                  <Textarea
                    id="vendor-address"
                    value={data.vendor?.address || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        vendor: { ...prev.vendor!, address: e.target.value },
                      }))
                    }
                    placeholder="Enter vendor address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="vendor-tax">Tax ID</Label>
                  <Input
                    id="vendor-tax"
                    value={data.vendor?.taxId || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        vendor: { ...prev.vendor!, taxId: e.target.value },
                      }))
                    }
                    placeholder="Enter tax ID"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
                Invoice Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={data.invoice?.number || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        invoice: { ...prev.invoice!, number: e.target.value },
                      }))
                    }
                    placeholder="INV-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={data.invoice?.date || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        invoice: { ...prev.invoice!, date: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={data.invoice?.currency || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        invoice: { ...prev.invoice!, currency: e.target.value },
                      }))
                    }
                    placeholder="USD"
                  />
                </div>
                <div>
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    value={data.invoice?.subtotal || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        invoice: { ...prev.invoice!, subtotal: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="tax-percent">Tax %</Label>
                  <Input
                    id="tax-percent"
                    value={data.invoice?.taxPercent || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        invoice: {
                          ...prev.invoice!,
                          taxPercent: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    value={data.invoice?.total || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        invoice: { ...prev.invoice!, total: parseFloat(e.target.value) || 0 },
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="po-number">PO Number</Label>
                  <Input
                    id="po-number"
                    value={data.invoice?.poNumber || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        invoice: { ...prev.invoice!, poNumber: e.target.value },
                      }))
                    }
                    placeholder="PO-XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="po-date">PO Date</Label>
                  <Input
                    id="po-date"
                    type="date"
                    value={data.invoice?.poDate || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        invoice: { ...prev.invoice!, poDate: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <div className="w-2 h-6 bg-gradient-primary rounded-full"></div>
                  Line Items
                </h3>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  Add Item
                </Button>
              </div>

              {(data.invoice?.lineItems || []).map((item, index) => (
                <Card
                  key={index}
                  className="p-4 space-y-4 bg-surface-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Item #{index + 1}
                    </span>
                    {(data.invoice?.lineItems || []).length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)
                          }
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label>Total</Label>
                        <Input
                          value={item.total}
                          onChange={(e) =>
                            updateLineItem(index, "total", parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {(selectedFile || initialInvoice) && (
        <div className="flex gap-2 p-4 border-t bg-surface-secondary/30">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {invoiceId ? 'Update Invoice' : 'Save Invoice'}
              </>
            )}
          </Button>
          
        </div>
      )}
    </Card>
  );
};

export default DataExtractionPanel;
