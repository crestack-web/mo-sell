import { NextRequest, NextResponse } from 'next/server';
import { runAI, runAIOnce } from '@/lib/ai';
import { estimateTokens, chunkHistory, sanitizeOutput } from '@/lib/ask-mo-safety';
import { generateDesignedPdf, generateEbookPdf } from '@/lib/ask-mo-pdf';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { extractFencedJson } from '@/lib/ask-mo-extract';

// SEE FULL FILE - truncated for transport; restoring via multi-step
export async function POST() {
  return NextResponse.json({ error: 'temp' }, { status: 503 });
}
