import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { saveBufferToGridFS, streamFromGridFS } from '../utils/files';
import { ApiResponse, UploadResponse } from '@flowbit/shared';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// POST /api/upload
router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: 'No PDF file provided'
      };
      return res.status(400).json(response);
    }

    // Generate unique file ID
    const fileId = uuidv4();
    const fileName = req.file.originalname;

    // Persist file to MongoDB GridFS
    await saveBufferToGridFS(fileId, req.file.buffer, req.file.originalname, req.file.mimetype);
    
    const response: ApiResponse<UploadResponse> = {
      success: true,
      data: {
        fileId,
        fileName
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
    
    res.status(500).json(response);
  }
});

export default router;
 
// GET /api/upload/:id - Return the uploaded PDF by fileId
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const stream = streamFromGridFS(id);
      res.setHeader('Content-Type', 'application/pdf');
      return stream.on('error', async (e) => {
        console.error('Stream file error:', e);
        // Legacy fallback: try in-memory store if present
        const fileStore = (global as any).fileStore as Map<string, any> | undefined;
        if (fileStore && fileStore.has(id)) {
          const file = fileStore.get(id);
          res.setHeader('Content-Type', file.mimetype || 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${file.originalname || 'document.pdf'}"`);
          return res.send(file.buffer);
        }
        return res.status(404).json({ success: false, error: 'File not found' });
      }).pipe(res);
    } catch (err) {
      console.error('GridFS load failed, trying legacy store:', err);
      const fileStore = (global as any).fileStore as Map<string, any> | undefined;
      if (fileStore && fileStore.has(id)) {
        const file = fileStore.get(id);
        res.setHeader('Content-Type', file.mimetype || 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${file.originalname || 'document.pdf'}"`);
        return res.send(file.buffer);
      }
      return res.status(404).json({ success: false, error: 'File not found' });
    }
  } catch (error) {
    console.error('Get file error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch file' });
  }
});