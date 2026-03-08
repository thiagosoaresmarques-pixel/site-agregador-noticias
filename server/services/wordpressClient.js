/**
 * WordPress Self-Hosted REST API Client
 * Uses Application Passwords (Basic Auth) to publish articles
 * Target: contradictio.com.br
 */

// marked library no longer needed — mdToHtml uses custom sanitization

const getWpUrl = () => process.env.WP_URL || 'https://contradictio.com.br';
const getWpUser = () => process.env.WP_USER || 'admin';
const getWpAppPassword = () => process.env.WP_APP_PASSWORD || '';

/**
 * Build WordPress REST API URL using ?rest_route= fallback
 * (Works without pretty permalinks enabled)
 */
function restUrl(route, extraParams = '') {
    const sep = extraParams ? '&' : '';
    return `${getWpUrl()}/?rest_route=${encodeURIComponent(route)}${sep}${extraParams}`;
}

/**
 * Get Basic Auth header for WordPress REST API
 */
function getAuthHeader() {
    const credentials = Buffer.from(`${getWpUser()}:${getWpAppPassword()}`).toString('base64');
    return `Basic ${credentials}`;
}

/**
 * Check if WordPress is configured
 */
export function isAuthenticated() {
    return !!(getWpUrl() && getWpUser() && getWpAppPassword());
}

/**
 * Get WordPress connection status
 */
export async function getStatus() {
    if (!isAuthenticated()) {
        return { connected: false, site: getWpUrl(), error: 'Missing credentials' };
    }

    try {
        const response = await fetch(restUrl('/wp/v2/users/me'), {
            headers: { Authorization: getAuthHeader() },
        });

        if (!response.ok) {
            return { connected: false, site: getWpUrl(), error: `HTTP ${response.status}` };
        }

        const user = await response.json();
        return {
            connected: true,
            site: getWpUrl(),
            user: user.name,
            role: user.roles?.[0] || 'unknown',
        };
    } catch (error) {
        return { connected: false, site: getWpUrl(), error: error.message };
    }
}

/**
 * Find or create a WordPress category by name
 */
