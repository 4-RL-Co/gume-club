import { Compass } from "lucide-react";
import { DOURADO } from "@/lib/dourado";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O SELO DO IDEALIZADOR. Fora do sistema de insígnias, de propósito.
 *
 *  "eu acho que em vez de eu ter uma badge de idealizador, poderia ter
 *  um iconezinho diferente do lado do meu nome" — o dono. Ele era a
 *  única insígnia concedida à mão (ninguém pode "conseguir" ter
 *  imaginado uma coisa) e a única sobre uma pessoa só — as duas exceções
 *  já bastavam para ele não caber direito na régua das outras sete
 *  (mesmo L, mesmo C, só o matiz girando — ver lib/badges-view.ts).
 *  Agora é um selo à parte, ao lado do nome em `/@handle`, e não mais um
 *  círculo na fileira de medalhas.
 *
 *  DOURADO, e não uma cor do círculo de matiz: é a mesma cor de toda
 *  coroa do app (curadoria da casa, favoritos — ver lib/dourado.ts), e
 *  "quem imaginou a casa" é exatamente esse tipo de coisa — nunca uma
 *  insígnia de trabalho, sempre um fato sobre a casa em si.
 *
 *  O ícone (Compass) é o mesmo que a insígnia já usava: continuidade,
 *  não um símbolo novo para decorar.
 *
 *  O FATO por trás não mudou: `badge_grants`, `souIdealizador()`
 *  (lib/authz.ts) e `conceder()` (lib/badges.ts) continuam os mesmos —
 *  só a FORMA como ele aparece na tela.
 * ════════════════════════════════════════════════════════════════════
 */
export function SeloIdealizador({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center"
      role="img"
      aria-label="idealizador: teve a ideia do Gume e começou a construir"
      title="idealizador: teve a ideia do Gume e começou a construir"
    >
      <Compass size={size} strokeWidth={1.75} aria-hidden style={{ color: DOURADO }} />
    </span>
  );
}
