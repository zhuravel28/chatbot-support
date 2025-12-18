// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
 apiKey : "AIzaSyB7R32hbMg0HwhD2YnL8faCBuZLxtLEM10" , 
  authDomain : "chatbot-support-a83b2.firebaseapp.com" , 
  projectId : "chatbot-support-a83b2" , 
  storageBucket : "chatbot-support-a83b2.firebasestorage.app" , 
  messagingSenderId : "297607445620" , 
  appId : "1:297607445620:web:d4d3a3b2168fa5547c6521" , 
  measurementId : "G-G8D203M27G"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
