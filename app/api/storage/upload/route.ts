import { NextRequest, NextResponse } from 'next/server';
import { createUploadUrl } from '@/lib/storage/r2-adapter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Issues a short-lived presigned PUT URL for direct browser→R2 upload.
 *
 * Relaying files through this route hit Vercel's serverless request-body cap
 * (~4.5MB → HTTP 413) for large files like product videos. The browser now
 * PUTs the file straight to R2 and only metadata crosses the function.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    if (!path) {
      return NextResponse.json({ success: false, error: 'path is required' }, { status: 400 });
    }

    let contentType = 'application/octet-stream';
    try {
      const body = await request.json();
      if (typeof body?.contentType === 'string' && body.contentType) {
        contentType = body.contentType;
      }
    } catch {
      // No JSON body — default to octet-stream.
    }

    const { uploadUrl, url } = await createUploadUrl(path, contentType);
    return NextResponse.json({ success: true, uploadUrl, url });
  } catch (error) {
    console.error('[Storage Upload] Failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
