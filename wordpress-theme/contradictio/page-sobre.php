<?php
/**
 * Template Name: Sobre
 * Slug: sobre
 *
 * Página institucional "Sobre a Contradictio"
 */
get_header();
?>

<div class="static-page-header">
    <div class="container">
        <span class="page-badge">⚖️ Quem Somos</span>
        <h1>Sobre a Contradictio</h1>
        <p class="page-subtitle">Todas as perspectivas, uma verdade.</p>
    </div>
</div>

<div class="container">
    <div class="static-page-content">

        <!-- Missão -->
        <section class="page-section animate-on-scroll">
            <h2>📌 Nossa Missão</h2>
            <p>
                A <strong>Contradictio</strong> é um portal editorial que aplica o <strong>método dialético clássico</strong>
                à análise de notícias. Nosso propósito é oferecer ao leitor uma compreensão mais profunda dos fatos,
                apresentando cada tema sob múltiplas perspectivas antes de chegar a um juízo integrado.
            </p>
            <p>
                Em um cenário informativo cada vez mais fragmentado, acreditamos que a verdade emerge do confronto honesto
                entre <em>tese</em> e <em>antítese</em>, mediado pela razão e iluminado pela tradição filosófica clássica
                e pela <strong>Doutrina Social da Igreja</strong>.
            </p>
        </section>

        <!-- Framework Dialético -->
        <section class="page-section animate-on-scroll">
            <h2>🔄 O Framework Dialético</h2>
            <p>
                Cada análise publicada segue rigorosamente três etapas, garantindo equilíbrio e profundidade:
            </p>

            <div class="page-card-grid">
                <div class="page-card thesis-accent">
                    <span class="dialectical-badge thesis">🔵 Tese</span>
                    <h3>O Relato Factual</h3>
                    <p>
                        Levantamento imparcial dos fatos, dados estatísticos, declarações oficiais e fontes primárias.
                        O ponto de partida objetivo do processo analítico.
                    </p>
                </div>
                <div class="page-card antithesis-accent">
                    <span class="dialectical-badge antithesis">🔴 Antítese</span>
                    <h3>O Contra-Argumento</h3>
                    <p>
                        Perspectivas negligenciadas, contradições internas, vozes dissidentes e evidências contrárias.
                        O elemento de tensão necessário para evitar o pensamento único.
                    </p>
                </div>
            </div>

            <div class="page-card synthesis-accent" style="margin-top: var(--space-6);">
                <span class="dialectical-badge synthesis">🟢 Síntese</span>
                <h3>Visão Integrada</h3>
                <p>
                    A reconciliação racional das perspectivas opostas, orientada pela tradição clássica e pela
                    Doutrina Social da Igreja. Uma análise que não escolhe lados, mas busca a verdade no diálogo
                    entre as partes.
                </p>
            </div>
        </section>

        <!-- Linha Editorial -->
        <section class="page-section animate-on-scroll">
            <h2>✝️ Linha Editorial</h2>
            <p>
                A Contradictio é orientada pela <strong>Doutrina Social da Igreja Católica</strong>, compreendida como
                um corpus coerente de princípios sobre dignidade humana, bem comum, subsidiariedade e solidariedade.
                Não se trata de proselitismo, mas de uma lente hermenêutica que garante ancoragem em valores perenes
                ao analisar o transitório da notícia.
            </p>
            <p>
                Recorremos a mais de <strong>50 pensadores</strong> — de Aristóteles e Santo Tomás de Aquino a
                Hannah Arendt e Aleksandr Solzhenitsyn — para enriquecer cada análise com uma pluralidade
                intelectual genuína.
            </p>
        </section>

        <!-- Tecnologia -->
        <section class="page-section animate-on-scroll">
            <h2>🤖 Tecnologia & Transparência</h2>
            <p>
                A Contradictio utiliza <strong>Inteligência Artificial</strong> (Google Gemini) como ferramenta
                editorial, seguindo o framework <strong>RISEN</strong> (Role, Instructions, Steps, End-goal, Narrowing).
                Cada artigo é gerado por um pipeline de agentes IA especializados:
            </p>
            <div class="page-card-grid">
                <div class="page-card">
                    <h3>🔍 Agente de Tese</h3>
                    <p>Coleta e organiza os fatos de forma imparcial e factual.</p>
                </div>
                <div class="page-card">
                    <h3>⚡ Agente de Antítese</h3>
                    <p>Levanta contra-argumentos, contradições e perspectivas divergentes.</p>
                </div>
                <div class="page-card">
                    <h3>🧠 Agente de Síntese</h3>
                    <p>Integra as visões opostas em uma análise coerente e autoritativa.</p>
                </div>
                <div class="page-card">
                    <h3>📈 Agente de SEO</h3>
                    <p>Otimiza títulos, excerpts e metadados para máxima visibilidade.</p>
                </div>
            </div>
            <p style="margin-top: var(--space-6);">
                Todo o código é aberto e a metodologia é documentada na página
                <a href="<?php echo esc_url(home_url('/metodologia/')); ?>">Metodologia</a>.
            </p>
        </section>

        <!-- Contato -->
        <section class="page-section animate-on-scroll" id="contato">
            <h2>📬 Contato</h2>
            <p>
                Dúvidas, sugestões ou correções? Entre em contato conosco:
            </p>
            <div class="page-card">
                <p>📧 <strong>Email:</strong> <a href="mailto:contato@contradictio.com.br">contato@contradictio.com.br</a></p>
                <p style="margin-top: var(--space-3);">🌐 <strong>Site:</strong> <a href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html(get_bloginfo('url')); ?></a></p>
            </div>
        </section>

        <!-- CTA -->
        <div class="page-cta animate-on-scroll">
            <h3>📬 Receba nossas análises</h3>
            <p>Inscreva-se na newsletter e receba as melhores sínteses dialéticas direto no seu email.</p>
            <a href="<?php echo esc_url(home_url('/#newsletterSection')); ?>" class="page-cta-btn">Inscrever-se →</a>
        </div>

    </div>
</div>

<?php get_footer(); ?>
