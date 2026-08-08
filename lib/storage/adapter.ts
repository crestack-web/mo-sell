/**
 * Storage Abstraction Layer
 * 
 * Provides a unified interface for file storage operations.
 * Supports Cloudflare R2 and Firebase Storage.
 */

export interface StorageAdapter {
  upload(file: File, path: string): Promise<string>;
  delete(path: string): Promise<void>;
}

/**
 * Get the appropriate storage adapter based on environment
 */
export function getStorage(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER || 'r2';
  
  if (provider === 'r2') {
    return new R2StorageAdapter();
  }
  
  return new FirebaseStorageAdapter();
}

// R2 Storage Adapter
export class R2StorageAdapter implements StorageAdapter {
  async upload(file: File, path: string): Promise<string> {
    // R2 credentials are server-only env vars, so the browser asks the server
    // for a short-lived presigned PUT URL, then uploads directly to R2. On the
    // server we upload directly without a round trip.
    if (typeof window === 'undefined') {
      const { uploadFile } = await import('./r2-adapter');
      return await uploadFile(file, path);
    }

    // 1. Ask the server for a presigned PUT URL (small JSON request).
    const res = await fetch(`/api/storage/upload?path=${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: file.type || 'application/octet-stream' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.uploadUrl) {
      throw new Error(data.error || 'Upload failed');
    }

    // 2. PUT the file straight to R2 — no serverless body-size limits.
    const putRes = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed (${putRes.status})`);
    }

    return data.url;
  }

  async delete(path: string): Promise<void> {
    const { deleteFile } = await import('./r2-adapter');
    return await deleteFile(path);
  }
}

// Firebase Storage Adapter
export class FirebaseStorageAdapter implements StorageAdapter {
  async upload(file: File, path: string): Promise<string> {
    const { FirebaseStorageAdapter } = await import('./firebase-adapter');
    const adapter = new FirebaseStorageAdapter();
    return await adapter.upload(file, path);
  }

  async delete(path: string): Promise<void> {
    const { FirebaseStorageAdapter } = await import('./firebase-adapter');
    const adapter = new FirebaseStorageAdapter();
    return await adapter.delete(path);
  }
}