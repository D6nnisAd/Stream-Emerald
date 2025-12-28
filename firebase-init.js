// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TODO: Replace the following with your app's Firebase project configuration
// See the guide provided in the chat to get these details.
  const firebaseConfig = {
    apiKey: "AIzaSyCX0nZUjR0uGJJ_9e2fbKt6j4Gsq82XfIE",
    authDomain: "stream-emerald.firebaseapp.com",
    projectId: "stream-emerald",
    storageBucket: "stream-emerald.firebasestorage.app",
    messagingSenderId: "431405324690",
    appId: "1:431405324690:web:29591d6ea5fc08fc16894b"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };