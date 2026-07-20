import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assertAuthenticated, assertIdealizador, ehIdealizador, souIdealizador, Forbidden, type Viewer,
} from "@/lib/authz";

import { LIMITS, clamp } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  MODERAÇÃO. Uma pessoa modera, e o e-mail é o painel.
 *
 *  Sem fila, sem sistema de tíquete, sem painel de métricas. Isso não é
 *  preguiça: é o tamanho certo. Um sistema de moderação com fila e
 *  atribuição, tocado por UMA pessoa, é um sistema que ninguém abre — e
 *  uma denúncia que ninguém lê é pior que uma denúncia que não existe,
 *  porque ela promete e não entrega.
 *
 *  ═══ BANIR NÃO APAGA, E É REVERSÍVEL ═══
 *
 *  `banned_at` é uma data. Duas razões, e as duas são caras:
 *
 *  1. ERRO ACONTECE. Quem modera é uma pessoa cansada, e uma pessoa
 *     cansada bane a pessoa errada. Um banimento que apaga é um erro que
 *     não volta atrás.
 *
 *  2. O DADO É DELE, mesmo de quem se comportou mal. Apagar a estante de
 *     alguém porque escreveu uma bobagem é desproporcional, e a licença
 *     deste projeto promete o contrário: os seus livros são seus.
 *
 *  ═══ O MOTIVO É OBRIGATÓRIO ═══
 *
 *  E não é burocracia: um banimento sem motivo escrito é um banimento que
 *  ninguém consegue revisar daqui a seis meses, nem explicar à pessoa
 *  banida. Quem bane tem que dizer por quê, nem que seja para si mesmo.
 * ════════════════════════════════════════════════════════════════════
 */

export type Banido = {
  id: string;
  handle: string;
  name: string | null;
  reason: string | null;
  quando: Date;
  porQuem: string | null;
};

/**
 * ════════════════════════════════════════════════════════════════════
 *  MODERADOR NÃO É BIBLIOTECÁRIO, e a separação é o coração disto.
 *
 *  Bibliotecário SE GANHA SOZINHO (50 correções sobreviventes, 30 dias de
 *  conta, e a porta abre). É a regra certa para o que ele faz: mexer em
 *  FICHA DE LIVRO. O pior erro dele é um erro de catálogo, revertível por
 *  outro bibliotecário, com o nome dele no log.
 *
 *  Moderador mexe em GENTE. Ele tira uma pessoa do ar.
 *
 *  Poder sobre LIVRO se ganha por trabalho. Poder sobre PESSOA se ganha
 *  por CONFIANÇA, e confiança não é uma consulta: é alguém dizendo sim.
 *  Um cargo que se destranca cruzando um número é um cargo que um script
 *  paciente também destranca.
 *
 *  Só o IDEALIZADOR promove, e ele é único no mundo por índice do banco.
 * ════════════════════════════════════════════════════════════════════
 */
export function ehModerador(alias: SQL): SQL {
  return sql`(
    ${alias}.moderator_at is not null
    and ${alias}.deleted_at is null
    and ${alias}.banned_at is null
  )`;
}

/**
 * O idealizador (ehIdealizador, assertIdealizador, souIdealizador) mora agora em
 * lib/authz.ts, que é onde toda autorização mora. Ele decide quem promove moderador E
 * quem vê o painel privado, e duas telas não podem responder "é o idealizador?" cada uma
 * do seu jeito. Este arquivo importa de lá.
 */

async function assertModerador(viewer: Viewer): Promise<{ id: string }> {
  assertAuthenticated(viewer);

  const [eu] = await db.execute<{ sim: boolean }>(sql`
    select ${ehModerador(sql`u`)} as sim
      from users u
     where u.id = ${viewer.id}::uuid`);

  if (!eu?.sim) throw new Forbidden("moderação não é de bibliotecário: é de moderador");
  return viewer;
}

/**
 * Promover alguém a moderador. Só o idealizador.
 *
 * Não existe critério automático, e não vai existir: confiança não é uma consulta.
 */
export async function promoverModerador(viewer: Viewer, userId: string): Promise<void> {
  const eu = await assertIdealizador(viewer);

  await db.execute(sql`
    update users
       set moderator_at = now(), moderator_by = ${eu.id}::uuid
     where id = ${userId}::uuid
       and deleted_at is null
       and banned_at is null
       and moderator_at is null`);
}

/** Rebaixar. O idealizador não se rebaixa: seria trancar o sistema por fora. */
export async function rebaixarModerador(viewer: Viewer, userId: string): Promise<void> {
  const eu = await assertIdealizador(viewer);

  if (userId === eu.id) {
    throw new Forbidden("você não pode tirar o próprio cargo: ninguém sobraria para promover");
  }

  await db.execute(sql`
    update users set moderator_at = null, moderator_by = null
     where id = ${userId}::uuid`);
}

export type Moderador = { id: string; handle: string; name: string | null; ehDono: boolean };

export async function getModeradores(viewer: Viewer): Promise<Moderador[]> {
  await assertModerador(viewer);

  const rows = await db.execute<{
    id: string; handle: string; name: string | null; dono: boolean;
  }>(sql`
    select u.id, u.handle, u.display_name as name, ${ehIdealizador(sql`u`)} as dono
      from users u
     where ${ehModerador(sql`u`)}
     order by u.moderator_at asc`);

  return rows.map((r) => ({ id: r.id, handle: r.handle, name: r.name, ehDono: r.dono }));
}

