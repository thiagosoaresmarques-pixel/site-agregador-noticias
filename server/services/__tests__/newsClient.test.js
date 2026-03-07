/**
 * Tests for NewsClient — Category mapping, date calculations, mock articles
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test internal functions, so we'll import the module
// and test the exported fetchArticles with mock API key (triggers mock mode)
import { fetchArticles } from '../newsClient.js';

describe('NewsClient', () => {
    // ─── Mock Articles (no API key) ────────────────────
    describe('fetchArticles (mock mode)', () => {
        it('should return mock articles when no API key is provided', async () => {
            const articles = await fetchArticles({
                apiKey: '',
                category: 'politica',
            });

            expect(articles).toBeInstanceOf(Array);
            expect(articles.length).toBeGreaterThan(0);
        });

        it('should return mock articles when API key is placeholder', async () => {
            const articles = await fetchArticles({
                apiKey: 'your_newsapi_ai_key_here',
                category: 'tecnologia',
            });

            expect(articles).toBeInstanceOf(Array);
            expect(articles.length).toBeGreaterThan(0);
        });

        it('mock articles should have required fields', async () => {
            const articles = await fetchArticles({ apiKey: '' });

            for (const article of articles) {
                expect(article).toHaveProperty('id');
                expect(article).toHaveProperty('title');
                expect(article).toHaveProperty('body');
                expect(article).toHaveProperty('source');
                expect(article).toHaveProperty('sourceUrl');
                expect(article).toHaveProperty('category');
                expect(article).toHaveProperty('language');
                expect(article.body.length).toBeGreaterThan(100);
            }
        });

        it('should set the correct category on returned articles', async () => {
            const articles = await fetchArticles({
                apiKey: '',
                category: 'economia',
            });

            for (const article of articles) {
                expect(article.category).toBe('economia');
            }
        });

        it('should handle all category names without errors', async () => {
            const categories = [
                'geral', 'politica', 'tecnologia', 'economia',
                'ciencia', 'saude', 'esportes',
                'educacao', 'meio-ambiente', 'internacional',
            ];

            for (const cat of categories) {
                const articles = await fetchArticles({ apiKey: '', category: cat });
                expect(articles).toBeInstanceOf(Array);
                expect(articles.length).toBeGreaterThan(0);
            }
        });
    });

    // ─── Category Map Coverage ─────────────────────────
    describe('CATEGORY_MAP', () => {
        it('should have keywords for all 10 categories', async () => {
            // We verify indirectly by fetching each category in mock mode
            // and checking the category is preserved
            const categories = [
                'geral', 'politica', 'tecnologia', 'economia',
                'ciencia', 'saude', 'esportes',
                'educacao', 'meio-ambiente', 'internacional',
            ];

            for (const cat of categories) {
                const articles = await fetchArticles({ apiKey: '', category: cat });
                expect(articles[0].category).toBe(cat);
            }
        });
    });
});
