-- A nota vira palavra.
--
-- Era meia-estrela (smallint 1..10). Agora é uma de cinco frases, guardada como
-- smallint 1..5 para ordenar, filtrar e importar continuarem funcionando:
--
--   1 não terminei · 2 não gostei · 3 achei ok · 4 gostei · 5 adorei
--
-- Estrela é escala, escala vira média, média vira placar. Palavra não soma.
--
-- A conversão PERDE precisão, e a perda é declarada, nunca silenciosa: 4 e 4,5
-- estrelas viram a mesma frase. O leitor é avisado na tela. Ver lib/veredito.ts,
-- que é a única definição da tradução, e o teste que prova que é esta.

alter table ratings drop constraint if exists ratings_half_stars;

update ratings set value = case
  when value >= 10 then 5   -- cinco estrelas      → adorei
  when value >= 8  then 4   -- quatro, quatro e meia → gostei
  when value >= 6  then 3   -- três, três e meia   → achei ok
  else 2                    -- duas e meia para baixo → não gostei
end
where value > 5;

alter table ratings add constraint ratings_words check (value between 1 and 5);

-- O feed guarda uma cópia da nota na atividade. Mesma conversão, ou a linha
-- "fulano avaliou" passaria a mostrar uma palavra errada para sempre.
update activities set rating = case
  when rating >= 10 then 5
  when rating >= 8  then 4
  when rating >= 6  then 3
  else 2
end
where rating is not null and rating > 5;
