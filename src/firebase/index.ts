'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // When deployed to Firebase App Hosting, the FIREBASE_CONFIG environment
  // variable is automatically populated.
  // Vercel and other platforms will not have this variable, so we fall back
  // to the firebaseConfig object.
  if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
    try {
      const app = initializeApp(JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG));
      return getSdks(app);
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG", e);
    }
  }
  
  // Fallback for local development and other hosting providers
  const app = initializeApp(firebaseConfig);
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';