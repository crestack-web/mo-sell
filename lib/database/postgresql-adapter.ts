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

// Initialize Supabase client with service key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Supabase Adapter Implementation
 * Maps Firestore-like operations to Supabase PostgreSQL queries
 */
export class SupabaseAdapter implements DatabaseAdapter {
  private supabase: SupabaseClient = supabaseServer;

  collection(name: string): CollectionAdapter {
    return new SupabaseCollection(this.supabase, name);
  }

  doc(path: string): DocumentAdapter {
    // Parse path like "businesses/{businessId}/store/config"
    const parts = path.split('/');
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

  constructor(
    supabase: SupabaseClient,
    tableName: string
  ) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  doc(id?: string): DocumentAdapter {
    const docId = id || '';
    return new SupabaseDocument(this.supabase, this.tableName, docId, `${this.tableName}/${docId}`);
  }

  where(field: string, op: string, value: any): QueryAdapter {
    return new SupabaseQuery(this.supabase, this.tableName, field, op, value);
  }

  limit(n: number): QueryAdapter {
    return new SupabaseQuery(this.supabase, this.tableName);
  }

  async count(): Promise<{ data: { count: number } }> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return { data: { count: count || 0 } };
  }

  async add(data: any): Promise<{ id: string }> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
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

  constructor(
    private supabase: SupabaseClient,
    tableName: string,
    docId: string,
    private path: string
  ) {
    this.id = docId;
    this.tableName = tableName;
  }

  async get(): Promise<{ exists: boolean; data(): any }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', this.id)
      .single();

    if (error || !data) {
      return { exists: false, data: () => null };
    }

    return { exists: true, data: () => data };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .upsert({ id: this.id, ...data });

    if (error) throw error;
  }

  async update(data: any): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq('id', this.id);

    if (error) throw error;
  }

  async delete(): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', this.id);

    if (error) throw error;
  }
}

/**
 * Supabase Query Implementation
 */
class SupabaseQuery implements QueryAdapter {
  private filters: Array<{ field: string; op: string; value: any }> = [];
  private limitValue?: number;

  constructor(
    private supabase: SupabaseClient,
    private tableName: string,
    field?: string,
    op?: string,
    value?: any
  ) {
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

/**
 * Firestore Adapter (for backward compatibility during migration)
 * This wraps the existing Firebase Firestore implementation
 */
export class FirestoreAdapter implements DatabaseAdapter {
  collection(name: string): CollectionAdapter {
    const { getServerFirestore } = require('@/lib/server-firestore');
    const db = getServerFirestore();
    
    return new FirestoreCollection(db, name);
  }

  doc(path: string): DocumentAdapter {
    const { getServerFirestore } = require('@/lib/server-firestore');
    const db = getServerFirestore();
    
    const parts = path.split('/');
    const collectionName = parts[0];
    const docId = parts[1] || '';
    
    return new FirestoreDocument(db, collectionName, docId);
  }

  batch(): BatchAdapter {
    const { getServerFirestore } = require('@/lib/server-firestore');
    const db = getServerFirestore();
    
    return new FirestoreBatch(db);
  }
}

/**
 * Firestore Collection Wrapper
 */
class FirestoreCollection implements CollectionAdapter {
  constructor(private db: any, private name: string) {}

  doc(id?: string): DocumentAdapter {
    return new FirestoreDocument(this.db, this.name, id || '');
  }

  where(field: string, op: string, value: any): QueryAdapter {
    return new FirestoreQuery(this.db, this.name, field, op, value);
  }

  limit(n: number): QueryAdapter {
    return new FirestoreQuery(this.db, this.name, '', '', null).limit(n);
  }

  async count(): Promise<{ data: { count: number } }> {
    const snap = await this.db.collection(this.name).count().get();
    return { data: { count: snap.data().count } };
  }

  async add(data: any): Promise<{ id: string }> {
    const ref = await this.db.collection(this.name).add(data);
    return { id: ref.id };
  }
}

/**
 * Firestore Document Wrapper
 */
class FirestoreDocument implements DocumentAdapter {
  id: string;
  private ref: any;
  private collectionName: string;

  constructor(db: any, collectionName: string, docId: string) {
    this.collectionName = collectionName;
    this.id = docId || '';
    this.ref = this.id ? db.collection(collectionName).doc(docId) : null;
  }

  async get(): Promise<{ exists: boolean; data(): any }> {
    if (!this.ref) return { exists: false, data: () => null };
    const snap = await this.ref.get();
    return {
      exists: snap.exists,
      data: () => snap.data(),
    };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    if (!this.ref) return;
    if (options?.merge) {
      await this.ref.set(data, { merge: true });
    } else {
      await this.ref.set(data);
    }
  }

  async update(data: any): Promise<void> {
    if (!this.ref) return;
    await this.ref.update(data);
  }

  async delete(): Promise<void> {
    if (!this.ref) return;
    await this.ref.delete();
  }
}

/**
 * Firestore Query Wrapper
 */
class FirestoreQuery implements QueryAdapter {
  private queryConstraints: any[] = [];
  private limitValue?: number;

  constructor(
    private db: any,
    private collectionName: string,
    private field: string,
    private op: string,
    private value: any
  ) {}

  where(field: string, op: string, value: any): QueryAdapter {
    this.queryConstraints.push({ field, op, value });
    return this;
  }

  limit(n: number): QueryAdapter {
    this.limitValue = n;
    return this;
  }

  async get(): Promise<{ docs: { id: string; data(): any }[] }> {
    let query = this.db.collection(this.collectionName);

    // Apply where constraints
    for (const constraint of this.queryConstraints) {
      query = query.where(constraint.field, constraint.op, constraint.value);
    }

    // Apply limit
    if (this.limitValue) {
      query = query.limit(this.limitValue);
    }

    const snap = await query.get();
    return {
      docs: snap.docs.map((doc: any) => ({
        id: doc.id,
        data: () => doc.data(),
      })),
    };
  }
}

/**
 * Firestore Batch Wrapper
 */
class FirestoreBatch implements BatchAdapter {
  private batch: any;
  private db: any;

  constructor(db: any) {
    this.db = db;
    this.batch = db.batch();
  }

  set(ref: DocumentAdapter, data: any): void {
    const docRef = this.db.collection((ref as any).collectionName).doc(ref.id);
    this.batch.set(docRef, data);
  }

  update(ref: DocumentAdapter, data: any): void {
    const docRef = this.db.collection((ref as any).collectionName).doc(ref.id);
    this.batch.update(docRef, data);
  }

  async commit(): Promise<void> {
    await this.batch.commit();
  }
}