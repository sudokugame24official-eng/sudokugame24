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

/**
 * S3-compatible storage. Uses the REST endpoint signature v4 via the AWS SDK
 * only when configured — to avoid a heavy dependency before credentials exist,
 * this implementation is intentionally a fail-fast placeholder that documents
 * exactly what the owner must provide. Wiring @aws-sdk/client-s3 is a 20-line
 * change once credentials are available (documented in OWNER_HANDOVER).
 */
export class S3MediaStorage implements MediaStorage {
  constructor(
    private readonly bucket: string,
    private readonly region: string,
    private readonly publicBaseUrl: string,
  ) {}

  async save(): Promise<StoredFile> {
    throw new BadRequestException(
      'Stockage S3 non configuré : renseignez S3_BUCKET, S3_REGION, S3_PUBLIC_URL ' +
        'et installez @aws-sdk/client-s3 (voir OWNER_HANDOVER.md, section Media).',
    );
  }

  async delete(): Promise<void> {
    // nothing stored — no-op
  }
}

export function createMediaStorage(): MediaStorage {
  const isProd =
    process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
  const s3Configured = !!(
    process.env.S3_BUCKET &&
    process.env.S3_REGION &&
    process.env.S3_PUBLIC_URL
  );
  const allowLocalStorage = process.env.ALLOW_LOCAL_STORAGE === 'true';

  if (s3Configured) {
    return new S3MediaStorage(
      process.env.S3_BUCKET!,
      process.env.S3_REGION!,
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
      'Set S3_BUCKET / S3_REGION / S3_PUBLIC_URL (or explicitly allow local storage via ALLOW_LOCAL_STORAGE=true).',
  );
}
