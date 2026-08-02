/**
 * Firebase Storage Adapter
 * 
 * Wraps Firebase Storage to match the StorageAdapter interface.
 */

export class FirebaseStorageAdapter {
  /**
   * Upload file to Firebase Storage
   */
  async upload(file: File, path: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { getStorage: getFirebaseStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { initializeFirebase } = await import('@/lib/firebase');
    
    const storage = getFirebaseStorage(initializeFirebase().firebaseApp);
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, buffer, { contentType: file.type });
    const downloadUrl = await getDownloadURL(storageRef);
    
    return downloadUrl;
  }

  /**
   * Delete file from Firebase Storage
   */
  async delete(path: string): Promise<void> {
    const { getStorage: getFirebaseStorage, ref, deleteObject } = await import('firebase/storage');
    const { initializeFirebase } = await import('@/lib/firebase');
    
    const storage = getFirebaseStorage(initializeFirebase().firebaseApp);
    const storageRef = ref(storage, path);
    
    await deleteObject(storageRef);
  }
}