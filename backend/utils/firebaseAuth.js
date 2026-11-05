// Verifies Firebase Authentication ID tokens (e.g. from "Continue with Google")
// against Google's public keys. No service account is needed for verification.
const { createRemoteJWKSet, jwtVerify } = require('jose');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'novacart-9b618';
const JWKS = createRemoteJWKSet(
    new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

/**
 * Returns { uid, email, emailVerified, name, picture, provider } for a valid token, or throws.
 */
async function verifyFirebaseToken(idToken) {
    const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://securetoken.google.com/${PROJECT_ID}`,
        audience: PROJECT_ID,
        algorithms: ['RS256']
    });
    if (!payload.sub) throw new Error('Token has no subject');
    if (payload.auth_time && payload.auth_time * 1000 > Date.now() + 60_000) throw new Error('Token auth_time is in the future');

    return {
        uid: payload.sub,
        email: payload.email ? String(payload.email).toLowerCase() : null,
        emailVerified: payload.email_verified === true,
        name: payload.name || null,
        picture: payload.picture || null,
        provider: payload.firebase?.sign_in_provider || null
    };
}

module.exports = { verifyFirebaseToken, PROJECT_ID };
