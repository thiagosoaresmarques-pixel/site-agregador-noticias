/**
 * Twitter/X Client
 * Auto-publishes articles to X after WordPress publishing.
 */

import { TwitterApi } from 'twitter-api-v2';

// ─── Category → Hashtag mapping ──────────────────────────
const CATEGORY_HASHTAGS = {
    'politica': '#Política',
    'analise-politica': '#AnálisePolítica',
    'geopolitica': '#Geopolítica',
    'politica-internacional': '#PolíticaInternacional',
    'seguranca-publica': '#SegurançaPública',
    'politica-e-sociedade': '#PolíticaESociedade',
    'economia': '#Economia',
    'educacao': '#Educação',
    'meio-ambiente': '#MeioAmbiente',
    'tecnologia': '#Tecnologia',
};

let twitterClient = null;

/**
 * Initialize the Twitter client (lazy)
 */
function getClient() {
    if (twitterClient) return twitterClient;

    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
        return null;
    }

    twitterClient = new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken,
        accessSecret,
    });

    return twitterClient;
}

/**
 * Check if Twitter publishing is configured
 */
export function isTwitterConfigured() {
    return !!getClient();
}

/**
 * Compose tweet text from article data
 * Max 280 characters — title + excerpt + link + hashtags
 */
export function composeTweet(article) {
    const seo = article.seo || {};
    const title = seo.title || article.rawTitle || '';
    const url = article.wpPostUrl || '';
    const categorySlug = article.category || '';

    // Build hashtags
    const hashtags = ['#Contradictio'];
    const catHash = CATEGORY_HASHTAGS[categorySlug];
    if (catHash) hashtags.push(catHash);

    const hashtagStr = hashtags.join(' ');
    const linkLine = url ? `\n\n🔗 ${url}` : '';
    const suffix = `${linkLine}\n\n${hashtagStr}`;

    // Title line
    const titleLine = `📰 ${title}`;

    // Calculate remaining space for excerpt
    // Twitter counts URLs as 23 chars regardless of length
    const urlCharCount = url ? 23 : 0;
    const fixedLength = `📰 `.length + title.length + `\n\n`.length + `\n\n🔗 `.length + urlCharCount + `\n\n`.length + hashtagStr.length;
    const maxExcerptLength = 280 - fixedLength - 4; // 4 for "..." and newline

    // Get excerpt
    let excerpt = seo.excerpt || seo.metaDescription || '';
    if (excerpt && maxExcerptLength > 20) {
        if (excerpt.length > maxExcerptLength) {
            excerpt = excerpt.substring(0, maxExcerptLength - 3) + '...';
        }
        return `${titleLine}\n\n${excerpt}${suffix}`;
    }

    return `${titleLine}${suffix}`;
}

/**
 * Post article to X/Twitter
 * @param {Object} article - Pipeline article with seo, wpPostUrl, category
 * @returns {Object} { success, tweetId, tweetUrl } or { success: false, error }
 */
export async function postTweet(article) {
    const client = getClient();
    if (!client) {
        console.log('[Twitter] ⏭️  Not configured, skipping tweet');
        return { success: false, error: 'Twitter not configured' };
    }

    try {
        const text = composeTweet(article);
        console.log(`[Twitter] 🐦 Posting tweet (${text.length} chars)...`);

        const { data } = await client.v2.tweet(text);

        const tweetUrl = `https://x.com/i/status/${data.id}`;
        console.log(`[Twitter] ✅ Posted: ${tweetUrl}`);

        return {
            success: true,
            tweetId: data.id,
            tweetUrl,
        };
    } catch (err) {
        console.error(`[Twitter] ❌ Error posting tweet: ${err.message}`);
        return { success: false, error: err.message };
    }
}
