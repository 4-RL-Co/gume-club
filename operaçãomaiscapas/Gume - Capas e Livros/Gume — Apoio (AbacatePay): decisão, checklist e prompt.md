# Apoio no Gume com AbacatePay

## A decisão

Dois caminhos na mesma página `/apoiar`:

1. **Assinatura de R$10/mês** — recorrente, no cartão. É o apoio "de verdade", contínuo.
2. **Apoio livre** — um Pix de qualquer valor, uma vez só. Pra quem quer ajudar sem assinar.

Isso cobre os dois tipos de apoiador: o que quer estar junto todo mês e o que quer dar um agrado e seguir a vida.

### O que a doc obriga, e muda o comportamento das duas

- **A assinatura é só cartão.** A AbacatePay não faz assinatura por Pix. Então o R$10/mês redireciona pra uma página de checkout hospedada da AbacatePay (você recebe uma `url` e manda a pessoa pra lá). Menos trabalho de tela, mas sai do site.
- **O apoio livre é Pix inline.** Nasce dentro do `/apoiar`, mostra o QR Code e o copia-e-cola, a pessoa não sai do site.
- **O preço dos R$10 mora no produto**, não na chamada. A assinatura só referencia o `product ID`. Então esse produto tem que estar com preço 1000 (centavos) e ciclo `MONTHLY`. Confira isso antes (abaixo).

### A insígnia e a moldura de apoiador

Os dois caminhos concedem a **insígnia de apoiador** e liberam a **moldura de apoiador** na foto de perfil. A pessoa escolhe qual moldura exibir: a de apoiador ou a da própria honra (elo). Recomendo:
- Assinatura: insígnia e moldura enquanto a assinatura estiver ativa. Cancelou, se despedem no fim do ciclo, e a foto volta pra moldura de honra.
- Apoio livre: insígnia e moldura também, e ficam. Tirar de quem doou uma vez seria mesquinho.

De qualquer jeito, é cosmético e não destrava função nenhuma. É a promessa do README: quem apoia e quem não apoia usam o mesmo Gume.

---

## Você já tem a chave e o product ID. Duas conferências antes de confiar neles

1. **A chave e o produto são de produção ou de sandbox?** IDs de sandbox não funcionam em produção, e vice-versa. Se o `product ID` que você tem é o de teste (o que a gente criou antes, `prod_...`), ele serve pra testar agora, mas **na hora de receber dinheiro real você precisa recriar o produto na conta de produção e usar o novo ID.** Deixe isso claro pro Claude Code (já está no prompt).

2. **O produto está com R$10/mês?** Preço 1000 centavos, ciclo `MONTHLY`. Se ele foi criado com outro valor ou avulso (sem ciclo), a assinatura falha. Dá pra conferir no painel, em Produtos, ou pedir pro Claude Code checar via `GET /products/get`.

## O que ainda é só seu, no painel

- **Ativar produção (KYC):** CPF, identidade, conta de saque. Sem isso não entra dinheiro real. Sua identidade, eu não preencho.
- **A chave vai pro Railway, não pro commit.** Como variável de ambiente `ABACATE_API_KEY`. Nunca no chat, nunca no git. Quando for colar no Railway, me chama que a gente resolve junto com o `AUTH_SECRET`, que ainda está no valor de exemplo e é o buraco mais urgente que sobrou.

O webhook o Claude Code registra por API. Você não clica nele.

## Variáveis no Railway (server-only, nunca NEXT_PUBLIC)

- `ABACATE_API_KEY` — a chave que você já tem (sandbox pra testar, produção pra valer).
- `ABACATE_WEBHOOK_SECRET` — um segredo que você inventa (`openssl rand -base64 32`).
- `ABACATE_PRODUCT_ID` — o ID do produto de R$10/mês.
- `ABACATE_BASE_URL` — `https://api.abacatepay.com/v2`.

---

# Prompt para o Claude Code

Cole tudo abaixo no Claude Code, dentro do repo do Gume.

---

Vamos construir a feature de **apoio**, com dois caminhos: uma assinatura de R$10/mês e um apoio livre por Pix de valor qualquer. Fatia vertical, ponta a ponta, com teste. Antes de escrever código, leia `AGENTS.md`, `SECURITY.md`, `ai/DECISIONS.md`, `lib/authz.ts`, a seção "Como isso se paga" do `README.md`, `lib/honras.ts` (ou o arquivo das insígnias) e `docs/design.md`, e me diga o que encontrou. **Se qualquer coisa aqui contradisser uma decisão registrada, pare e me fale antes de implementar.**

## O que o apoio concede, e as regras que continuam valendo

O apoio concede a **insígnia de apoiador** e libera a **moldura de apoiador** na foto de perfil. A pessoa **escolhe** qual moldura exibir: a de apoiador ou a da própria honra (elo). As duas convivem, e a escolha é dela.

