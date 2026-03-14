/**
 * NewsAPI.ai Client
 * Fetches full-body news articles for dialectical processing
 * Features: deduplication, advanced filters (source, relevance, period)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_API_BASE = 'https://eventregistry.org/api/v1';
const DATA_DIR = path.resolve(__dirname, '../data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

/**
 * Get set of already-processed article URLs for deduplication
 */
function getProcessedUrls() {
    try {
        if (fs.existsSync(ARTICLES_FILE)) {
            const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));
            return new Set(articles.map((a) => a.rawSourceUrl).filter(Boolean));
        }
    } catch {
        // Ignore errors, treat as no history
    }
    return new Set();
}

/**
 * Get titles of already-processed articles for title-based dedup
 */
function getProcessedTitles() {
    try {
        if (fs.existsSync(ARTICLES_FILE)) {
            const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));
            return articles.map((a) => a.rawTitle || a.seo?.title || '').filter(Boolean);
        }
    } catch {
        // Ignore errors
    }
    return [];
}

/**
 * Normalize a title for comparison: lowercase, strip accents, remove punctuation
 */
function normalizeTitle(title) {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[^a-z0-9\s]/g, '')     // remove punctuation
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if two titles are semantically similar (word overlap > threshold)
 * @param {string} t1 - First title
 * @param {string} t2 - Second title
 * @param {number} [threshold=0.6] - Minimum word overlap ratio (0-1)
 * @returns {boolean}
 */
