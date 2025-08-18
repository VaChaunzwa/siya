import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA5e58qpYPLVDSkdLvVCwLV2MepVUel2g0',
  authDomain: 'siya-portal.firebaseapp.com',
  projectId: 'siya-portal',
  storageBucket: 'siya-portal.firebasestorage.app',
  messagingSenderId: '947179849026',
  appId: '1:947179849026:web:ee7d8232c05b238ee274db',
  measurementId: 'G-XQZNXKPJMP'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;