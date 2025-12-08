// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXr8Gp5ZVQTmgXtgOde_Rb2UH273NsL6M",
    authDomain: "project-adhd-74d3e.firebaseapp.com",
    projectId: "project-adhd-74d3e",
    storageBucket: "project-adhd-74d3e.firebasestorage.app",
    messagingSenderId: "1064899006603",
    appId: "1:1064899006603:web:b06cc7ad26f7bfc4a9848e",
    measurementId: "G-7PWTEMMC64",
    databaseURL: "https://project-adhd-74d3e-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

// Initialize Firebase Authentication
// In Firebase v12, persistence is handled automatically for React Native
const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Uncomment the following lines to use Firebase Emulator for development
// if (process.env.NODE_ENV === 'development') {
//   connectDatabaseEmulator(database, 'localhost', 9000);
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

export { auth, database, googleProvider };
export default app; 