-- HANDLES RESERVADOS. É o único item desta lista que não tem conserto depois.
--
-- No dia em que o cadastro abrir, o primeiro que chegar leva `@admin`, `@gume` e
-- `@livro`. E aí não tem volta: tomar o handle de alguém depois é uma coisa que a
-- gente não vai querer fazer, e não fazer é pior.
--
-- ═══ TRÊS PERIGOS DIFERENTES, E O TERCEIRO É O QUE NINGUÉM VÊ ═══
--
-- 1. IMPERSONAÇÃO.  `@gume`, `@oficial`, `@suporte`, `@moderador`. Alguém com
--    `@suporte` pede a senha de outra pessoa e ela dá, porque parece o suporte.
--
-- 2. COLISÃO DE ROTA.  O perfil mora em `/@handle`, e o Next resolve `/[handle]`.
--    Um handle chamado `livro` vira `/@livro`, que é perto demais de `/livro` para
--    um humano distinguir num link colado no WhatsApp.
--
-- 3. HOMÓGLIFO.  E este é o que passa: `@adm1n` com UM, `@ádmin` com acento,
--    `@a-d-m-i-n` com traços. Todos LEEM como "admin", e nenhum é "admin". Uma
--    lista de palavras proibidas, comparada letra a letra, não pega nenhum dos três.
--
-- ═══ A GARANTIA MORA NO BANCO, E NÃO NO CÓDIGO ═══
--
-- O código também checa (ver lib/handles.ts), e é ele que dá a mensagem bonita.
-- Mas a defesa REAL é um gatilho: código se contorna (um script, um seed, um caminho
-- novo que alguém escreveu sem saber), e um gatilho não. Este é exatamente o tipo de
-- coisa que não pode depender de alguém ter lembrado.

