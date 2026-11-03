# FreteHub

Plataforma web de intermediacao de **fretes urbanos e pequenas mudancas**.
Combina duas formas de contratacao: motoristas do app recebem pedidos e respondem
a ofertas de valor; motoristas de contato direto divulgam WhatsApp e telefone.
Todos passam pela curadoria da equipe antes de aparecer no catalogo.

Equipe: Caio Monte Alegre, Lucas Silva Fagundes, Ricardo Panighel Lazarini.

## Stack

| Camada      | Tecnologia                                      |
| ----------- | ----------------------------------------------- |
| Build/UI    | React 18 + Vite + TypeScript                    |
| Estilo      | Tailwind CSS v4                                 |
| Icones      | Phosphor Icons                                  |
| Fonte       | Plus Jakarta Sans                               |
| Roteamento  | React Router v6                                 |
| Dados/cache | TanStack React Query v5                         |
| API         | Spring Boot 3.5 (`backend/`)                    |
| Banco       | PostgreSQL 16                                   |
| Auth        | JWT (stateless)                                 |

A foto do motorista vai do navegador direto para o Cloudinary (upload preset
"unsigned"); a API so guarda a URL em `photoUrl`. Para ligar, crie um arquivo
`.env.local` na raiz com:

```
VITE_CLOUDINARY_CLOUD_NAME=<cloud name do painel do Cloudinary>
VITE_CLOUDINARY_UPLOAD_PRESET=<nome do preset unsigned>
```

Sem essas variaveis, o cadastro mostra o campo de URL da foto.

## Como rodar

Passo a passo completo para a equipe, com Windows, macOS e Docker:
**[docs/como-rodar-localmente.md](docs/como-rodar-localmente.md)**.

Resumo, com o PostgreSQL ja rodando (banco, usuario e senha `fretehub`):

```bash
git clone https://github.com/ricardopanighel/FreteHub.git && cd FreteHub
cd backend && ./mvnw spring-boot:run   # API em http://localhost:8080 (Java 21+)
npm install && npm run dev             # em outro terminal: http://localhost:5173
```

O Vite encaminha `/api` para a API. O schema e criado/atualizado pelas
migrations do Flyway na subida; na primeira vez, o banco vazio recebe as contas,
os motoristas e os fretes de demonstracao.

Outros scripts:

```bash
npm run build    # type-check + build de producao
npm run preview  # serve o build localmente
npm run lint     # type-check (tsc --noEmit)
cd backend && ./mvnw test   # testes de API (contas, curadoria, fretes, fila, contatos)
```

## Capturas de tela

As telas principais, em desktop e celular, estao em
[capturas-principais/](capturas-principais/LEIAME.md).

## Configuracao

A API le as credenciais do ambiente (ver `.env.example`). Em **dev** (perfil
padrao) ha defaults para o banco local e, se `JWT_SECRET` nao estiver definido,
uma chave efemera e gerada a cada subida — pratico, mas as sessoes nao
sobrevivem a reinicializacao.

| Variavel                 | Dev (padrao)              | Producao            |
| ------------------------ | ------------------------- | ------------------- |
| `SPRING_PROFILES_ACTIVE` | `dev`                     | `prod`              |
| `DB_URL` / `DB_USER` / `DB_PASSWORD` | banco local `fretehub` | **obrigatorias**    |
| `JWT_SECRET`             | opcional (chave efemera)  | **obrigatoria**, 32+ caracteres |
| `FREIGHT_RESPONSE_MINUTES` | `30`                  | opcional            |
| `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` | opcionais, em `.env.local` (front) | opcionais, no `fretehub-web` |

Com `SPRING_PROFILES_ACTIVE=prod`, nao ha defaults: a aplicacao nao sobe sem
`DB_*` e `JWT_SECRET`. Nenhum segredo fica versionado.

## Publicar online

A versao online usa dois servicos no **Render** (plano free), descritos no
`render.yaml`, e o banco no **Neon** (PostgreSQL free, sem prazo de expiracao):

| Servico        | O que e                                  | Endereco                            |
| -------------- | ---------------------------------------- | ----------------------------------- |
| `fretehub-web` | Site estatico com o build do front       | `https://fretehub-web.onrender.com` |
| `fretehub-api` | API em Docker (`backend/Dockerfile`)     | `https://fretehub-api.onrender.com` |

1. No Neon, crie um projeto (regiao AWS US East) e copie a connection string.
2. No Render, **New → Blueprint** com este repositorio (le o `render.yaml`).
3. Cole a connection string em `DATABASE_URL`. O `JWT_SECRET` e gerado pelo
   Render.
4. Para o upload de fotos, preencha `VITE_CLOUDINARY_CLOUD_NAME` e
   `VITE_CLOUDINARY_UPLOAD_PRESET` no `fretehub-web`. Elas entram no build, entao
   e preciso refazer o deploy do site depois de mudar.

