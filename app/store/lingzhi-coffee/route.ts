import { readFile } from 'fs/promises';
import path from 'path';

const FILE_NAME = 'lingzhi-coffee.html';

async function loadHtml() {
  const candidates = [
    path.join(process.cwd(), 'app', 'store', 'lingzhi-coffee', FILE_NAME),
    path.join(process.cwd(), '.next', 'server', 'app', 'store', 'lingzhi-coffee', FILE_NAME),
  ];

  let lastError: unknown;
  for (const filePath of candidates) {
    try {
      return await readFile(filePath);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

export async function GET() {
  try {
    const html = await loadHtml();
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch {
    return new Response('Lingzhi Coffee page not found.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

