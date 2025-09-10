"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const Invoice_1 = require("../models/Invoice");
const router = express_1.default.Router();
// Helper: normalize Mongoose docs into InvoiceDocument
function normalizeInvoice(doc) {
    return {
        ...doc,
        _id: doc._id.toString(),
    };
}
// GET /api/invoices - List all invoices with optional search
router.get("/", async (req, res) => {
    try {
        const { q: searchQuery, page = "1", limit = "10" } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        if (mongoose_1.default.connection.readyState !== 1) {
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
            Invoice_1.InvoiceModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Invoice_1.InvoiceModel.countDocuments(query),
        ]);
        const response = {
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
    }
    catch (error) {
        console.error("Get invoices error:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch invoices",
        };
        res.status(500).json(response);
    }
});
// GET /api/invoices/:id - Get single invoice
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_1.InvoiceModel.findById(id).lean();
        if (!invoice) {
            return res
                .status(404)
                .json({ success: false, error: "Invoice not found" });
        }
        const response = {
            success: true,
            data: normalizeInvoice(invoice),
        };
        res.json(response);
    }
    catch (error) {
        console.error("Get invoice error:", error);
        const response = {
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
        const invoice = new Invoice_1.InvoiceModel(invoiceData);
        const savedInvoice = await invoice.save();
        const response = {
            success: true,
            data: normalizeInvoice(savedInvoice.toObject()),
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error("Create invoice error:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create invoice",
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
        const invoice = await Invoice_1.InvoiceModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).lean();
        if (!invoice) {
            return res
                .status(404)
                .json({ success: false, error: "Invoice not found" });
        }
        const response = {
            success: true,
            data: normalizeInvoice(invoice),
        };
        res.json(response);
    }
    catch (error) {
        console.error("Update invoice error:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update invoice",
        };
        res.status(500).json(response);
    }
});
// DELETE /api/invoices/:id - Delete invoice
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_1.InvoiceModel.findByIdAndDelete(id).lean();
        if (!invoice) {
            return res
                .status(404)
                .json({ success: false, error: "Invoice not found" });
        }
        const response = {
            success: true,
            data: { message: "Invoice deleted successfully" },
        };
        res.json(response);
    }
    catch (error) {
        console.error("Delete invoice error:", error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete invoice",
        };
        res.status(500).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=invoices.js.map