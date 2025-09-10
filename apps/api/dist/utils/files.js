"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBufferFromGridFS = exports.streamFromGridFS = exports.saveBufferToGridFS = exports.getFilesBucket = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const stream_1 = require("stream");
let bucket = null;
const getFilesBucket = () => {
    if (bucket)
        return bucket;
    const db = mongoose_1.default.connection.db;
    if (!db) {
        throw new Error('Database not initialized');
    }
    bucket = new mongoose_1.default.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    return bucket;
};
exports.getFilesBucket = getFilesBucket;
const saveBufferToGridFS = async (fileId, buffer, filename, contentType) => {
    const bucket = (0, exports.getFilesBucket)();
    await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(fileId, {
            contentType,
            metadata: { filename },
        });
        stream_1.Readable.from(buffer).pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => resolve());
    });
};
exports.saveBufferToGridFS = saveBufferToGridFS;
const streamFromGridFS = (fileId) => {
    const bucket = (0, exports.getFilesBucket)();
    return bucket.openDownloadStreamByName(fileId);
};
exports.streamFromGridFS = streamFromGridFS;
const readBufferFromGridFS = async (fileId) => {
    const bucket = (0, exports.getFilesBucket)();
    const chunks = [];
    await new Promise((resolve, reject) => {
        bucket.openDownloadStreamByName(fileId)
            .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
            .on('error', reject)
            .on('end', () => resolve());
    });
    return Buffer.concat(chunks);
};
exports.readBufferFromGridFS = readBufferFromGridFS;
//# sourceMappingURL=files.js.map