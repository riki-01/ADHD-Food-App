// Script to initialize Firebase with sample data from dump.js
// This is for development/testing purposes only

import { ref, set } from 'firebase/database';
import data from '../services/dump.js';
import { database } from '../services/firebaseConfig.js';

async function initializeFirebase() {
  try {
    console.log('Initializing Firebase with sample data...');
    
    // Initialize application options
    const optionsRef = ref(database, 'application-options');
    await set(optionsRef, data['application-options']);
    console.log('✓ Application options initialized');
    
    // Note: User data will be created when users register
    // We don't pre-populate user data for security reasons
    
    console.log('✓ Firebase initialization complete!');
    console.log('Users can now register and their data will be stored in Firebase.');
    
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

// Run the initialization
if (process.argv[2] === 'run') {
  initializeFirebase();
}

export default initializeFirebase;
