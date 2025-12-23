
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = { 
  apiKey: "AIzaSyBLjUv8BeM2mDcek-ICFPAKAib2pfLvQaQ", 
  authDomain: "sirt-digital.firebaseapp.com", 
  projectId: "sirt-digital", 
  storageBucket: "sirt-digital.firebasestorage.app", 
  messagingSenderId: "239216216102", 
  appId: "1:239216216102:web:b7faf52bffba3e3b983ee7", 
  measurementId: "G-VEHBXW7FKC" 
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
