"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const files_1 = require("../utils/files");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});
// POST /api/upload
router.post('/', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            const response = {
                success: false,
                error: 'No PDF file provided'
            };
            return res.status(400).json(response);
        }
        // Generate unique file ID
        const fileId = (0, uuid_1.v4)();
        const fileName = req.file.originalname;
        // Persist file to MongoDB GridFS
        await (0, files_1.saveBufferToGridFS)(fileId, req.file.buffer, req.file.originalname, req.file.mimetype);
        const response = {
            success: true,
            data: {
                fileId,
                fileName
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Upload error:', error);
        const response = {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
        res.status(500).json(response);
    }
});
exports.default = router;
// GET /api/upload/:id - Return the uploaded PDF by fileId
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        try {
            const stream = (0, files_1.streamFromGridFS)(id);
            res.setHeader('Content-Type', 'application/pdf');
            return stream.on('error', async (e) => {
                console.error('Stream file error:', e);
                // Legacy fallback: try in-memory store if present
                const fileStore = global.fileStore;
                if (fileStore && fileStore.has(id)) {
                    const file = fileStore.get(id);
                    res.setHeader('Content-Type', file.mimetype || 'application/pdf');
                    res.setHeader('Content-Disposition', `inline; filename="${file.originalname || 'document.pdf'}"`);
                    return res.send(file.buffer);
                }
                return res.status(404).json({ success: false, error: 'File not found' });
            }).pipe(res);
        }
        catch (err) {
            console.error('GridFS load failed, trying legacy store:', err);
            const fileStore = global.fileStore;
            if (fileStore && fileStore.has(id)) {
                const file = fileStore.get(id);
                res.setHeader('Content-Type', file.mimetype || 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${file.originalname || 'document.pdf'}"`);
                return res.send(file.buffer);
            }
            return res.status(404).json({ success: false, error: 'File not found' });
        }
    }
    catch (error) {
        console.error('Get file error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch file' });
    }
});
//# sourceMappingURL=upload.js.map