-- ── A FORMA CANÔNICA. É ela que pega o homóglifo. ─────────────────────────────
--
-- "Adm1n", "ádmin", "a-d-m-i-n" e "ADMIN" viram todos `admin`. A comparação é sobre
-- a forma canônica, e nunca sobre o que a pessoa digitou.
--
-- Os números viram as letras que eles imitam. Isso torna `@l1vro` impossível, e é o
-- ponto: quem escreve `l1vro` não está sendo criativo, está tentando passar por
-- `livro`.
CREATE OR REPLACE FUNCTION handle_canonico(texto text)
RETURNS text AS $$
  SELECT regexp_replace(
    translate(
      immutable_unaccent(lower(coalesce(texto, ''))),
      '0134578',   -- os homóglifos que gente de verdade usa
      'oieasti'
    ),
    '[^a-z]', '', 'g'  -- fora traço, ponto, sublinhado e o que sobrar
  )
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "handles_reservados" (
  "canonico" text PRIMARY KEY,
  "handle" text NOT NULL,
  -- Por que ele está aqui. Uma linha sem motivo é uma linha que ninguém ousa apagar
  -- daqui a um ano, e a lista incha até virar uma lista que ninguém lê.
  "motivo" text NOT NULL,
  "criado_em" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- ── O GATILHO. Ele é a defesa, e o resto é conforto. ─────────────────────────
CREATE OR REPLACE FUNCTION checa_handle() RETURNS trigger AS $$
DECLARE
  motivo text;
BEGIN
  -- Um handle que começa com número é um handle que finge ser outra coisa (um id,
  -- uma data, uma rota). E ele não serve para nada que uma pessoa de verdade queira.
  IF NEW.handle ~ '^[0-9]' THEN
    RAISE EXCEPTION 'handle não pode começar com número'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT r.motivo INTO motivo
    FROM handles_reservados r
   WHERE r.canonico = handle_canonico(NEW.handle);

  IF FOUND THEN
    RAISE EXCEPTION 'handle reservado (%)', motivo
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Só quando o handle MUDA. Sem isto, todo update em qualquer coluna de users pagaria
-- a consulta, e o dono (que legitimamente tem um handle reservado) não conseguiria
-- trocar a própria bio.
CREATE TRIGGER "users_handle_reservado"
  BEFORE INSERT OR UPDATE OF "handle" ON "users"
  FOR EACH ROW
  WHEN (NEW."handle" IS NOT NULL)
  EXECUTE FUNCTION checa_handle();
--> statement-breakpoint

-- ── A LISTA ──────────────────────────────────────────────────────────────────
--
-- As ROTAS entram TODAS, e não só as bonitas: o perfil mora em /@handle, e uma rota
-- nova amanhã não vai lembrar de vir aqui reservar o nome dela.
INSERT INTO "handles_reservados" ("canonico", "handle", "motivo") VALUES
  -- a marca
  (handle_canonico('gume'), 'gume', 'marca'),
  (handle_canonico('gumeclub'), 'gumeclub', 'marca'),
  (handle_canonico('4rl'), '4rl', 'marca'),
  (handle_canonico('4rlco'), '4rlco', 'marca'),
  (handle_canonico('oficial'), 'oficial', 'marca'),
  (handle_canonico('official'), 'official', 'marca'),

  -- quem se faz passar por autoridade. É o vetor mais barato que existe: alguém com
  -- @suporte pede a senha de outra pessoa, e ela dá.
  (handle_canonico('admin'), 'admin', 'autoridade'),
  (handle_canonico('root'), 'root', 'autoridade'),
  (handle_canonico('staff'), 'staff', 'autoridade'),
  (handle_canonico('equipe'), 'equipe', 'autoridade'),
  (handle_canonico('mod'), 'mod', 'autoridade'),
  (handle_canonico('moderador'), 'moderador', 'autoridade'),
  (handle_canonico('bibliotecario'), 'bibliotecario', 'autoridade'),
  (handle_canonico('suporte'), 'suporte', 'autoridade'),
  (handle_canonico('ajuda'), 'ajuda', 'autoridade'),
  (handle_canonico('contato'), 'contato', 'autoridade'),
  (handle_canonico('seguranca'), 'seguranca', 'autoridade'),
  (handle_canonico('security'), 'security', 'autoridade'),

  -- sistema
  (handle_canonico('api'), 'api', 'sistema'),
  (handle_canonico('auth'), 'auth', 'sistema'),
  (handle_canonico('config'), 'config', 'sistema'),
  (handle_canonico('settings'), 'settings', 'sistema'),
  (handle_canonico('www'), 'www', 'sistema'),
  (handle_canonico('mail'), 'mail', 'sistema'),

  -- TODAS as rotas do app. /@livro ao lado de /livro é indistinguível num link
  -- colado no WhatsApp, e é assim que se rouba um clique.
  (handle_canonico('autor'), 'autor', 'rota'),
  (handle_canonico('bem-vindo'), 'bem-vindo', 'rota'),
  (handle_canonico('buscar'), 'buscar', 'rota'),
  (handle_canonico('contribuidores'), 'contribuidores', 'rota'),
  (handle_canonico('entrar'), 'entrar', 'rota'),
  (handle_canonico('sair'), 'sair', 'rota'),
  (handle_canonico('estante'), 'estante', 'rota'),
  (handle_canonico('estatisticas'), 'estatisticas', 'rota'),
  (handle_canonico('eu'), 'eu', 'rota'),
  (handle_canonico('explorar'), 'explorar', 'rota'),
  (handle_canonico('feed'), 'feed', 'rota'),
  (handle_canonico('importar'), 'importar', 'rota'),
  (handle_canonico('insignias'), 'insignias', 'rota'),
  (handle_canonico('livro'), 'livro', 'rota'),
  (handle_canonico('o-que-falta'), 'o-que-falta', 'rota'),
  (handle_canonico('perfil'), 'perfil', 'rota'),
  (handle_canonico('pessoas'), 'pessoas', 'rota'),
  (handle_canonico('recomendacoes'), 'recomendacoes', 'rota'),
  (handle_canonico('sobre'), 'sobre', 'rota'),
  (handle_canonico('moderacao'), 'moderacao', 'rota'),

  -- o dono. Reservados para ele, e não POR ele: um deles ele já usa, e os outros
  -- existem para ninguém se passar por ele.
  (handle_canonico('olegas'), 'olegas', 'o dono'),
  (handle_canonico('olegasama'), 'olegasama', 'o dono'),
  (handle_canonico('gabriel'), 'gabriel', 'o dono'),
  (handle_canonico('olegas4real'), 'olegas4real', 'o dono')
ON CONFLICT ("canonico") DO NOTHING;

-- ═══ OS DEZ AMIGOS ═══
--
-- Eles NÃO estão aqui, e a ausência é deliberada: eu não sei os handles deles, e
-- inventar seria pior que não reservar. Reserve na tela de moderação, ou daqui:
--
--   insert into handles_reservados (canonico, handle, motivo)
--   values (handle_canonico('fulano'), 'fulano', 'guardado para o Fulano');
--
-- Faça isso ANTES de a URL ser pública. Depois não tem conserto: tirar o handle de
-- alguém que já o tem é uma coisa que a gente não vai querer fazer, e não fazer é
-- pior.
