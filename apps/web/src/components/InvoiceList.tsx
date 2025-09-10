import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { InvoiceDocument } from "@flowbit/shared";
import { useToast } from "@/hooks/use-toast";

interface InvoiceListProps {
  onViewInvoice: (invoice: InvoiceDocument) => void;
  onEditInvoice: (invoice: InvoiceDocument) => void;
  onNewInvoice: () => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  onViewInvoice,
  onEditInvoice,
  onNewInvoice,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState<InvoiceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async (page = 1, search = "") => {
    try {
      if (page === 1 && !search) {
        setLoading(true);
      } else {
        setSearchLoading(true);
      }

      const result = await apiClient.getInvoices(search, page, pagination.limit);
      setInvoices(result.invoices);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadInvoices(1, query);
  };

  const handleDelete = async (invoiceId: string) => {
    try {
      await apiClient.deleteInvoice(invoiceId);
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      loadInvoices(pagination.page, searchQuery);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number | undefined, currency = 'USD') => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Invoice Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage all your invoice documents
                </p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/?mode=edit')}
              className="bg-gradient-primary hover:bg-primary-hover shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-lg">
          {/* Search and Filters */}
          <div className="p-6 border-b bg-surface-primary/30">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                {searchLoading ? (
                  <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  placeholder="Search by vendor name or invoice number..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-secondary/50">
                  <TableHead className="font-semibold">Vendor</TableHead>
                  <TableHead className="font-semibold">Invoice #</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">File</TableHead>
                  <TableHead className="font-semibold text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading invoices...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery ? 'No invoices found matching your search.' : 'No invoices found. Create your first invoice!'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow
                      key={invoice._id}
                      className="hover:bg-surface-primary/30 cursor-pointer transition-colors"
                      onClick={() => router.push(`/?mode=view&id=${invoice._id}`)}
                    >
                      <TableCell className="font-medium">
                        {invoice.vendor.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoice.number}
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoice.date)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.invoice.total, invoice.invoice.currency)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {invoice.fileName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/?mode=view&id=${invoice._id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/?mode=edit&id=${invoice._id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(invoice._id!);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-surface-secondary/30 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {invoices.length} of {pagination.total} invoices
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === 1 || loading}
                onClick={() => loadInvoices(pagination.page - 1, searchQuery)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={pagination.page === pagination.pages || loading}
                onClick={() => loadInvoices(pagination.page + 1, searchQuery)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default InvoiceList;