async function findOrCreateCategory(name) {
    if (!name) return null;

    try {
        // Search for existing category
        const searchRes = await fetch(
            restUrl('/wp/v2/categories', `search=${encodeURIComponent(name)}`),
            { headers: { Authorization: getAuthHeader() } }
        );

        if (searchRes.ok) {
            const categories = await searchRes.json();
            const match = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
            if (match) return match.id;
        }

        // Create new category
        const createRes = await fetch(restUrl('/wp/v2/categories'), {
            method: 'POST',
            headers: {
                Authorization: getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (createRes.ok) {
            const cat = await createRes.json();
            return cat.id;
        }
    } catch (error) {
        console.warn('[WordPress] Category error:', error.message);
    }

    return null;
}

/**
 * Find or create WordPress tags
 */
async function findOrCreateTags(tagNames) {
    if (!tagNames || !tagNames.length) return [];

    const tagIds = [];
    for (const name of tagNames.slice(0, 8)) {
        try {
            const searchRes = await fetch(
                restUrl('/wp/v2/tags', `search=${encodeURIComponent(name)}`),
                { headers: { Authorization: getAuthHeader() } }
            );

            if (searchRes.ok) {
                const tags = await searchRes.json();
                const match = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
                if (match) {
                    tagIds.push(match.id);
                    continue;
                }
            }

            const createRes = await fetch(restUrl('/wp/v2/tags'), {
                method: 'POST',
                headers: {
                    Authorization: getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            if (createRes.ok) {
                const tag = await createRes.json();
                tagIds.push(tag.id);
            }
        } catch (error) {
            console.warn(`[WordPress] Tag "${name}" error:`, error.message);
        }
    }

    return tagIds;
}

/**
 * Convert content to clean HTML — handles both markdown and plain text
 * Strips residual markdown artifacts and ensures proper paragraph wrapping
 */
export function mdToHtml(content) {
    if (!content) return '';

    // Strip residual markdown formatting that Gemini might still produce
    let clean = content
        .replace(/^#{1,6}\s+/gm, '')           // ## headers → plain text
        .replace(/\*\*(.+?)\*\*/g, '$1')        // **bold** → plain
        .replace(/\*(.+?)\*/g, '$1')            // *italic* → plain
        .replace(/^[-*•]\s+/gm, '')             // bullet lists → plain text
        .replace(/^\d+\.\s+/gm, '')             // numbered lists → plain text
        .replace(/```[\s\S]*?```/g, '')         // code blocks → remove
        .replace(/`(.+?)`/g, '$1')              // inline code → plain
        .trim();

    // Split into paragraphs and wrap in <p> tags
    const paragraphs = clean
        .split(/\n\s*\n/)                       // split on blank lines
        .map(p => p.replace(/\n/g, ' ').trim()) // join single newlines
        .filter(p => p.length > 0);

    return paragraphs.map(p => `<p>${p}</p>`).join('\n');
}

/**
 * Build the full dialectical HTML content with all three sections
 * @param {Object} article - Article from pipeline with thesis, antithesis, synthesis, seo
 * @returns {string} HTML content with all dialectical sections
 */
export function buildDialecticalContent(article) {
    const seo = article.seo || {};
    const parts = [];

    // ── Thesis Section ──
    if (article.thesis) {
        const thesisHtml = mdToHtml(article.thesis);
        parts.push(
            `<!-- DIALECTICAL-SECTION: THESIS -->`,
            `<div class="dialectical-section section-thesis">`,
            `<span class="section-badge">🔵 Tese — O Relato Factual</span>`,
            `<div class="section-content">${thesisHtml}</div>`,
            `</div>`
        );
    }

    // ── Antithesis Section ──
    if (article.antithesis) {
        const antithesisHtml = mdToHtml(article.antithesis);
        parts.push(
            `<!-- DIALECTICAL-SECTION: ANTITHESIS -->`,
            `<div class="dialectical-section section-antithesis">`,
            `<span class="section-badge">🔴 Antítese — O Contra-Argumento</span>`,
            `<div class="section-content">${antithesisHtml}</div>`,
            `</div>`
        );
    }

    // ── Synthesis Section ──
    // Use SEO-optimized HTML content if available, otherwise convert markdown
    const synthesisHtml = seo.content || mdToHtml(article.synthesis);
    if (synthesisHtml) {
        parts.push(
            `<!-- DIALECTICAL-SECTION: SYNTHESIS -->`,
            `<div class="dialectical-section section-synthesis">`,
            `<span class="section-badge">🟢 Síntese — Visão Integrada</span>`,
            `<div class="section-content">${synthesisHtml}</div>`,
            `</div>`
        );
    }

    // Fallback: if no sections were built, use raw synthesis or seo content
    if (parts.length === 0) {
        return seo.content || article.synthesis || '';
    }

    let content = parts.join('\n');

    // Source attribution
    if (article.rawSource) {
        content += `\n\n<p><em>Fonte original: ${article.rawSource}</em></p>`;
    }

    return content;
}

/**
 * Upload an image from URL to WordPress Media Library
 * @param {string} imageUrl - Source image URL
 * @param {string} title - Image title
 * @param {string} caption - Image caption (source attribution)
 * @returns {Promise<number|null>} Media ID or null on failure
 */
async function uploadImageToWordPress(imageUrl, title, caption) {
    try {
        // Download the image
        const imgResponse = await fetch(imageUrl);
        if (!imgResponse.ok) {
            console.warn(`[WordPress] Image download failed: ${imgResponse.status}`);
            return null;
        }

        const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
        const buffer = Buffer.from(await imgResponse.arrayBuffer());

        // Determine file extension
        const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
        const ext = extMap[contentType] || 'jpg';
        const filename = `${title.replace(/[^a-zA-Z0-9-]/g, '-').substring(0, 60)}.${ext}`;

        // Upload to WP Media Library
        const response = await fetch(restUrl('/wp/v2/media'), {
            method: 'POST',
            headers: {
                Authorization: getAuthHeader(),
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': contentType,
            },
            body: buffer,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.warn(`[WordPress] Image upload failed: ${response.status} — ${error.message || ''}`);
            return null;
        }

        const media = await response.json();

        // Update caption with source attribution
        if (caption) {
            await fetch(restUrl(`/wp/v2/media/${media.id}`), {
                method: 'POST',
                headers: {
                    Authorization: getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ caption }),
            });
        }

        console.log(`[WordPress] 🖼️ Image uploaded: ID ${media.id}`);
        return media.id;
    } catch (err) {
        console.warn(`[WordPress] Image upload error: ${err.message}`);
        return null;
    }
}

/**
 * Publish an article to WordPress
 * @param {Object} options
 * @param {Object} options.article - Article data from pipeline
 * @param {boolean} [options.asDraft=true] - Publish as draft for human review
 * @returns {Promise<Object>} WordPress post response
 */
export async function publishToWordPress({ article, asDraft = true }) {
    if (!isAuthenticated()) {
        throw new Error('WordPress not configured. Check WP_URL, WP_USER, and WP_APP_PASSWORD in .env');
    }

    const seo = article.seo || {};

    // Build post content with full dialectical structure (Thesis + Antithesis + Synthesis)
    let content = buildDialecticalContent(article);

    // Find/create category and tags
    const categoryId = await findOrCreateCategory(seo.category || article.category);
    const tagIds = await findOrCreateTags(seo.tags);

    const postData = {
        title: seo.title || article.rawTitle,
        content: content,
        excerpt: seo.metaDescription || seo.excerpt || '',
        slug: seo.slug || '',
        status: asDraft ? 'draft' : 'publish',
    };

    if (categoryId) postData.categories = [categoryId];
    if (tagIds.length) postData.tags = tagIds;

    // Upload featured image from source article
    if (article.rawImage) {
        const caption = article.rawSource
            ? `Imagem: ${article.rawSource}`
            : '';
        const mediaId = await uploadImageToWordPress(
            article.rawImage,
            seo.title || article.rawTitle,
            caption
        );
        if (mediaId) {
            postData.featured_media = mediaId;
        }
    }

    try {
        console.log(`[WordPress] Publishing to ${getWpUrl()}: "${postData.title}" (${postData.status})`);

        const response = await fetch(restUrl('/wp/v2/posts'), {
            method: 'POST',
            headers: {
                Authorization: getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`WordPress API error: ${response.status} — ${error.message || response.statusText}`);
        }

        const post = await response.json();

        console.log(`[WordPress] ✅ Published: ${post.link} (ID: ${post.id})`);

        return {
            success: true,
            postId: post.id,
            postUrl: post.link,
            status: post.status,
            editUrl: `${getWpUrl()}/wp-admin/post.php?post=${post.id}&action=edit`,
        };
    } catch (error) {
        console.error('[WordPress] Publish error:', error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}
