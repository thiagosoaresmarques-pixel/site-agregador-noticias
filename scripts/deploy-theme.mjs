#!/usr/bin/env node
/**
 * Deploy WordPress Theme — Contradictio
 *
 * Pushes all theme files to WordPress via the REST API Theme File Editor.
 * Uses WP Application Passwords for authentication.
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
const THEME_DIR = path.resolve(__dirname, '../wordpress-theme/contradictio');
const THEME_SLUG = 'contradictio';

const WP_URL = process.env.WP_URL || 'https://contradictio.com.br';
const WP_USER = process.env.WP_USER || 'admin';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || '';
const AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');

// Files to deploy (relative to theme dir)
// Binary files (images, fonts) cannot be deployed via the theme editor API
const TEXT_EXTENSIONS = ['.php', '.css', '.js', '.json', '.txt', '.md'];

function getThemeFiles(dir, base = '') {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const relative = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            // Skip hidden dirs and node_modules
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
            files.push(...getThemeFiles(path.join(dir, entry.name), relative));
        } else if (TEXT_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
            files.push(relative);
        }
    }
    return files;
}

async function updateThemeFile(fileName, content) {
    const url = `${WP_URL}/?rest_route=${encodeURIComponent(`/wp/v2/themes/${THEME_SLUG}`)}&file=${encodeURIComponent(fileName)}`;

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newcontent: content }),
    });

    return { status: res.status, ok: res.ok };
}

async function main() {
    if (!WP_APP_PASSWORD) {
        console.error('❌ WP_APP_PASSWORD is required');
        process.exit(1);
    }

    console.log(`\n🎨 Deploying theme "${THEME_SLUG}" to ${WP_URL}\n`);

    // Verify connection first
    const authRes = await fetch(`${WP_URL}/?rest_route=${encodeURIComponent('/wp/v2/users/me')}`, {
        headers: { Authorization: AUTH_HEADER },
    });

    if (!authRes.ok) {
        console.error(`❌ Auth failed: HTTP ${authRes.status}`);
        process.exit(1);
    }

    const user = await authRes.json();
    console.log(`✅ Authenticated as: ${user.name} (${user.roles?.[0]})\n`);

    const files = getThemeFiles(THEME_DIR);
    console.log(`📁 Found ${files.length} theme files\n`);

    let success = 0;
    let failed = 0;

    for (const file of files) {
        const content = fs.readFileSync(path.join(THEME_DIR, file), 'utf8');
        const result = await updateThemeFile(file, content);

        if (result.ok) {
            console.log(`  ✅ ${file}`);
            success++;
        } else {
            console.log(`  ❌ ${file} (HTTP ${result.status})`);
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
