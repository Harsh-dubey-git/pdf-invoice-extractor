import { useEffect, useRef, useState } from "react";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF.js worker for browser
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

interface PDFViewerProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  onFileSelect,
  selectedFile,
}) => {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered', event.target.files);
    const file = event.target.files?.[0];
    
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    if (file.type !== "application/pdf") {
      setError('Please select a PDF file');
      return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be under 25MB');
      return;
    }
    
    console.log('File is valid, calling onFileSelect');
    onFileSelect(file);
    setCurrentPage(1); // Reset to first page
    setError(null);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF file');
    setLoading(false);
  };

  const onDocumentLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleDownload = () => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full flex flex-col bg-background shadow-xl border border-border/50">
      {/* Enhanced Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-surface-primary/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-sm">PDF Viewer</span>
            
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 25}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="px-3 py-1 bg-muted rounded text-sm font-medium min-w-[70px] text-center">
              {zoom}%
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 300}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1"></div>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!selectedFile}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedFile ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-sm">
              <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <Upload className="h-12 w-12 text-white" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Upload PDF Document</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Upload your invoice PDF to extract data automatically using AI
                </p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    console.log('Button clicked, triggering file input');
                    document.getElementById('pdf-upload')?.click();
                  }}
                  className="bg-gradient-primary hover:bg-primary-hover transition-all duration-300 shadow-lg hover:shadow-glow hover:scale-105"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose PDF File
                </Button>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Maximum file size: 25MB</p>
                <p>• Supported format: PDF only</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* PDF Display Area */}
            <div className="flex-1 bg-muted/20 overflow-auto p-6 scrollbar-hide">
              <div className="mx-auto">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}
                
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading PDF...</span>
                    </div>
                  </div>
                )}

                <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-border/20 flex justify-center">
                  {isClient && (
                    <Document
                      file={selectedFile}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      onLoadStart={onDocumentLoadStart}
                      loading={
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      }
                      error={
                        <div className="flex items-center justify-center p-8">
                          <p className="text-destructive">Failed to load PDF</p>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={currentPage}
                        scale={zoom / 100}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        rotate={rotation}
                      />
                    </Document>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Page Navigation */}
            <div className="flex items-center justify-center gap-6 p-4 border-t bg-surface-secondary/30">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1 || loading}
                onClick={prevPage}
                className="hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Page</span>
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded font-medium min-w-[40px] text-center">
                  {currentPage}
                </div>
                <span className="text-sm text-muted-foreground">
                  of {totalPages || '...'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || loading}
                onClick={nextPage}
                className="hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default PDFViewer;
