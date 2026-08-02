/**
 * Cloudflare R2 Storage Adapter
 * 
 * Implements storage operations using Cloudflare R2 (S3-compatible).
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Read environment variables
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = 'mo-sell';
const r2PublicUrl = process.env.R2_PUBLIC_URL;

if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
  console.warn('[R2] Missing credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
}

// Create S3-compatible client for R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId || 'dummy',
    secretAccessKey: r2SecretAccessKey || 'dummy',
  },
  forcePathStyle: true,
});

/**
 * Upload a file to R2
 * 
 * @param file - File object to upload
 * @param path - Storage path (key) in the bucket
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: path,
      Body: buffer,
      ContentType: file.type,
      ACL: 'public-read',
    });

    await r2Client.send(command);

    return `${r2PublicUrl}/${path}`;
  } catch (error) {
    console.error('[R2] Upload failed:', error);
    throw new Error('Failed to upload file to R2');
  }
}

/**
 * Delete a file from R2
 * 
 * @param path - Storage path (key) in the bucket
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: r2Bucket,
      Key: path,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('[R2] Delete failed:', error);
    throw new Error('Failed to delete file from R2');
  }
}