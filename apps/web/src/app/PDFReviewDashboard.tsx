'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Brain, BarChart3, ArrowLeft, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { InvoiceDocument } from '@flowbit/shared';
import PDFViewer from '@/components/PDFViewerDynamic';
import DataExtractionPanel from '@/components/DataExtractionPanel';
import InvoiceList from '@/components/InvoiceList';

type View = 'list' | 'viewer';
type ViewerMode = 'view' | 'edit' | null;

// Use shared InvoiceDocument type

const PDFReviewDashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<View>('viewer');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDocument | null>(null);
  const [viewerMode, setViewerMode] = useState<ViewerMode>('edit');

  const handleFileSelect = (file: File) => {
    console.log('File selected in dashboard:', file);
    setSelectedFile(file);
  };

  const handleViewInvoice = async (row: any) => {
    try {
      const fileId = row?.fileId;
      const fileName = row?.fileName || 'document.pdf';
      if (!fileId) {
        // Fallback: fetch to get fileId
        const full = await apiClient.getInvoice(row._id);
        const resolvedFileId = full.fileId;
        const resolvedFileName = full.fileName || fileName;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/${resolvedFileId}`);
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
        const blob = await res.blob();
        if (!blob || blob.size === 0) throw new Error('Empty PDF blob');
        const file = new File([blob], resolvedFileName, { type: 'application/pdf' });
        setSelectedFile(file);
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/${fileId}`);
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
        const blob = await res.blob();
        if (!blob || blob.size === 0) throw new Error('Empty PDF blob');
        const file = new File([blob], fileName, { type: 'application/pdf' });
        setSelectedFile(file);
      }
      // Do not change selectedInvoice in View mode
      setViewerMode('view');
      setCurrentView('viewer');
    } catch (err) {
      console.error('Failed to fetch PDF for viewing:', err);
    }
  };

  const handleEditInvoice = async (row: any) => {
    try {
      const full = await apiClient.getInvoice(row._id);
      const normalizedFull: InvoiceDocument = {
        ...full,
        vendor: {
          ...full.vendor,
          address: full.vendor.address ?? '',
          taxId: full.vendor.taxId ?? '',
        },
      };
      setSelectedInvoice(normalizedFull);
      // Do not change selectedFile in Edit mode
      setViewerMode('edit');
      setCurrentView('viewer');
    } catch (err) {
      console.error('Failed to fetch invoice for editing:', err);
    }
  };

  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    // Keep current PDF as-is; new invoice implies editing form with empty data
    setViewerMode('edit');
    setCurrentView('viewer');
  };

  const handleBackToList = () => {
    router.push('/invoices');
  };

  // On mount or URL change, handle deep-links from /invoices
  useEffect(() => {
    const mode = searchParams.get('mode');
    const id = searchParams.get('id');
    if (mode === 'view' && id) {
      handleViewInvoice({ _id: id });
    } else if (mode === 'edit') {
      if (id) {
        handleEditInvoice({ _id: id });
      } else {
        setViewerMode('edit');
        setCurrentView('viewer');
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-surface">
      {currentView === 'list' ? (
        <InvoiceList 
          onViewInvoice={handleViewInvoice}
          onEditInvoice={handleEditInvoice}
          onNewInvoice={handleNewInvoice}
        />
      ) : (
        <>
          {/* Header for Viewer */}
          <header className="bg-background/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-primary rounded-lg shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">PDF Invoice Extractor</h1>
                      <p className="text-sm text-muted-foreground">
                        {viewerMode === 'edit' && selectedInvoice
                          ? `Editing: ${selectedInvoice.invoice.number}`
                          : 'Viewing PDF'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToList}
                  >
                    <List className="h-4 w-4 mr-2" />
                   All Invoices
                  </Button>
                  
                </div>
              </div>
            </div>
          </header>

          {/* Main Split Layout */}
          <main className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-[calc(100vh-120px)]">
              {/* PDF Viewer - Left Panel */}
              <div className="xl:col-span-1 h-full min-h-0">
                <PDFViewer 
                  onFileSelect={handleFileSelect} 
                  selectedFile={selectedFile}
                />
              </div>

              {/* Data Extraction Panel - Right Panel */}
              <div className="xl:col-span-1 h-full min-h-0">
                {viewerMode === 'edit' ? (
                  <DataExtractionPanel 
                    selectedFile={selectedFile} 
                    initialInvoice={selectedInvoice as any}
                    onInvoiceSaved={() => {
                      console.log('Invoice saved successfully');
                    }}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Select Edit to modify invoice details
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default PDFReviewDashboard;