/**
 * A nota é uma PALAVRA. O número morreu.
 *
 * Estrela é escala. Escala vira média. Média vira placar. Palavra não soma: não
 * existe "a média de 'gostei' e 'adorei'", e é exatamente por isso que ela é a
 * forma certa. Era o último número do produto, e ele saiu.
 *
 * No banco continua um smallint 1..5, porque ordenar, filtrar e importar precisam
 * de ordem. Na TELA nunca aparece um dígito. Nunca.
 */

export const VERDICTS = [
  /**
   * O DEGRAU 1 JÁ SE CHAMOU "não terminei", e o nome estava errado de dois jeitos:
   * gente marcava enquanto ainda estava LENDO (parecia um status, e status é outra
   * coluna: "larguei" existe para isso), e o degrau era para ser PIOR que "não
   * gostei", o que o nome não dizia. Virou julgamento: "detestei". "Odiei" foi
   * considerado e recusado (forte demais para um app que fala baixo), e o teste
   * garante que ele nunca entra.
   */
  { value: 1, mine: "detestei", theirs: "detestou" },
  { value: 2, mine: "não gostei", theirs: "não gostou" },
  { value: 3, mine: "achei ok", theirs: "achou ok" },
  { value: 4, mine: "gostei", theirs: "gostou" },
  { value: 5, mine: "adorei", theirs: "adorou" },
] as const;

export type VerdictValue = 1 | 2 | 3 | 4 | 5;

/** O que EU achei. "adorei". */
export function mine(value: number): string {
  return VERDICTS.find((v) => v.value === value)?.mine ?? "";
}

/** O que a OUTRA pessoa achou. "Rui adorou". Opinião de gente, nunca placar. */
export function theirs(value: number): string {
  return VERDICTS.find((v) => v.value === value)?.theirs ?? "";
}

/**
 * Estrela de importação vira palavra, degrau por degrau.
 *
 * O Goodreads (e o Skoob, e a planilha da sua amiga) guarda estrela de 1 a 5, e
 * agora cada estrela tem a sua palavra: uma estrela é "detestei", e não mais uma
 * perda achatada em "não gostei". Enquanto o degrau 1 se chamava "não terminei"
 * (um quase-status), mandar uma estrela para lá seria mentir sobre a leitura; com
 * o degrau virando julgamento, a tradução ficou inteira.
 */
export function fromStars(stars: number): VerdictValue | null {
  if (!Number.isFinite(stars) || stars < 1) return null;
  const s = Math.round(stars);
  if (s >= 5) return 5;
  return Math.max(1, s) as VerdictValue;
}

/**
 * A escala de meia-estrela que este app usou até aqui (smallint 1..10) vira
 * palavra. Usado uma vez, na migração, e mantido aqui para o teste poder provar
 * que a conversão é a que a gente diz que é.
 */
export function fromHalfStars(half: number): VerdictValue {
  if (half >= 10) return 5;
  if (half >= 8) return 4;
  if (half >= 6) return 3;
  return 2;
}
