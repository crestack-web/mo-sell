/**
 * Ask MO PDF Generator v2 — 5-page recipe ebook template (@react-pdf/renderer)
 *
 * Renders the JSON produced by Groq into a Canva-style designed PDF:
 *   Page 1: cover (full-bleed photo + brand overlay + title)
 *   Pages 2-4: one recipe per page (image left, ingredients/steps right)
 *   Page 5: call-to-action
 *
 * This file is server-only (imported from API routes / lib). It must never be
 * imported by client components.
 */

import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

export interface EbookPdfPage {
  type: 'cover' | 'recipe' | 'cta';
  title?: string;
  subtitle?: string;
  image_prompt?: string;
  ingredients?: string[];
  steps?: string[];
  ingredients_box_color?: string;
}

export interface EbookPdfData {
  template: string;
  title: string;
  brand_colors?: string[];
  pages: EbookPdfPage[];
}

export type PdfImage = string | Buffer | null;

const styles = StyleSheet.create({
  page: { padding: 40 },
  cover: {
    backgroundColor: '#4ECDC4',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverTitle: { fontSize: 42, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  coverSubtitle: { fontSize: 16, color: 'white', marginTop: 8 },
  recipeTitle: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  twoCol: { flexDirection: 'row', gap: 20 },
  image: { width: '45%', height: 200, borderRadius: 12 },
  content: { width: '55%' },
  box: { padding: 12, borderRadius: 8, marginBottom: 12 },
  boxTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  listItem: { fontSize: 11, marginBottom: 4 },
  cta: { backgroundColor: '#FFE66D', padding: 30, borderRadius: 16, alignItems: 'center' },
  coverImage: { position: 'absolute', width: '100%', height: '100%', opacity: 0.4 },
});

const DEFAULT_BOX_COLOR = '#D9F4F2';
const STEPS_BOX_COLOR = '#FFF1D6';

interface EbookRecipe5PageProps {
  data: EbookPdfData;
  images?: (PdfImage | undefined)[];
}

export const EbookRecipe5Page = ({ data, images }: EbookRecipe5PageProps) => (
  <Document title={data.title}>
    {data.pages.map((page, i) => {
      const img = images?.[i] ?? null;

      if (page.type === 'cover') {
        const brandColor = Array.isArray(data.brand_colors) && data.brand_colors[0] ? data.brand_colors[0] : '#4ECDC4';
        return (
          <Page key={i} style={[styles.page, { padding: 0 }]}>
            <View style={[styles.cover, { backgroundColor: brandColor }]}>
              {img && <Image src={img} style={styles.coverImage} />}
              <Text style={styles.coverTitle}>{data.title}</Text>
              {page.subtitle ? <Text style={styles.coverSubtitle}>{page.subtitle}</Text> : null}
            </View>
          </Page>
        );
      }

      if (page.type === 'recipe') {
        const ingredients = Array.isArray(page.ingredients) ? page.ingredients : [];
        const steps = Array.isArray(page.steps) ? page.steps : [];
        return (
          <Page key={i} style={styles.page}>
            <Text style={styles.recipeTitle}>{page.title}</Text>
            <View style={styles.twoCol}>
              {img && <Image src={img} style={styles.image} />}
              <View style={styles.content}>
                <View style={[styles.box, { backgroundColor: page.ingredients_box_color || DEFAULT_BOX_COLOR }]}>
                  <Text style={styles.boxTitle}>Ingredients</Text>
                  {ingredients.map((item, idx) => (
                    <Text key={idx} style={styles.listItem}>• {item}</Text>
                  ))}
                </View>
                <View style={[styles.box, { backgroundColor: STEPS_BOX_COLOR }]}>
                  <Text style={styles.boxTitle}>Steps</Text>
                  {steps.map((step, idx) => (
                    <Text key={idx} style={styles.listItem}>{idx + 1}. {step}</Text>
                  ))}
                </View>
              </View>
            </View>
          </Page>
        );
      }

      // cta page
      return (
        <Page key={i} style={[styles.page, { justifyContent: 'center' }]}>
          <View style={styles.cta}>
            <Text style={{ ...styles.coverTitle, color: '#222', fontSize: 28 }}>{page.title}</Text>
            {page.subtitle ? <Text style={{ marginTop: 8, fontSize: 13, color: '#555' }}>{page.subtitle}</Text> : null}
          </View>
        </Page>
      );
    })}
  </Document>
);
