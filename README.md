# FreteHub

Plataforma web de intermediacao de **fretes urbanos e pequenas mudancas**.
Na primeira entrega, funciona como um **catalogo com curadoria**: a equipe
cadastra e valida os prestadores, e os clientes os contatam diretamente pelo
canal que preferirem (WhatsApp, telefone ou e-mail).

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

A foto do prestador e uma URL. O upload via Cloudinary fica para quando houver conta; o campo `photoUrl` ja e o contrato.

## Como rodar

PostgreSQL local (Homebrew), uma vez:

```bash
brew services start postgresql@16
createuser -s fretehub
psql -d postgres -c "ALTER USER fretehub WITH PASSWORD 'fretehub';"
createdb -O fretehub fretehub
```

API e front, em terminais separados. A API exige Java 21 ou mais recente (compila com release 21). Se `java` nao estiver no PATH:

```bash
export JAVA_HOME=$(/usr/libexec/java_home)
```

```bash
cd backend && ./mvnw spring-boot:run   # http://localhost:8080
npm install && npm run dev             # http://localhost:5173
```

O Vite encaminha `/api` para a API. O schema e criado/atualizado pelas
migrations do Flyway na subida; na primeira vez, o banco vazio recebe as contas
e os prestadores de demonstracao.

Outros scripts:

```bash
npm run build    # type-check + build de producao
npm run preview  # serve o build localmente
npm run lint     # type-check (tsc --noEmit)
cd backend && ./mvnw test   # testes de API (login, curadoria, status, avaliacao)
```

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

Com `SPRING_PROFILES_ACTIVE=prod`, nao ha defaults: a aplicacao nao sobe sem
`DB_*` e `JWT_SECRET`. Nenhum segredo fica versionado.

## Publicar online

A versao online roda no **Render** (plano free) com o banco no **Neon**
(PostgreSQL free, sem prazo de expiracao). O `Dockerfile` gera um unico
container: a API entrega o build do front e a `/api` no mesmo endereco.

1. No Neon, crie um projeto (regiao AWS US East) e copie a connection string.
2. No Render, **New → Blueprint** com este repositorio (le o `render.yaml`).
3. Cole a connection string em `DATABASE_URL`. O `JWT_SECRET` e gerado pelo
   Render.

Na primeira subida, o Flyway cria as tabelas e o seed carrega as contas de
demonstracao. A aplicacao dorme apos 15 min sem acesso e leva 1 a 2 min para
acordar. Detalhes na secao 3.1 da [documentacao tecnica](docs/documentacao-tecnica.md#31-publicar-render--neon).

## Banco e migrations

O schema pertence ao **Flyway** (`backend/src/main/resources/db/migration/`) e o
Hibernate roda em `ddl-auto: validate` — valida que as entidades batem com o que
as migrations criaram, sem alterar o schema. Para recomecar do zero em dev,
apague as tabelas (ou recrie o banco `fretehub`) e suba a API: o Flyway recria o
schema e o seed repovoa.

Os testes rodam contra um H2 em memoria (modo PostgreSQL), entao `./mvnw test`
nao exige Docker nem PostgreSQL no ar.

## Funcionalidades do MVP

- **Home** com explicacao do fluxo e prestadores em destaque.
- **Catalogo publico** (sem login) com:
  - busca textual (nome, regiao, servico) com debounce;
  - filtros por tipo de veiculo, regiao e servico;
  - paginacao na API.
- **Perfil do prestador** com dados completos, regioes, servicos, avaliacoes e
  **canais de contato direto** (WhatsApp / telefone / e-mail). O botao de
  WhatsApp abre a conversa com uma saudacao ja escrita.
- **Cadastro de prestador** ("Seja um prestador") que entra como `PENDENTE`.
- **Autenticacao** (cliente e admin) com JWT. O cliente da sessao fica no
  `localStorage` (`fretehub:auth`).
- **Painel da equipe (admin)**: fluxo de curadoria para aprovar, rejeitar,
  desativar e reativar prestadores. Rota protegida por role `ADMIN`.
- **Solicitacao de frete**: cliente logado registra origem, destino, data
  e descricao da carga, com ou sem prestador escolhido. Se o prestador tem
  WhatsApp, a confirmacao oferece enviar os dados do pedido numa
  **mensagem pronta**.
- **Acompanhamento**: o cliente ve o status em "Meus fretes" (aberta, em
  negociacao, confirmada, concluida ou cancelada) e pode cancelar enquanto
  o pedido ainda nao foi confirmado.
- **Painel da equipe**: alem da curadoria, a equipe avanca o status das
  solicitacoes.
- **Avaliacoes**: clientes logados podem avaliar prestadores — uma avaliacao
  por cliente e prestador.
- Design **responsivo** (mobile/desktop) e acessivel (contraste AA, foco
  visivel, navegacao por teclado), com design system proprio (secao 9.8 da
  documentacao tecnica).

## Contas de demonstracao

| Perfil  | E-mail                | Senha       |
| ------- | --------------------- | ----------- |
| Admin   | admin@fretehub.com    | admin123    |
| Cliente | cliente@fretehub.com  | cliente123  |

> Os dados de demonstracao entram no PostgreSQL na primeira subida da API,
> a partir de `backend/src/main/resources/seed/demo.json`. Para recomecar,
> apague as tabelas (ou o banco `fretehub`) e suba a API de novo. A sessao
> do navegador continua em `fretehub:auth`.

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
  components/ui.tsx  # componentes base do design system
backend/             # Spring Boot
  src/main/java/com/fretehub/
  src/main/resources/db/migration/   # migrations Flyway (schema)
  src/main/resources/seed/demo.json  # dados de demonstracao
  src/test/java/com/fretehub/api/    # testes de API (MockMvc + H2)
Dockerfile           # imagem de publicacao (front + API)
render.yaml          # Blueprint do Render
```

## Visao futura

Conta de prestador com envio de propostas, notificacoes, chat, mapas e upload
de foto no Cloudinary. A solicitacao de frete e o acompanhamento de status
ja existem, persistidos no PostgreSQL.
