/**
 * Firebase Storage Adapter (for backward compatibility)
 * 
 * Wraps existing Firebase Storage operations to match the StorageAdapter interface.
 */

import { StorageAdapter } from './adapter';

export class FirebaseStorageAdapter implements StorageAdapter {
  /**
   * Upload a file to Firebase Storage
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
   */
  getUrl(key: string): string {
    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bizassistant2-62305643-adad7.firebasestorage.app';
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(key)}`;
  }
}