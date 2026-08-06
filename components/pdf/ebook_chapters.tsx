/**
 * Ask MO — chapter-based ebook PDF template (@react-pdf/renderer)
 *
 * A clean, branded layout for AI-generated ebooks:
 *   - Cover page (title, subtitle, author, chapter/word meta)
 *   - Table of contents
 *   - One page per chapter (body text auto-flows across pages)
 *   - Closing "Thank you for reading!" page
 *
 * Server-only (imported from lib / API routes).
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface EbookChapter {
  heading?: string;
  body?: string;
}

export interface EbookChaptersData {
  title: string;
  subtitle?: string | null;
  author?: string | null;
  chapters: EbookChapter[];
}

const ACCENT = '#6366F1';
const DARK = '#1a1a1a';
const BODY = '#262626';
const MUTED = '#6b7280';
const FAINT = '#9ca3af';

const styles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 60,
    fontFamily: 'Helvetica',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: ACCENT,
  },
  cover: { flex: 1, justifyContent: 'center' },
  coverTitle: {
    fontSize: 34,
    lineHeight: 1.25,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 14,
  },
  coverSubtitle: { fontSize: 15, lineHeight: 1.6, color: MUTED, marginBottom: 26 },
  coverDivider: { width: 64, height: 3, backgroundColor: ACCENT, marginBottom: 22 },
  coverAuthor: { fontSize: 13, color: MUTED, marginBottom: 12 },
  coverMeta: { fontSize: 10.5, fontFamily: 'Helvetica-Oblique', color: MUTED, marginBottom: 48 },
  coverFooter: { fontSize: 9, color: FAINT },
  pageTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 8 },
  pageDivider: { height: 2, backgroundColor: ACCENT, marginBottom: 20 },
  tocRow: { flexDirection: 'row', marginBottom: 8 },
  tocNum: { width: 30, fontSize: 12.5, fontFamily: 'Helvetica-Bold', color: ACCENT },
  tocName: { flex: 1, fontSize: 12.5, fontFamily: 'Helvetica-Bold', color: DARK },
  chapterMeta: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: ACCENT,
    marginBottom: 6,
  },
  chapterTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 8,
  },
  chapterDivider: { width: 44, height: 2, backgroundColor: ACCENT, marginBottom: 16 },
  chapterBody: { fontSize: 11.5, lineHeight: 1.7, color: BODY },
  thanks: { flex: 1, justifyContent: 'center' },
  thanksTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 10 },
  thanksDivider: { width: 60, height: 3, backgroundColor: ACCENT, marginBottom: 18 },
  thanksBody: { fontSize: 12, lineHeight: 1.7, color: MUTED, marginBottom: 12 },
  thanksLink: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: ACCENT },
});

export function EbookChaptersDocument({ data }: { data: EbookChaptersData }) {
  const { title, subtitle, author, chapters } = data;
  const wordCount = chapters.reduce(
    (sum, ch) => sum + (ch.body ?? '').split(/\s+/).filter(Boolean).length,
    0,
  );

  return (
    <Document title={title}>
      {/* ── Cover ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} fixed />
        <View style={styles.cover}>
          <Text style={styles.coverTitle}>{title}</Text>
          {subtitle ? <Text style={styles.coverSubtitle}>{subtitle}</Text> : null}
          <View style={styles.coverDivider} />
          <Text style={styles.coverAuthor}>{author || 'Busmo Merchant'}</Text>
          <Text style={styles.coverMeta}>
            {chapters.length} chapters · {wordCount.toLocaleString()}+ words · Actionable guide
          </Text>
          <Text style={styles.coverFooter}>
            Powered by Busmo — Africa's Business Operating System
          </Text>
        </View>
      </Page>

      {/* ── Table of Contents ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} fixed />
        <Text style={styles.pageTitle}>Table of Contents</Text>
        <View style={styles.pageDivider} />
        {chapters.map((ch, i) => (
          <View key={i} style={styles.tocRow}>
            <Text style={styles.tocNum}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={styles.tocName}>{ch.heading || `Chapter ${i + 1}`}</Text>
          </View>
        ))}
      </Page>

      {/* ── Chapters ── */}
      {chapters.map((ch, i) => (
        <Page key={i} size="A4" style={styles.page}>
          <View style={styles.accentBar} fixed />
          <Text style={styles.chapterMeta}>CHAPTER {i + 1}</Text>
          <Text style={styles.chapterTitle}>{ch.heading || `Chapter ${i + 1}`}</Text>
          <View style={styles.chapterDivider} />
          <Text style={styles.chapterBody}>{ch.body || ''}</Text>
        </Page>
      ))}

      {/* ── Closing ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.accentBar} fixed />
        <View style={styles.thanks}>
          <Text style={styles.thanksTitle}>Thank you for reading!</Text>
          <View style={styles.thanksDivider} />
          <Text style={styles.thanksBody}>
            This guide was created with Busmo — Africa's business operating system. Busmo helps
            merchants manage their stores, create digital products, and grow their business online.
          </Text>
          <Text style={styles.thanksLink}>Start your store today at busmo.app</Text>
        </View>
      </Page>
    </Document>
  );
}
