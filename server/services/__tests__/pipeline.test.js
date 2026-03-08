/**
 * Tests for Pipeline — Article CRUD, pipeline status management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getArticles,
    getArticleById,
    updateArticleStatus,
    getPipelineStatus,
    getAllPipelineRuns,
    initArticleStorage,
} from '../pipeline.js';

// Initialize storage before tests (uses local file mode since no GCS in test)
await initArticleStorage();

describe('Pipeline', () => {
    // ─── getArticles ──────────────────────────────────
    describe('getArticles', () => {
        it('should return an array', () => {
            const articles = getArticles();
            expect(articles).toBeInstanceOf(Array);
        });

        it('returned articles should have required id field', () => {
            const articles = getArticles();
            for (const article of articles) {
                expect(article).toHaveProperty('id');
            }
        });
    });

    // ─── getArticleById ───────────────────────────────
    describe('getArticleById', () => {
        it('should return null for non-existent ID', () => {
            const article = getArticleById('nonexistent-id-12345');
            expect(article).toBeNull();
        });

        it('should return an article when a valid ID is provided', () => {
            const articles = getArticles();
            if (articles.length > 0) {
                const found = getArticleById(articles[0].id);
                expect(found).not.toBeNull();
                expect(found.id).toBe(articles[0].id);
            }
        });
    });

    // ─── updateArticleStatus ──────────────────────────
    describe('updateArticleStatus', () => {
        it('should return null for non-existent article', () => {
            const result = updateArticleStatus('nonexistent-id', 'published');
            expect(result).toBeNull();
        });

        it('should update article status and return updated article', () => {
            const articles = getArticles();
            if (articles.length > 0) {
                const original = articles[0];
                const originalStatus = original.status;
                const updated = updateArticleStatus(original.id, 'test-status');
                expect(updated).not.toBeNull();
                expect(updated.status).toBe('test-status');
                // Restore original status
                updateArticleStatus(original.id, originalStatus);
            }
        });

        it('should merge meta properties into article', () => {
            const articles = getArticles();
            if (articles.length > 0) {
                const original = articles[0];
                const originalStatus = original.status;
                const updated = updateArticleStatus(original.id, originalStatus, {
                    testMeta: 'test-value',
                });
                expect(updated.testMeta).toBe('test-value');
                // Cleanup
                updateArticleStatus(original.id, originalStatus);
            }
        });
    });

    // ─── getPipelineStatus ────────────────────────────
    describe('getPipelineStatus', () => {
        it('should return null for unknown run ID', () => {
            const status = getPipelineStatus('unknown-run-id');
            expect(status).toBeNull();
        });
    });

    // ─── getAllPipelineRuns ────────────────────────────
    describe('getAllPipelineRuns', () => {
        it('should return an array', () => {
            const runs = getAllPipelineRuns();
            expect(runs).toBeInstanceOf(Array);
        });

        it('should return runs sorted by startedAt descending', () => {
            const runs = getAllPipelineRuns();
            if (runs.length > 1) {
                for (let i = 0; i < runs.length - 1; i++) {
                    expect(new Date(runs[i].startedAt).getTime())
                        .toBeGreaterThanOrEqual(new Date(runs[i + 1].startedAt).getTime());
                }
            }
        });
    });
});
