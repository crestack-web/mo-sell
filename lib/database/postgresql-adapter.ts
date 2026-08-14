/**
 * Supabase PostgreSQL Adapter
 * 
 * Implements the DatabaseAdapter interface using Supabase client.
 * This allows the app to use PostgreSQL via Supabase instead of Firestore.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DatabaseAdapter,
  CollectionAdapter,
  DocumentAdapter,
  QueryAdapter,
  BatchAdapter,
} from './adapter';

// Lazy initialization of Supabase client to avoid build-time errors
let supabaseServerInstance: SupabaseClient | null = null;

function readAccessToken(supabaseUrl: string): string | null {
  try {
    const ref = supabaseUrl.replace('https://', '').split('.')[0];
    const raw = window.localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

export function getSupabaseServer(): SupabaseClient {
  if (supabaseServerInstance) {
    return supabaseServerInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  supabaseServerInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseServerInstance;
}

// Export for backward compatibility (deprecated - use getSupabaseServer() instead)
export const supabaseServer = new Proxy({} as any, {
  get: () => getSupabaseServer(),
});

/**
 * Supabase Adapter Implementation
 * Maps Firestore-like operations to Supabase PostgreSQL queries
 */
export class SupabaseAdapter implements DatabaseAdapter {
  private supabase: SupabaseClient;

  constructor() {
    // Initialize with mock client during build time
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
    const isClient = typeof window !== 'undefined';
    const supabaseKey = isClient
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
      : process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'mock-key';

    // On the client, attach the signed-in user's access token so RLS
    // policies (e.g. `id = auth.uid()`) resolve correctly for own rows.
    const headers: Record<string, string> = {};
    if (isClient && supabaseUrl && !supabaseUrl.includes('mock')) {
      const token = readAccessToken(supabaseUrl);
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers,
      },
    });
  }

  collection(name: string): CollectionAdapter {
    // Normalize Firestore subcollection paths to flat tables:
    //   "businesses/{businessId}/storeOrders" -> table "storeOrders"
    //   scoped by businessId (Firestore scoped subcollections by their parent
    //   document, so the flattened table must apply the same implicit filter).
    let tableName = name;
    let businessId: string | undefined;
    const sub = name.match(/^businesses\/([^/]+)\/(.+)$/);
    if (sub) {
      businessId = sub[1];
      tableName = sub[2];
    }
    return new SupabaseCollection(this.supabase, tableName, businessId);
  }

  doc(path: string): DocumentAdapter {
    // Parse path like "businesses/{businessId}/store/config"
    const parts = path.split('/');

    if (parts.length === 4) {
      // "businesses/{businessId}/store/config" maps to the businesses row;
      // "businesses/{businessId}/storeOrders/{orderId}" maps to the storeOrders row.
      if (parts[2] === 'store' && parts[3] === 'config') {
        return new SupabaseDocument(this.supabase, parts[0], parts[1], path);
      }
      return new SupabaseDocument(this.supabase, parts[2], parts[3], path);
    }

    const collectionName = parts[0];
    const docId = parts[1] || '';

    return new SupabaseDocument(
      this.supabase,
      collectionName,
      docId,
      path
    );
  }

  batch(): BatchAdapter {
    return new SupabaseBatch(this.supabase);
  }
}

/**
 * Supabase Collection Implementation
 */
class SupabaseCollection implements CollectionAdapter {
  private supabase: SupabaseClient;
  private tableName: string;
  private businessId?: string;

  constructor(
    supabase: SupabaseClient,
    tableName: string,
    businessId?: string
  ) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.businessId = businessId;
  }

  doc(id?: string): DocumentAdapter {
    const docId = id || '';
    return new SupabaseDocument(this.supabase, this.tableName, docId, `${this.tableName}/${docId}`, this.businessId);
  }

  where(field: string, op: string, value: any): QueryAdapter {
    return new SupabaseQuery(this.supabase, this.tableName, this.businessId, field, op, value);
  }

  limit(n: number): QueryAdapter {
    return new SupabaseQuery(this.supabase, this.tableName, this.businessId).limit(n);
  }

  async count(): Promise<{ data: { count: number } }> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (this.businessId) {
      query = query.eq('businessId', this.businessId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return { data: { count: count || 0 } };
  }

  async add(data: any): Promise<{ id: string }> {
    const payload = this.businessId ? { ...data, businessId: this.businessId } : data;
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(payload)
      .select('id')
      .single();

    if (error) throw error;
    return { id: result.id };
  }
}

/**
 * Supabase Document Implementation
 */
