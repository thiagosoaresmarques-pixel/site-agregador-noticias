#!/usr/bin/env node
/**
 * Deploy WordPress Theme — Contradictio
 *
 * Pushes all theme files to WordPress via a custom REST API endpoint
 * registered in the theme's functions.php.
 *
 * Usage:
 *   node scripts/deploy-theme.mjs
 *
 * Environment variables:
 *   WP_URL           — WordPress site URL (default: https://contradictio.com.br)
 *   WP_USER          — WordPress admin username (default: admin)
 *   WP_APP_PASSWORD  — WordPress Application Password
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env for local execution (CI/CD sets env vars directly)
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
            const key = trimmed.substring(0, idx).trim();
            const val = trimmed.substring(idx + 1).trim();
            if (!process.env[key]) process.env[key] = val;
        }
    }
}

const THEME_DIR = path.resolve(__dirname, '../wordpress-theme/contradictio');
const THEME_SLUG = 'contradictio';

const WP_URL = process.env.WP_URL || 'https://contradictio.com.br';
const WP_USER = process.env.WP_USER || 'admin';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || '';
const AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');

// Only text files can be deployed via REST — binary assets (images) need manual upload
const TEXT_EXTENSIONS = ['.php', '.css', '.js', '.json', '.txt', '.md'];

function getThemeFiles(dir, base = '') {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const relative = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            files.push(...getThemeFiles(path.join(dir, entry.name), relative));
        } else if (TEXT_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
            files.push(relative);
        }
    }
    return files;
}

function restUrl(route, extra = '') {
    const sep = extra ? '&' : '';
    return `${WP_URL}/?rest_route=${encodeURIComponent(route)}${sep}${extra}`;
}

async function deployFile(fileName, content) {
    const res = await fetch(restUrl('/contradictio/v1/deploy-file'), {
        method: 'POST',
        headers: {
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: fileName, content }),
    });

    let body = {};
    try { body = await res.json(); } catch { }
    return { status: res.status, ok: res.ok, message: body.message || '' };
}

async function main() {
    if (!WP_APP_PASSWORD) {
        console.error('❌ WP_APP_PASSWORD is required');
        process.exit(1);
    }

    console.log(`\n🎨 Deploying theme "${THEME_SLUG}" to ${WP_URL}\n`);

    // Verify authentication
    const authRes = await fetch(restUrl('/wp/v2/users/me'), {
        headers: { Authorization: AUTH_HEADER },
    });

    if (!authRes.ok) {
        console.error(`❌ Auth failed: HTTP ${authRes.status}`);
        process.exit(1);
    }

    const user = await authRes.json();
    console.log(`✅ Authenticated as: ${user.name} (${user.roles?.[0]})\n`);

    // Check if the deploy endpoint exists
    const checkRes = await fetch(restUrl('/contradictio/v1/deploy-file'), {
        method: 'POST',
        headers: {
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: 'style.css', content: '' }),
    });

    if (checkRes.status === 404) {
        console.error('❌ Deploy endpoint not found. The theme needs the deploy-file REST endpoint.');
        console.error('   Please ensure the Contradictio theme is active and up-to-date on WordPress.');
        process.exit(1);
    }

    const files = getThemeFiles(THEME_DIR);
    console.log(`📁 Found ${files.length} theme files\n`);

    let success = 0;
    let failed = 0;

    for (const file of files) {
        const content = fs.readFileSync(path.join(THEME_DIR, file), 'utf8');
        const result = await deployFile(file, content);

        if (result.ok) {
            console.log(`  ✅ ${file}`);
            success++;
        } else {
            console.log(`  ❌ ${file} (HTTP ${result.status}: ${result.message})`);
            failed++;
        }
    }

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`✅ Deployed: ${success}/${files.length}`);
    if (failed > 0) {
        console.log(`❌ Failed: ${failed}`);
        process.exit(1);
    }
    console.log(`🚀 Theme deployed successfully!\n`);
}

main().catch(err => {
    console.error('❌ Deploy failed:', err.message);
    process.exit(1);
});
