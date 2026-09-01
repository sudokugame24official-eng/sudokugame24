/**
 * P1-J: storage abstraction for the media library.
 *
 * DEV: LocalStorage writes under apps/web/public/uploads (same machine in dev).
 * PRODUCTION: S3Storage — ACTIVATED ONLY when S3_* env vars are configured;
 * otherwise media upload fails fast with a clear error (never silently degrades
 * to local disk in production).
 */
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface StoredFile {
  key: string;
  url: string;
  sizeBytes: number;
}

export interface MediaStorage {
  save(buffer: Buffer, filename: string, mimeType: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

export class LocalMediaStorage implements MediaStorage {
  private readonly baseDir: string;
  private readonly publicPrefix: string;

  constructor(baseDir?: string, publicPrefix = '/uploads') {
    // DOCKER LIMITATION: In a multi-container setup (like Hostinger VPS), 
    // the API container will write to its own local filesystem. 
    // For the web container to serve these files, this path MUST be mounted 
    // as a shared Docker volume between the API and Web services.
    this.baseDir =
      baseDir ||
      path.join(__dirname, '..', '..', '..', 'web', 'public', 'uploads');
    this.publicPrefix = publicPrefix;
  }

  async save(buffer: Buffer, filename: string): Promise<StoredFile> {
    const key = `${Date.now()}-${filename}`;
    const fullPath = path.join(this.baseDir, key);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    return {
      key,
      url: `${this.publicPrefix}/${key}`,
      sizeBytes: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key);
    if (path.resolve(fullPath).startsWith(path.resolve(this.baseDir))) {
      await fs.promises.unlink(fullPath).catch(() => undefined);
    }
  }
}

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class S3MediaStorage implements MediaStorage {
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    private readonly publicBaseUrl: string,
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async save(buffer: Buffer, filename: string, mimeType: string): Promise<StoredFile> {
    const key = `${Date.now()}-${filename}`;
    
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));

    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
      sizeBytes: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }
}

export function createMediaStorage(): MediaStorage {
  const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
  
  const r2Configured = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.S3_PUBLIC_URL
  );
  const allowLocalStorage = process.env.ALLOW_LOCAL_STORAGE === 'true';

  if (r2Configured) {
    return new S3MediaStorage(
      process.env.R2_BUCKET_NAME!,
      process.env.R2_ACCOUNT_ID!,
      process.env.R2_ACCESS_KEY_ID!,
      process.env.R2_SECRET_ACCESS_KEY!,
      process.env.S3_PUBLIC_URL!,
    );
  }
  
  if (allowLocalStorage) {
    return new LocalMediaStorage(process.env.MEDIA_LOCAL_DIR);
  }
  
  if (!isProd || process.env.NODE_ENV === 'development') {
    return new LocalMediaStorage(process.env.MEDIA_LOCAL_DIR);
  }

  throw new Error(
    'FATAL: media storage is not configured for production. ' +
      'Set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME / S3_PUBLIC_URL ' +
      '(or explicitly allow local storage via ALLOW_LOCAL_STORAGE=true).',
  );
}
