import express from "express";
import mongoose from "mongoose";
import { InvoiceModel } from "../models/Invoice";
import { ApiResponse, InvoiceDocument } from "@flowbit/shared";

const router = express.Router();

// Helper: normalize Mongoose docs into InvoiceDocument
function normalizeInvoice(doc: any): InvoiceDocument {
  return {
    ...doc,
    _id: doc._id.toString(),
  };
}

// GET /api/invoices - List all invoices with optional search
router.get("/", async (req, res) => {
  try {
    const { q: searchQuery, page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState !== 1) {
      return res
        .status(503)
        .json({ success: false, error: "Database not connected" });
    }

    let query = {};

    if (searchQuery) {
      query = {
        $or: [
          { "vendor.name": { $regex: searchQuery, $options: "i" } },
          { "invoice.number": { $regex: searchQuery, $options: "i" } },
        ],
      };
    }

    const [invoices, total] = await Promise.all([
      InvoiceModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      InvoiceModel.countDocuments(query),
    ]);

    const response: ApiResponse<{
      invoices: InvoiceDocument[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        invoices: invoices.map(normalizeInvoice),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Get invoices error:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch invoices",
    };

    res.status(500).json(response);
  }
});

// GET /api/invoices/:id - Get single invoice
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await InvoiceModel.findById(id).lean();

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    const response: ApiResponse<InvoiceDocument> = {
      success: true,
      data: normalizeInvoice(invoice),
    };

    res.json(response);
  } catch (error) {
    console.error("Get invoice error:", error);

    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch invoice",
    };

    res.status(500).json(response);
  }
});

// POST /api/invoices - Create new invoice
router.post("/", async (req, res) => {
  try {
    const invoiceData = req.body;

    const now = new Date().toISOString();
    invoiceData.createdAt = now;
    invoiceData.updatedAt = now;

    const invoice = new InvoiceModel(invoiceData);
    const savedInvoice = await invoice.save();

    const response: ApiResponse<InvoiceDocument> = {
      success: true,
      data: normalizeInvoice(savedInvoice.toObject()),
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Create invoice error:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    };

    res.status(500).json(response);
  }
});

// PUT /api/invoices/:id - Update invoice
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    updateData.updatedAt = new Date().toISOString();

    const invoice = await InvoiceModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    const response: ApiResponse<InvoiceDocument> = {
      success: true,
      data: normalizeInvoice(invoice),
    };

    res.json(response);
  } catch (error) {
    console.error("Update invoice error:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update invoice",
    };

    res.status(500).json(response);
  }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await InvoiceModel.findByIdAndDelete(id).lean();

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    const response: ApiResponse = {
      success: true,
      data: { message: "Invoice deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Delete invoice error:", error);

    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete invoice",
    };

    res.status(500).json(response);
  }
});

export default router;
