/**
 * Storage Abstraction Layer
 * 
 * Provides a unified interface for file storage operations.
 * Supports Cloudflare R2 and Firebase Storage.
 */

export interface StorageAdapter {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

/**
 * Get the appropriate storage adapter based on environment
 */
export function getStorage(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER || 'firebase';
  
  if (provider === 'r2') {
    const { R2StorageAdapter } = require('./r2-adapter');
    return new R2StorageAdapter();
  }
  
  const { FirebaseStorageAdapter } = require('./firebase-adapter');
  return new FirebaseStorageAdapter();
}