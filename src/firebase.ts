import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAvAkl9DKd4Doxm5e5bd4x48sjT1ViW1iw",
  authDomain: "phonic-transit-7wfkz.firebaseapp.com",
  projectId: "phonic-transit-7wfkz",
  storageBucket: "phonic-transit-7wfkz.firebasestorage.app",
  messagingSenderId: "816379334508",
  appId: "1:816379334508:web:08858a5cfff3719b846d49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore targeting the specific database ID from configuration
export const db = initializeFirestore(app, {}, "ai-studio-papermarketpro-a4c451cc-beae-433b-b0ec-ae18cdd3511b");
