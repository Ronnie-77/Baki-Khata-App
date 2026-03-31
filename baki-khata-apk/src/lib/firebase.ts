import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyALEze5zQ50IMiImF2lFucCW1duk5RWoQU",
  authDomain: "baki-khata-167fc.firebaseapp.com",
  projectId: "baki-khata-167fc",
  storageBucket: "baki-khata-167fc.firebasestorage.app",
  messagingSenderId: "27946852391",
  appId: "1:27946852391:android:1f284452661a8f70b52e02"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err: { code: string }) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence works in one tab only');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support persistence');
    }
  });
}

export default app;