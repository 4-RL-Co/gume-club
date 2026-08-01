"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { reenviarConfirmacao } from "@/app/[handle]/actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "VOCÊ NÃO ESTÁ APARECENDO PARA NINGUÉM." Dito na cara, e com saída.
 *
 *  ═══ O SILÊNCIO QUE ISTO ACABA ═══
 *
 *  Quem não confirmou o e-mail continua usando o Gume inteiro — e some do explorar,
 *  das listas, do "pessoas" e dos buscadores. **Nenhuma tela dizia isso.** Não havia
 *  erro, não havia aviso: a pessoa simplesmente não existia para os outros, e o
 *  único sintoma era ninguém nunca segui-la.
 *
 *  Em produção eram quatro. Uma delas tinha montado a maior estante do site, 503
 *  livros, e estava invisível o tempo todo.
 *
 *  Um app que esconde alguém e não conta é um app que mente por omissão. O portão
 *  pode continuar existindo; o segredo, não.
 *
 *  ═══ SÓ PARA A PRÓPRIA PESSOA ═══
 *
 *  Este aviso não é um `Notice` que se fecha e some: fechar não conserta nada, e o
 *  problema continua de pé até alguém clicar no link do e-mail. Ele fica.
 *
 *  E ele só aparece no SEU perfil, para você. Dizer a um visitante que o dono da
 *  página não confirmou o e-mail seria expor uma pendência dele para estranhos.
 *
 *  ═══ A FRASE NÃO FALA DE CADASTRO, FALA DE GENTE ═══
 *
 *  Não é "verifique sua conta". É "ninguém te encontra". A primeira é burocracia; a
 *  segunda é o que está de fato acontecendo com a estante que a pessoa montou.
 * ════════════════════════════════════════════════════════════════════
 */
export function ConfirmeSeuEmail({ faltam }: { faltam: number }) {
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado" | "erro">("parado");

  const enviar = () => {
    setEstado("enviando");
    reenviarConfirmacao()
      .then(() => setEstado("enviado"))
      // Um botão que não responde faz a pessoa clicar cinco vezes e desistir. Se a
      // rede caiu, ela precisa saber que caiu — e poder tentar de novo.
      .catch(() => setEstado("erro"));
  };

  return (
    <div className="surface mt-5 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:gap-5">
      <MailWarning
        size={20}
        strokeWidth={1.5}
        aria-hidden
        className="shrink-0 text-[var(--color-ink-soft)]"
      />

      <div className="flex-1">
        <p className="text-[15px] text-[var(--color-ink)]">
          A sua estante não está aparecendo para quem ainda não te conhece.
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
          Falta confirmar o seu e-mail. Enquanto isso, o Gume funciona igual e a sua estante
          é sua — mas o seu perfil fica fora do explorar e das listas.{" "}
          {faltam > 0 && (
            <>
              Outro caminho: uma estante pública com {faltam}{" "}
              {faltam === 1 ? "livro" : "livros"} a mais também abre essa porta.
            </>
          )}
        </p>
      </div>

      {estado === "enviado" ? (
        <p className="shrink-0 text-[13px] text-[var(--color-ink-soft)]">
          Enviado. Olhe também o spam.
        </p>
      ) : (
        <button
          onClick={enviar}
          disabled={estado === "enviando"}
          className="shrink-0 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)] disabled:opacity-50"
        >
          {estado === "enviando" ? "enviando…" : estado === "erro" ? "tentar de novo" : "reenviar o e-mail"}
        </button>
      )}
    </div>
  );
}
