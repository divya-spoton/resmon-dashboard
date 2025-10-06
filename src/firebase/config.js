import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDkP0Mw7m_Knc4K5CvLdK_KE6JJ_AuPVHY",
    authDomain: "bluetooth-io-t-qraue0.firebaseapp.com",
    projectId: "bluetooth-io-t-qraue0",
    storageBucket: "bluetooth-io-t-qraue0.firebasestorage.app",
    messagingSenderId: "188461081827",
    appId: "1:188461081827:web:2a82e57b190c2e96bc91d6"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);