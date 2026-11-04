// Firebase Authentication helpers. The SDK is loaded on demand (the first time someone
// signs in or signs up), so it never adds to the main bundle for regular shoppers.
//
// NovaCart keeps its own session: after Firebase confirms who someone is, the Firebase
// ID token is exchanged at POST /api/auth/firebase for the normal NovaCart token.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let authPromise;
const load = () => {
  if (!authPromise) {
    authPromise = Promise.all([import('firebase/app'), import('firebase/auth')]).then(([appMod, authMod]) => {
      const app = appMod.getApps()[0] || appMod.initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      auth.useDeviceLanguage();
      return { auth, fb: authMod };
    });
  }
  return authPromise;
};

/** Error with a stable `code` the UI can branch on. */
export class AuthFlowError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

const MESSAGES = {
  'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not switched on for the store yet.',
  'auth/unauthorized-domain': 'This web address is not allowed to use Firebase sign-in yet.',
  'auth/network-request-failed': 'We could not reach the sign-in service. Check your connection and try again.',
  'auth/account-exists-with-different-credential': 'This email is already linked to a different sign-in method.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Use at least 6 characters for your password.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/invalid-credential': 'That email and password do not match.',
  'auth/wrong-password': 'That email and password do not match.',
  'auth/user-not-found': 'That email and password do not match.',
  'auth/missing-email': 'Enter your email address.'
};
const CANCELLED = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];

const wrap = (err) => {
  if (err instanceof AuthFlowError) return err;
  return new AuthFlowError(MESSAGES[err?.code] || 'Sign-in did not complete. Please try again.', err?.code || 'unknown');
};

// After someone clicks the link in the confirmation email, Firebase sends them back here.
const continueUrl = () => `${window.location.origin}/login?verified=1`;

/** Google popup. Resolves to a Firebase ID token, or null if the window was closed. */
export async function getGoogleIdToken() {
  if (!firebaseEnabled) throw new AuthFlowError('Google sign-in is not configured.', 'not-configured');
  const { auth, fb } = await load();
  const provider = new fb.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const cred = await fb.signInWithPopup(auth, provider);
    const token = await cred.user.getIdToken();
    fb.signOut(auth).catch(() => {});
    return token;
  } catch (err) {
    if (CANCELLED.includes(err?.code)) return null;
    throw wrap(err);
  }
}

/**
 * Creates an email + password account and sends the confirmation email.
 * The person is not signed in to NovaCart until they click the link.
 */
export async function signUpWithEmail(name, email, password) {
  const { auth, fb } = await load();
  try {
    const cred = await fb.createUserWithEmailAndPassword(auth, email, password);
    if (name) await fb.updateProfile(cred.user, { displayName: name });
    await fb.sendEmailVerification(cred.user, { url: continueUrl() });
    // Stay signed in to Firebase (not NovaCart) so "resend email" works on this screen.
    return { email: cred.user.email };
  } catch (err) {
    throw wrap(err);
  }
}

/**
 * Email + password sign-in. Resolves to a Firebase ID token for a confirmed email.
 * Throws AuthFlowError code 'email-not-verified' when the link has not been clicked yet,
 * and code 'auth/invalid-credential' when Firebase does not know this email/password.
 */
export async function signInWithEmail(email, password) {
  const { auth, fb } = await load();
  let cred;
  try {
    cred = await fb.signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw wrap(err);
  }
  await cred.user.reload();
  if (!cred.user.emailVerified) {
    throw new AuthFlowError(`Please confirm your email first. Open the link we sent to ${cred.user.email}, then sign in again.`, 'email-not-verified');
  }
  const token = await cred.user.getIdToken(true);
  fb.signOut(auth).catch(() => {});
  return token;
}

/** Re-sends the confirmation email to the account that last tried to sign in or sign up. */
export async function resendVerificationEmail() {
  const { auth, fb } = await load();
  if (!auth.currentUser) throw new AuthFlowError('Sign in again to get a new confirmation email.', 'no-user');
  try {
    await fb.sendEmailVerification(auth.currentUser, { url: continueUrl() });
  } catch (err) {
    throw wrap(err);
  }
}

/** Sends a password reset email. Resolves even if the address is unknown, so emails cannot be probed. */
export async function sendPasswordReset(email) {
  const { auth, fb } = await load();
  try {
    await fb.sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/login` });
  } catch (err) {
    if (err?.code === 'auth/user-not-found') return;
    throw wrap(err);
  }
}
