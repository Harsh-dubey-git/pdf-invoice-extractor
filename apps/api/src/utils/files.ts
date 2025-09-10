import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import { Readable } from 'stream';

let bucket: GridFSBucket | null = null;

export const getFilesBucket = (): GridFSBucket => {
  if (bucket) return bucket;
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not initialized');
  }
  bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
  return bucket;
};

export const saveBufferToGridFS = async (
  fileId: string,
  buffer: Buffer,
  filename: string,
  contentType: string
) => {
  const bucket = getFilesBucket();
  await new Promise<void>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(fileId, {
      contentType,
      metadata: { filename },
    });
    Readable.from(buffer).pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve());
  });
};

export const streamFromGridFS = (fileId: string) => {
  const bucket = getFilesBucket();
  return bucket.openDownloadStreamByName(fileId);
};

export const readBufferFromGridFS = async (fileId: string): Promise<Buffer> => {
  const bucket = getFilesBucket();
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    bucket.openDownloadStreamByName(fileId)
      .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      .on('error', reject)
      .on('end', () => resolve());
  });
  return Buffer.concat(chunks);
};