Isso encosta no sistema de insígnias e de molduras, então leia o `lib/honras.ts` (ou onde vivem as insígnias e molduras) e os testes estruturais delas antes de mexer, e respeite o que já está garantido por teste:

- **Todas as insígnias têm o mesmo peso visual, e nenhuma brilha mais que as outras.** A de apoiador entra nessa regra igual às outras. Ela não pode ter glow maior, tamanho maior, nem destaque que as de contribuição não têm. Se o teste que garante isso quebrar, o certo é ajustar a insígnia de apoiador pra respeitar a regra, nunca afrouxar o teste.
- **A moldura de apoiador não pode ofuscar a de honra.** São alternativas, não uma superior à outra. A pessoa troca entre elas; nenhuma é a "melhor".
- **Nenhuma insígnia é sobre ler muito.** A de apoiador não muda isso: ela é sobre apoiar, não sobre leitura, e não pode virar contagem nem placar.
- **Apoio não destrava função.** Quem apoia e quem não apoia usam exatamente o mesmo Gume. A insígnia e a moldura são a única diferença, e ela é puramente visual.

Se em algum ponto o jeito de conceder a insígnia de apoiador conflitar com um teste das insígnias, **pare e me fale antes de mudar o teste.** O teste provavelmente está certo e a implementação é que precisa se ajustar.

## Arquitetura

Base URL `https://api.abacatepay.com/v2`. Auth: header `Authorization: Bearer ${ABACATE_API_KEY}`. **Valores em centavos.** Envelope de resposta `{ data, success, error }`.

### Variáveis de ambiente (server-only, nunca em client component nem NEXT_PUBLIC)

- `ABACATE_API_KEY`
- `ABACATE_WEBHOOK_SECRET`
- `ABACATE_PRODUCT_ID` (o produto de assinatura de R$10/mês)
- `ABACATE_BASE_URL` (default `https://api.abacatepay.com/v2`)

Adicione as quatro ao `.env.example` com placeholders vazios, no mesmo padrão das outras. Nenhum valor real no repo.

**Antes de tudo, confira o produto:** faça `GET /products/get` com o `ABACATE_PRODUCT_ID` e me confirme que ele tem preço 1000 centavos e ciclo `MONTHLY`. Se não tiver, pare e me avise: a assinatura vai falhar e é melhor descobrir agora.

### Caminho 1 — assinatura de R$10/mês (cartão, checkout hospedado)

Exige estar logado (o selo recorrente é atrelado à conta).

1. Botão "apoiar com R$10 por mês" na `/apoiar`.
2. Server action cria o checkout de assinatura: `POST /subscriptions/create`
   ```json
   {
     "items": [{ "id": "<ABACATE_PRODUCT_ID>", "quantity": 1 }],
     "methods": ["CARD"],
     "externalId": "<id local da assinatura>",
     "completionUrl": "https://<DOMINIO>/apoiar/obrigado",
     "metadata": { "userId": "<id do usuário>", "kind": "assinatura" }
   }
   ```
3. Redirecione a pessoa para `data.url` (a AbacatePay hospeda a página de cartão). Guarde o `data.id` (`bill_...`) numa tabela local de apoios, com status `PENDING`.
4. O selo é concedido pelo **webhook**, nunca pela criação do checkout.

### Caminho 2 — apoio livre (Pix, valor qualquer, inline)

Pode ser anônimo: se a pessoa não estiver logada, aceita o Pix mesmo assim, só não concede selo (não há a quem conceder). Ninguém fica sem poder ajudar por não ter conta.

1. Três botões (R$5, R$10, R$30) e um campo "outro valor". Mínimo R$5. **Valide o valor no servidor**, não confie no cliente.
2. Server action cria a cobrança: `POST /transparents/create`
   ```json
   {
     "method": "PIX",
     "data": {
       "amount": <centavos>,
       "description": "Apoio ao Gume",
       "expiresIn": 3600,
       "metadata": { "userId": "<id do usuário, se houver>", "kind": "apoio-livre" }
     }
   }
   ```
3. Renderize inline: a imagem do QR Code (`data.brCodeBase64`) e o copia-e-cola (`data.brCode`) com botão de copiar. Guarde o `data.id` (`pix_char_...`) na mesma tabela de apoios, status `PENDING`.
4. Selo pelo webhook.

### Webhook (um só, para os dois caminhos)

Rota `POST /api/webhooks/abacatepay`. Pública, mas autenticada por assinatura. Registre no controle de rotas públicas com o motivo.

