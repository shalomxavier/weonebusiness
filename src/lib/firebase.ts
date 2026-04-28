import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCkkQfWvRSkAalBHRQMHL7pIabUVCLZsHA',
  authDomain: 'we-one-business-dashboard.firebaseapp.com',
  projectId: 'we-one-business-dashboard',
  storageBucket: 'we-one-business-dashboard.firebasestorage.app',
  messagingSenderId: '1081637758019',
  appId: '1:1081637758019:web:29a299c73b402c25bfa0f6',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
