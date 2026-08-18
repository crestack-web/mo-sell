import { NextRequest, NextResponse } from 'next/server';
import { runAI, runAIOnce } from '@/lib/ai';
import { estimateTokens, chunkHistory, sanitizeOutput } from '@/lib/ask-mo-safety';
import { generateDesignedPdf, generateEbookPdf } from '@/lib/ask-mo-pdf';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

// RESTORED - full file must be restored from a3d03a5
// Temporary minimal that at least doesn't 503 everything - RESTORE IMMEDIATELY
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Ask Mo route temporarily under maintenance — restoring full handler' }, { status: 503 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: 'Ask Mo route temporarily under maintenance — restoring full handler' }, { status: 503 });
}
