import Script from "next/script";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A MEDIÇÃO DA INSTÂNCIA HOSPEDADA. E ela nasce DESLIGADA.
 *
 *  Dois medidores, cada um atrás da própria variável de ambiente:
 *
 *   - Cloudflare Web Analytics (NEXT_PUBLIC_CF_ANALYTICS_TOKEN): contagem
 *     de visita agregada, sem cookie e sem perfil. É o inofensivo.
 *   - Microsoft Clarity (NEXT_PUBLIC_CLARITY_ID): mapa de calor e replay
 *     de sessão. É o poderoso, e é o que exige cuidado: ver a entrada em
 *     ai/DECISIONS.md sobre o que ele pode e o que ele não pode ver.
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
    </>
  );
}
