import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to load service account either from JSON env, explicit path, or default file
function loadServiceAccount() {
  // 1) If JSON string provided via env, parse it
  if (process.env.SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    } catch (err) {
      console.error('Failed to parse SERVICE_ACCOUNT_JSON:', err);
    }
  }

  // 2) If a path is provided via env, read that
  if (process.env.SERVICE_ACCOUNT_PATH) {
    try {
      return JSON.parse(readFileSync(process.env.SERVICE_ACCOUNT_PATH, 'utf8'));
    } catch (err) {
      console.error('Failed to read service account from SERVICE_ACCOUNT_PATH:', err);
    }
  }

  // 3) Fallback to local file (may not exist in cleaned repo)
  try {
    const fallbackPath = join(__dirname, '../../serviceAccountKey.json');
    return JSON.parse(readFileSync(fallbackPath, 'utf8'));
  } catch (err) {
    console.error('No service account available; set SERVICE_ACCOUNT_JSON or SERVICE_ACCOUNT_PATH to initialize Firebase Admin.');
    return null;
  }
}

const serviceAccount = loadServiceAccount();

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export const db = admin.firestore();

export default admin;

