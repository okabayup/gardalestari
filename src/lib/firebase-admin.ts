
import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It checks if an app is already initialized to prevent errors.
export async function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Set the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // to the path of your service account key file.
  // The SDK will automatically use it.
  // If running on Google Cloud (like Cloud Run or Cloud Functions),
  // this is handled automatically.

  try {
    const app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // Add your databaseURL if you're using Realtime Database
      // databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`,
    });
    return app;
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    throw new Error('Could not initialize Firebase Admin SDK');
  }
}
