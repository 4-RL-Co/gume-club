import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { ImportForm } from "@/components/import-form";

export const dynamic = "force-dynamic";

/**
 * Trazer a estante inteira.
 *
 * A régua é SEM PERDAS: datas de leitura, notas, texto de resenha, prateleiras,
 * ISBN. Metade dos concorrentes perde isso, e é por isso que ninguém termina de
 * migrar: a pessoa importa, vê que dez anos de datas sumiram, e volta para o app
 * que ela já tinha decidido abandonar.
 *
 * Uma migração pela metade é PIOR que nenhuma: ela gasta o entusiasmo da pessoa e
 * entrega uma estante mutilada, que ela vai ter que consertar à mão para sempre.
 */
export const metadata = {
  title: "Trazer a sua estante · Gume",
  description: "Os seus livros são seus, e eles vêm inteiros.",
};

export default async function Importar() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <ScreenHeader title={<>Traga a sua <em className="italic text-[var(--color-ink-soft)]">estante</em>.</>} />
        <Empty>
          <Link href="/entrar" className="underline decoration-[var(--color-ink)] underline-offset-4">
            Entre
          </Link>{" "}
          para trazer os seus livros.
        </Empty>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title={<>Traga a sua <em className="italic text-[var(--color-ink-soft)]">estante</em>.</>}
        meta={["inteira", "sem perder nada"]}
      />

      <p className="mt-8 max-w-xl text-[16px] leading-relaxed text-[var(--color-ink-soft)]">
        Os seus livros vêm com tudo o que você escreveu neles: a data em que você terminou, a sua
        nota, o texto da sua resenha, e as prateleiras que você inventou. Se alguma coisa mudar de
        forma no caminho, a gente diz antes de trazer.
      </p>

      <ImportForm />

      <p className="mt-14 max-w-xl text-[14px] leading-relaxed text-[var(--color-ink-faint)]">
        Trouxe duas vezes o mesmo arquivo? Não tem problema: nada duplica. O mesmo livro
        reconhece a si mesmo e só atualiza o que mudou.
      </p>
    </main>
  );
}
