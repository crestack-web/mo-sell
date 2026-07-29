import { firebaseConfig } from '@/lib/firebase/config';
import { isAdminInitialized, getAdminDb, getAdminStorage } from './firebase-admin';


let compatApp: any = null;
let compatDb: any = null;
let compatStorage: any = null;

function ensureCompat() {
  if (!compatApp) {
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
  }
  return { db: compatDb, storage: compatStorage };
}

export function getServerFirestore(): any {
  if (isAdminInitialized()) {
    try { return getAdminDb(); } catch {}
  }
  return ensureCompat().db;
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
    if (isAdminInitialized()) {
      try {
        const admin = require('firebase-admin');
        return admin.firestore.FieldValue.serverTimestamp();
      } catch {}
    }
    // Lazy-load compat SDK to avoid issues at import time
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.serverTimestamp();
  },
  arrayUnion(...elements: any[]): any {
    if (isAdminInitialized()) {
      try {
        const admin = require('firebase-admin');
        return admin.firestore.FieldValue.arrayUnion(...elements);
      } catch {}
    }
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.arrayUnion(...elements);
  },
  arrayRemove(...elements: any[]): any {
    if (isAdminInitialized()) {
      try {
        const admin = require('firebase-admin');
        return admin.firestore.FieldValue.arrayRemove(...elements);
      } catch {}
    }
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.arrayRemove(...elements);
  },
  increment(n: number): any {
    if (isAdminInitialized()) {
      try {
        const admin = require('firebase-admin');
        return admin.firestore.FieldValue.increment(n);
      } catch {}
    }
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.increment(n);
  },
  delete(): any {
    if (isAdminInitialized()) {
      try {
        const admin = require('firebase-admin');
        return admin.firestore.FieldValue.delete();
      } catch {}
    }
    const firebase = require('firebase/compat/app');
    require('firebase/compat/firestore');
    return firebase.firestore.FieldValue.delete();
  },
};

// Timestamp polyfill
export const Timestamp = {
  now(): any {
    if (isAdminInitialized()) {
      try {
        const admin = require('firebase-admin');
        return admin.firestore.Timestamp.now();
      } catch {}
    }
    return { toMillis: () => Date.now(), toDate: () => new Date() };
  },
  fromMillis(milliseconds: number): any {
    if (isAdminInitialized()) {
      try {
        const admin = require('firebase-admin');
        return admin.firestore.Timestamp.fromMillis(milliseconds);
      } catch {}
    }
    const d = new Date(milliseconds);
    return { seconds: Math.floor(d.getTime() / 1000), nanoseconds: (d.getTime() % 1000) * 1000000, toMillis: () => d.getTime(), toDate: () => d };
  },
  fromDate(date: Date): any {
    if (isAdminInitialized()) {
      try {
        const admin = require('firebase-admin');
        return admin.firestore.Timestamp.fromDate(date);
      } catch {}
    }
    return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: (date.getTime() % 1000) * 1000000, toMillis: () => date.getTime(), toDate: () => date };
  },
};
