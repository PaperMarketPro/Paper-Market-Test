import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore targeting the specific database ID from configuration
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || "ai-studio-papermarketpro-a4c451cc-beae-433b-b0ec-ae18cdd3511b");
