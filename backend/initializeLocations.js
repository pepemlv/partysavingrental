import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const locations = [
  {
    id: 'charlotte',
    name: 'Charlotte',
    state: 'NC',
    latitude: 35.2271,
    longitude: -80.8431,
    address: '3244 Bamburgh Court, Charlotte, NC 28216',
  },
  {
    id: 'raleigh',
    name: 'Raleigh',
    state: 'NC',
    latitude: 35.7796,
    longitude: -78.6382,
    address: '456 Fayetteville St, Raleigh, NC 27601',
  },
  {
    id: 'columbia',
    name: 'Columbia',
    state: 'SC',
    latitude: 34.0007,
    longitude: -81.0348,
    address: '789 Main St, Columbia, SC 29201',
  },
  {
    id: 'atlanta',
    name: 'Atlanta',
    state: 'GA',
    latitude: 33.7490,
    longitude: -84.3880,
    address: '101 Peachtree St, Atlanta, GA 30303',
  },
  {
    id: 'miami',
    name: 'Miami',
    state: 'FL',
    latitude: 25.7617,
    longitude: -80.1918,
    address: '202 Biscayne Blvd, Miami, FL 33132',
  },
];

async function initializeLocations() {
  console.log('🔄 Initializing locations in Firestore...');

  try {
    const batch = db.batch();

    locations.forEach((location) => {
      const locationRef = db.collection('locations').doc(location.id);
      batch.set(locationRef, {
        ...location,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log('✅ Successfully initialized all locations!');
    console.log(`   - Charlotte: 3244 Bamburgh Court, Charlotte, NC 28216`);
    console.log(`   - Raleigh: 456 Fayetteville St, Raleigh, NC 27601`);
    console.log(`   - Columbia: 789 Main St, Columbia, SC 29201`);
    console.log(`   - Atlanta: 101 Peachtree St, Atlanta, GA 30303`);
    console.log(`   - Miami: 202 Biscayne Blvd, Miami, FL 33132`);
  } catch (error) {
    console.error('❌ Error initializing locations:', error);
  } finally {
    process.exit(0);
  }
}

initializeLocations();