// souIdealizador vem de lib/authz.ts, e é reexportado para quem já importava daqui.
export { souIdealizador };

/** Quem está olhando é moderador? Para a barra decidir se desenha o link. */
export async function souModerador(viewer: Viewer): Promise<boolean> {
  if (!viewer) return false;
  const [eu] = await db.execute<{ sim: boolean }>(sql`
    select ${ehModerador(sql`u`)} as sim
      from users u where u.id = ${viewer.id}::uuid`);
  return eu?.sim ?? false;
}

/**
 * Banir. Reversível, com nome e com motivo.
 *
 * Ninguém bane a si mesmo (um clique errado não pode te trancar para fora), e ninguém
 * bane um MODERADOR: se a coisa chegou nesse ponto, ela não se resolve num clique, e um
 * clique que resolve isso vira dois moderadores banindo um ao outro em looping.
 */
export async function banir(viewer: Viewer, userId: string, motivo: string): Promise<void> {
  const eu = await assertModerador(viewer);

  if (userId === eu.id) throw new Forbidden("você não pode se banir");

  const limpo = clamp(motivo, LIMITS.note);
  if (!limpo) throw new Error("um banimento sem motivo não é um banimento: é um sumiço");

  // Um moderador não se bane por botão. Se a coisa chegou nesse ponto, ela não se
  // resolve num clique, e um clique que resolve isso é um clique que vira guerra
  // civil: dois moderadores banindo um ao outro em looping.
  const [alvo] = await db.execute<{ mod: boolean }>(sql`
    select ${ehModerador(sql`u`)} as mod
      from users u where u.id = ${userId}::uuid`);

  if (alvo?.mod) {
    throw new Forbidden("um moderador não se bane por botão. Isso é conversa.");
  }

  await db.execute(sql`
    update users
       set banned_at = now(), banned_reason = ${limpo}, banned_by = ${eu.id}::uuid
     where id = ${userId}::uuid and banned_at is null`);
}

/** Desbanir. O erro volta atrás, e é para isso que a coluna é uma data. */
export async function desbanir(viewer: Viewer, userId: string): Promise<void> {
  await assertModerador(viewer);

  await db.execute(sql`
    update users
       set banned_at = null, banned_reason = null, banned_by = null
     where id = ${userId}::uuid`);
}

export async function getBanidos(viewer: Viewer): Promise<Banido[]> {
  await assertModerador(viewer);

  const rows = await db.execute<{
    id: string; handle: string; name: string | null;
    reason: string | null; quando: Date; por_quem: string | null;
  }>(sql`
    select u.id, u.handle, u.display_name as name,
           u.banned_reason as reason, u.banned_at as quando,
           (select b.handle from users b where b.id = u.banned_by) as por_quem
      from users u
     where u.banned_at is not null
     order by u.banned_at desc`);

  return rows.map((r) => ({
    id: r.id,
    handle: r.handle,
    name: r.name,
    reason: r.reason,
    quando: new Date(r.quando),
    porQuem: r.por_quem,
  }));
}

/** Achar alguém para banir. Busca crua por handle: é uma tela de moderação, e não a busca. */
export async function procurarPessoa(
  viewer: Viewer,
  q: string,
): Promise<{ id: string; handle: string; name: string | null; banido: boolean }[]> {
  await assertModerador(viewer);

  const query = q.trim();
  if (query.length < 2) return [];

  const rows = await db.execute<{
    id: string; handle: string; name: string | null; banido: boolean;
  }>(sql`
    select u.id, u.handle, u.display_name as name, (u.banned_at is not null) as banido
      from users u
     where u.deleted_at is null
       and (
         immutable_unaccent(lower(${query})) <% immutable_unaccent(lower(u.handle))
         or immutable_unaccent(lower(${query}))
            <% immutable_unaccent(lower(coalesce(u.display_name, '')))
       )
     order by u.handle
     limit 10`);

  return rows.map((r) => ({ id: r.id, handle: r.handle, name: r.name, banido: r.banido }));
}

/**
 * RESERVAR UM HANDLE, da tela.
 *
 * Existe porque os dez amigos precisam ter os handles deles guardados ANTES de a URL
 * ser pública, e porque uma rota nova amanhã vai precisar do nome dela reservado. Sem
 * uma tela, isso vira "alguém abre o psql", e ninguém abre o psql.
 */
export async function reservarHandle(
  viewer: Viewer,
  handle: string,
  motivo: string,
): Promise<void> {
  await assertModerador(viewer);

  const limpo = clamp(handle, LIMITS.handle)?.toLowerCase();
  const porque = clamp(motivo, LIMITS.note);
  if (!limpo || !porque) throw new Error("um handle reservado precisa de um motivo");

  // Já é de alguém? Então não dá para reservar, e é bom que não dê: tirar o handle de
  // quem já o tem é a coisa que a gente não quer fazer.
  const [existe] = await db.execute<{ id: string }>(sql`
    select id from users where handle = ${limpo} and deleted_at is null`);
  if (existe) throw new Error("esse handle já é de alguém");

  await db.execute(sql`
    insert into handles_reservados (canonico, handle, motivo)
    values (handle_canonico(${limpo}), ${limpo}, ${porque})
    on conflict (canonico) do nothing`);
}

export async function getReservados(
  viewer: Viewer,
): Promise<{ handle: string; motivo: string }[]> {
  await assertModerador(viewer);

  const rows = await db.execute<{ handle: string; motivo: string }>(sql`
    select handle, motivo from handles_reservados order by motivo, handle`);

  return rows;
}
