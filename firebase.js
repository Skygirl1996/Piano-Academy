import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";


import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {
    apiKey:
        "AIzaSyAndoh-qko5SsDkvTYDCqlEV9rau1jp7RM",

    authDomain:
        "online-piano-academy.firebaseapp.com",

    projectId:
        "online-piano-academy",

    storageBucket:
        "online-piano-academy.firebasestorage.app",

    messagingSenderId:
        "1012777671824",

    appId:
        "1:1012777671824:web:05b403fa3ff105b11c8c15"
};


const app =
    initializeApp(firebaseConfig);


const db =
    getFirestore(app);


export { db };
