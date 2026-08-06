// Firebase SDK imports

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
    getFirestore 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyAndoh-qko5SsDkvTYDCqlEV9rau1jp7RM",

  authDomain: "online-piano-academy.firebaseapp.com",

  projectId: "online-piano-academy",

  storageBucket: "online-piano-academy.firebasestorage.app",

  messagingSenderId: "1012777671824",

  appId: "1:1012777671824:web:05b403fa3ff105b11c8c15"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);


// Firestore database

const db = getFirestore(app);


export { db };
