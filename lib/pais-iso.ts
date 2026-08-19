/**
 * ════════════════════════════════════════════════════════════════════
 *  O CÓDIGO ISO DE CADA PAÍS. A ponte entre "Brasil" (o que o leitor vê,
 *  lib/paises.ts) e "BR" (o que o mapa múndi (components/mapa-mundi.tsx) sabe
 *  desenhar).
 *
 *  Chave: o código NUMÉRICO ISO 3166-1 (o que o world-atlas usa como `id`
 *  de cada país — ver scripts/gerar-mapa-mundi.mjs, que gera as formas SVG
 *  uma vez e commita o resultado; não roda em produção). Valor: o alpha-2
 *  (o que o SVG final usa como `data-iso`) e o nome em português, na MESMA
 *  grafia que lib/paises.ts já usa como canônica, onde as duas listas se
 *  cruzam (Brasil, Portugal, Reino Unido, Estados Unidos...).
 *
 *  ═══ O QUE ISTO NÃO FAZ ═══
 *
 *  Não inventa um país que a nacionalidade não disse. `isoDoPais()` casa
 *  pelo NOME normalizado (minúsculo, sem acento — mesma função de
 *  lib/paises.ts), e o que não bate simplesmente não pinta no mapa: fica
 *  cinza, do jeito que uma nacionalidade sem retrato hoje não aparece na
 *  barra. Nunca um "não identificado" chutado.
 * ════════════════════════════════════════════════════════════════════
 */

export type Pais = { iso2: string; pt: string };

