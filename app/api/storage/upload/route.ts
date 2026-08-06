import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage/r2-adapter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    if (!path) {
      return NextResponse.json({ success: false, error: 'path is required' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'file is required' }, { status: 400 });
    }

    const url = await uploadFile(file, path);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('[Storage Upload] Failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
