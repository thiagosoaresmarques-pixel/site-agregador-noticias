/**
 * Authentication Middleware
 * Uses HMAC SHA256 tokens via native Node crypto (zero dependencies)
 */

import crypto from 'crypto';

// Secret derived from DASHBOARD_PASSWORD or random per-instance
const SECRET = process.env.DASHBOARD_PASSWORD
    ? crypto.createHash('sha256').update(process.env.DASHBOARD_PASSWORD).digest()
    : crypto.randomBytes(32);

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Create a signed token containing an expiry timestamp
 */
export function createToken() {
    const payload = Buffer.from(JSON.stringify({
        exp: Date.now() + TOKEN_TTL_MS,
    })).toString('base64url');

    const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

    return `${payload}.${sig}`;
}

/**
 * Verify a token and return the payload, or null if invalid
 */
export function verifyToken(token) {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payload, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

    // Length check before timing-safe comparison (timingSafeEqual throws on length mismatch)
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
    }

    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
        if (data.exp < Date.now()) return null; // expired
        return data;
    } catch {
        return null;
    }
}

/**
 * Express middleware — protects routes behind auth.
 * Skips: /api/health, /api/auth/*
 */
export function requireAuth(req, res, next) {
    // Skip auth for health check and auth routes
    if (req.path === '/api/health' || req.path.startsWith('/api/auth')) {
        return next();
    }

    // Only protect /api/* routes
    if (!req.path.startsWith('/api/')) {
        return next();
    }

    // No password configured = auth disabled (dev mode)
    if (!process.env.DASHBOARD_PASSWORD) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Autenticação necessária' });
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    next();
}
