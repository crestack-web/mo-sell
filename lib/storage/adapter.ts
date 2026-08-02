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
  const provider = process.env.STORAGE_PROVIDER || 'firebase';
  
  if (provider === 'r2') {
    return new R2StorageAdapter();
  }
  
  return new FirebaseStorageAdapter();
}

// R2 Storage Adapter
export class R2StorageAdapter implements StorageAdapter {
  async upload(file: File, path: string): Promise<string> {
    const { uploadFile } = await import('./r2-adapter');
    return await uploadFile(file, path);
  }

  async delete(path: string): Promise<void> {
    const { deleteFile } = await import('./r2-adapter');
    return await deleteFile(path);
  }
}

// Firebase Storage Adapter
export class FirebaseStorageAdapter implements StorageAdapter {
  async upload(file: File, path: string): Promise<string> {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { uploadToFirebaseStorage } = await import('./firebase-adapter');
    return await uploadToFirebaseStorage(buffer, path, file.type);
  }

  async delete(path: string): Promise<void> {
    const { deleteFromFirebaseStorage } = await import('./firebase-adapter');
    return await deleteFromFirebaseStorage(path);
  }
}