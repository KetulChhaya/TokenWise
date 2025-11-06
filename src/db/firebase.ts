import type { LogRecord, FirebaseConfig } from "../types.js";

export interface FirebaseHandler {
  insertLog(log: LogRecord): void;
}

export function createFirebaseHandler(config: FirebaseConfig): FirebaseHandler {
  console.log(`Firebase database initialized for project: ${config.projectId}, collection: ${config.collection}`);
  
  // Initialize Firebase Admin SDK
  let admin: any = null;
  let db: any = null;
  
  try {
    // Dynamic import to avoid issues when Firebase is not installed
    const initializeFirebase = async () => {
      if (!admin) {
        let firebaseAdmin: any;
        try {
          firebaseAdmin = await import("firebase-admin");
        } catch (error) {
          console.error("firebase-admin is not installed!");
          console.log("To use Firebase database, install firebase-admin: npm install firebase-admin");
          throw new Error("firebase-admin is required for Firebase database support. Please install it: npm install firebase-admin");
        }
        admin = firebaseAdmin.default;
        
        // Initialize Firebase Admin SDK with different credential options
        if (config.clientEmail && config.privateKey) {
          // Environment variables approach (recommended)
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: config.projectId,
              clientEmail: config.clientEmail,
              privateKey: config.privateKey.replace(/\\n/g, '\n'),
            }),
            projectId: config.projectId,
          });
        } else if (config.serviceAccount) {
          // Service account object
          admin.initializeApp({
            credential: admin.credential.cert(config.serviceAccount),
            projectId: config.projectId,
          });
        } else if (config.serviceAccountKey) {
          // Service account key file path
          admin.initializeApp({
            credential: admin.credential.cert(config.serviceAccountKey),
            projectId: config.projectId,
          });
        } else {
          // Use default credentials (GOOGLE_APPLICATION_CREDENTIALS environment variable)
          admin.initializeApp({
            projectId: config.projectId,
          });
        }
        
        db = admin.firestore();
        console.log("Firebase Admin SDK initialized successfully");
      }
    };
    
    // Initialize Firebase (async but we'll handle it in insertLog)
    initializeFirebase().catch(console.error);
    
    return {
      insertLog(log: LogRecord) {
        if (!admin || !db) {
          console.warn("Firebase Admin SDK not initialized yet. Logs are being printed to console instead of being stored in Firebase.");
          console.log("To fix this, ensure Firebase is properly configured:");
          console.log("   1. Install firebase-admin: npm install firebase-admin");
          console.log("   2. Provide Firebase credentials in one of these ways:");
          console.log("      • Set GOOGLE_APPLICATION_CREDENTIALS environment variable");
          console.log("      • Provide serviceAccount object in config");
          console.log("      • Provide serviceAccountKey file path in config");
          console.log("      • Provide clientEmail and privateKey in config");
          console.log(`Current log (would be stored in ${config.projectId} collection: ${config.collection}):`);
          console.log(JSON.stringify(log, null, 2));
          return;
        }
        
        try {
          // Clean the log data to remove undefined values
          const cleanLog = {
            timestamp: log.timestamp,
            provider: log.provider,
            model: log.model,
            input_tokens: log.input_tokens ?? null,
            output_tokens: log.output_tokens ?? null,
            cost: log.cost ?? null,
            latency_ms: log.latency_ms,
            status: log.status,
            ...(log.error_message && { error_message: log.error_message }),
            metadata: log.metadata ? JSON.stringify(log.metadata) : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          // Insert log into Firestore
          db.collection(config.collection).add(cleanLog).then(() => {
            // Silent success - no need to log every successful insert
          }).catch((error: any) => {
            console.error("Failed to insert log to Firebase:", error.message || error);
            // Don't throw here to avoid breaking the main application flow
          });
        } catch (error) {
          console.error("Error inserting log to Firebase:", error);
        }
      }
    };
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    
    // Fallback to console logging
    return {
      insertLog(log: LogRecord) {
        console.log(`Firebase log (fallback): ${JSON.stringify(log)} to project: ${config.projectId}, collection: ${config.collection}`);
      }
    };
  }
}
