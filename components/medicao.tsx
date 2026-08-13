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

      {/**
       * ═══ O CLARITY TAMBÉM PRECISOU DO CONSERTO DO GOOGLE, E NINGUÉM TINHA
       *     VOLTADO AQUI PRA APLICAR ═══
       *
       * O mesmo problema documentado abaixo pro Google Analytics: `next/script`
       * com `afterInteractive` não põe a tag no HTML que o servidor manda — ela
       * nasce só depois da hidratação, como dado dentro do payload do React. O
       * verificador do Clarity lê o HTML cru (a mesma checagem que o Google já
       * fazia), não acha o script, e mostra "ainda não instalado" para sempre,
       * mesmo com o rastreamento funcionando de verdade em quem realmente abre
       * a página. Por isso o bloco é `dangerouslySetInnerHTML`, como o do GA
       * logo abaixo — não `next/script`. */}
      {clarity && (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarity}");`,
          }}
        />
      )}

      {/**
       * ════════════════════════════════════════════════════════════════
       *  O GOOGLE ANALYTICS, E POR QUE ELE É O ÚNICO DOS TRÊS QUE NÃO USA
       *  `next/script`.
       *
       *  ═══ A PRIMEIRA VERSÃO USAVA, E O GOOGLE NÃO ACHAVA A TAG ═══
       *
       *  Com `next/script`, o script NÃO sai no HTML que o servidor manda. O
       *  que sai é um `<link rel="preload">` e uma instrução dentro do pacote
       *  do React; a tag de verdade só nasce depois que a página hidrata, no
       *  navegador. Para gente de verdade isso funciona perfeitamente, e é
       *  inclusive melhor: o script de terceiro não disputa a primeira pintura.
       *
       *  Só que a verificação do Google ("sua tag não foi detectada em
       *  gume.club") lê o HTML, e no HTML não havia tag nenhuma. **Foi medido,
       *  e nas duas estratégias**: nem `afterInteractive` nem
       *  `beforeInteractive` põem uma `<script src>` de verdade na resposta
       *  quando o componente vive no corpo da página.
       *
       *  Um painel de medição que diz "não instalado" é um painel em que
       *  ninguém confia, e o dono ia voltar nessa tela toda semana.
       *
       *  ═══ ENTÃO É O SNIPPET DO GOOGLE, COMO ELE É ═══
       *
       *  Duas tags literais, exatamente o que o Google manda colar, o que faz
       *  a verificação passar e a medição começar mais cedo (pega quem abre e
       *  desiste antes de a página hidratar, que hoje não era contado).
       *
       *  O preço é honesto e limitado: um script de terceiro entra na conta do
       *  carregamento. O `async` segura o estrago (ele não bloqueia a leitura
       *  da página), e é o mesmo custo que qualquer site com GA paga.
       *
       *  ═══ ELAS CAEM EM LUGARES DIFERENTES, E ESTÁ CERTO ═══
       *
       *  Medido no HTML gerado: o React 19 IÇA a tag com `async src` para o
       *  `<head>` sozinho (é o que ele faz com script assíncrono, e de quebra
       *  garante que ela não se duplica). O bloco embutido fica onde este
       *  componente mora, no fim do corpo.
       *
       *  Separados assim eles continuam certos, e é por desenho do próprio
       *  gtag: os dois lados conversam pela fila `dataLayer`, e quem chegar
       *  primeiro cria a fila para o outro. O loader é assíncrono justamente
       *  porque pode chegar antes ou depois. Não tente "consertar" a ordem.
       *
       *  E o gtag conta a troca de página sozinho, escutando a URL, sem
       *  precisar de código nosso em cada tela.
       *
       *  O `unsafe-inline` que o segundo bloco exige JÁ EXISTE na CSP (é o
       *  preço do Next, que injeta o próprio bootstrap embutido). Este script
       *  não afrouxa nada: ver middleware.ts.
       * ════════════════════════════════════════════════════════════════
       */}
      {ga && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga}');`,
            }}
          />
        </>
      )}
    </>
  );
}
