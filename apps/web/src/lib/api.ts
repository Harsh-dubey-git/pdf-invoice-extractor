import {
  ApiResponse,
  UploadResponse,
  ExtractRequest,
  ExtractResponse,
  InvoiceDocument,
} from "@flowbit/shared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
      // Throwing ensures callers don’t try to access `.data` on error
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Upload PDF file
  async uploadPdf(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await this.request<UploadResponse>("/upload", {
      method: "POST",
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });

    if ("data" in response) {
      return response.data;
    }
    throw new Error("Upload failed");
  }

  // Extract data from PDF using AI
  async extractData(
    fileId: string,
    model: "gemini" | "groq"
  ): Promise<ExtractResponse> {
    const response = await this.request<ExtractResponse>("/extract", {
      method: "POST",
      body: JSON.stringify({ fileId, model }),
    });

    if ("data" in response) {
      return response.data;
    }
    throw new Error("Extraction failed");
  }

  // Get all invoices with optional search
  async getInvoices(searchQuery?: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchQuery) {
      params.append("q", searchQuery);
    }

    const response = await this.request<{
      invoices: InvoiceDocument[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/invoices?${params}`);

    if ("data" in response) {
      return response.data;
    }
    throw new Error("Fetching invoices failed");
  }

  // Get single invoice
  async getInvoice(id: string): Promise<InvoiceDocument> {
    const response = await this.request<InvoiceDocument>(`/invoices/${id}`);
    if ("data" in response) {
      return response.data;
    }
    throw new Error("Invoice not found");
  }

  // Create new invoice
  async createInvoice(
    invoiceData: Omit<InvoiceDocument, "_id" | "createdAt" | "updatedAt">
  ): Promise<InvoiceDocument> {
    const response = await this.request<InvoiceDocument>("/invoices", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });

    if ("data" in response) {
      return response.data;
    }
    throw new Error("Invoice creation failed");
  }

  // Update invoice
  async updateInvoice(
    id: string,
    invoiceData: Partial<InvoiceDocument>
  ): Promise<InvoiceDocument> {
    const response = await this.request<InvoiceDocument>(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(invoiceData),
    });

    if ("data" in response) {
      return response.data;
    }
    throw new Error("Invoice update failed");
  }

  // Delete invoice
  async deleteInvoice(id: string): Promise<void> {
    const response = await this.request(`/invoices/${id}`, {
      method: "DELETE",
    });

    if ("data" in response) {
      return;
    }
    throw new Error("Invoice deletion failed");
  }
}

export const apiClient = new ApiClient();
