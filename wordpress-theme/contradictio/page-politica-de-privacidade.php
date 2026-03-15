<?php
/**
 * Template Name: Política de Privacidade
 * Slug: politica-de-privacidade
 *
 * Página institucional "Política de Privacidade" (LGPD)
 */
get_header();
?>

<div class="static-page-header">
    <div class="container">
        <span class="page-badge">🔒 Proteção de Dados</span>
        <h1>Política de Privacidade</h1>
        <p class="page-subtitle">Última atualização: <?php echo date('d/m/Y'); ?></p>
    </div>
</div>

<div class="container">
    <div class="static-page-content static-page-legal">

        <section class="page-section animate-on-scroll">
            <h2>1. Introdução</h2>
            <p>
                A <strong><?php bloginfo('name'); ?></strong> ("nós", "nosso") opera o site
                <a href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html(get_bloginfo('url')); ?></a>.
                Esta Política de Privacidade explica como coletamos, usamos e protegemos os seus dados pessoais,
                em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
            </p>
            <p>
                Ao utilizar nosso site, você concorda com as práticas descritas nesta política.
            </p>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>2. Dados Coletados</h2>

            <h3>2.1 Dados fornecidos voluntariamente</h3>
            <ul>
                <li><strong>Newsletter:</strong> Ao se inscrever, coletamos apenas seu endereço de email para envio de conteúdo editorial.</li>
                <li><strong>Contato:</strong> Caso entre em contato conosco por email, coletamos o endereço de email e o conteúdo da mensagem.</li>
            </ul>

            <h3>2.2 Dados coletados automaticamente</h3>
            <ul>
                <li><strong>Google Analytics (GA4):</strong> Coletamos dados anônimos de navegação, como páginas visitadas, tempo de permanência, dispositivo e localização geográfica aproximada. Administradores logados são excluídos do rastreamento.</li>
                <li><strong>Cookies:</strong> Utilizamos cookies essenciais para funcionamento do site e cookies analíticos do Google Analytics. Veja a seção 5 para detalhes.</li>
                <li><strong>Notificações Push:</strong> Caso você autorize notificações do navegador, armazenamos apenas a permissão localmente no seu dispositivo. Nenhum dado é enviado ao nosso servidor.</li>
            </ul>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>3. Finalidade do Tratamento</h2>
            <p>Seus dados são utilizados exclusivamente para:</p>
            <ul>
                <li>Envio de newsletters com análises editoriais</li>
                <li>Melhoria do conteúdo e da experiência de navegação por meio de métricas anônimas</li>
                <li>Resposta a contatos e solicitações</li>
                <li>Cumprimento de obrigações legais</li>
            </ul>
            <p>
                <strong>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros</strong>,
                exceto quando exigido por lei.
            </p>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>4. Base Legal</h2>
            <p>O tratamento dos seus dados é fundamentado nas seguintes bases legais da LGPD:</p>
            <ul>
                <li><strong>Consentimento</strong> (Art. 7º, I): Para inscrição na newsletter e ativação de notificações push.</li>
                <li><strong>Legítimo interesse</strong> (Art. 7º, IX): Para análise de métricas de navegação anônimas visando melhoria do conteúdo.</li>
                <li><strong>Cumprimento de obrigação legal</strong> (Art. 7º, II): Quando aplicável.</li>
            </ul>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>5. Cookies</h2>
            <p>Utilizamos os seguintes tipos de cookies:</p>

            <div class="privacy-table-wrapper">
                <table class="privacy-table">
                    <thead>
                        <tr>
                            <th>Cookie</th>
                            <th>Tipo</th>
                            <th>Finalidade</th>
                            <th>Retenção</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>sintese-theme</code></td>
                            <td>Essencial</td>
                            <td>Salva a preferência de tema (claro/escuro)</td>
                            <td>Permanente (localStorage)</td>
                        </tr>
                        <tr>
                            <td><code>_ga</code>, <code>_ga_*</code></td>
                            <td>Analítico</td>
                            <td>Google Analytics — métricas de navegação anônimas</td>
                            <td>2 anos</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p>
                Você pode desativar cookies a qualquer momento nas configurações do seu navegador.
                A desativação de cookies essenciais pode impactar a experiência de navegação.
            </p>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>6. Seus Direitos (LGPD)</h2>
            <p>
                Conforme a LGPD, você tem direito a:
            </p>
            <ul>
                <li><strong>Confirmação</strong> da existência de tratamento dos seus dados</li>
                <li><strong>Acesso</strong> aos dados pessoais que mantemos sobre você</li>
                <li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização, bloqueio ou eliminação</strong> de dados desnecessários ou excessivos</li>
                <li><strong>Portabilidade</strong> dos dados a outro fornecedor de serviço</li>
                <li><strong>Eliminação</strong> dos dados tratados com consentimento</li>
                <li><strong>Revogação do consentimento</strong> a qualquer momento</li>
            </ul>
            <p>
                Para exercer qualquer desses direitos, entre em contato pelo email:
                <a href="mailto:contato@contradictio.com.br">contato@contradictio.com.br</a>.
                Responderemos em até <strong>15 dias úteis</strong>.
            </p>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>7. Retenção de Dados</h2>
            <ul>
                <li><strong>Email de newsletter:</strong> Mantido enquanto você permanecer inscrito. Pode ser removido a qualquer momento.</li>
                <li><strong>Dados analíticos:</strong> Retidos de forma anônima e agregada, conforme políticas do Google Analytics.</li>
                <li><strong>Contatos por email:</strong> Retidos pelo tempo necessário para resposta e seguimento.</li>
            </ul>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>8. Segurança</h2>
            <p>
                Empregamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
            </p>
            <ul>
                <li>Comunicação criptografada via HTTPS (TLS)</li>
                <li>Hospedagem em infraestrutura Google Cloud com segurança de nível empresarial</li>
                <li>Acesso restrito a dados pessoais (apenas pessoal autorizado)</li>
            </ul>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>9. Alterações nesta Política</h2>
            <p>
                Reservamo-nos o direito de atualizar esta Política de Privacidade a qualquer momento.
                Alterações significativas serão comunicadas por meio de aviso no site ou por email
                para assinantes da newsletter.
            </p>
        </section>

        <section class="page-section animate-on-scroll">
            <h2>10. Responsável pelo Tratamento</h2>
            <div class="page-card">
                <p><strong>Controlador:</strong> <?php bloginfo('name'); ?></p>
                <p style="margin-top: var(--space-2);"><strong>Site:</strong> <a href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html(get_bloginfo('url')); ?></a></p>
                <p style="margin-top: var(--space-2);"><strong>Email:</strong> <a href="mailto:contato@contradictio.com.br">contato@contradictio.com.br</a></p>
            </div>
        </section>

    </div>
</div>

<?php get_footer(); ?>
