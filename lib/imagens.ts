/**
 * ════════════════════════════════════════════════════════════════════
 *  DE ONDE UMA IMAGEM PODE VIR. Uma lista, e um lugar só.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO EXISTE POR CAUSA DE ═══
 *
 *  "Não consigo colocar foto no autor dos livros: eu colo o link e vai a imagem
 *  quebrada."
 *
 *  A imagem não estava quebrada. Ela estava **bloqueada** — a CSP do app só deixa passar
 *  imagem de uma lista de origens, e o endereço colado não estava nela. O navegador
 *  recusava, e a tela mostrava um retângulo vazio **sem dizer nada**.
 *
 *  O formulário aceitava, o banco gravava, a revisão era registrada com o nome de quem
 *  fez, e o resultado era uma imagem quebrada para todo mundo. **A pessoa fez tudo certo
 *  e o app fingiu que deu certo.**
 *
 *  ═══ POR QUE A LISTA EXISTE, E NÃO VAI VIRAR `https:` ═══
 *
 *  Abrir a CSP para `img-src https:` conserta o sintoma em uma linha, e abre um buraco:
 *  quem escolhe o endereço de uma imagem escolhe um servidor que vai receber o **IP de
 *  toda pessoa que abrir aquela página**. Um retrato de autor apontado para o servidor de
 *  alguém é um rastreador dentro do app.
 *
 *  A lista continua. O que muda é que agora ela é **dita**, e a recusa acontece no
 *  formulário — com uma frase — em vez de acontecer no navegador, em silêncio.
 *
 *  ═══ E ELA VIVE NUM LUGAR SÓ ═══
 *
 *  A CSP (middleware.ts) e a validação do formulário liam DUAS listas diferentes. Duas
 *  listas sobre a mesma coisa divergem: alguém acrescenta uma origem na CSP, esquece do
 *  validador, e o formulário passa a recusar uma imagem que funcionaria.
 *
 *  Aqui é uma lista. As duas leem daqui.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * As origens de imagem que o app aceita.
 *
 * Cada uma está aqui por um motivo, e o motivo é o mesmo: é um acervo público de onde a
 * imagem vem POR REFERÊNCIA — a gente guarda o endereço, e nunca uma cópia do arquivo.
 * Ver ai/PRD.md.
 */
export const FONTES_DE_IMAGEM = [
  { host: "covers.openlibrary.org", oQueE: "capas da Open Library" },
  { host: "archive.org", oQueE: "o Internet Archive" },
  { host: "*.archive.org", oQueE: "o Internet Archive" },
  { host: "books.google.com", oQueE: "capas do Google Books" },
  { host: "*.gstatic.com", oQueE: "imagens do Google" },
  { host: "s4.anilist.co", oQueE: "capas da AniList" },
  /**
   * A CDN da H1 Editora. Entrou na operação que trouxe o catálogo da H1 inteiro
   * (scripts/operacao-mais-capas.mjs): 27 edições com ISBN e capa exata em alta,
   * apontadas POR REFERÊNCIA para o endereço público da editora, como a política
   * manda. Guardar o endereço, nunca a cópia.
   */
  { host: "h1editora.fbitsstatic.net", oQueE: "capas da H1 Editora" },
  { host: "commons.wikimedia.org", oQueE: "o Wikimedia Commons" },
  { host: "upload.wikimedia.org", oQueE: "o Wikimedia Commons" },
  { host: "avatars.githubusercontent.com", oQueE: "a foto de perfil do GitHub" },
  { host: "lh3.googleusercontent.com", oQueE: "a foto de perfil do Google" },

  /**
   * ═══ E A FOTO QUE A PRÓPRIA PESSOA MANDOU ═══
   *
   * Em produção ela não mora mais no nosso disco (em serverless não existe disco): ela vai
   * para o armazenamento de objetos, e volta de um host que NÃO é o nosso.
   *
   * Sem esta linha, a CSP bloquearia o rosto de todo mundo que subisse uma foto — que é
   * exatamente o bug que este arquivo existe para matar, recriado por quem o matou, uma
   * feature depois. Ver lib/guardar.ts.
   */
  { host: "*.public.blob.vercel-storage.com", oQueE: "a foto que você mesma mandou" },
] as const;

