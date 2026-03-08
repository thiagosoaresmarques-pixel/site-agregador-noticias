/**
 * Tests for Scheduler — Status, config, history, cron helpers
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getSchedulerStatus,
    getSchedulerHistory,
    updateSchedulerConfig,
    stopScheduler,
} from '../scheduler.js';

describe('Scheduler', () => {
    // ─── getSchedulerStatus ───────────────────────────
    describe('getSchedulerStatus', () => {
        it('should return an object with expected fields', () => {
            const status = getSchedulerStatus();
            expect(status).toHaveProperty('enabled');
            expect(status).toHaveProperty('isRunning');
            expect(status).toHaveProperty('cronExpression');
            expect(status).toHaveProperty('cronLabel');
            expect(status).toHaveProperty('categories');
            expect(status).toHaveProperty('maxArticlesPerRun');
            expect(status).toHaveProperty('autoPublish');
            expect(status).toHaveProperty('presets');
        });

        it('enabled should be a boolean', () => {
            const status = getSchedulerStatus();
            expect(typeof status.enabled).toBe('boolean');
        });

        it('isRunning should be a boolean', () => {
            const status = getSchedulerStatus();
            expect(typeof status.isRunning).toBe('boolean');
        });

        it('presets should contain known cron expressions', () => {
            const status = getSchedulerStatus();
            expect(status.presets).toHaveProperty('0 */6 * * *');
            expect(status.presets).toHaveProperty('0 8 * * *');
        });

        it('cronLabel should be a human-readable string', () => {
            const status = getSchedulerStatus();
            expect(typeof status.cronLabel).toBe('string');
            expect(status.cronLabel.length).toBeGreaterThan(0);
        });

        it('categories should be an array', () => {
            const status = getSchedulerStatus();
            expect(status.categories).toBeInstanceOf(Array);
        });
    });

    // ─── getSchedulerHistory ──────────────────────────
    describe('getSchedulerHistory', () => {
        it('should return an array', () => {
            const history = getSchedulerHistory();
            expect(history).toBeInstanceOf(Array);
        });
    });

    // ─── updateSchedulerConfig ────────────────────────
    describe('updateSchedulerConfig', () => {
        it('should apply config changes and return updated status', () => {
            const original = getSchedulerStatus();
            const newMax = original.maxArticlesPerRun === 10 ? 5 : 10;

            const result = updateSchedulerConfig({ maxArticlesPerRun: newMax });
            expect(result.maxArticlesPerRun).toBe(newMax);

            // Restore
            updateSchedulerConfig({ maxArticlesPerRun: original.maxArticlesPerRun });
        });

        it('should update language when provided', () => {
            const original = getSchedulerStatus();

            const result = updateSchedulerConfig({ language: 'eng' });
            expect(result.language).toBe('eng');

            // Restore
            updateSchedulerConfig({ language: original.language });
        });
    });

    // ─── stopScheduler ────────────────────────────────
    describe('stopScheduler', () => {
        it('should return a status object', () => {
            const result = stopScheduler();
            expect(result).toHaveProperty('enabled');
            expect(result.enabled).toBe(false);
        });
    });
});
