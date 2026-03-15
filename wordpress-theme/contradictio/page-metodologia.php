<?php
/**
 * Template Name: Metodologia
 * Slug: metodologia
 *
 * Página institucional "Metodologia Dialética"
 */
get_header();
?>

<div class="static-page-header">
    <div class="container">
        <span class="page-badge">🔬 Transparência Editorial</span>
        <h1>Metodologia</h1>
        <p class="page-subtitle">Como cada análise dialética é construída, do zero à publicação.</p>
    </div>
</div>

<div class="container">
    <div class="static-page-content">

        <!-- Visão Geral -->
        <section class="page-section animate-on-scroll">
            <h2>📋 Visão Geral</h2>
            <p>
                A Contradictio opera um <strong>pipeline editorial automatizado</strong> que combina curadoria
                de fontes jornalísticas, processamento por agentes de IA especializados, e publicação em
                WordPress. Cada etapa é projetada para maximizar a profundidade analítica e minimizar
                vieses inconscientes.
            </p>
        </section>

        <!-- Pipeline -->
        <section class="page-section animate-on-scroll">
            <h2>⚙️ O Pipeline Editorial</h2>

            <div class="page-timeline">
                <div class="timeline-item">
                    <div class="timeline-marker">1</div>
                    <div class="timeline-content">
                        <h3>Curadoria de Fontes</h3>
                        <p>
                            Utilizamos a <strong>NewsAPI.ai</strong> para coletar notícias em tempo real de
                            fontes brasileiras confiáveis. Aplicamos filtros por <code>categoryUri</code>,
                            <code>sourceGroups</code> (Brazilian media) e exclusão de fontes de baixa qualidade.
                        </p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker">2</div>
                    <div class="timeline-content">
                        <h3>Análise de Tese</h3>
                        <p>
                            O <strong>Agente de Tese</strong> recebe os fatos brutos e produz um relato factual
                            imparcial, identificando dados-chave, fontes primárias e o contexto imediato
                            do acontecimento.
                        </p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker">3</div>
                    <div class="timeline-content">
                        <h3>Construção da Antítese</h3>
                        <p>
                            O <strong>Agente de Antítese</strong> examina o relato factual e levanta
                            contra-argumentos, contradições internas, perspectivas minoritárias e
                            evidências contrárias que possam ter sido negligenciadas.
                        </p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker">4</div>
                    <div class="timeline-content">
                        <h3>Síntese Dialética</h3>
                        <p>
                            O <strong>Agente de Síntese</strong> integra tese e antítese em uma análise
                            coerente, orientada pela tradição filosófica clássica e pela Doutrina Social
                            da Igreja. É aqui que o juízo editorial toma forma.
                        </p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker">5</div>
                    <div class="timeline-content">
                        <h3>Otimização SEO</h3>
                        <p>
                            O <strong>Agente de SEO</strong> refina títulos, meta-descriptions, excerpts e
                            tags para maximizar a visibilidade em mecanismos de busca e Google News,
                            sem comprometer a integridade editorial.
                        </p>
                    </div>
                </div>

                <div class="timeline-item">
                    <div class="timeline-marker">6</div>
                    <div class="timeline-content">
                        <h3>Publicação</h3>
                        <p>
                            O artigo final é publicado automaticamente no WordPress via REST API,
                            incluindo imagem destacada, categorias, tags e metadados estruturados
                            (JSON-LD <code>NewsArticle</code>).
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Framework RISEN -->
        <section class="page-section animate-on-scroll">
            <h2>🧩 Framework RISEN</h2>
            <p>
                Cada agente de IA opera sob o framework <strong>RISEN</strong>, garantindo
                consistência e qualidade:
            </p>
            <div class="page-card-grid">
                <div class="page-card">
                    <h3>🎭 Role</h3>
                    <p>Persona especializada atribuída ao agente (ex: "jornalista investigativo", "filósofo tomista").</p>
                </div>
                <div class="page-card">
                    <h3>📝 Instructions</h3>
                    <p>Regras detalhadas sobre tom, estilo, profundidade e restrições editoriais.</p>
                </div>
                <div class="page-card">
                    <h3>📐 Steps</h3>
                    <p>Sequência estruturada de operações que o agente deve executar.</p>
                </div>
                <div class="page-card">
                    <h3>🎯 End-goal</h3>
                    <p>Objetivo claro e mensurável (ex: "produzir 800-1200 palavras de análise factual").</p>
                </div>
            </div>
        </section>

        <!-- Fontes -->
        <section class="page-section animate-on-scroll" id="fontes">
            <h2>📰 Fontes & Transparência</h2>
            <p>
                A Contradictio coleta notícias exclusivamente de fontes jornalísticas brasileiras reconhecidas.
                Utilizamos o grupo de fontes <strong>"Brazilian media"</strong> da NewsAPI.ai, complementado
                por filtros de exclusão para garantir qualidade editorial.
            </p>
            <p>
                Todas as fontes originais são citadas ao longo de cada artigo. Nosso compromisso é com a
                <strong>rastreabilidade</strong>: cada afirmação pode ser verificada pelo leitor nas
                fontes primárias.
            </p>
        </section>

        <!-- Humanized -->
        <section class="page-section animate-on-scroll">
            <h2>🧠 Diversidade Intelectual</h2>
            <p>
                Para evitar repetição e enriquecer as análises, utilizamos um pool de mais de
                <strong>50 pensadores</strong> de diversas tradições intelectuais. A cada execução,
                um pensador diferente é selecionado como referência principal, garantindo que cada
                artigo traga uma perspectiva única:
            </p>
            <div class="page-card" style="margin-top: var(--space-4);">
                <p>
                    <strong>Filosofia Clássica:</strong> Aristóteles, Platão, Santo Agostinho, Santo Tomás de Aquino<br>
                    <strong>Pensamento Moderno:</strong> Hannah Arendt, Aleksandr Solzhenitsyn, G.K. Chesterton<br>
                    <strong>Doutrina Social:</strong> Leão XIII, João Paulo II, Bento XVI, Papa Francisco<br>
                    <strong>Pensamento Brasileiro:</strong> Gustavo Corção, Padre Julio Maria, Alceu Amoroso Lima
                </p>
            </div>
        </section>

        <!-- CTA -->
        <div class="page-cta animate-on-scroll">
            <h3>Conheça mais sobre nós</h3>
            <p>Saiba quem está por trás da Contradictio e qual é a nossa linha editorial.</p>
            <a href="<?php echo esc_url(home_url('/sobre/')); ?>" class="page-cta-btn">Página Sobre →</a>
        </div>

    </div>
</div>

<?php get_footer(); ?>
