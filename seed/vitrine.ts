/**
 * ════════════════════════════════════════════════════════════════════
 *  A VITRINE. Um perfil de mentira, para olhar de verdade.
 *
 *  Cria @vitrine: uma pessoa com **todas as insígnias que dá para ter**, moldura de
 *  apoiador, e leituras nas duas escadas — para dar para ver, na tela, como fica.
 *
 *  ═══ AS INSÍGNIAS NÃO SÃO CONCEDIDAS. ELAS SÃO CALCULADAS. ═══
 *
 *  Este seed não escreve "esta pessoa é zeladora" em lugar nenhum, porque não existe
 *  esse lugar — e é de propósito. Uma insígnia do Gume é uma CONSEQUÊNCIA: o zelador é
 *  quem fez dez correções que ficaram de pé, o semeador é quem passou uma cópia adiante,
 *  o arauto é quem trouxe alguém que ficou.
 *
 *  Então o seed escreve os FATOS — dez correções, uma cópia doada, um convidado que
 *  leu — e as insígnias aparecem sozinhas. Se um dia alguém quebrar o cálculo, esta
 *  vitrine para de brilhar, e isso é exatamente o que ela deveria fazer.
 *
 *  ═══ A QUE NÃO DÁ PARA TER ═══
 *
 *  **construtor.** Ela sai de uma conta do GitHub que apareça nos contribuidores do
 *  repositório — e o repositório ainda não foi publicado. Ela não acende para ninguém,
 *  local, e forjá-la aqui seria mentir na única tela que existe para dizer a verdade
 *  sobre quem fez o quê.
 *
 *  Uso:  node --experimental-strip-types seed/vitrine.ts
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const env = readFileSync(".env", "utf8");
const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const sql = postgres(url, { max: 1 });
const n = (v: unknown) => Number(v).toLocaleString("pt-BR");

/**
 * Quantas leituras a vitrine tem em cada escada.
 *
 * 214 livros põe a pessoa em **Diamante** (piso 175), com a barra na metade do degrau —
 * que é o estado mais interessante de olhar: dá para ver a barra andada, o elo, e o
 * "faltam X para Mestre".
 *
 * 146 volumes de mangá põe em **Ouro** na outra escada. Duas barras, dois elos, e a
 * demonstração de que as duas escadas não se misturam.
 */
const LIVROS = 214;
const QUADRINHOS = 146;

console.log("\n1. a pessoa\n");

const [vitrine] = await sql`
  insert into users (handle, display_name, email, email_verified, bio,
                     librarian_tier, moderator_at, avulso_badge_until, moldura)
  values ('vitrine', 'Vitrine', 'vitrine@gume.local', true,
          'Um perfil de mentira, para olhar de verdade. Todas as insígnias, as duas escadas, e a moldura de apoiador.',
          -- BIBLIOTECÁRIA e MODERADORA: estes dois são PAPÉIS, e papel se dá.
          -- Os outros cinco são consequência, e aparecem sozinhos lá embaixo.
          --
          -- A de APOIADORA vinha de is_supporter, que não existe mais: quem apoia é
          -- calculado de assinatura viva ou avulso no prazo (ver lib/apoio.ts). Aqui a
          -- vitrine ganha um avulso com validade longa, e não uma assinatura de mentira:
          -- é uma coluna de data, sem precisar inventar um id do Stripe que não existe.
          2, now(), now() + interval '365 days', 'apoiador')
  on conflict (handle) do update
     set display_name = excluded.display_name,
         avulso_badge_until = excluded.avulso_badge_until,
         moldura      = excluded.moldura,
         librarian_tier = excluded.librarian_tier,
         moderator_at = excluded.moderator_at,
         bio = excluded.bio
  returning id, handle`;

console.log(`  @${vitrine!.handle}`);

// ─────────────────────────────────────────────── as insígnias que são CONSEQUÊNCIA

console.log("\n2. os fatos que viram insígnia\n");

/** ZELADOR: dez correções de catálogo que sobreviveram. Correção revertida não conta. */
const obras = await sql`select id from works order by random() limit 10`;

await sql`delete from revisions where user_id = ${vitrine!.id}`;
for (const o of obras) {
  // A revisão guarda um PATCH, e não colunas soltas: uma correção pode mexer em três
  // campos de uma vez, e desfazê-la tem que devolver os três juntos.
  await sql`
    insert into revisions (user_id, target_type, target_id, patch, previous, reason)
    values (${vitrine!.id}, 'work', ${o.id},
            ${sql.json({ publisher: "Editora certa" })},
            ${sql.json({ publisher: "Editora errada" })},
            'a editora estava trocada')`;
}
console.log(`  ${obras.length} correções que ficaram de pé  →  zelador`);

