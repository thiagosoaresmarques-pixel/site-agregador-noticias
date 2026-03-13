import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let genAI = null;
let model = null;

/**
 * Initialize the Gemini client with API key
 */
export function initGemini(apiKey, modelName = 'gemini-2.0-flash-lite') {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: modelName });
    console.log(`[Gemini] Initialized with model: ${modelName}`);
}

/**
 * Load a SKILL.md prompt file and extract the behavioral contract
 */
function loadSkillPrompt(agentName) {
    const skillPath = path.resolve(__dirname, '../../agents', agentName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
        throw new Error(`SKILL.md not found for agent: ${agentName} at ${skillPath}`);
    }
    const content = fs.readFileSync(skillPath, 'utf-8');
    // Remove YAML frontmatter
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, '');
    return withoutFrontmatter.trim();
}

/**
 * Call Gemini with a system prompt (from SKILL.md) and user content
 * Returns the response text and token usage
 */
async function callGemini(systemPrompt, userContent) {
    if (!model) {
        throw new Error('[Gemini] Not initialized. Call initGemini() first.');
    }

    const fullPrompt = `${systemPrompt}\n\n---\n\n## Conteúdo para Processar:\n\n${userContent}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    const usage = response.usageMetadata || {};

    return {
        text,
        tokens: {
            input: usage.promptTokenCount || 0,
            output: usage.candidatesTokenCount || 0,
            total: usage.totalTokenCount || 0,
        },
    };
}

/**
 * Generate Thesis (factual JSON memo) from raw news content
 */
export async function generateThesis(rawNewsContent) {
    const systemPrompt = loadSkillPrompt('thesis');
    const result = await callGemini(systemPrompt, rawNewsContent);
    // Thesis now outputs JSON — add instruction to return only JSON
    return result;
}

/**
 * Generate Antithesis (objection JSON memo) from the Thesis JSON output
 */
export async function generateAntithesis(thesisContent) {
    const systemPrompt = loadSkillPrompt('antithesis');
    // Thesis output is now JSON — pass it as structured data
    const userContent = `## Ficha Factual da Tese:\n\n${typeof thesisContent === 'object' ? JSON.stringify(thesisContent, null, 2) : thesisContent}`;
    return callGemini(systemPrompt, userContent);
}

/**
 * Generate Synthesis (single final editorial) from Thesis + Antithesis JSON memos
 */
export async function generateSynthesis(thesisContent, antithesisContent) {
    const systemPrompt = loadSkillPrompt('synthesis');
    const thesisStr = typeof thesisContent === 'object' ? JSON.stringify(thesisContent, null, 2) : thesisContent;
    const antithesisStr = typeof antithesisContent === 'object' ? JSON.stringify(antithesisContent, null, 2) : antithesisContent;
    const userContent = `## FICHA FACTUAL (material interno da Tese):\n\n${thesisStr}\n\n---\n\n## MAPA DE OBJEÇÕES (material interno da Antítese):\n\n${antithesisStr}`;
    return callGemini(systemPrompt, userContent);
}

/**
 * Generate SEO-optimized output from the final editorial
 */
export async function generateSEO(synthesisContent) {
    const systemPrompt = loadSkillPrompt('seo');
    const userContent = `## Artigo Final para Empacotamento SEO:\n\n${synthesisContent}\n\nRetorne APENAS um objeto JSON válido conforme especificado nas instruções.`;
    return callGemini(systemPrompt, userContent);
}

