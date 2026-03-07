---
name: News Dialectics Orchestrator
description: Orquestra o workflow de processamento dialético de notícias através da Tríade Tese → Antítese → Síntese → SEO.
---

# News Dialectics — Orquestrador Principal

## Workflow: News_Dialectics

O pipeline de processamento dialético segue uma cadeia sequencial rigorosa onde cada agente depende da saída do anterior:

```
Researcher_Agent → Capture Raw Data (NewsAPI.ai)
     ↓
Thesis_Agent → "O Cronista" — Reprodução Literal da Fonte
     ↓
Antithesis_Agent → "O Progressista" — Leitura Crítica de Esquerda
     ↓
Synthesis_Agent → "O Filósofo" — Resolução Aristotélico-Tomista
     ↓
SEO_Agent → Final Polish & WordPress-Ready Output
```

## Arquétipos da Tríade Dialética

| Agente | Arquétipo | Orientação | Função |
|--------|-----------|------------|--------|
| **Tese** | O Cronista | Neutro/Factual | Reproduz fielmente os fatos como reportados pela fonte |
| **Antítese** | O Progressista | Esquerda | Leitura de justiça social, direitos coletivos, crítica ao poder |
| **Síntese** | O Filósofo | Conservador Tomista | Resolução via lei natural, bem comum, prudência e subsidiariedade |
| **SEO** | O Otimizador | Técnico/Neutro | Polimento final para publicação e buscadores |

## Regras de Orquestração

1. **Sequencialidade**: Cada agente só executa após o anterior completar com sucesso
2. **Persistência**: A saída de cada estágio é salva independentemente para auditoria
3. **Revisão Humana**: O artigo final é publicado como **rascunho** por padrão
4. **Rastreabilidade**: Todas as fontes originais são preservadas ao longo do pipeline
5. **Idempotência**: O mesmo artigo raw nunca deve gerar duas sínteses duplicadas
6. **Identidade**: Cada agente "assume a identidade" definida no seu SKILL.md — não apenas sugere texto, mas decide autonomamente

## Configuração dos Agentes

| Agente | Arquivo | Modelo |
|--------|---------|--------|
| Thesis | `agents/thesis/SKILL.md` | gemini-2.5-flash |
| Antithesis | `agents/antithesis/SKILL.md` | gemini-2.5-flash |
| Synthesis | `agents/synthesis/SKILL.md` | gemini-2.5-flash |
| SEO | `agents/seo/SKILL.md` | gemini-2.5-flash |

## Integração n8n

O pipeline expõe um webhook em `POST /api/webhook/trigger` que aceita:
```json
{
  "category": "politica",
  "maxArticles": 5,
  "language": "por",
  "sortBy": "date",
  "period": "3days",
  "publishAsDraft": true
}
```

Isso permite que o n8n agende execuções periódicas via Cloud Scheduler ou cron.
