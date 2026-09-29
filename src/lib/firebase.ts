export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function readConfig(): FirebasePublicConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "";
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "";
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "";
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "";
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ?? "";

  if (!apiKey || !projectId || !appId) return null;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

/** True only when the public Firebase keys are present. Missing keys keep the app on localStorage. */
export function isFirebaseConfigured() {
  return readConfig() !== null;
}

export function expectedParentPin() {
  const pin = process.env.NEXT_PUBLIC_PARENT_PIN?.trim();
  return pin ? pin : "1234";
}

let database: Promise<import("firebase/firestore").Firestore | null> | null = null;

export function getDb() {
  database ??= openDatabase();
  return database;
}

async function openDatabase() {
  const config = readConfig();
  if (!config) return null;

  try {
    const { getApps, initializeApp } = await import("firebase/app");
    const { getFirestore } = await import("firebase/firestore");
    const app = getApps()[0] ?? initializeApp(config);
    return getFirestore(app);
  } catch {
    return null;
  }
}