Na primeira subida, o Flyway cria as tabelas e o seed carrega as contas de
demonstracao. A API dorme apos 15 min sem acesso e leva 1 a 2 min para
acordar. Cada push na `main` dispara o deploy. A V2 atualiza os dados existentes;
o seed novo so entra automaticamente num banco sem usuarios. Veja a secao 3.1
da [documentacao tecnica](docs/documentacao-tecnica.md#31-publicar-render--neon).

## Banco e migrations

O schema pertence ao **Flyway** (`backend/src/main/resources/db/migration/`) e o
Hibernate roda em `ddl-auto: validate` — valida que as entidades batem com o que
as migrations criaram, sem alterar o schema. A V2 adiciona tipos de motorista,
login, disponibilidade, oferta e prazo aos pedidos. Para recomecar do zero em
desenvolvimento, apague apenas o schema do PostgreSQL **local** e suba a API: o
Flyway recria o schema e o seed repovoa. Zerar o Neon apaga dados online e
requer confirmacao explicita.

Os testes rodam contra um H2 em memoria (modo PostgreSQL), com Flyway desligado.
`./mvnw test` nao exige PostgreSQL, mas nao valida a SQL da V2. Essa verificacao
exige subir a API contra o PostgreSQL local.

## Funcionalidades do MVP

- **Catalogo publico** com busca, filtros, paginacao e selos "Contratar no App"
  ou "Contato Direto". O motorista externo oferece links `wa.me` e `tel:`;
  os contatos do interno ficam privados ate o aceite do pedido.
- **Cadastro de motorista** em `/seja-motorista`. A foto e enviada pelo Cloudinary
  (ou informada por URL, se o upload nao estiver configurado). A opcao "Receber pedidos pelo
  app" cria uma conta `MOTORISTA`; sem ela, cria apenas o perfil de contato
  direto. Ambos entram como `PENDENTE` e passam pela curadoria da equipe.
- **Solicitacao de frete** pelo cliente com origem, destino, cidade, data e
  horario, telefone e valor oferecido. O cliente escolhe um motorista interno
  disponivel ou envia o pedido para a fila da cidade.
- **Aceite no app**: o motorista recebe pedidos diretos e da fila, aceita ou
  recusa um pedido direto e pode fazer uma contraproposta. O cliente aceita ou
  recusa essa contraproposta. A primeira resposta a um pedido da fila vence.
- **Prazo de resposta** de 30 minutos por padrao, configuravel por
  `FREIGHT_RESPONSE_MINUTES`. O app atualiza os paineis a cada 10 segundos e
  quando a aba volta ao foco; pedidos vencidos expiram ao ser consultados.
- **Paineis** do cliente, motorista e equipe. Depois do aceite, cliente e
  motorista veem os canais de contato para combinar a execucao. O motorista
  inicia e conclui o servico; a equipe faz curadoria, moderacao e apoio.
- **Avaliacoes** por clientes logados, uma por cliente e motorista aprovado.
- Interface **responsiva** e acessivel, com contraste AA, foco visivel,
  navegacao por teclado e design system proprio (secao 9.8 da documentacao).

## Contas de demonstracao

| Perfil                          | E-mail                 | Senha        |
| ------------------------------- | ---------------------- | ------------ |
| Admin                           | admin@fretehub.com     | admin123     |
| Cliente                         | cliente@fretehub.com   | cliente123   |
| Motorista aprovado, disponivel  | motorista@fretehub.com | motorista123 |
| Motorista aprovado, indisponivel | ana@fretehub.com       | motorista123 |
| Motorista pendente              | pedro@fretehub.com     | motorista123 |

> Os dados de demonstracao entram no PostgreSQL somente quando a tabela de
> usuarios esta vazia, a partir de `backend/src/main/resources/seed/demo.json`.
> A V2 nao adiciona as contas novas a um banco ja populado. Para recarregar o
> seed, use o procedimento de reset apenas no banco local (secao 6.3 da
> documentacao tecnica). A sessao do navegador fica em `fretehub:auth`.

## Documentacao tecnica

Arquitetura, modulos, banco, seguranca, referencia da API, frontend, testes e
limitacoes conhecidas: [docs/documentacao-tecnica.md](docs/documentacao-tecnica.md).

## Estrutura

```
src/                 # front-end
  lib/api.ts         # chamadas HTTP para a API
  lib/types.ts       # tipos que espelham o JSON da API
  lib/auth.tsx       # sessao (token JWT)
  lib/whatsapp.ts    # links wa.me com mensagem pronta
  lib/upload.ts      # upload de fotos para o Cloudinary
  components/ui.tsx  # componentes base do design system
backend/             # Spring Boot
  src/main/java/com/fretehub/
  src/main/resources/db/migration/   # migrations Flyway (schema)
  src/main/resources/seed/demo.json  # dados de demonstracao
  src/test/java/com/fretehub/api/    # testes de API (MockMvc + H2)
  Dockerfile                         # imagem da API para publicacao
render.yaml          # Blueprint do Render (site + API)
```

## Visao futura

Notificacoes push (SSE/WebSocket), e-mail ou SMS, chat no app, rastreio por
GPS, mapas, preco calculado por distancia, pagamento, upload de documentos, edicao do perfil pelo motorista, varias rodadas de contraproposta,
desistencia pelo motorista apos o aceite e varios veiculos por motorista.