/** Numérico ISO 3166-1 → { alpha-2, nome em português }. */
export const PAIS_POR_NUMERICO: Record<string, Pais> = {
  "004": { iso2: "AF", pt: "Afeganistão" },
  "008": { iso2: "AL", pt: "Albânia" },
  "012": { iso2: "DZ", pt: "Argélia" },
  "024": { iso2: "AO", pt: "Angola" },
  "032": { iso2: "AR", pt: "Argentina" },
  "031": { iso2: "AZ", pt: "Azerbaijão" },
  "036": { iso2: "AU", pt: "Austrália" },
  "040": { iso2: "AT", pt: "Áustria" },
  "044": { iso2: "BS", pt: "Bahamas" },
  "050": { iso2: "BD", pt: "Bangladesh" },
  "051": { iso2: "AM", pt: "Armênia" },
  "056": { iso2: "BE", pt: "Bélgica" },
  "064": { iso2: "BT", pt: "Butão" },
  "068": { iso2: "BO", pt: "Bolívia" },
  "070": { iso2: "BA", pt: "Bósnia e Herzegovina" },
  "072": { iso2: "BW", pt: "Botsuana" },
  "076": { iso2: "BR", pt: "Brasil" },
  "084": { iso2: "BZ", pt: "Belize" },
  "090": { iso2: "SB", pt: "Ilhas Salomão" },
  "096": { iso2: "BN", pt: "Brunei" },
  "100": { iso2: "BG", pt: "Bulgária" },
  "104": { iso2: "MM", pt: "Mianmar" },
  "108": { iso2: "BI", pt: "Burundi" },
  "112": { iso2: "BY", pt: "Bielorrússia" },
  "116": { iso2: "KH", pt: "Camboja" },
  "120": { iso2: "CM", pt: "Camarões" },
  "124": { iso2: "CA", pt: "Canadá" },
  "140": { iso2: "CF", pt: "República Centro-Africana" },
  "144": { iso2: "LK", pt: "Sri Lanka" },
  "148": { iso2: "TD", pt: "Chade" },
  "152": { iso2: "CL", pt: "Chile" },
  "156": { iso2: "CN", pt: "China" },
  "158": { iso2: "TW", pt: "Taiwan" },
  "170": { iso2: "CO", pt: "Colômbia" },
  "178": { iso2: "CG", pt: "Congo" },
  "180": { iso2: "CD", pt: "República Democrática do Congo" },
  "188": { iso2: "CR", pt: "Costa Rica" },
  "191": { iso2: "HR", pt: "Croácia" },
  "192": { iso2: "CU", pt: "Cuba" },
  "196": { iso2: "CY", pt: "Chipre" },
  "203": { iso2: "CZ", pt: "Chéquia" },
  "204": { iso2: "BJ", pt: "Benin" },
  "208": { iso2: "DK", pt: "Dinamarca" },
  "214": { iso2: "DO", pt: "República Dominicana" },
  "218": { iso2: "EC", pt: "Equador" },
  "222": { iso2: "SV", pt: "El Salvador" },
  "226": { iso2: "GQ", pt: "Guiné Equatorial" },
  "231": { iso2: "ET", pt: "Etiópia" },
  "232": { iso2: "ER", pt: "Eritreia" },
  "233": { iso2: "EE", pt: "Estônia" },
  "238": { iso2: "FK", pt: "Ilhas Malvinas" },
  "242": { iso2: "FJ", pt: "Fiji" },
  "246": { iso2: "FI", pt: "Finlândia" },
  "250": { iso2: "FR", pt: "França" },
  "262": { iso2: "DJ", pt: "Djibuti" },
  "266": { iso2: "GA", pt: "Gabão" },
  "268": { iso2: "GE", pt: "Geórgia" },
  "270": { iso2: "GM", pt: "Gâmbia" },
  "275": { iso2: "PS", pt: "Palestina" },
  "276": { iso2: "DE", pt: "Alemanha" },
  "288": { iso2: "GH", pt: "Gana" },
  "300": { iso2: "GR", pt: "Grécia" },
  "304": { iso2: "GL", pt: "Groenlândia" },
  "320": { iso2: "GT", pt: "Guatemala" },
  "324": { iso2: "GN", pt: "Guiné" },
  "328": { iso2: "GY", pt: "Guiana" },
  "332": { iso2: "HT", pt: "Haiti" },
  "340": { iso2: "HN", pt: "Honduras" },
  "348": { iso2: "HU", pt: "Hungria" },
  "352": { iso2: "IS", pt: "Islândia" },
  "356": { iso2: "IN", pt: "Índia" },
  "360": { iso2: "ID", pt: "Indonésia" },
  "364": { iso2: "IR", pt: "Irã" },
  "368": { iso2: "IQ", pt: "Iraque" },
  "372": { iso2: "IE", pt: "Irlanda" },
  "376": { iso2: "IL", pt: "Israel" },
  "380": { iso2: "IT", pt: "Itália" },
  "384": { iso2: "CI", pt: "Costa do Marfim" },
  "388": { iso2: "JM", pt: "Jamaica" },
  "392": { iso2: "JP", pt: "Japão" },
  "398": { iso2: "KZ", pt: "Cazaquistão" },
  "400": { iso2: "JO", pt: "Jordânia" },
  "404": { iso2: "KE", pt: "Quênia" },
  "408": { iso2: "KP", pt: "Coreia do Norte" },
  "410": { iso2: "KR", pt: "Coreia do Sul" },
  "414": { iso2: "KW", pt: "Kuwait" },
  "417": { iso2: "KG", pt: "Quirguistão" },
  "418": { iso2: "LA", pt: "Laos" },
  "422": { iso2: "LB", pt: "Líbano" },
  "426": { iso2: "LS", pt: "Lesoto" },
  "428": { iso2: "LV", pt: "Letônia" },
  "430": { iso2: "LR", pt: "Libéria" },
  "434": { iso2: "LY", pt: "Líbia" },
  "440": { iso2: "LT", pt: "Lituânia" },
  "442": { iso2: "LU", pt: "Luxemburgo" },
  "450": { iso2: "MG", pt: "Madagascar" },
  "454": { iso2: "MW", pt: "Malawi" },
  "458": { iso2: "MY", pt: "Malásia" },
  "466": { iso2: "ML", pt: "Mali" },
  "478": { iso2: "MR", pt: "Mauritânia" },
  "484": { iso2: "MX", pt: "México" },
  "496": { iso2: "MN", pt: "Mongólia" },
  "498": { iso2: "MD", pt: "Moldávia" },
  "499": { iso2: "ME", pt: "Montenegro" },
  "504": { iso2: "MA", pt: "Marrocos" },
  "508": { iso2: "MZ", pt: "Moçambique" },
  "512": { iso2: "OM", pt: "Omã" },
  "516": { iso2: "NA", pt: "Namíbia" },
  "524": { iso2: "NP", pt: "Nepal" },
  "528": { iso2: "NL", pt: "Países Baixos" },
  "540": { iso2: "NC", pt: "Nova Caledônia" },
  "548": { iso2: "VU", pt: "Vanuatu" },
  "554": { iso2: "NZ", pt: "Nova Zelândia" },
  "558": { iso2: "NI", pt: "Nicarágua" },
  "562": { iso2: "NE", pt: "Níger" },
  "566": { iso2: "NG", pt: "Nigéria" },
  "578": { iso2: "NO", pt: "Noruega" },
  "586": { iso2: "PK", pt: "Paquistão" },
  "591": { iso2: "PA", pt: "Panamá" },
  "598": { iso2: "PG", pt: "Papua-Nova Guiné" },
  "600": { iso2: "PY", pt: "Paraguai" },
  "604": { iso2: "PE", pt: "Peru" },
  "608": { iso2: "PH", pt: "Filipinas" },
  "616": { iso2: "PL", pt: "Polônia" },
  "620": { iso2: "PT", pt: "Portugal" },
  "624": { iso2: "GW", pt: "Guiné-Bissau" },
  "626": { iso2: "TL", pt: "Timor-Leste" },
  "630": { iso2: "PR", pt: "Porto Rico" },
  "634": { iso2: "QA", pt: "Catar" },
  "642": { iso2: "RO", pt: "Romênia" },
  "643": { iso2: "RU", pt: "Rússia" },
  "646": { iso2: "RW", pt: "Ruanda" },
  "682": { iso2: "SA", pt: "Arábia Saudita" },
  "686": { iso2: "SN", pt: "Senegal" },
  "688": { iso2: "RS", pt: "Sérvia" },
  "694": { iso2: "SL", pt: "Serra Leoa" },
  "703": { iso2: "SK", pt: "Eslováquia" },
  "704": { iso2: "VN", pt: "Vietnã" },
  "705": { iso2: "SI", pt: "Eslovênia" },
  "706": { iso2: "SO", pt: "Somália" },
  "710": { iso2: "ZA", pt: "África do Sul" },
  "716": { iso2: "ZW", pt: "Zimbábue" },
  "724": { iso2: "ES", pt: "Espanha" },
  "728": { iso2: "SS", pt: "Sudão do Sul" },
  "729": { iso2: "SD", pt: "Sudão" },
  "732": { iso2: "EH", pt: "Saara Ocidental" },
  "740": { iso2: "SR", pt: "Suriname" },
  "748": { iso2: "SZ", pt: "Essuatíni" },
  "752": { iso2: "SE", pt: "Suécia" },
  "756": { iso2: "CH", pt: "Suíça" },
  "760": { iso2: "SY", pt: "Síria" },
  "762": { iso2: "TJ", pt: "Tajiquistão" },
  "764": { iso2: "TH", pt: "Tailândia" },
  "768": { iso2: "TG", pt: "Togo" },
  "780": { iso2: "TT", pt: "Trinidad e Tobago" },
  "784": { iso2: "AE", pt: "Emirados Árabes Unidos" },
  "788": { iso2: "TN", pt: "Tunísia" },
  "792": { iso2: "TR", pt: "Turquia" },
  "795": { iso2: "TM", pt: "Turcomenistão" },
  "800": { iso2: "UG", pt: "Uganda" },
  "804": { iso2: "UA", pt: "Ucrânia" },
  "807": { iso2: "MK", pt: "Macedônia do Norte" },
  "818": { iso2: "EG", pt: "Egito" },
  "826": { iso2: "GB", pt: "Reino Unido" },
  "834": { iso2: "TZ", pt: "Tanzânia" },
  "840": { iso2: "US", pt: "Estados Unidos" },
  "854": { iso2: "BF", pt: "Burquina Faso" },
  "858": { iso2: "UY", pt: "Uruguai" },
  "860": { iso2: "UZ", pt: "Uzbequistão" },
  "862": { iso2: "VE", pt: "Venezuela" },
  "887": { iso2: "YE", pt: "Iêmen" },
  "894": { iso2: "ZM", pt: "Zâmbia" },
};

