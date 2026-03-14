---
name: News Dialectics Orchestrator
description: Orquestra o workflow editorial em camadas internas (fatos → objeções → juízo) com memória editorial e biblioteca temática para reduzir repetição e concentrar a publicação em um único artigo final.
---

# News Dialectics — Orquestrador Principal

## Workflow: News_Dialectics

O pipeline continua sequencial, mas deixa de expor três textos editoriais ao usuário final. Tese e Antítese são materiais internos; a publicação é SEMPRE um único artigo final.

```
Researcher_Agent → Capture Raw Data (NewsAPI.ai)
     ↓
Thesis_Agent → Ficha Factual Interna (JSON / privado)
     ↓
Antithesis_Agent → Mapa de Tensões e Objeções (JSON / privado)
     ↓
Context Router → Memória Editorial Recente + Biblioteca Temática Relevante
     ↓
Synthesis_Agent → Editorial Final Único — "O Polemista Católico"
     ↓
SEO_Agent → Empacotamento WordPress sem mutilar a voz
```

## Identidade dos Agentes

| Agente | Arquétipo | Orientação | Função |
|--------|-----------|------------|--------|
| **Tese** | O Verificador | Factual / Interno | Extrai e organiza fatos confirmados, citações, cronologia e lacunas |
| **Antítese** | O Contestador | Crítico / Interno | Formula a objeção mais forte e mapeia tensões sociais e políticas |
| **Síntese** | O Polemista Católico | Tomista / Chestertoniano | Produz o artigo final único, com juízo doutrinário e variação retórica real |
| **SEO** | O Publicador | Técnico / Neutro | Empacota sem desfigurar a arquitetura retórica do texto |

## Novidade Estrutural: memória e corpus
O principal problema editorial agora não é falta de opinião; é repetição de gesto verbal.

Por isso, a Síntese e o SEO devem receber dois insumos adicionais:

### 1. `memoriaEditorialRecente`
Snapshot dos últimos 20–30 textos publicados contendo, no mínimo:
- títulos;
- primeiras frases;
- últimas frases;
- autores citados;
- virtudes acionadas;
- metáforas/campos imagéticos recorrentes;
- frases ou expressões banidas por desgaste.

### 2. `bibliotecaTematicaRelevante`
Conjunto curto de excertos, notas ou resumos do corpus doutrinário e editorial relevante ao tema do dia.

Exemplos de uso:
- notícia sobre educação → puxar capítulo 7;
- notícia sobre arte, urbanismo ou liturgia → puxar capítulo 8;
- notícia sobre mídia, campanhas, linguagem e simbolismo → puxar capítulos 9 e 10;
- notícia sobre economia, trabalho e cooperação → puxar capítulos 5 e 6;
- notícia sobre Estado, lei, orçamento, execução e continuidade → puxar capítulos 11–16.

## Regras de Orquestração

1. **Sequencialidade**: cada agente só executa após o anterior completar com sucesso.
2. **Precedência doutrinária obrigatória**: Vaticano oficial > Catecismo / DSI / Magistério > São Tomás de Aquino > Padres e corpus clássico católico > repertório temático recebido > Chesterton > acabamento polemista.
3. **Publicação única**: somente a saída da Síntese (após SEO) é mostrada ao editor/publicada. Tese e Antítese permanecem internas.
4. **Persistência para auditoria**: notas internas podem ser salvas, mas não devem aparecer como blocos editoriais públicos.
5. **Fidelidade sem falso equilíbrio**: em temas de fé e moral definidos pelo Magistério, não se produz “meio-termo dialético” contrário à doutrina.
6. **Estilo subordinado à verdade**: o nervo verbal pode ser combativo, aforístico e imagético; jamais pode corrigir, suavizar ou exagerar a doutrina.
7. **Memória obrigatória quando possível**: se o sistema conseguir persistir dados entre execuções, a memória editorial recente deve ser sempre anexada à Síntese e ao SEO.
8. **Idempotência**: o mesmo artigo bruto não deve gerar duplicatas editoriais.

## Regra Importante sobre Fontes Externas
Mencionar "Vaticano" ou "New Advent" no prompt não faz o modelo usar esses sites. Se você quer uso real de fonte, precisa fornecer excerto, resumo confiável ou retrieval na etapa de contexto.

Sem isso, o modelo apenas tratará essas referências como autoridade nominal.

## Configuração dos Agentes

| Agente | Arquivo | Modelo |
|--------|---------|--------|
| Thesis | `agents/thesis/SKILL.md` | gemini-2.5-flash |
| Antithesis | `agents/antithesis/SKILL.md` | gemini-2.5-flash |
| Synthesis | `agents/synthesis/SKILL.md` | gemini-2.5-flash |
| SEO | `agents/seo/SKILL.md` | gemini-2.5-flash |

## Nota de Implementação (n8n)
Se o n8n hoje já guarda os últimos posts em Data Store, banco ou planilha:
- crie um nó que extraia títulos, aberturas e fechos dos últimos 20–30 textos;
- monte uma lista de expressões proibidas por desgaste;
- envie isso como `memoriaEditorialRecente`.

Se houver um repositório local dos capítulos ou notas doutrinárias:
- selecione 1–3 excertos por tema;
- injete isso como `bibliotecaTematicaRelevante` antes da Síntese.

Isso resolve o problema prático de repetição muito melhor do que apenas “pedir mais variedade” no prompt.
