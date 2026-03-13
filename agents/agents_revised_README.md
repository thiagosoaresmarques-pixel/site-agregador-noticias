# O que mudou

1. **Só um texto público por matéria**
   - Tese e Antítese viram artefatos internos em JSON.
   - Só a Síntese vira artigo final.

2. **Hierarquia de autoridade explícita**
   - Vaticano oficial e Magistério no topo.
   - São Tomás como espinha dorsal.
   - New Advent como corpus de apoio.
   - Chesterton como forma de argumentar.
   - Nelson Rodrigues apenas como acabamento verbal.

3. **Fim da “regra de diversidade” para o núcleo católico**
   - Tomás, Catecismo, DSI e Chesterton podem reaparecer sempre.

4. **Fim do falso equilíbrio em moral definida**
   - O agente não inventa meio-termo em temas já definidos pela Igreja.

5. **SEO sem destruir a coluna**
   - O agente SEO foi orientado a preservar parágrafos e ritmo, sem encher o texto de H2/H3 artificiais.

## Ajuste técnico esperado no n8n

Se o fluxo atual espera três campos textuais (`thesisText`, `antithesisText`, `synthesisText`), passe a esperar:

- `thesisMemo` (JSON)
- `antithesisMemo` (JSON)
- `finalArticle` (texto)

ou mantenha os mesmos nomes, mas mudando o tipo dos dois primeiros para objeto estruturado.
