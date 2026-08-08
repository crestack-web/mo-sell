/**
 * Cloudflare R2 Storage Adapter
 * 
 * Implements storage operations using Cloudflare R2 (S3-compatible).
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

// Browser→R2 PUTs (presigned URLs) require CORS on the bucket. Set it once per
// serverless instance; failures are non-fatal so a CORS miss surfaces clearly
// in the browser instead of silently breaking every upload.
let corsConfigured: Promise<boolean> | null = null;

async function ensureBucketCors(): Promise<void> {
  if (!corsConfigured) {
    corsConfigured = r2Client
      .send(
        new PutBucketCorsCommand({
          Bucket: r2Bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: ['*'],
                AllowedMethods: ['PUT', 'GET', 'HEAD', 'POST', 'DELETE'],
                AllowedHeaders: ['*'],
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      )
      .then(() => true)
      .catch((err) => {
        console.warn('[R2] Failed to configure bucket CORS (browser uploads may be blocked):', err);
        return false;
      });
  }
  await corsConfigured;
}

/**
 * Create a short-lived presigned PUT URL so the browser can upload the file
 * directly to R2 — this bypasses serverless body-size limits (Vercel caps
 * request bodies at ~4.5MB, which breaks video/product file uploads).
 *
 * @param path - Storage path (key) in the bucket
 * @param contentType - MIME type of the file being uploaded
 * @returns { uploadUrl, url } — uploadUrl for the browser PUT, url is the
 *          public URL the file will be served from
 */
export async function createUploadUrl(
  path: string,
  contentType: string,
): Promise<{ uploadUrl: string; url: string }> {
  try {
    if (!r2PublicUrl) {
      throw new Error('R2_PUBLIC_URL is not configured');
    }

    await ensureBucketCors();

    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: path,
      ContentType: contentType || 'application/octet-stream',
    });
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    return { uploadUrl, url: `${r2PublicUrl}/${path}` };
  } catch (error) {
    console.error('[R2] Failed to create upload URL:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create upload URL');
  }
}

/**
 * Upload a file to R2
 * 
 * @param file - File object to upload
 * @param path - Storage path (key) in the bucket
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    if (!r2PublicUrl) {
      throw new Error('R2_PUBLIC_URL is not configured');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: path,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    return `${r2PublicUrl}/${path}`;
  } catch (error) {
    console.error('[R2] Upload failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload file to R2');
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