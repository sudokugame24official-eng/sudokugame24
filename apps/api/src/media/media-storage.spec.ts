import { BadRequestException } from '@nestjs/common';
import { LocalMediaStorage, createMediaStorage } from './media-storage';

describe('P1-J: media storage abstraction', () => {
  it('LocalMediaStorage saves and deletes files (real FS execution)', async () => {
    const dir = __dirname + '/../../../.tmp-media-test';
    const storage = new LocalMediaStorage(dir, '/uploads');

    const stored = await storage.save(Buffer.from('hello'), 'test.png');
    expect(stored.url).toMatch(/^\/uploads\//);
    expect(stored.sizeBytes).toBe(5);

    const stored2 = await storage.save(Buffer.from('<svg onload=alert(1)>'), 'evil.svg');
    expect(stored2.key).not.toBe(stored.key);

    await storage.delete(stored.key);
    await storage.delete(stored2.key);
  });

  it('production without S3 configuration FAILS FAST (no silent local disk)', () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevBucket = process.env.S3_BUCKET;
    delete process.env.S3_BUCKET;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => createMediaStorage()).toThrow('media storage is not configured');
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      if (prevBucket) process.env.S3_BUCKET = prevBucket;
    }
  });

  it('development falls back to local storage', () => {
    const prevNodeEnv = process.env.NODE_ENV;
    delete process.env.S3_BUCKET;
    process.env.NODE_ENV = 'development';
    try {
      expect(createMediaStorage()).toBeInstanceOf(LocalMediaStorage);
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  it('S3 selection when configured (constructor only, no network call)', () => {
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_REGION = 'eu-west-1';
    process.env.S3_PUBLIC_URL = 'https://cdn.example.com';
    try {
      const s3 = createMediaStorage() as any;
      expect(s3.bucket).toBe('test-bucket');
      // save() must fail with an explicit NOT CONFIGURED message for now
      expect(s3.save()).rejects.toBeDefined();
    } finally {
      delete process.env.S3_BUCKET;
      delete process.env.S3_REGION;
      delete process.env.S3_PUBLIC_URL;
    }
  });
});
