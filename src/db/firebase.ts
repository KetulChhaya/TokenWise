import type { LogRecord, FirebaseConfig } from "../types.js";

export interface FirebaseHandler {
  insertLog(log: LogRecord): void;
}

export function createFirebaseHandler(config: FirebaseConfig): FirebaseHandler {
  const collectionName = config.collection || "llm_logs"; // Default collection name
  console.log(`Firebase database configured for project: ${config.projectId}, collection: ${collectionName}`);
  
  // Initialize Firebase Admin SDK
  let admin: any = null;
  let db: any = null;
  let app: any = null;
  
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
        
        // Check if Firebase app is already initialized (plug-and-play approach)
        const useExistingApp = config.useExistingApp !== false; // Default to true
        const appName = config.appName; // Optional named app
        
        if (useExistingApp) {
          try {
            // Try to get existing app (default or named)
            app = appName ? admin.app(appName) : admin.app();
            console.log(`✅ Using existing Firebase app${appName ? ` "${appName}"` : ''} (plug-and-play mode)`);
            
            // Verify the app has the correct project ID if specified
            if (config.projectId && app.options.projectId !== config.projectId) {
              console.warn(`⚠️  Warning: Existing Firebase app project ID (${app.options.projectId}) differs from config (${config.projectId}). Using existing app's project ID.`);
            }
          } catch (error) {
            // No existing app found, create a new one
            app = null;
          }
        }
        
        // Create new app if no existing app found or useExistingApp is false
        if (!app) {
          console.log(`📦 ${useExistingApp ? 'No existing Firebase app found, initializing new one' : 'Creating new Firebase app'}...`);
          
          const appConfig: any = {
            projectId: config.projectId,
          };
          
          if (config.clientEmail && config.privateKey) {
            // Environment variables approach (recommended)
            appConfig.credential = admin.credential.cert({
              projectId: config.projectId,
              clientEmail: config.clientEmail,
              privateKey: config.privateKey.replace(/\\n/g, '\n'),
            });
          } else if (config.serviceAccount) {
            // Service account object
            appConfig.credential = admin.credential.cert(config.serviceAccount);
          } else if (config.serviceAccountKey) {
            // Service account key file path
            appConfig.credential = admin.credential.cert(config.serviceAccountKey);
          }
          // If no credentials provided, use default (GOOGLE_APPLICATION_CREDENTIALS)
          
          app = admin.initializeApp(appConfig, appName);
          console.log(`✅ New Firebase app${appName ? ` "${appName}"` : ''} initialized successfully`);
        }
        
        // Get Firestore instance from the app (existing or newly created)
        db = app.firestore();
        console.log(`🔥 Firestore connected - will only operate on collection: "${collectionName}"`);
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
          console.log(`Current log (would be stored in ${config.projectId} collection: ${collectionName}):`);
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

          // SAFETY: Only insert into the specified collection - never touch other collections
          // This ensures the package is completely isolated and doesn't interfere with existing data
          db.collection(collectionName).add(cleanLog).then(() => {
            // Silent success - no need to log every successful insert
          }).catch((error: any) => {
            console.error(`Failed to insert log to Firebase collection "${collectionName}":`, error.message || error);
            // Don't throw here to avoid breaking the main application flow
          });
        } catch (error) {
          console.error(`Error inserting log to Firebase collection "${collectionName}":`, error);
        }
      }
    };
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    
    // Fallback to console logging
    return {
      insertLog(log: LogRecord) {
        console.log(`Firebase log (fallback): ${JSON.stringify(log)} to project: ${config.projectId}, collection: ${collectionName}`);
      }
    };
  }
}
