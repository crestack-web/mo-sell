/**
 * Ask MO PDF Generator v2 — cover collage page template (@react-pdf/renderer)
 *
 * A Canva-style one-page overview that opens the ebook:
 *   - Title bar (title + subtitle + badges)
 *   - Left column: 2 large photos + 4-photo strip + 7-DAY MEAL PLAN table
 *   - Right column: WHAT YOU'LL FIND INSIDE, WHY MEAL PREP? (green box),
 *     6 EASY RECIPES 2x3 grid
 *   - Bottom row: Portion Guide / 90-Min Routine / Shopping List / Storage
 *
 * Server-only (imported from lib / API routes).
 */

import { Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { PdfImage } from './ebook_recipe_5page';

export interface MealPlanRow {
  day?: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snack?: string;
  [key: string]: unknown;
}

export interface RecipeGridItem {
  name?: string;
  image_prompt?: string;
}

export interface CoverCollageData {
  title?: string;
  subtitle?: string;
  what_youll_find?: string[];
  why_bullets?: string[];
  image_prompts?: string[];
  badges?: string[];
  meal_plan_table?: MealPlanRow[];
  recipes_grid?: RecipeGridItem[];
}

const TEAL = '#4ECDC4';
const CORAL = '#FF6B6B';
const YELLOW = '#FFE66D';
const GREEN = '#2FA36B';
const DARK = '#222222';
const MUTED = '#666666';
const LINE = '#EFE7D8';
const CREAM = '#FFFDF7';

const styles = StyleSheet.create({
  page: { padding: 20, backgroundColor: CREAM },
  accentBar: { height: 6, backgroundColor: CORAL, marginBottom: 10, borderRadius: 3 },
  titleBar: { backgroundColor: TEAL, borderRadius: 12, padding: 14, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 10, color: 'white', marginTop: 3 },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { backgroundColor: YELLOW, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, fontSize: 7, fontWeight: 'bold', color: DARK },

  topRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  leftCol: { width: '56%' },
  rightCol: { width: '44%' },

  imagesRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bigImage: { width: '48%', height: 150, borderRadius: 10 },
  stripRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  stripImage: { width: '23%', height: 36, borderRadius: 6 },

  tableCard: { backgroundColor: 'white', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: LINE },
  sectionHeading: { fontSize: 11, fontWeight: 'bold', color: DARK, marginBottom: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3ECDD' },
  cell: { padding: 4, fontSize: 6.5, color: DARK },
  cellHead: { fontSize: 7, fontWeight: 'bold', color: 'white' },
  cellHeadRow: { backgroundColor: TEAL, borderBottomWidth: 0 },
  headerCell: { padding: 4 },

  card: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: LINE },

  whyBox: { backgroundColor: GREEN, borderRadius: 10, padding: 12, marginBottom: 12 },
  whyTitle: { fontSize: 11, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  whyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  whyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white', marginRight: 6 },
  whyText: { fontSize: 8, color: 'white' },

  listItem: { fontSize: 8.5, color: DARK, marginBottom: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridCell: { width: '47.5%' },
  gridImage: { width: '100%', height: 44, borderRadius: 8 },
  gridName: { fontSize: 7, fontWeight: 'bold', color: DARK, textAlign: 'center', marginTop: 2 },

  bottomRow: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 9, borderWidth: 1, borderColor: LINE },
  boxTitle: { fontSize: 8.5, fontWeight: 'bold', color: CORAL, marginBottom: 3 },
  boxText: { fontSize: 7, color: MUTED },
});

const Photo = ({ src, style, label }: { src?: PdfImage | undefined; style: Style; label?: string }) =>
  src ? (
    <Image src={src} style={style} />
  ) : (
    <View style={[style, { backgroundColor: '#EAF7F5', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 6, color: '#7CC4BE', textAlign: 'center', padding: 4 }}>{label || 'photo'}</Text>
    </View>
  );

const BOTTOM_BOXES: { title: string; text: string }[] = [
  { title: 'Portion Guide', text: 'Half veg, quarter protein, quarter carbs' },
  { title: '90-Min Routine', text: 'Prep, cook, and pack in 90 minutes' },
  { title: 'Shopping List', text: 'One list, one trip, all week' },
  { title: 'Storage', text: 'Glass containers keep meals fresh' },
];

export interface EbookCoverCollageProps {
  data: CoverCollageData;
  images?: (PdfImage | undefined)[];
  recipeImages?: (PdfImage | undefined)[];
}

export const EbookCoverCollage = ({ data, images, recipeImages }: EbookCoverCollageProps) => {
  const what = Array.isArray(data.what_youll_find) ? data.what_youll_find.slice(0, 6) : [];
  const why = Array.isArray(data.why_bullets) ? data.why_bullets.slice(0, 4) : [];
  const badges = Array.isArray(data.badges) ? data.badges.slice(0, 4) : [];
  const grid = Array.isArray(data.recipes_grid) ? data.recipes_grid.slice(0, 6) : [];

  const tableRows: MealPlanRow[] = (Array.isArray(data.meal_plan_table)
    ? data.meal_plan_table
    : Object.entries(data.meal_plan_table ?? {}).map(([day, meals]) => ({ day, ...(meals as object) }))
  ).slice(0, 7);

  const tableCols: { key: keyof MealPlanRow; label: string; flex: number }[] = [
    { key: 'day', label: 'DAY', flex: 1.1 },
    { key: 'breakfast', label: 'BREAKFAST', flex: 2 },
    { key: 'lunch', label: 'LUNCH', flex: 2 },
    { key: 'dinner', label: 'DINNER', flex: 2 },
    { key: 'snack', label: 'SNACK', flex: 2 },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.accentBar} />

      {/* Title bar */}
      <View style={styles.titleBar}>
        <Text style={styles.title}>{data.title || 'MEAL PREP MADE EASY'}</Text>
        {data.subtitle ? <Text style={styles.subtitle}>{data.subtitle}</Text> : null}
        {badges.length > 0 && (
          <View style={styles.badgesRow}>
            {badges.map((b, i) => (
              <Text key={i} style={styles.badge}>{b}</Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.topRow}>
        {/* Left column: photos + 7-day table */}
        <View style={styles.leftCol}>
          <View style={styles.imagesRow}>
            <Photo src={images?.[0]} style={styles.bigImage} label="cover" />
            <Photo src={images?.[1]} style={styles.bigImage} label="cover" />
          </View>
          <View style={styles.stripRow}>
            {[2, 3, 4, 5].map(i => (
              <Photo key={i} src={images?.[i]} style={styles.stripImage} label="prep" />
            ))}
          </View>

          <View style={styles.tableCard}>
            <Text style={styles.sectionHeading}>7-DAY MEAL PLAN OVERVIEW</Text>
            <View style={[styles.tableRow, styles.cellHeadRow]}>
              {tableCols.map(c => (
                <View key={c.key} style={{ flex: c.flex }}>
                  <Text style={[styles.cell, styles.cellHead]}>{c.label}</Text>
                </View>
              ))}
            </View>
            {tableRows.map((row, ri) => (
              <View key={ri} style={styles.tableRow}>
                {tableCols.map(c => (
                  <View key={c.key} style={{ flex: c.flex }}>
                    <Text style={styles.cell}>{String(row[c.key] ?? '')}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Right column: inside list, why box, recipes grid */}
        <View style={styles.rightCol}>
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>WHAT YOU'LL FIND INSIDE</Text>
            {what.map((item, i) => (
              <Text key={i} style={styles.listItem}>{i + 1}. {item}</Text>
            ))}
          </View>

          <View style={styles.whyBox}>
            <Text style={styles.whyTitle}>WHY MEAL PREP?</Text>
            {why.map((item, i) => (
              <View key={i} style={styles.whyRow}>
                <View style={styles.whyDot} />
                <Text style={styles.whyText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionHeading}>6 EASY RECIPES</Text>
            <View style={styles.grid}>
              {grid.map((r, i) => (
                <View key={i} style={styles.gridCell}>
                  <Photo src={recipeImages?.[i]} style={styles.gridImage} label={r.name} />
                  <Text style={styles.gridName}>{r.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Bottom row: 4 boxes */}
      <View style={styles.bottomRow}>
        {BOTTOM_BOXES.map(b => (
          <View key={b.title} style={styles.box}>
            <Text style={styles.boxTitle}>{b.title}</Text>
            <Text style={styles.boxText}>{b.text}</Text>
          </View>
        ))}
      </View>
    </Page>
  );
};
