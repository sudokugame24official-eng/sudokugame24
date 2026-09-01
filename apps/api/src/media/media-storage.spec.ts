import { BadRequestException } from '@nestjs/common';
import { LocalMediaStorage, createMediaStorage } from './media-storage';

describe('P1-J: media storage abstraction', () => {
  it('LocalMediaStorage saves and deletes files (real FS execution)', async () => {
    const dir = __dirname + '/../../../.tmp-media-test';
    const storage = new LocalMediaStorage(dir, '/uploads');

    const stored = await storage.save(Buffer.from('hello'), 'test.png', 'image/png');
    expect(stored.url).toMatch(/^\/uploads\//);
    expect(stored.sizeBytes).toBe(5);

    const stored2 = await storage.save(
      Buffer.from('<svg onload=alert(1)>'),
      'evil.svg',
      'image/svg+xml'
    );
    expect(stored2.key).not.toBe(stored.key);

    await storage.delete(stored.key);
    await storage.delete(stored2.key);
  });

  describe('Configuration Resolution', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
      delete process.env.R2_ACCOUNT_ID;
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
      delete process.env.R2_MEDIA_BUCKET;
      delete process.env.S3_PUBLIC_URL;
      delete process.env.ALLOW_LOCAL_STORAGE;
      delete process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('1. production + R2 configuré → S3MediaStorage', () => {
      process.env.NODE_ENV = 'production';
      process.env.R2_ACCOUNT_ID = 'account-id';
      process.env.R2_ACCESS_KEY_ID = 'access-key';
      process.env.R2_SECRET_ACCESS_KEY = 'secret-key';
      process.env.R2_MEDIA_BUCKET = 'test-bucket';
      process.env.S3_PUBLIC_URL = 'https://cdn.example.com';
      
      const storage = createMediaStorage();
      // Since it's exported but not imported, we can check constructor name
      expect(storage.constructor.name).toBe('S3MediaStorage');
    });

    it('2. production + R2 absent + ALLOW_LOCAL_STORAGE=true → LocalMediaStorage', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_LOCAL_STORAGE = 'true';
      
      const storage = createMediaStorage();
      expect(storage).toBeInstanceOf(LocalMediaStorage);
    });

    it('3. production + R2 absent + ALLOW_LOCAL_STORAGE absent/false → erreur', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_LOCAL_STORAGE = 'false';
      
      expect(() => createMediaStorage()).toThrow(
        /FATAL: media storage is not configured for production/
      );

      delete process.env.ALLOW_LOCAL_STORAGE;
      expect(() => createMediaStorage()).toThrow(
        /FATAL: media storage is not configured for production/
      );
    });

    it('4. development + S3 absent → LocalMediaStorage', () => {
      process.env.NODE_ENV = 'development';
      
      const storage = createMediaStorage();
      expect(storage).toBeInstanceOf(LocalMediaStorage);
    });
  });
});
