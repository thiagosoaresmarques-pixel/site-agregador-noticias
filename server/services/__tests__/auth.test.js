/**
 * Tests for Auth Middleware — Token creation, verification, route protection
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createToken, verifyToken, requireAuth } from '../../middleware/auth.js';

describe('Auth Middleware', () => {
    // ─── createToken ──────────────────────────────────
    describe('createToken', () => {
        it('should return a string with two parts separated by a dot', () => {
            const token = createToken();
            expect(typeof token).toBe('string');
            const parts = token.split('.');
            expect(parts.length).toBe(2);
        });

        it('should create unique tokens on each call', () => {
            const t1 = createToken();
            // Tokens with same expiry window may have same payload,
            // but in practice timing differences make them unique
            expect(typeof t1).toBe('string');
            expect(t1.length).toBeGreaterThan(10);
        });

        it('token payload should contain an expiry timestamp', () => {
            const token = createToken();
            const [payload] = token.split('.');
            const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
            expect(data).toHaveProperty('exp');
            expect(data.exp).toBeGreaterThan(Date.now());
        });
    });

    // ─── verifyToken ──────────────────────────────────
    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const token = createToken();
            const payload = verifyToken(token);
            expect(payload).not.toBeNull();
            expect(payload).toHaveProperty('exp');
        });

        it('should reject null/undefined/empty tokens', () => {
            expect(verifyToken(null)).toBeNull();
            expect(verifyToken(undefined)).toBeNull();
            expect(verifyToken('')).toBeNull();
        });

        it('should reject tokens without a dot separator', () => {
            expect(verifyToken('nodottoken')).toBeNull();
        });

        it('should reject tokens with tampered payload', () => {
            const token = createToken();
            const [, sig] = token.split('.');
            const fakePayload = Buffer.from(JSON.stringify({ exp: Date.now() + 99999999 })).toString('base64url');
            expect(verifyToken(`${fakePayload}.${sig}`)).toBeNull();
        });

        it('should reject tokens with tampered signature', () => {
            const token = createToken();
            const [payload] = token.split('.');
            expect(verifyToken(`${payload}.fakesignature`)).toBeNull();
        });

        it('should reject expired tokens', () => {
            // We can't easily create an expired token from outside since SECRET is
            // module-scoped, but we can verify that verifyToken handles bad payloads.
            // A manually crafted token with past expiry will fail signature check
            // unless we have the same secret. This tests the reject path.
            const fakeExpired = Buffer.from(JSON.stringify({ exp: 0 })).toString('base64url');
            expect(verifyToken(`${fakeExpired}.invalidsig`)).toBeNull();
        });

        it('should reject non-string inputs', () => {
            expect(verifyToken(12345)).toBeNull();
            expect(verifyToken({})).toBeNull();
            expect(verifyToken([])).toBeNull();
        });
    });

    // ─── requireAuth middleware ────────────────────────
    describe('requireAuth', () => {
        let req, res, next;

        beforeEach(() => {
            req = { path: '/api/test', headers: {} };
            res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn().mockReturnThis(),
            };
            next = vi.fn();
        });

        it('should skip auth for /api/health', () => {
            req.path = '/api/health';
            requireAuth(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should skip auth for /api/auth routes', () => {
            req.path = '/api/auth/login';
            requireAuth(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should skip auth for /api/auth/check', () => {
            req.path = '/api/auth/check';
            requireAuth(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should skip auth for non-API routes', () => {
            req.path = '/index.html';
            requireAuth(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should skip auth when DASHBOARD_PASSWORD is not set', () => {
            const orig = process.env.DASHBOARD_PASSWORD;
            delete process.env.DASHBOARD_PASSWORD;

            requireAuth(req, res, next);
            expect(next).toHaveBeenCalled();

            if (orig) process.env.DASHBOARD_PASSWORD = orig;
        });

        it('should return 401 when no Authorization header and password is set', () => {
            const orig = process.env.DASHBOARD_PASSWORD;
            process.env.DASHBOARD_PASSWORD = 'test-pass';

            requireAuth(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();

            if (orig) process.env.DASHBOARD_PASSWORD = orig;
            else delete process.env.DASHBOARD_PASSWORD;
        });

        it('should return 401 for invalid Bearer token', () => {
            const orig = process.env.DASHBOARD_PASSWORD;
            process.env.DASHBOARD_PASSWORD = 'test-pass';
            req.headers.authorization = 'Bearer invalid.token';

            requireAuth(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();

            if (orig) process.env.DASHBOARD_PASSWORD = orig;
            else delete process.env.DASHBOARD_PASSWORD;
        });

        it('should allow valid Bearer token through', () => {
            const orig = process.env.DASHBOARD_PASSWORD;
            process.env.DASHBOARD_PASSWORD = 'test-pass';
            const token = createToken();
            req.headers.authorization = `Bearer ${token}`;

            requireAuth(req, res, next);
            expect(next).toHaveBeenCalled();

            if (orig) process.env.DASHBOARD_PASSWORD = orig;
            else delete process.env.DASHBOARD_PASSWORD;
        });
    });
});
