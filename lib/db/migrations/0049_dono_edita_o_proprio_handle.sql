-- O DONO PODE EDITAR O PRÓPRIO PERFIL, mesmo com um handle reservado.
--
-- O gatilho checa_handle() dispara em UPDATE OF handle, e o Postgres dispara isso
-- SEMPRE que a coluna handle está no SET, mesmo que o valor não mude. Salvar o perfil
-- reescreve handle com o mesmo valor, então o gatilho rodava, achava o handle na lista de
-- reservados (o dono está lá, reservado PARA ele), e bloqueava. Resultado: o dono não
-- conseguia trocar a própria foto nem a bio, e o erro vinha disfarçado de "@ já é de outra
-- pessoa" por um catch guloso no app.
--
-- O conserto: se o handle não MUDOU, não há nada a checar. A trava existe para quem tenta
-- PEGAR um handle reservado ou de outra pessoa, e não para quem já o tem e está mexendo em
-- outra coluna. Um update que mantém o handle passa direto.
CREATE OR REPLACE FUNCTION checa_handle() RETURNS trigger AS $$
DECLARE
  motivo text;
BEGIN
  -- Handle inalterado num update: quem já tem, mantém. Nada a checar.
  IF TG_OP = 'UPDATE' AND NEW.handle IS NOT DISTINCT FROM OLD.handle THEN
    RETURN NEW;
  END IF;

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
