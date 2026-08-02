/**
 * Database Abstraction Layer
 * 
 * Provides a unified interface for database operations, allowing easy switching
 * between Firebase Firestore and Supabase PostgreSQL without changing business logic.
 */

// Query result types
export interface QuerySnapshot {
  docs: QueryDocumentSnapshot[];
}

export interface QueryDocumentSnapshot {
  id: string;
  data(): any;
  exists: boolean;
}

export interface DocumentSnapshot {
  id: string;
  data(): any;
  exists: boolean;
}

export interface DocumentReference {
  id: string;
  get(): Promise<DocumentSnapshot>;
  set(data: any, options?: { merge?: boolean }): Promise<void>;
  update(data: any): Promise<void>;
  delete(): Promise<void>;
}

export interface CollectionReference {
  doc(id?: string): DocumentReference;
  where(field: string, op: string, value: any): QueryConstraint;
  limit(n: number): QueryConstraint;
  count(): Promise<{ get(): Promise<{ data(): { count: number } }> }>;
  add(data: any): Promise<DocumentReference>;
}

export interface QueryConstraint {
  limit(n: number): QueryConstraint;
  get(): Promise<QuerySnapshot>;
}

// Main adapter interface
export interface DatabaseAdapter {
  collection(name: string): CollectionAdapter;
  doc(path: string): DocumentAdapter;
  batch(): BatchAdapter;
}

export interface CollectionAdapter {
  doc(id?: string): DocumentAdapter;
  where(field: string, op: string, value: any): QueryAdapter;
  limit(n: number): QueryAdapter;
  count(): Promise<{ data: { count: number } }>;
  add(data: any): Promise<{ id: string }>;
}

export interface DocumentAdapter {
  id: string;
  get(): Promise<{ exists: boolean; data(): any }>;
  set(data: any, options?: { merge?: boolean }): Promise<void>;
  update(data: any): Promise<void>;
  delete(): Promise<void>;
}

export interface QueryAdapter {
  where(field: string, op: string, value: any): QueryAdapter;
  limit(n: number): QueryAdapter;
  get(): Promise<{ docs: { id: string; data(): any }[] }>;
}

export interface BatchAdapter {
  set(ref: DocumentAdapter, data: any): void;
  update(ref: DocumentAdapter, data: any): void;
  commit(): Promise<void>;
}

// Factory function
export function getDatabase(): DatabaseAdapter {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    const provider = process.env.DATABASE_PROVIDER || 'supabase';
    
    if (provider === 'supabase') {
      // Dynamic import to avoid loading Supabase when using Firestore
      const { SupabaseAdapter } = require('./postgresql-adapter');
      return new SupabaseAdapter();
    }
    
    // Default to Supabase (Firestore deprecated for client-side usage)
    const { SupabaseAdapter } = require('./postgresql-adapter');
    return new SupabaseAdapter();
  }
  
  // Server-side: throw error to prevent build-time initialization
  throw new Error('getDatabase() should only be called on the client side. Use getSupabaseServer() for server-side operations.');
}