- Eventos que importam: **`transparent.completed`** (apoio livre pago), **`subscription.completed`** (assinatura ativada), **`subscription.renewed`** (mês seguinte pago), **`subscription.cancelled`** (assinatura cancelada).
- **Confira a assinatura HMAC** de todo payload com `ABACATE_WEBHOOK_SECRET` antes de confiar em qualquer coisa. Payload sem assinatura válida é descartado, sem efeito. (Veja o esquema HMAC na página de webhooks da doc.)
- **Idempotência obrigatória:** o mesmo evento pode chegar duas vezes. Case pelo id da cobrança/assinatura. Já processado, não faz nada.
- Efeitos:
  - `transparent.completed` e `subscription.completed`: marca pago e **concede a insígnia de apoiador e a moldura ao userId do metadata**. Sem userId, registra o apoio sem conceder nada (não há a quem).
  - `subscription.renewed`: mantém a insígnia e a moldura, registra a renovação.
  - `subscription.cancelled`: marca a assinatura como encerrada e **remove a insígnia e a moldura de apoiador ao fim do ciclo**. Se a pessoa estava exibindo a moldura de apoiador, a foto volta pra moldura de honra. O apoio livre nunca perde nada; só a assinatura cancelada perde.

**Registre o webhook por API** (não quero clicar no painel). Escreva um script one-off em `scripts/` que faz `POST /webhooks/create`:
```json
{
  "name": "Gume apoio",
  "endpoint": "https://<DOMINIO_DE_PRODUCAO>/api/webhooks/abacatepay",
  "secret": "<valor de ABACATE_WEBHOOK_SECRET>",
  "events": ["transparent.completed", "subscription.completed", "subscription.renewed", "subscription.cancelled"]
}
```
Me diga o comando pra rodar, e me lembre que o `<DOMINIO_DE_PRODUCAO>` tem que ser o domínio público do Railway (HTTPS, sem localhost, a AbacatePay recusa endereço local).

### Sandbox primeiro

Construa e teste tudo em devMode/sandbox antes de produção. Use `POST /transparents/simulate-payment` pra simular o Pix e disparar o webhook sem dinheiro real. Só depois que o fluxo inteiro (assinatura e apoio livre) funcionar no sandbox é que a gente troca pela chave e pelo produto de produção. Me diga como rodar a simulação.

## A tela `/apoiar`

- Segue `docs/design.md`: monocromático, sem cor de destaque (já rejeitei laranja antes). Sóbrio.
- Cópia em sentence case, sem em-dash, sem jargão. Fala com leitor. As palavras "webhook", "checkout", "API", "assinatura recorrente" não aparecem em tela; se precisar falar do mês, diga "R$10 por mês, cancela quando quiser".
- Deixe claro, sem culpa e sem drama, que **apoio é opcional e não muda nada no app, é só um agrado que ganha uma insígnia e uma moldura na foto**. Nada de "ajude o Gume a sobreviver", nada de barra de meta, nada de contador de apoiadores exposto (viraria placar).
- As duas opções lado a lado: "R$10 por mês" e "um valor à sua escolha, uma vez". Sem empurrar uma contra a outra.
- Depois de confirmado, uma confirmação simples, a insígnia no perfil, e a opção de trocar a moldura da foto pra de apoiador (ou manter a da honra). A rota de volta da assinatura é `/apoiar/obrigado`.

## Segurança e privacidade

- Chave e secret são server-only. Nada em `"use client"` nem `NEXT_PUBLIC_*`.
- O webhook confere assinatura antes de agir. Assuma que um atacante vai forjar um `transparent.completed` ou um `subscription.completed` pra ganhar a insígnia de graça; a assinatura HMAC é o que impede. Escreva teste provando que payload com assinatura inválida não concede insígnia nem moldura.
- Conceder e remover insígnia e moldura passa por `lib/authz.ts`.
- Não logue o payload cru com dado pessoal. Nada de valor ou id em URL/query string.
- Datas: use `lib/datas.ts`, `toISOString` cru é proibido e tem teste banindo.

## Commit

- Sobe no próprio repo, mas **a mensagem de commit não anuncia segredo**. Nada tipo "adicionei a chave da AbacatePay". Chaves só no ambiente do Railway e no `.env` local (gitignored). Confirme que `.env` está no `.gitignore` antes de commitar.
- Registre no `ai/DECISIONS.md`: a escolha de oferecer assinatura de valor fixo E apoio único de valor livre (com o motivo: assinatura na AbacatePay exige preço fixo, então o valor livre só existe como Pix único), e a regra de que a insígnia de apoiador é a única concedida por dinheiro, é cosmética, respeita o mesmo peso visual das outras, e vem com uma moldura que a pessoa pode escolher exibir no lugar da moldura de honra.

## Testes junto, não depois

- Assinatura de webhook inválida não concede insígnia nem moldura.
- Evento duplicado não concede duas vezes.
- A insígnia de apoiador respeita o mesmo peso visual das outras (o teste que garante isso continua verde), e a moldura de apoiador não ofusca a de honra.
- Valor de apoio livre abaixo do mínimo é recusado no servidor.
- `subscription.cancelled` remove a insígnia e a moldura de apoiador; um apoio livre pago não perde nada.
- A rota do webhook está registrada como pública com motivo, e o teste de rotas públicas segue verde.

Confira o CI depois de cada push. Verde na sua máquina não é verde. Se algo aqui for má ideia, me diga: você já me contradisse antes e estava certo.