/**
 * ARAUTO: trouxe alguém que FICOU.
 *
 * Repare que não basta convidar: o convidado precisa ter posto um livro na estante. A
 * insígnia é de quem trouxe gente que fica, e não de quem espalhou link.
 */
const [convidado] = await sql`
  insert into users (handle, display_name, email, email_verified, invited_by)
  values ('convidada-da-vitrine', 'Convidada', 'convidada@gume.local', true, ${vitrine!.id})
  on conflict (handle) do update set invited_by = excluded.invited_by
  returning id`;

const [edicao] = await sql`
  select e.id, e.work_id from editions e where e.cover_url is not null limit 1`;

await sql`
  insert into library_entries (user_id, work_id, edition_id, status, visibility)
  values (${convidado!.id}, ${edicao!.work_id}, ${edicao!.id}, 'read', 'public')
  on conflict (user_id, work_id) do nothing`;
console.log(`  uma convidada que ficou e leu       →  arauto`);

/**
 * SEMEADOR: passou uma cópia adiante.
 *
 * E olha a beleza disto: a insígnia não é dada por quem DOOU. Ela é dada pela estante de
 * quem RECEBEU, que diz de onde o livro veio. Ninguém se declara semeador.
 */
await sql`
  insert into owned_copies (user_id, work_id, edition_id, state, came_from)
  values (${convidado!.id}, ${edicao!.work_id}, ${edicao!.id}, 'owned', ${vitrine!.id})
  on conflict (user_id, work_id) do update set came_from = excluded.came_from`;
console.log(`  uma cópia que chegou na estante de outra pessoa  →  semeador`);

/** IDEALIZADOR: a única concedida à mão. O banco garante que só existe uma no mundo. */
await sql`
  insert into badge_grants (user_id, badge)
  values (${vitrine!.id}, 'idealizador')
  on conflict do nothing`;
console.log(`  a única concedida à mão             →  idealizador`);

/**
 * MEMBRO FUNDADOR: estava entre os cem primeiros.
 *
 * O corte é por POSIÇÃO, e não por data — então a vitrine só é fundadora se houver menos
 * de cem pessoas nascidas antes dela. Num banco de desenvolvimento isso é verdade sozinho.
 */
const [antes] = await sql`
  select count(*)::int as n from users u2
   where u2.created_at < (select created_at from users where id = ${vitrine!.id})
     and u2.deleted_at is null`;
console.log(`  ${antes!.n} pessoas chegaram antes dela (o corte é 100)  →  membro fundador`);

// ─────────────────────────────────────────────── as duas escadas

console.log("\n3. as duas escadas\n");

await sql`delete from library_entries where user_id = ${vitrine!.id}`;

/**
 * Só obras COM EDIÇÃO: a estante guarda a edição que a pessoa leu, e não a obra
 * abstrata. Uma obra sem edição não pode entrar na estante de ninguém.
 */
for (const [forma, quantas] of [["livro", LIVROS], ["quadrinho", QUADRINHOS]] as const) {
  const escolhidas = await sql`
    select distinct on (w.id) w.id as work_id, e.id as edition_id
      from works w
      join editions e on e.work_id = w.id
     where w.forma = ${forma}
     order by w.id, e.created_at
     limit ${quantas}`;

  for (let i = 0; i < escolhidas.length; i += 200) {
    await sql.begin(async (tx) => {
      for (const x of escolhidas.slice(i, i + 200)) {
        await tx`
          insert into library_entries (user_id, work_id, edition_id, status, visibility)
          values (${vitrine!.id}, ${x.work_id}, ${x.edition_id}, 'read', 'public')
          on conflict (user_id, work_id) do nothing`;
      }
    });
  }
  console.log(`  ${n(escolhidas.length)} ${forma === "livro" ? "livros" : "volumes"} lidos`);
}

const [conta] = await sql`
  select count(*) filter (where w.forma = 'livro')::int as livros,
         count(*) filter (where w.forma = 'quadrinho')::int as quadrinhos
    from library_entries le join works w on w.id = le.work_id
   where le.user_id = ${vitrine!.id} and le.status = 'read'`;

console.log(`\n  ✓ @vitrine: ${n(conta!.livros)} livros · ${n(conta!.quadrinhos)} volumes`);
console.log(`  ✓ moldura de apoiador, e sete das oito insígnias`);
console.log(`  ✓ construtor não acende: ela sai do GitHub, e o repo não foi publicado.\n`);
console.log(`  Veja em:  http://localhost:3000/@vitrine\n`);

await sql.end();
