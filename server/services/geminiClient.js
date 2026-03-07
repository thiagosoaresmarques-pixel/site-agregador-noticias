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
 * Generate Thesis from raw news content
 */
export async function generateThesis(rawNewsContent) {
    const systemPrompt = loadSkillPrompt('thesis');
    return callGemini(systemPrompt, rawNewsContent);
}

/**
 * Generate Antithesis from the Thesis output
 */
export async function generateAntithesis(thesisContent) {
    const systemPrompt = loadSkillPrompt('antithesis');
    const userContent = `## Tese a ser Analisada Criticamente:\n\n${thesisContent}`;
    return callGemini(systemPrompt, userContent);
}

/**
 * Generate Synthesis from Thesis + Antithesis
 */
export async function generateSynthesis(thesisContent, antithesisContent) {
    const systemPrompt = loadSkillPrompt('synthesis');
    const userContent = `## TESE (Posição Factual):\n\n${thesisContent}\n\n---\n\n## ANTÍTESE (Contra-Argumentos):\n\n${antithesisContent}`;
    return callGemini(systemPrompt, userContent);
}

/**
 * Generate SEO-optimized output from the Synthesis
 */
export async function generateSEO(synthesisContent) {
    const systemPrompt = loadSkillPrompt('seo');
    const userContent = `## Artigo da Síntese para Otimização SEO:\n\n${synthesisContent}\n\nRetorne APENAS um objeto JSON válido conforme especificado nas instruções.`;
    return callGemini(systemPrompt, userContent);
}
