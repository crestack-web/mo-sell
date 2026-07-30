import { firebaseConfig } from '@/lib/firebase/config';
import { isAdminInitialized, getAdminDb, getAdminStorage, admin } from './firebase-admin';


let compatApp: any = null;
let compatDb: any = null;
let compatStorage: any = null;

function ensureCompat() {
  if (!compatApp) {
    try {
      const firebase = require('firebase/compat/app');
      require('firebase/compat/firestore');
      require('firebase/compat/storage');
      try {
        compatApp = firebase.initializeApp(firebaseConfig, 'server-fallback');
      } catch {
        compatApp = firebase.app('server-fallback');
      }
      compatDb = compatApp.firestore();
      compatStorage = compatApp.storage();
    } catch (e) {
      console.error('Compat Firebase SDK initialization failed:', e);
    }
  }
  return { db: compatDb, storage: compatStorage };
}

export function getServerFirestore(): any {
  if (isAdminInitialized()) {
    try { return getAdminDb(); } catch (e) { console.error('Admin DB init failed:', e); }
  }
  const compat = ensureCompat();
  if (!compat.db) {
    throw new Error('Firestore not available — admin SDK not initialized and compat fallback failed');
  }
  return compat.db;
}

export function getServerStorage(): any {
  if (isAdminInitialized()) {
    try { return getAdminStorage(); } catch {}
  }
  return ensureCompat().storage;
}

// FieldValue polyfill — uses compat SDK when Admin SDK unavailable
export const FieldValue = {
  serverTimestamp(): any {
    if (admin) {
      try { return admin.firestore.FieldValue.serverTimestamp(); } catch {}
    }
    try {
      const firebase = require('firebase/compat/app');
      require('firebase/compat/firestore');
      return firebase.firestore.FieldValue.serverTimestamp();
    } catch {
      throw new Error('Firestore FieldValue not available — admin SDK not initialized and compat fallback failed');
    }
  },
  arrayUnion(...elements: any[]): any {
    if (admin) {
      try { return admin.firestore.FieldValue.arrayUnion(...elements); } catch {}
    }
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.arrayUnion(...elements);
  },
  arrayRemove(...elements: any[]): any {
    if (admin) {
      try { return admin.firestore.FieldValue.arrayRemove(...elements); } catch {}
    }
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.arrayRemove(...elements);
  },
  increment(n: number): any {
    if (admin) {
      try { return admin.firestore.FieldValue.increment(n); } catch {}
    }
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.increment(n);
  },
  delete(): any {
    if (admin) {
      try { return admin.firestore.FieldValue.delete(); } catch {}
    }
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.delete();
  },
};

// Timestamp polyfill
export const Timestamp = {
  now(): any {
    if (admin) {
      try { return admin.firestore.Timestamp.now(); } catch {}
    }
    return { toMillis: () => Date.now(), toDate: () => new Date() };
  },
  fromMillis(milliseconds: number): any {
    if (admin) {
      try { return admin.firestore.Timestamp.fromMillis(milliseconds); } catch {}
    }
    const d = new Date(milliseconds);
    return { seconds: Math.floor(d.getTime() / 1000), nanoseconds: (d.getTime() % 1000) * 1000000, toMillis: () => d.getTime(), toDate: () => d };
  },
  fromDate(date: Date): any {
    if (admin) {
      try { return admin.firestore.Timestamp.fromDate(date); } catch {}
    }
    return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: (date.getTime() % 1000) * 1000000, toMillis: () => date.getTime(), toDate: () => date };
  },
};