/**
 * A diretiva da CSP, montada da lista. É o middleware que usa.
 *
 * ════════════════════════════════════════════════════════════════════
 *  `blob:` NÃO É UMA ORIGEM DE FORA. É A FOTO QUE AINDA NÃO SAIU DA MÁQUINA.
 *
 *  ═══ A CAIXA CINZA ═══
 *
 *  Quem escolhia uma foto de perfil via um retângulo cinza, e mais nada. Nenhum erro na
 *  tela, nenhum erro no servidor, nenhum teste vermelho: só o cinza.
 *
 *  O seletor de foto trocou `readAsDataURL` por `createObjectURL` para não engasgar com
 *  uma foto de seis megabytes — uma troca certa, e ela criou um endereço `blob:`. Só que
 *  a CSP listava `'self' data:` e mais nada, então o navegador BLOQUEAVA a prévia. Em
 *  silêncio, que é como a CSP sempre faz.
 *
 *  Uma decisão de desempenho num arquivo mudou o que outro arquivo precisava permitir, e
 *  os dois não se conheciam.
 *
 *  ═══ POR QUE ISTO NÃO AFROUXA NADA ═══
 *
 *  Um `blob:` só existe dentro da aba que o criou, e só a partir de um arquivo que a
 *  própria pessoa escolheu no disco dela. Ele não é um endereço que um atacante possa
 *  fabricar de fora, e ele morre quando a aba fecha. É a mesma confiança que `data:` já
 *  tinha, num formato que não custa um terço de megabyte por foto.
 *
 *  `lib/imagens.test.ts` amarra isto: se a prévia usa `createObjectURL`, a CSP tem que
 *  dizer `blob:`. As duas pontas param de poder divergir em silêncio.
 * ════════════════════════════════════════════════════════════════════
 */
export function imgSrc(): string {
  const origens = FONTES_DE_IMAGEM.map((f) => `https://${f.host}`).join(" ");
  return `img-src 'self' data: blob: ${origens}`;
}

/**
 * Os lugares de onde um RETRATO DE AUTOR pode vir, ditos em português.
 *
 * É o que o formulário mostra. Uma recusa sem explicação é um formulário que diz "não" e
 * dá as costas — e a pessoa não tem como acertar na segunda tentativa.
 */
export const DE_ONDE_ACEITA = [
  "o Wikimedia Commons (a foto que está na Wikipédia)",
  "a Open Library",
  "o Internet Archive",
] as const;

/**
 * Este endereço de imagem é aceito?
 *
 * Devolve `null` quando está tudo bem, e uma FRASE quando não está. Nunca um booleano
 * pelado: quem chama precisa dizer à pessoa o que houve, e um `false` não diz nada.
 */
export function porQueNaoAceita(endereco: string): string | null {
  const limpo = endereco.trim();
  if (!limpo) return null; // vazio é apagar o retrato, e apagar é permitido

  let url: URL;
  try {
    url = new URL(limpo);
  } catch {
    return "Isso não parece um endereço de imagem. Ele começa com https://";
  }

  /**
   * `https`, e nunca `http`.
   *
   * Uma imagem em http numa página em https é bloqueada pelo navegador de qualquer jeito
   * (conteúdo misto) — e ela some sem avisar, que é exatamente o bug que este arquivo
   * existe para matar.
   */
  if (url.protocol !== "https:") {
    return "O endereço tem que começar com https:// — o navegador bloqueia imagem em http.";
  }

  const host = url.hostname.toLowerCase();

  const aceita = FONTES_DE_IMAGEM.some((f) => {
    if (f.host.startsWith("*.")) {
      const dominio = f.host.slice(2);
      return host === dominio || host.endsWith(`.${dominio}`);
    }
    return host === f.host;
  });

  if (aceita) return null;

  /**
   * A RECUSA DIZ DE ONDE ACEITA.
   *
   * "Endereço inválido" é a mensagem de erro mais inútil que existe: ela não diz o que
   * está errado nem o que fazer. A pessoa tentou ajudar o catálogo, e o app tem que
   * ajudá-la de volta.
   */
  return (
    `O Gume não mostra imagem de ${host}. Ele só aceita retrato de acervos públicos, ` +
    `de onde a imagem vem por referência: ${DE_ONDE_ACEITA.join(", ")}. ` +
    `Na Wikipédia, clique na foto, depois em "Mais detalhes", e copie o endereço do arquivo.`
  );
}
