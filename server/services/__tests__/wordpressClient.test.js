/**
 * Tests for WordPress Client — mdToHtml, buildDialecticalContent, auth helpers
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the exported functions
import {
    isAuthenticated,
    mdToHtml,
    buildDialecticalContent,
} from '../wordpressClient.js';

describe('WordPressClient', () => {
    // ─── mdToHtml ──────────────────────────────────────
    describe('mdToHtml', () => {
        it('should return empty string for falsy input', () => {
            expect(mdToHtml('')).toBe('');
            expect(mdToHtml(null)).toBe('');
            expect(mdToHtml(undefined)).toBe('');
        });

        it('should wrap text in <p> tags', () => {
            const result = mdToHtml('Hello world');
            expect(result).toBe('<p>Hello world</p>');
        });

        it('should split paragraphs on double newlines', () => {
            const result = mdToHtml('Paragraph 1\n\nParagraph 2');
            expect(result).toContain('<p>Paragraph 1</p>');
            expect(result).toContain('<p>Paragraph 2</p>');
        });

        it('should strip markdown headers', () => {
            const result = mdToHtml('## Header\nContent');
            expect(result).not.toContain('##');
            expect(result).toContain('Header');
        });

        it('should strip bold markdown', () => {
            const result = mdToHtml('This is **bold** text');
            expect(result).toContain('bold');
            expect(result).not.toContain('**');
        });

        it('should strip italic markdown', () => {
            const result = mdToHtml('This is *italic* text');
            expect(result).toContain('italic');
            expect(result).not.toContain('*italic*');
        });

        it('should strip bullet lists', () => {
            const result = mdToHtml('- Item 1\n- Item 2');
            expect(result).toContain('Item 1');
            expect(result).not.toContain('- Item');
        });

        it('should strip code blocks', () => {
            const result = mdToHtml('Before\n```\ncode block\n```\nAfter');
            expect(result).not.toContain('```');
            expect(result).toContain('Before');
        });

        it('should strip inline code', () => {
            const result = mdToHtml('Use `console.log` here');
            expect(result).toContain('console.log');
            expect(result).not.toContain('`');
        });

        it('should join single newlines within paragraphs', () => {
            const result = mdToHtml('Line 1\nLine 2');
            expect(result).toBe('<p>Line 1 Line 2</p>');
        });

        it('should skip empty paragraphs', () => {
            const result = mdToHtml('Para 1\n\n\n\nPara 2');
            const pCount = (result.match(/<p>/g) || []).length;
            expect(pCount).toBe(2);
        });
    });

    // ─── buildDialecticalContent ───────────────────────
    describe('buildDialecticalContent', () => {
        it('should build all three dialectical sections', () => {
            const article = {
                thesis: 'Thesis content here',
                antithesis: 'Antithesis content here',
                synthesis: 'Synthesis content here',
            };

            const result = buildDialecticalContent(article);

            expect(result).toContain('DIALECTICAL-SECTION: THESIS');
            expect(result).toContain('DIALECTICAL-SECTION: ANTITHESIS');
            expect(result).toContain('DIALECTICAL-SECTION: SYNTHESIS');
            expect(result).toContain('section-thesis');
            expect(result).toContain('section-antithesis');
            expect(result).toContain('section-synthesis');
        });

        it('should include section badges with emojis', () => {
            const article = {
                thesis: 'T',
                antithesis: 'A',
                synthesis: 'S',
            };

            const result = buildDialecticalContent(article);
            expect(result).toContain('🔵 Tese');
            expect(result).toContain('🔴 Antítese');
            expect(result).toContain('🟢 Síntese');
        });

        it('should handle missing sections gracefully', () => {
            const article = { synthesis: 'Only synthesis' };
            const result = buildDialecticalContent(article);

            expect(result).toContain('DIALECTICAL-SECTION: SYNTHESIS');
            expect(result).not.toContain('DIALECTICAL-SECTION: THESIS');
            expect(result).not.toContain('DIALECTICAL-SECTION: ANTITHESIS');
        });

        it('should use SEO content for synthesis if available', () => {
            const article = {
                thesis: 'T',
                synthesis: 'Raw synthesis',
                seo: { content: '<p>SEO optimized content</p>' },
            };

            const result = buildDialecticalContent(article);
            expect(result).toContain('SEO optimized content');
        });

        it('should add source attribution when rawSource is present', () => {
            const article = {
                synthesis: 'Content',
                rawSource: 'Reuters',
            };

            const result = buildDialecticalContent(article);
            expect(result).toContain('Fonte original: Reuters');
        });

        it('should fallback to synthesis text when no sections built', () => {
            const article = { synthesis: 'Fallback content' };
            // With only synthesis, it should still produce content
            const result = buildDialecticalContent(article);
            expect(result).toBeTruthy();
            expect(result.length).toBeGreaterThan(0);
        });

        it('should return empty string for completely empty article', () => {
            const result = buildDialecticalContent({});
            expect(result).toBe('');
        });
    });

    // ─── isAuthenticated ───────────────────────────────
    describe('isAuthenticated', () => {
        const originalEnv = { ...process.env };

        afterEach(() => {
            process.env = { ...originalEnv };
        });

        it('should return false when WP_APP_PASSWORD is missing', () => {
            // WP_URL and WP_USER have defaults, so only password matters
            delete process.env.WP_APP_PASSWORD;
            expect(isAuthenticated()).toBe(false);
        });

        it('should return true when WP_APP_PASSWORD is set', () => {
            process.env.WP_APP_PASSWORD = 'test-secret';
            expect(isAuthenticated()).toBe(true);
        });
    });
});
