# Apoio (Stripe)

Como o apoio funciona no Gume, e o que precisa ser configurado para ele existir.

> **A AbacatePay foi descartada.** A spec antiga dela está aposentada: nada no código lê
> `ABACATE_*`, e essas variáveis podem sair de qualquer `.env` antigo.

## O que o apoio é, e o que ele não é

Quem apoia paga a conta do servidor e ganha **uma insígnia**, que diz na cara o que ela é:
esta não se conquista, ela se paga.

**Apoio não destrava função nenhuma.** Sem tela extra, sem limite maior, sem privacidade
comprada, sem alcance. Se um dia uma checagem de permissão consultar `lib/apoio.ts`, ela
está errada: quem decide o que alguém pode fazer é `lib/authz.ts`, e ele não sabe que
dinheiro existe.

Duas formas:

| forma | quanto dura a insígnia |
|---|---|
| assinatura mensal (Marcador, Lombada, Capa Dura) | enquanto a assinatura estiver viva |
| apoio avulso, de valor livre | 30 dias por pagamento, e eles **somam** |

Os três planos dão a **mesma** insígnia. A diferença é só o valor.

## Quem apoia é uma pergunta, e não uma coluna

Não existe `users.is_supporter`. Quem apoia é calculado na hora, por `ehApoiador()` em
`lib/apoio.ts`:

```text
existe assinatura com status active ou trialing   OU   avulso_badge_until > now()
```

O motivo está na migration `0055`: o apoio avulso vence em 30 dias, e **no dia 31 o Stripe
não manda aviso nenhum**, porque não aconteceu nada, o tempo só passou. Um booleano
gravado ficaria `true` para sempre, e a insígnia viraria uma mentira que o app conta todo
dia. Calculado, ela sai sozinha, e ninguém precisa manter uma faxina viva.

A mesma função serve a insígnia, a moldura do perfil e a lista de apoiadores. Uma regra de
produto escrita três vezes é uma regra que vai divergir.

## Aparecer na lista nasce marcado

`users.supporter_public` nasce `true`, e quem não quiser aparecer **desmarca** em
`/perfil`. `/contribuidores` mostra só quem não desmarcou.

Nasceu ao contrário (migration `0055`, opt-in) e virou opt-out na `0056`, por decisão do
dono: uma lista que existe para agradecer não agradece ninguém se estiver sempre vazia, e
com opt-in o caso comum era a pessoa pagar e nunca descobrir que a caixa existia.

O que a lista mostra é **nome e arroba**, que já são públicos no perfil de quem apoia. E
sair tem que funcionar: `lib/apoio.sql.test.ts` prova os dois lados (entra sem pedir, sai
ao desmarcar), e a trava foi mutada para confirmar que ela pega. Um opt-out cujo botão de
sair não funciona é pior que um opt-in.

A lista nunca mostra valor, nunca ordena por valor, e não tem posição: ela é por ordem de
chegada, que é um fato sobre o tempo e não sobre o bolso. `lib/contributors.sql.test.ts`
quebra a build se alguém misturar quem paga com quem trabalha.

## Configurar

No `.env` (e nas Variables do serviço, em produção):

| variável | onde achar |
|---|---|
| `STRIPE_SECRET_KEY` | painel do Stripe, em Developers → API keys |
| `STRIPE_PRICE_MARCADOR` | o preço mensal criado no painel |
| `STRIPE_PRICE_LOMBADA` | idem |
| `STRIPE_PRICE_CAPADURA` | idem |
| `STRIPE_WEBHOOK_SECRET` | só depois do deploy. Ver abaixo |

`APP_URL` já existe no projeto, e é ela que monta os endereços de volta do checkout.

**Não existe chave publicável.** O navegador nunca fala com o Stripe: o servidor cria a
sessão e manda a pessoa para a URL que o Stripe devolveu. Uma variável que ninguém lê só
confunde quem for configurar.

Sem `STRIPE_SECRET_KEY`, o apoio **não existe**: `/apoiar` responde "não encontrado", as
rotas de checkout somem, a seção de apoio em `/contribuidores` não aparece, e nada mais
quebra. Quem hospeda o próprio Gume simplesmente não configura.

## Plugar o webhook, depois do deploy

O segredo do webhook só nasce quando o endpoint existe, então este passo é o último.

1. No painel do Stripe: **Developers → Webhooks → Add endpoint**
2. URL: `https://<seu domínio>/api/webhooks/stripe`
3. Eventos a assinar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copie o **signing secret** (`whsec_...`) e ponha em `STRIPE_WEBHOOK_SECRET`
5. Reinicie o serviço para a variável entrar

Para testar sem deploy: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. O
comando imprime um `whsec_...` próprio, que vale só enquanto ele estiver rodando.

## Por que o webhook é tão desconfiado

É a **única** superfície do app em que uma requisição sem sessão muda dado de leitor. Ela
está na lista de rotas públicas de `lib/surface.test.ts`, com o motivo escrito, e o que
faz o papel da sessão são três travas:

**A assinatura, sobre o corpo cru.** Qualquer um sabe a URL e o formato do evento (está na
documentação pública do Stripe). O que separa o Stripe de um desconhecido é um HMAC. E ele
é sobre o corpo byte a byte: se qualquer coisa fizer o parse do JSON antes, a verificação
passa a conferir um texto reserializado e falha para sempre. Por isso `req.text()`, e
nunca `req.json()`, naquele arquivo.

**A idempotência.** O Stripe reenvia de propósito, e está certo em reenviar. Sem trava, um
avulso reenviado daria 60 dias por um pagamento de 30. O id do evento entra em
`stripe_processed_event` **junto** com o efeito, e nunca antes: marcar antes de aplicar
perderia o pagamento em silêncio se o meio falhasse.

**O corpo não é a verdade, mesmo assinado.** A assinatura prova que o Stripe mandou, e não
que o que ele mandou ainda vale: um evento atrasado descreve um estado que já mudou. Para
assinatura, a rota vai buscar o estado atual na API antes de gravar. O corpo diz **onde**
olhar; a API diz **o que** é verdade.

E ela nunca escreve o corpo num log, nem em erro: o payload tem e-mail, nome e valor pago
de uma pessoa.

`lib/stripe.webhook.sql.test.ts` prova as três: corpo forjado é recusado, corpo assinado
com o segredo errado é recusado, corpo trocado depois de assinado é recusado, e o mesmo
evento duas vezes paga uma vez só.

## Rate limit

As rotas de checkout usam o `limitar()` de `lib/rate-limit.ts`, que conta **no banco**, e
não na memória do processo. Não é preferência: um balde em memória vira um balde por
instância, e com mais de uma réplica o limite não afrouxa, ele para de existir e continua
parecendo que existe. Ver a migration `0048`.

**E ele conta por endereço, então `IP_HEADER` importa.** No Railway, ponha
`IP_HEADER=x-forwarded-for`: lá o `x-real-ip` chega com o endereço da borda da CDN, e não
o da pessoa (bug conhecido e assumido por eles). Sem isso, todo mundo divide o mesmo
balde, e como o teto do login é dez a cada cinco minutos, algumas pessoas entrando ao
mesmo tempo trancam todas as outras para fora. `lib/rate-limit.test.ts` prova os dois
modos, e a trava foi mutada para confirmar que ela pega.

O webhook não tem rate limit por IP, e é de propósito: quem bate nele é o Stripe, e
limitar o Stripe é jogar fora aviso de pagamento. Quem não é o Stripe não passa do HMAC.
