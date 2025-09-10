import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
export declare const getFilesBucket: () => GridFSBucket;
export declare const saveBufferToGridFS: (fileId: string, buffer: Buffer, filename: string, contentType: string) => Promise<void>;
export declare const streamFromGridFS: (fileId: string) => mongoose.mongo.GridFSBucketReadStream;
export declare const readBufferFromGridFS: (fileId: string) => Promise<Buffer>;
//# sourceMappingURL=files.d.ts.map