/** minúscula, sem acento — mesma régua de lib/paises.ts. */
function normaliza(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Nomes de país que existem no acervo mas não batem exatamente com o nome
 * canônico acima — os mesmos adjetivos e apelidos que lib/paises.ts já
 * conhece, mais alguns que só o mapa precisa (o mapa casa pelo NOME
 * completo, então "brasileira" tem que apontar pro mesmo lugar que
 * "Brasil"). Chave normalizada, valor é o numérico ISO.
 */
const APELIDOS: Record<string, string> = {
  brasileira: "076", brasileiro: "076",
  portuguesa: "620", portugues: "620",
  britanica: "826", britanico: "826", inglesa: "826", inglaterra: "826",
  americana: "840", americano: "840",
  francesa: "250", frances: "250",
  alema: "276", alemao: "276",
  italiana: "380", italiano: "380",
  japonesa: "392", japones: "392",
  espanhola: "724", espanhol: "724",
  russa: "643", russo: "643",
  indiana: "356",
  angolana: "024",
  mocambicana: "508",
};

const POR_NOME = (() => {
  const mapa = new Map<string, string>();
  for (const [numerico, { pt }] of Object.entries(PAIS_POR_NUMERICO)) {
    mapa.set(normaliza(pt), numerico);
  }
  for (const [apelido, numerico] of Object.entries(APELIDOS)) {
    mapa.set(apelido, numerico);
  }
  return mapa;
})();

/** O país (nome em português, apelido, ou adjetivo) → { iso2, pt }, ou `null` quando não bate. */
export function paisPorNome(nome: string): Pais | null {
  const numerico = POR_NOME.get(normaliza(nome));
  return numerico ? PAIS_POR_NUMERICO[numerico]! : null;
}