function isTitleSimilar(t1, t2, threshold = 0.6) {
    const words1 = new Set(normalizeTitle(t1).split(' ').filter(w => w.length > 2));
    const words2 = new Set(normalizeTitle(t2).split(' ').filter(w => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return false;
    const intersection = [...words1].filter(w => words2.has(w)).length;
    const smaller = Math.min(words1.size, words2.size);
    return (intersection / smaller) >= threshold;
}

/**
 * Map category names to NewsAPI.ai filters
 * Uses BOTH categoryUri (broad) + keywords (specific) + ignore (exclusion)
 */
const CATEGORY_MAP = {
    geral: {
        keywords: ['Brasil'],
        keywordOper: 'or',
    },
    politica: {
        categoryUri: 'news/Politics',
        keywords: ['política', 'governo', 'congresso', 'senado', 'eleições', 'legislação'],
        keywordOper: 'or',
        ignoreKeywords: ['futebol', 'campeonato', 'NBA'],
    },
    economia: {
        categoryUri: 'news/Business',
        keywords: ['economia', 'PIB', 'inflação', 'Selic', 'mercado financeiro', 'fiscal', 'dólar', 'IBGE', 'emprego'],
        keywordOper: 'or',
        ignoreKeywords: ['futebol', 'campeonato', 'gol', 'Fórmula 1', 'Indy', 'UFC', 'homicídio', 'assassinato', 'preso'],
    },
    tecnologia: {
        categoryUri: 'news/Technology',
        keywords: ['tecnologia', 'inteligência artificial', 'startup', 'inovação', 'software', 'cibersegurança'],
        keywordOper: 'or',
    },
    ciencia: {
        categoryUri: 'news/Science',
        keywords: ['ciência', 'pesquisa científica', 'universidade', 'NASA', 'descoberta'],
        keywordOper: 'or',
    },
    saude: {
        categoryUri: 'news/Health',
        keywords: ['saúde', 'SUS', 'vacina', 'pandemia', 'medicina', 'hospital'],
        keywordOper: 'or',
    },
    esportes: {
        categoryUri: 'news/Sports',
        keywords: ['futebol', 'Brasileirão', 'Copa', 'Olimpíadas', 'esporte'],
        keywordOper: 'or',
    },
    educacao: {
        keywords: ['educação', 'escola', 'universidade', 'ENEM', 'MEC', 'ensino'],
        keywordOper: 'or',
        ignoreKeywords: ['futebol', 'campeonato'],
    },
    'meio-ambiente': {
        categoryUri: 'news/Environment',
        keywords: ['meio ambiente', 'desmatamento', 'clima', 'sustentabilidade', 'Amazônia', 'poluição'],
        keywordOper: 'or',
    },
    internacional: {
        keywords: ['geopolítica', 'ONU', 'diplomacia', 'relações internacionais', 'guerra', 'G20'],
        keywordOper: 'or',
        ignoreKeywords: ['futebol', 'campeonato'],
    },
};

/**
 * Fetch articles from NewsAPI.ai with advanced filters
 * @param {Object} options
 * @param {string} options.apiKey - NewsAPI.ai API key
 * @param {string} [options.category] - Category keyword
 * @param {string} [options.language] - Language code (por, eng, spa)
 * @param {number} [options.maxArticles] - Max articles to fetch
 * @param {string} [options.sortBy] - Sort by: 'date', 'rel' (relevance), 'socialScore'
 * @param {string} [options.period] - Time period: 'today', '3days', 'week', 'month'
 * @param {string} [options.sourceFilter] - Comma-separated source names to filter
 * @param {boolean} [options.skipDuplicates] - Skip already-processed articles (default: true)
 * @returns {Promise<Array>} Processed articles
 */
export async function fetchArticles({
    apiKey,
    category = 'politica',
    language = 'por',
    maxArticles = 5,
    sortBy = 'date',
    period = '3days',
    sourceFilter = '',
    skipDuplicates = true,
}) {
    if (!apiKey || apiKey === 'your_newsapi_ai_key_here') {
        console.log('[NewsClient] No API key configured, using mock data');
        return getMockArticles(category);
    }

    try {
        // Calculate date range based on period
        const dateEnd = new Date().toISOString().split('T')[0];
        const dateStart = getStartDate(period);

        // Get category config with multi-layered filtering
        const catConfig = CATEGORY_MAP[category] || CATEGORY_MAP.geral;

        // Fetch more articles than needed to account for dedup filtering
        const fetchCount = skipDuplicates ? Math.min(maxArticles * 3, 30) : maxArticles;

        const requestBody = {
            action: 'getArticles',
            keyword: catConfig.keywords,
            keywordOper: catConfig.keywordOper || 'or',
            lang: language,
            sourceLocationUri: ['http://en.wikipedia.org/wiki/Brazil'], // Only Brazilian sources
            articlesPage: 1,
            articlesCount: fetchCount,
            articlesSortBy: sortBy,
            articlesSortByAsc: false,
            articlesArticleBodyLen: -1, // Full body text
            dateStart: dateStart,
            dateEnd: dateEnd,
            resultType: 'articles',
            apiKey: apiKey,
        };

        // Add category URI for broad topic filtering
        if (catConfig.categoryUri) {
            requestBody.categoryUri = catConfig.categoryUri;
        }

        // Add negative keywords to exclude off-topic articles
        if (catConfig.ignoreKeywords) {
            requestBody.ignoreKeyword = catConfig.ignoreKeywords;
        }

        // Add source filter if specified
        if (sourceFilter) {
            requestBody.sourceUri = sourceFilter
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }

        console.log(`[NewsClient] Fetching "${category}" [${catConfig.categoryUri || 'no-cat'}] keywords: ${catConfig.keywords.join(', ')} (${language}), period: ${dateStart}→${dateEnd}, sort: ${sortBy}, max: ${maxArticles}`);

        const response = await fetch(`${NEWS_API_BASE}/article/getArticles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let articles = data?.articles?.results || [];

        // Deduplication: remove already-processed articles (by URL)
        if (skipDuplicates && articles.length > 0) {
            const processedUrls = getProcessedUrls();
            const before = articles.length;
            articles = articles.filter((a) => !processedUrls.has(a.url));
            const removedUrl = before - articles.length;
            if (removedUrl > 0) {
                console.log(`[NewsClient] Dedup (URL): removed ${removedUrl} already-processed articles`);
            }
        }

        // Deduplication: remove articles with titles too similar to already-published ones
        if (skipDuplicates && articles.length > 0) {
            const processedTitles = getProcessedTitles();
            if (processedTitles.length > 0) {
                const before = articles.length;
                articles = articles.filter((a) => {
                    const isDup = processedTitles.some(pt => isTitleSimilar(a.title || '', pt));
                    if (isDup) console.log(`[NewsClient] Dedup (title): skipping "${a.title}" — similar to existing article`);
                    return !isDup;
                });
                const removedTitle = before - articles.length;
                if (removedTitle > 0) {
                    console.log(`[NewsClient] Dedup (title): removed ${removedTitle} similar-title articles`);
                }
            }
        }

        // Filter out articles with empty body
        articles = articles.filter((a) => a.body && a.body.length > 100);

        // Dedup within batch: remove articles in the current batch with similar titles
        if (articles.length > 1) {
            const unique = [articles[0]];
            for (let i = 1; i < articles.length; i++) {
                const isDupInBatch = unique.some(u => isTitleSimilar(u.title || '', articles[i].title || ''));
                if (isDupInBatch) {
                    console.log(`[NewsClient] Dedup (batch): skipping "${articles[i].title}" — similar to another article in this batch`);
                } else {
                    unique.push(articles[i]);
                }
            }
            if (unique.length < articles.length) {
                console.log(`[NewsClient] Dedup (batch): removed ${articles.length - unique.length} similar articles within batch`);
            }
            articles = unique;
        }

        // Limit to requested count
        articles = articles.slice(0, maxArticles);

        console.log(`[NewsClient] Returning ${articles.length} articles (after all filters)`);
        if (articles.length < maxArticles) {
            console.log(`[NewsClient] ⚠️ Only ${articles.length}/${maxArticles} articles available after dedup`);
        }

        return articles.map((a) => ({
            id: a.uri || crypto.randomUUID(),
            title: a.title || 'Sem título',
            body: a.body || '',
            source: a.source?.title || 'Fonte desconhecida',
            sourceUrl: a.url || '',
            datePublished: a.dateTime || new Date().toISOString(),
            image: a.image || null,
            category: category,
            language: language,
        }));
    } catch (error) {
        console.error('[NewsClient] Error fetching articles:', error.message);
        console.log('[NewsClient] Falling back to mock data');
        return getMockArticles(category);
    }
}

/**
 * Calculate start date from period string
 */
function getStartDate(period) {
    const now = new Date();
    switch (period) {
        case 'today':
            return now.toISOString().split('T')[0];
        case '3days':
            now.setDate(now.getDate() - 3);
            return now.toISOString().split('T')[0];
        case 'week':
            now.setDate(now.getDate() - 7);
            return now.toISOString().split('T')[0];
        case 'month':
            now.setMonth(now.getMonth() - 1);
            return now.toISOString().split('T')[0];
        default:
            now.setDate(now.getDate() - 3);
            return now.toISOString().split('T')[0];
    }
}

/**
 * Mock articles for development without API key
 */
function getMockArticles(category) {
    return [
        {
            id: 'mock-001',
            title: 'Governo anuncia novo pacote de medidas para conter inflação',
            body: `O governo federal anunciou nesta quinta-feira um novo pacote de medidas econômicas 
voltadas à contenção da inflação, que acumula alta de 5,2% nos últimos 12 meses. O pacote inclui 
redução temporária de impostos sobre combustíveis, ampliação de crédito para pequenos produtores 
rurais e renegociação de dívidas de famílias de baixa renda.

O ministro da Fazenda afirmou que as medidas terão impacto estimado de 0,8 ponto percentual na 
inflação ao longo dos próximos seis meses. "Estamos agindo de forma cirúrgica nos itens que mais 
pesam no bolso do brasileiro", declarou durante coletiva em Brasília.

A oposição criticou o pacote, classificando-o como "eleitoreiro" e insuficiente para resolver 
problemas estruturais da economia. O líder da minoria no Senado argumentou que as medidas são 
paliativas e não atacam a raiz do problema inflacionário.

Economistas do mercado financeiro se dividem. Enquanto alguns veem as medidas como positivas no 
curto prazo, outros alertam para o risco fiscal de renúncias tributárias sem contrapartida de 
receita. O Banco Central manteve posição cautelosa, sinalizando que a taxa Selic deve permanecer 
elevada até que haja convergência inflacionária consistente.

Fontes: Ministério da Fazenda, Banco Central, Senado Federal, Reuters Brasil.`,
            source: 'Reuters Brasil',
            sourceUrl: 'https://reuters.com/brasil/mock',
            datePublished: new Date().toISOString(),
            image: null,
            category: category,
            language: 'por',
        },
        {
            id: 'mock-002',
            title: 'Inteligência artificial transforma o mercado de trabalho no setor financeiro',
            body: `Um estudo publicado pela Fundação Getúlio Vargas (FGV) revela que a adoção de inteligência artificial 
no setor financeiro brasileiro eliminou cerca de 18 mil postos de trabalho nos últimos dois anos, mas criou 
aproximadamente 12 mil novas vagas em áreas como ciência de dados, engenharia de machine learning e gestão 
de riscos algorítmicos.

A pesquisa, que entrevistou 340 executivos de bancos, fintechs e seguradoras, aponta que 78% das instituições 
já utilizam alguma forma de IA em suas operações, ante 45% em 2023. "A transformação é irreversível", afirmou 
a coordenadora do estudo, Dra. Marina Alves.

Os maiores impactos foram registrados em áreas de atendimento ao cliente (redução de 32% no quadro), análise 
de crédito (redução de 28%) e compliance (redução de 22%). Em contrapartida, as vagas criadas oferecem 
remunerações em média 40% superiores às posições eliminadas.

O Banco Central anunciou a criação de um grupo de trabalho para avaliar os impactos regulatórios da IA no 
sistema financeiro nacional, com foco em viés algorítmico e transparência nas decisões automatizadas.

Críticos do movimento alertam para o aumento da desigualdade, já que as novas vagas exigem qualificações 
que boa parte dos trabalhadores deslocados não possui. O Sindicato dos Bancários defende a criação de um 
programa nacional de requalificação profissional financiado pelas próprias instituições.

Fontes: FGV, Banco Central do Brasil, Sindicato dos Bancários, Valor Econômico.`,
            source: 'Valor Econômico',
            sourceUrl: 'https://valor.com.br/mock',
            datePublished: new Date().toISOString(),
            image: null,
            category: category,
            language: 'por',
        },
    ];
}
