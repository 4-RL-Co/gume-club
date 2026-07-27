import Script from "next/script";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A MEDIÇÃO DA INSTÂNCIA HOSPEDADA. E ela nasce DESLIGADA.
 *
 *  Três medidores, cada um atrás da própria variável de ambiente:
 *
 *   - Cloudflare Web Analytics (NEXT_PUBLIC_CF_ANALYTICS_TOKEN): contagem
 *     de visita agregada, sem cookie e sem perfil. É o inofensivo.
 *   - Microsoft Clarity (NEXT_PUBLIC_CLARITY_ID): mapa de calor e replay
 *     de sessão. É o poderoso, e é o que exige cuidado: ver a entrada em
 *     ai/DECISIONS.md sobre o que ele pode e o que ele não pode ver.
 *   - Google Analytics 4 (NEXT_PUBLIC_GA_ID): audiência, origem do
 *     tráfego e funil. Usa cookie, e é o único dos três que o dono já
 *     conhece de outros projetos, que é o motivo de ele estar aqui.
 *
 *  ═══ POR QUE POR VARIÁVEL, E NUNCA CRAVADO ═══
 *
 *  Este repo é de todo mundo. Um token cravado aqui faria TODA instância
 *  auto-hospedada mandar os leitores de outra pessoa para o painel do
 *  dono desta — um rastreador de fábrica, no app que promete o contrário.
 *  Sem as variáveis, nenhum byte de medição entra na página, e a CSP nem
 *  abre os hosts (ver middleware.ts: as duas listas andam juntas).
 * ════════════════════════════════════════════════════════════════════
 */
export function Medicao() {
  const cloudflare = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  const clarity = process.env.NEXT_PUBLIC_CLARITY_ID;
  const ga = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {cloudflare && (
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={`{"token": "${cloudflare}"}`}
          strategy="afterInteractive"
        />
      )}

      {clarity && (
        <Script id="clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarity}");`}
        </Script>
      )}

      {/**
       * ═══ O GOOGLE ANALYTICS, E O QUE MUDA DO SNIPPET QUE O GOOGLE DÁ ═══
       *
       * O Google entrega dois `<script>` para colar no `<head>`: um que baixa o
       * gtag e outro, embutido, que o configura. Colados assim num app do Next,
       * eles bloqueiam a primeira pintura e brigam com a navegação do lado do
       * cliente. Aqui viram dois `next/script` com `afterInteractive`, que é a
       * mesma coisa depois de a página existir.
       *
       * O `id` do segundo NÃO é enfeite: sem ele o Next não sabe que os dois
       * blocos são um só, e em navegação repetida o script embutido pode entrar
       * de novo e recontar a mesma pessoa.
       *
       * E ele conta a navegação sozinho: o gtag escuta a troca de URL do
       * navegador, então uma página aberta pelo menu conta igual a uma aberta
       * direto no endereço, sem precisar de código nosso em cada tela.
       */}
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga}');`}
          </Script>
        </>
      )}
    </>
  );
}
