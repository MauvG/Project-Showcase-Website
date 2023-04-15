import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyB2fbnvgaRQTCrfMMAcEEPiHJ4xNW0M7Zo',
  authDomain: 'arch-center.firebaseapp.com',
  projectId: 'arch-center',
  storageBucket: 'arch-center.appspot.com',
  messagingSenderId: '1008186013618',
  appId: '1:1008186013618:web:0c4403a576f1cf284ed6ab'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);