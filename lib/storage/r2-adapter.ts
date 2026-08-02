/**
 * Cloudflare R2 Storage Adapter
 * 
 * Implements StorageAdapter using Cloudflare R2 (S3-compatible).
 * Provides file upload, delete, and URL generation.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getStorage } from './adapter';

// Initialize R2 client
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET || 'mo-sell-uploads';
const r2PublicUrl = process.env.R2_PUBLIC_URL || `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}`;

if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
  console.warn('[Storage] R2 credentials not fully configured');
}

// Create S3-compatible client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId || 'dummy',
    secretAccessKey: r2SecretAccessKey || 'dummy',
  },
});

/**
 * R2 Storage Adapter Implementation
 */
export class R2StorageAdapter {
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = r2Bucket;
    this.publicUrl = r2PublicUrl;
  }

  /**
   * Upload a file to R2
   * 
   * @param file - File buffer
   * @param key - Storage key (path)
   * @param contentType - MIME type
   * @returns Public URL of uploaded file
   */
  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read', // Make files publicly accessible
      });

      await r2Client.send(command);

      // Return public URL
      return `${this.publicUrl}/${key}`;
    } catch (error) {
      console.error('[Storage] R2 upload failed:', error);
      throw new Error('Failed to upload file to R2');
    }
  }

  /**
   * Delete a file from R2
   * 
   * @param key - Storage key (path)
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await r2Client.send(command);
    } catch (error) {
      console.error('[Storage] R2 delete failed:', error);
      throw new Error('Failed to delete file from R2');
    }
  }

  /**
   * Get public URL for a file
   * 
   * @param key - Storage key (path)
   * @returns Public URL
   */
  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}

/**
 * Firebase Storage Adapter (for backward compatibility)
 */
export class FirebaseStorageAdapter {
  /**
   * Upload a file to Firebase Storage
   * 
   * @param file - File buffer
   * @param key - Storage key (path)
   * @param contentType - MIME type
   * @returns Public URL of uploaded file
   */
  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const { getStorage: getFirebaseStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { initializeFirebase } = await import('@/lib/firebase');
      
      const storage = getFirebaseStorage(initializeFirebase().firebaseApp);
      const storageRef = ref(storage, key);
      
      await uploadBytes(storageRef, file, { contentType });
      const downloadUrl = await getDownloadURL(storageRef);
      
      return downloadUrl;
    } catch (error) {
      console.error('[Storage] Firebase upload failed:', error);
      throw new Error('Failed to upload file to Firebase Storage');
    }
  }

  /**
   * Delete a file from Firebase Storage
   * 
   * @param key - Storage key (path)
   */
  async delete(key: string): Promise<void> {
    try {
      const { getStorage: getFirebaseStorage, ref, deleteObject } = await import('firebase/storage');
      const { initializeFirebase } = await import('@/lib/firebase');
      
      const storage = getFirebaseStorage(initializeFirebase().firebaseApp);
      const storageRef = ref(storage, key);
      
      await deleteObject(storageRef);
    } catch (error) {
      console.error('[Storage] Firebase delete failed:', error);
      throw new Error('Failed to delete file from Firebase Storage');
    }
  }

  /**
   * Get public URL for a file
   * 
   * @param key - Storage key (path)
   * @returns Public URL
   */
  getUrl(key: string): string {
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bizassistant2-62305643-adad7.firebasestorage.app';
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(key)}`;
  }
}

/**
 * Upload a product image
 * 
 * @param businessId - Business ID
 * @param file - Image file buffer
 * @param filename - Original filename
 * @returns Public URL of uploaded image
 */
export async function uploadProductImage(
  businessId: string,
  file: Buffer,
  filename: string
): Promise<string> {
  const storage = getStorage();
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `products/${businessId}/${timestamp}_${sanitizedFilename}`;
  
  // Detect content type
  const contentType = filename.endsWith('.png') ? 'image/png' 
    : filename.endsWith('.gif') ? 'image/gif' 
    : 'image/jpeg';
  
  return await storage.upload(file, key, contentType);
}

/**
 * Delete a product image
 * 
 * @param imageUrl - Full URL of the image to delete
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  const storage = getStorage();
  
  // Extract key from URL
  let key: string;
  if (imageUrl.includes('r2.cloudflarestorage.com')) {
    // R2 URL: https://account.r2.cloudflarestorage.com/bucket/key
    const urlParts = imageUrl.split('/');
    key = urlParts.slice(-2).join('/'); // Get bucket/key part
  } else if (imageUrl.includes('firebasestorage.googleapis.com')) {
    // Firebase URL: extract the o/ path
    const match = imageUrl.match(/\/o\/([^?]+)/);
    key = match ? decodeURIComponent(match[1]) : imageUrl;
  } else {
    key = imageUrl;
  }
  
  await storage.delete(key);
}