class SupabaseDocument implements DocumentAdapter {
  id: string;
  private tableName: string;
  private businessId?: string;

  constructor(
    private supabase: SupabaseClient,
    tableName: string,
    docId: string,
    private path: string,
    businessId?: string
  ) {
    this.id = docId;
    this.tableName = tableName;
    this.businessId = businessId;
  }

  private scopedQuery<T>(query: any): any {
    if (this.businessId) {
      return query.eq('businessId', this.businessId);
    }
    return query;
  }

  async get(): Promise<{ exists: boolean; data(): any }> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', this.id);
    query = this.scopedQuery(query);

    const { data, error } = await query.single();

    if (error || !data) {
      return { exists: false, data: () => null };
    }

    return { exists: true, data: () => data };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    const payload = this.businessId ? { id: this.id, ...data, businessId: this.businessId } : { id: this.id, ...data };
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert(payload);

    if (error) throw error;
  }

  async update(data: any): Promise<void> {
    let query = this.supabase
      .from(this.tableName)
      .update(data)
      .eq('id', this.id);
    query = this.scopedQuery(query);

    const { error } = await query;

    if (error) throw error;
  }

  async delete(): Promise<void> {
    let query = this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', this.id);
    query = this.scopedQuery(query);

    const { error } = await query;

    if (error) throw error;
  }
}

/**
 * Supabase Query Implementation
 */
class SupabaseQuery implements QueryAdapter {
  private filters: Array<{ field: string; op: string; value: any }> = [];
  private limitValue?: number;
  private businessId?: string;

  constructor(
    private supabase: SupabaseClient,
    private tableName: string,
    businessId?: string,
    field?: string,
    op?: string,
    value?: any
  ) {
    this.businessId = businessId;
    if (field && op && value !== undefined) {
      this.filters.push({ field, op, value });
    }
  }

  where(field: string, op: string, value: any): QueryAdapter {
    this.filters.push({ field, op, value });
    return this;
  }

  limit(n: number): QueryAdapter {
    this.limitValue = n;
    return this;
  }

  async get(): Promise<{ docs: { id: string; data(): any }[] }> {
    let query = this.supabase.from(this.tableName).select('*');

    // Implicit scope from a "businesses/{businessId}/..." subcollection path
    if (this.businessId) {
      query = query.eq('businessId', this.businessId);
    }

    // Apply filters
    for (const filter of this.filters) {
      switch (filter.op) {
        case '==':
          query = query.eq(filter.field, filter.value);
          break;
        case '!=':
          query = query.neq(filter.field, filter.value);
          break;
        case '>':
          query = query.gt(filter.field, filter.value);
          break;
        case '>=':
          query = query.gte(filter.field, filter.value);
          break;
        case '<':
          query = query.lt(filter.field, filter.value);
          break;
        case '<=':
          query = query.lte(filter.field, filter.value);
          break;
        case 'in':
          query = query.in(filter.field, filter.value);
          break;
        case 'array-contains':
          query = query.contains(filter.field, filter.value);
          break;
        default:
          throw new Error(`Unsupported operator: ${filter.op}`);
      }
    }

    // Apply limit
    if (this.limitValue) {
      query = query.limit(this.limitValue);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      docs: data.map((row: any) => ({
        id: row.id,
        data: () => row,
      })),
    };
  }
}

/**
 * Supabase Batch Implementation
 * Note: Supabase doesn't have true batch writes like Firestore
 * We'll simulate it by queuing operations and executing them
 */
class SupabaseBatch implements BatchAdapter {
  private operations: Array<{
    type: 'set' | 'update';
    table: string;
    id: string;
    data: any;
  }> = [];

  constructor(private supabase: SupabaseClient) {}

  set(ref: DocumentAdapter, data: any): void {
    this.operations.push({
      type: 'set',
      table: (ref as any).tableName || 'unknown',
      id: ref.id,
      data,
    });
  }

  update(ref: DocumentAdapter, data: any): void {
    this.operations.push({
      type: 'update',
      table: (ref as any).tableName || 'unknown',
      id: ref.id,
      data,
    });
  }

  async commit(): Promise<void> {
    // Execute all operations
    for (const op of this.operations) {
      if (op.type === 'set') {
        const { error } = await this.supabase
          .from(op.table)
          .upsert({ id: op.id, ...op.data });

        if (error) throw error;
      } else if (op.type === 'update') {
        const { error } = await this.supabase
          .from(op.table)
          .update(op.data)
          .eq('id', op.id);

        if (error) throw error;
      }
    }

    this.operations = [];
  }
}

