# FreteHub — Documentacao tecnica

Este documento explica como o FreteHub funciona por dentro: o que cada parte
faz, por que foi feita assim e como as partes conversam. A ideia e que qualquer
pessoa da equipe consiga abrir o codigo, entender onde mexer e nao quebrar o
que ja funciona.

Sumario

1. [O que e o FreteHub](#1-o-que-e-o-fretehub)
2. [Visao geral da arquitetura](#2-visao-geral-da-arquitetura)
3. [Como rodar](#3-como-rodar)
4. [Configuracao e variaveis de ambiente](#4-configuracao-e-variaveis-de-ambiente)
5. [Backend (API)](#5-backend-api)
6. [Banco de dados](#6-banco-de-dados)
7. [Seguranca e autenticacao](#7-seguranca-e-autenticacao)
8. [Referencia da API](#8-referencia-da-api)
9. [Frontend](#9-frontend)
10. [Fluxos de ponta a ponta](#10-fluxos-de-ponta-a-ponta)
11. [Testes](#11-testes)
12. [Pontos de atencao e limitacoes conhecidas](#12-pontos-de-atencao-e-limitacoes-conhecidas)
13. [Glossario](#13-glossario)

---

## 1. O que e o FreteHub

O FreteHub e um **catalogo com curadoria** de prestadores de frete urbano e
pequenas mudancas, com demonstracao na Baixada Santista.

O problema que ele resolve: hoje quem precisa de um frete procura em grupos de
WhatsApp e classificados, sem saber se o prestador e confiavel e sem nenhum
registro do que foi pedido. O FreteHub faz duas coisas:

- **Valida quem aparece.** So prestadores aprovados pela equipe entram no
  catalogo publico.
- **Guarda o pedido.** O cliente registra o frete (origem, destino, data,
  descricao) e acompanha o status.

O que o FreteHub **nao** faz, de proposito: nao cobra, nao fatura e nao fecha
preco. O cliente fala direto com o prestador (WhatsApp, telefone ou e-mail) e
a negociacao acontece fora da plataforma.

Existem dois tipos de usuario com login:

| Papel     | Quem e                     | O que pode fazer                                              |
| --------- | -------------------------- | ------------------------------------------------------------- |
| `CLIENTE` | Quem precisa de um frete   | Avaliar prestadores, abrir pedidos, acompanhar e cancelar     |
| `ADMIN`   | A equipe do FreteHub       | Tudo do cliente + curadoria de prestadores e status dos fretes |

O **prestador nao tem login**. Ele e um cadastro (um "perfil") que a equipe
aprova ou nao.

---

## 2. Visao geral da arquitetura

A aplicacao tem tres pecas:

```
 Navegador                     Servidor                      Banco
┌──────────────────┐  /api   ┌─────────────────────┐  JDBC  ┌──────────────┐
│ Frontend React   │ ──────▶ │ API Spring Boot     │ ─────▶ │ PostgreSQL 16│
│ (Vite, :5173)    │ ◀────── │ (:8080)             │ ◀───── │ (fretehub)   │
└──────────────────┘  JSON   └─────────────────────┘        └──────────────┘
```

- **Frontend** — a interface que o usuario ve. Escrita em React + TypeScript,
  roda no navegador. Nao guarda dados de negocio; pede tudo para a API.
- **API (backend)** — o "cerebro". Recebe as requisicoes, aplica as regras
  (quem pode o que, quais status sao validos) e le/grava no banco.
- **Banco** — PostgreSQL, onde ficam usuarios, prestadores, avaliacoes e
  pedidos de frete.

Frontend e API se comunicam por **HTTP com JSON**. Toda rota da API comeca com
`/api`. Em desenvolvimento, o Vite (servidor do front) funciona como
**proxy**: quando o navegador chama `http://localhost:5173/api/...`, o Vite
repassa para `http://localhost:8080/api/...`. Isso evita problemas de CORS e
deixa o front chamar sempre o caminho relativo `/api`.

Na versao publicada (secao 3.1) nao ha Vite: o front e um site estatico em um
endereco e a API fica em outro. O build do front recebe a URL da API em
`VITE_API_URL`, e a API libera o endereco do site no CORS
(`CORS_ALLOWED_ORIGINS`).

### Tecnologias

| Camada          | Tecnologia                         | Para que serve                                         |
| --------------- | ---------------------------------- | ------------------------------------------------------ |
| Interface       | React 18 + TypeScript              | Componentes de tela tipados                            |
| Build do front  | Vite 5                             | Servidor de desenvolvimento rapido e build de producao |
| Estilo          | Tailwind CSS v4                    | Classes utilitarias de CSS                             |
| Icones          | Phosphor Icons                     | Icones SVG como componentes React                      |
| Fonte           | Plus Jakarta Sans (Fontsource)     | Fonte da interface, servida pelo proprio app           |
| Rotas do front  | React Router v6                    | Navegacao entre paginas sem recarregar                 |
| Dados no front  | TanStack React Query v5            | Busca, cache e atualizacao dos dados da API            |
| API             | Spring Boot 3.5 (Java 21+)         | Servidor web, regras de negocio                        |
| Persistencia    | Spring Data JPA / Hibernate        | Mapeia classes Java para tabelas                       |
| Migrations      | Flyway                             | Cria e evolui o schema do banco de forma versionada    |
| Banco           | PostgreSQL 16                      | Armazenamento                                          |
| Autenticacao    | JWT (jjwt 0.12) + BCrypt           | Login sem sessao no servidor; senha com hash           |
| Testes          | JUnit 5, MockMvc, H2               | Testes de API sem precisar de banco externo            |

---

## 3. Como rodar

Pre-requisitos: Node.js, Java 21 ou mais recente e PostgreSQL 16.

**Banco (uma vez so):**

```bash
brew services start postgresql@16
createuser -s fretehub
psql -d postgres -c "ALTER USER fretehub WITH PASSWORD 'fretehub';"
createdb -O fretehub fretehub
```

**API** (terminal 1):

```bash
export JAVA_HOME=$(/usr/libexec/java_home)   # se o java nao estiver no PATH
cd backend
./mvnw spring-boot:run
```

Na subida, o Flyway cria as tabelas e, se o banco estiver vazio, o seed carrega
as contas e prestadores de demonstracao.

**Frontend** (terminal 2, na raiz do projeto):

```bash
npm install
npm run dev        # http://localhost:5173
```

**Rodar a API em outra porta** (ex.: a 8080 esta ocupada):

```bash
SERVER_PORT=8081 ./mvnw spring-boot:run                 # em backend/
VITE_PROXY_TARGET=http://localhost:8081 npm run dev     # na raiz
```

**Contas de demonstracao:**

| Perfil  | E-mail               | Senha      |
| ------- | -------------------- | ---------- |
| Admin   | admin@fretehub.com   | admin123   |
| Cliente | cliente@fretehub.com | cliente123 |

**Outros comandos:**

| Comando                     | O que faz                                   |
| --------------------------- | ------------------------------------------- |
| `npm run build`             | Checa tipos e gera o build de producao      |
| `npm run lint`              | Checa tipos (`tsc --noEmit`)                |
| `npm run preview`           | Serve o build localmente                    |
| `cd backend && ./mvnw test` | Roda os testes de API                       |

### 3.1 Publicar (Render + Neon)

A versao online usa tres pecas gratuitas: dois servicos no Render, descritos em
[`render.yaml`](../render.yaml), e o banco no Neon.

```
 Navegador
    │
    ├─ https://fretehub-web.onrender.com ──▶ fretehub-web (site estatico)
    │                                          build do front, nunca dorme
    │
    └─ https://fretehub-api.onrender.com/api ──▶ fretehub-api (Docker)
                                                   │ dorme apos 15 min
                                                   ▼
                                                Neon (PostgreSQL)
```

- **`fretehub-web`** — o Render roda `npm run build` e publica o `dist/`.
  Rotas do React Router (`/catalogo`, `/prestador/...`) nao sao arquivos: uma
  regra de rewrite as manda para o `index.html`, e o front resolve a tela.
- **`fretehub-api`** — o Render gera a imagem do
  [`backend/Dockerfile`](../backend/Dockerfile) e roda o jar.
- **Neon** — guarda o PostgreSQL. O banco free do Render expira em 30 dias; o
  do Neon e permanente (1 GB por projeto).

Os dois servicos se encontram pela URL publica: o site recebe
`VITE_API_URL=https://fretehub-api.onrender.com` no build, e a API recebe
`CORS_ALLOWED_ORIGINS=https://fretehub-web.onrender.com`. Se o Render der outro
endereco a algum deles (nome ja usado por outra conta), ajuste essas duas
linhas do `render.yaml`.

**Passo a passo (uma vez so):**

1. No [Neon](https://neon.com), crie um projeto na regiao **AWS US East
   (N. Virginia)**, a mesma da API. Em **Connect**, copie a connection string
   (`postgresql://...neon.tech/neondb?sslmode=require...`).
2. No [Render](https://render.com), entre com o GitHub e va em **New →
   Blueprint**. Escolha este repositorio; o Render le o `render.yaml`.
3. Cole a connection string do Neon no campo `DATABASE_URL` e confirme.
   `JWT_SECRET` e gerado pelo proprio Render.
4. Aguarde os dois deploys (alguns minutos). Na primeira subida da API, o
   Flyway cria as tabelas no Neon e o seed carrega as contas de demonstracao.

O [`backend/docker-start.sh`](../backend/docker-start.sh) converte a
`DATABASE_URL` nas variaveis `DB_URL`, `DB_USER` e `DB_PASSWORD` que o perfil
`prod` exige. Se o endereco copiado for o do pooler (`-pooler`), ele troca pela
conexao direta, porque o Flyway nao funciona bem atras do PgBouncer e a API ja
tem o Hikari como pool. Cada push na `main` gera um novo deploy.

**Limites do plano gratuito:**

| Servico        | Limite                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| `fretehub-web` | Servido por CDN; nao dorme                                             |
| `fretehub-api` | 512 MB e 0,1 CPU; dorme apos 15 min sem acesso e leva 1 a 2 min para acordar |
| Neon           | 1 GB; o banco pausa apos 5 min sem uso e volta sozinho na consulta seguinte |

Com a API dormindo, o site abre na hora, mas os dados demoram a aparecer ate
ela acordar. Antes de uma apresentacao, abra o link alguns minutos antes.

---

## 4. Configuracao e variaveis de ambiente

Nenhum segredo fica no codigo. A API le tudo de variaveis de ambiente, com
valores padrao apenas para o desenvolvimento local. O arquivo
[`.env.example`](../.env.example) lista todas.

| Variavel                 | Padrao em dev                                 | Em producao                  |
| ------------------------ | --------------------------------------------- | ---------------------------- |
| `SPRING_PROFILES_ACTIVE` | `dev`                                         | `prod`                       |
| `SERVER_PORT`            | `8080`                                        | conforme o ambiente          |
| `DB_URL`                 | `jdbc:postgresql://localhost:5432/fretehub`   | **obrigatoria**              |
| `DB_USER`                | `fretehub`                                    | **obrigatoria**              |
| `DB_PASSWORD`            | `fretehub`                                    | **obrigatoria**              |
| `DATABASE_URL`           | —                                             | no container, substitui as tres acima (secao 3.1) |
| `CORS_ALLOWED_ORIGINS`   | `http://localhost:5173,http://127.0.0.1:5173` | URL do site publicado        |
| `JWT_SECRET`             | vazio → chave efemera gerada na subida        | **obrigatoria**, 32+ caracteres |
| `JWT_EXPIRATION_HOURS`   | `12`                                          | opcional                     |
| `VITE_PROXY_TARGET`      | `http://localhost:8080` (usada pelo Vite)     | —                            |
| `VITE_API_URL`           | vazio (usa `/api` relativo)                   | URL da API, no build do site |

### Perfis

Um **perfil** do Spring e um conjunto de configuracoes ativado por nome.

- **`dev`** (padrao) — usa `application.yml`. Tem defaults para o banco local.
  Se `JWT_SECRET` nao for definido, a API gera uma chave aleatoria a cada
  subida e avisa no log. Consequencia pratica: **ao reiniciar a API, todo
  mundo precisa logar de novo**. Para evitar isso, defina `JWT_SECRET`.
- **`prod`** — soma `application-prod.yml`, que remove os defaults do banco.
  A API **nao sobe** se faltar `DB_URL`, `DB_USER`, `DB_PASSWORD` ou
  `JWT_SECRET`. Isso e proposital: e melhor falhar na subida do que rodar em
  producao com senha de exemplo.
- **`test`** — usado so pelos testes (`src/test/resources/application-test.yml`).
  Troca o PostgreSQL por um H2 em memoria.

---

## 5. Backend (API)

Codigo em `backend/src/main/java/com/fretehub/`. A organizacao e **por
assunto** (cada pasta e uma parte do negocio), e nao por tipo de classe.

```
com/fretehub/
├── FreteHubApplication.java   # ponto de entrada
├── config/SecurityConfig.java # regras de acesso, CORS, BCrypt
├── config/CorsProperties.java # enderecos do front liberados no CORS
├── security/                  # JWT e usuario logado
├── user/                      # contas, login e cadastro de cliente
├── provider/                  # prestadores, curadoria e avaliacoes
├── freight/                   # pedidos de frete e seus status
├── domain/Enums.java          # listas fixas de valores (status, veiculos...)
├── web/                       # DTOs e tratamento de erros
└── seed/DemoDataLoader.java   # dados de demonstracao
```

### 5.1 As camadas de cada assunto

Cada assunto segue o mesmo padrao de tres camadas. Usando prestadores como
exemplo:

```
Requisicao HTTP
      │
      ▼
ProviderController   ← recebe a requisicao, extrai parametros, devolve JSON
      │
      ▼
ProviderService      ← regras de negocio e validacoes; abre a transacao
      │
      ▼
ProviderRepository   ← le e grava no banco (Spring Data gera a implementacao)
      │
      ▼
ProviderProfile      ← entidade: a classe que espelha a tabela "providers"
```

- **Controller** — so traduz HTTP para chamada Java. Nao tem regra.
- **Service** — onde mora a logica: "o nome e obrigatorio", "so aprovados
  aparecem no catalogo", "nao pode pular status". E aqui que ficam as
  anotacoes `@Transactional`.
- **Repository** — interface que estende `JpaRepository`. O Spring gera as
  consultas a partir do nome do metodo, por exemplo
  `findByStatus(ProviderStatus status)` vira
  `select ... from providers where status = ?`.
- **Entidade** — classe anotada com `@Entity`; cada campo e uma coluna.

### 5.2 DTOs: o que entra e o que sai

As entidades **nunca** sao devolvidas direto no JSON. Em vez disso, o service
converte para um **DTO** (objeto de transferencia), definido em
[`web/Dtos.java`](../backend/src/main/java/com/fretehub/web/Dtos.java) como
`record` Java.

Convencao de nomes:

- `...Input` — o que o cliente envia (ex.: `ProviderInput`, `FreightInput`).
- `...View` — o que a API devolve (ex.: `ProviderView`, `FreightView`).

Por que separar: a entidade tem detalhes internos (hash de senha, relacoes
com carregamento preguicoso) que nao devem vazar. O DTO e o **contrato** com o
front, e e exatamente o que `src/lib/types.ts` espelha.

### 5.3 Transacoes e carregamento preguicoso

O projeto usa `spring.jpa.open-in-view: false`. Em termos simples: a conexao
com o banco fica aberta **apenas durante o metodo do service**, nao durante a
requisicao inteira.

Isso importa porque algumas relacoes sao `LAZY` (carregadas so quando
acessadas), como o cliente e o prestador de um frete. Por isso, todos os
metodos de service que montam um `...View` tem `@Transactional` — a conversao
para DTO acontece **dentro** da transacao. Se voce criar um metodo novo que le
uma relacao e esquecer o `@Transactional`, vai ver um
`LazyInitializationException`.

Outra consequencia util: dentro de um metodo `@Transactional`, alterar um
campo de uma entidade carregada (ex.: `freight.setStatus(...)`) ja grava no
banco ao final do metodo, sem precisar chamar `save`.

### 5.4 Enums (valores fixos)

[`domain/Enums.java`](../backend/src/main/java/com/fretehub/domain/Enums.java)
concentra as listas fechadas. Sao gravadas no banco como texto
(`EnumType.STRING`), entao **renomear um valor exige migration** para
atualizar os dados existentes.

| Enum             | Valores                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `VehicleType`    | MOTO, CARRO, FIORINO, VAN, CAMINHAO_PEQUENO, CAMINHAO_BAU                                       |
| `ServiceTag`     | FRETE_PEQUENO, MUDANCA_RESIDENCIAL, MUDANCA_COMERCIAL, ENTREGA_EXPRESSA, CARGA_FRAGIL, MONTAGEM_MOVEIS, AJUDANTE_CARGA |
| `ProviderStatus` | PENDENTE, APROVADO, REJEITADO, INATIVO                                                          |
| `FreightStatus`  | ABERTA, EM_NEGOCIACAO, CONFIRMADA, CONCLUIDA, CANCELADA                                         |
| `UserRole`       | CLIENTE, ADMIN                                                                                  |

Os mesmos valores existem em `src/lib/types.ts`, junto com os rotulos de tela
(`VEHICLE_LABELS`, `SERVICE_LABELS`...). **Ao adicionar um valor, atualize os
dois lados.**

### 5.5 Modulo `user` — contas e login

- **`UserAccount`** (tabela `app_user`) — id, nome, e-mail (unico), hash da
  senha e papel.
- **`AuthService.register`** — cria sempre um `CLIENTE`. Valida nome, e-mail
  (precisa ter `@`), senha com 6+ caracteres e e-mail ainda nao usado
  (senao, `409 Conflict`). A senha e guardada com **BCrypt** — um hash lento
  e com "sal", de forma que nem quem tem acesso ao banco descobre a senha.
- **`AuthService.login`** — busca o usuario pelo e-mail (sem diferenciar
  maiusculas), compara a senha com o hash e devolve `{ user, token }`. E-mail
  inexistente e senha errada dao a **mesma** mensagem, para nao revelar quais
  e-mails tem conta.
- Contas `ADMIN` nao sao criadas pela API; vem do seed (ou direto no banco).

### 5.6 Modulo `provider` — prestadores, curadoria e avaliacoes

**Entidade `ProviderProfile`** (tabela `providers`):

| Campo                           | Significado                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| `name`, `headline`, `bio`       | Nome, chamada curta do card e descricao longa                |
| `photoUrl`                      | URL da foto. Se vazio no cadastro, usa uma foto padrao       |
| `vehicleType`, `vehicleDescription` | Tipo e descricao livre do veiculo                        |
| `regions`                       | Lista de bairros/cidades (tabela `provider_region`)          |
| `services`                      | Lista de servicos (tabela `provider_service`)                |
| `contacts`                      | Telefone, WhatsApp e e-mail (colunas na propria tabela)      |
| `status`                        | Situacao na curadoria                                        |
| `documentNote`                  | Observacao interna da equipe (ex.: "CNH validada")           |
| `reviews`                       | Avaliacoes (tabela `reviews`)                                |

`regions` e `services` sao `@ElementCollection`: listas simples guardadas em
tabelas auxiliares, com uma coluna `position` para manter a ordem. `contacts`
e um `@Embeddable` (`ContactInfo`): os tres campos viram colunas da propria
tabela `providers`; valores em branco viram `null`.

**Cadastro (`create`)** — aberto ao publico pela pagina "Seja um prestador".
Exige nome, chamada, tipo de veiculo, ao menos uma regiao, ao menos um
servico e ao menos um canal de contato. **Sempre entra como `PENDENTE`**,
seja qual for o valor enviado.

**Curadoria (`updateStatus`)** — so `ADMIN`. Muda o status e, opcionalmente,
a observacao interna (`documentNote`; texto vazio apaga a nota). Os quatro
status:

| Status      | Significado                       | Aparece no catalogo? | Recebe pedido? |
| ----------- | --------------------------------- | -------------------- | -------------- |
| `PENDENTE`  | Aguardando analise                | Nao                  | Nao            |
| `APROVADO`  | Validado pela equipe              | **Sim**              | **Sim**        |
| `REJEITADO` | Nao passou na curadoria           | Nao                  | Nao            |
| `INATIVO`   | Ja foi aprovado, foi desativado   | Nao                  | Nao            |

**Catalogo publico (`listPublic`)** — le os prestadores `APROVADO` e aplica os
filtros **em memoria**, em Java:

- `vehicleType` e `service`: comparacao exata com o enum.
- `region`: "contem", ignorando acentos e maiusculas (ex.: `sao vicente`
  encontra `Sao Vicente`).
- `search`: "contem" sobre nome + chamada + bio + regioes, tambem ignorando
  acentos e maiusculas.

Depois ordena por nome e corta a pagina pedida. `page` comeca em 1;
`pageSize` padrao e 9 e maximo 50. A resposta traz `items`, `total`, `page` e
`pageSize`. Filtrar em memoria e simples e atende o volume atual; ver a
secao 12.

**Perfil (`get`)** — para o publico (e para clientes logados), so existe
prestador `APROVADO`: qualquer outro status responde `404`, igual a um id
inexistente, para nao revelar cadastros pendentes ou rejeitados. Se quem pede
e um `ADMIN` logado, a API devolve o perfil em qualquer status — e assim que o
painel deixa a equipe pre-visualizar um cadastro pendente.

**Nota interna (`documentNote`)** — so sai nas respostas para a equipe:
`/api/admin/providers`, o `PATCH` de curadoria e o perfil pedido por um
`ADMIN`. Catalogo, perfil publico, cadastro e avaliacao nunca a incluem. No
codigo, isso e a diferenca entre `toPublicView` e `toAdminView` no
`ProviderService`.

**Regioes (`listRegions`)** — lista sem repeticao das regioes dos prestadores
aprovados, usada para montar o filtro de regiao no front.

**Avaliacoes (`addReview`)** — qualquer usuario logado, apenas em prestador
`APROVADO` (senao `404`). Nota de 1 a 5 e comentario obrigatorio. **Um
usuario so avalia cada prestador uma vez**:

- o service verifica antes e devolve `409 "Voce ja avaliou este prestador."`;
- o banco reforca com a restricao unica `(provider_id, author_id)`.

O nome do autor e copiado no momento da avaliacao (`author_name`). As
avaliacoes do seed tem `author_id` nulo, porque nao vieram de um usuario
logado — no PostgreSQL varios `NULL` nao conflitam entre si.

### 5.7 Modulo `freight` — pedidos de frete

**Entidade `FreightOrder`** (tabela `freight_requests`): cliente, prestador
(opcional), origem, destino, descricao, data desejada, tipo de veiculo e
servico (opcionais), status e datas de criacao/atualizacao.

O campo `providerName` e uma **copia** do nome do prestador no momento do
pedido. Assim, o historico continua legivel mesmo que o prestador mude de nome
ou seja desativado.

**Abrir pedido (`create`)** — usuario logado. Valida:

- origem, destino e descricao obrigatorios; descricao com 10+ caracteres;
- data obrigatoria e **nao pode estar no passado** (o "hoje" e calculado no
  fuso `America/Sao_Paulo`, nao no do servidor);
- se veio um prestador, ele precisa estar `APROVADO`;
- `vehicleType` e `service`, se enviados, precisam ser valores validos.

O pedido nasce `ABERTA`.

**Maquina de status** — o status so anda por caminhos permitidos, definidos
no mapa `TRANSITIONS` do `FreightService`:

```
ABERTA ──▶ EM_NEGOCIACAO ──▶ CONFIRMADA ──▶ CONCLUIDA
  │              │                │
  └──────────────┴────────────────┴──────▶ CANCELADA
```

`CONCLUIDA` e `CANCELADA` sao finais: nao saem dali.

Quem move o status:

| Acao                          | Quem          | Rota                              | Regra                                           |
| ----------------------------- | ------------- | --------------------------------- | ----------------------------------------------- |
| Avancar / cancelar            | `ADMIN`       | `PATCH /api/admin/freights/{id}`  | So transicoes do diagrama; um passo por vez     |
| Cancelar o proprio pedido     | Dono do pedido | `POST /api/freights/{id}/cancel` | So enquanto `ABERTA` ou `EM_NEGOCIACAO`         |

Ou seja, depois de `CONFIRMADA` o cliente nao cancela mais sozinho; so a
equipe. Tentar pular etapa (ex.: `ABERTA → CONFIRMADA`) da `400`. Cancelar
pedido de outra pessoa da `403`.

### 5.8 Erros

Toda falha de regra lanca `ApiException(status HTTP, mensagem)`. O
`ApiExceptionHandler` captura e responde sempre no mesmo formato:

```json
{ "message": "A data nao pode estar no passado." }
```

As mensagens ja sao escritas para o usuario final; o front simplesmente as
exibe. Codigos usados:

| Codigo | Quando                                                        |
| ------ | ------------------------------------------------------------- |
| `400`  | Dado invalido ou transicao de status nao permitida            |
| `401`  | Sem login, token invalido/expirado, ou login com senha errada |
| `403`  | Logado, mas sem permissao (ex.: cliente em rota de admin)     |
| `404`  | Prestador ou pedido nao encontrado                            |
| `409`  | Conflito: e-mail ja cadastrado ou avaliacao repetida          |

Os erros `401` e `403` de acesso sao gerados pelo Spring Security (ver secao
7), com o mesmo formato `{ "message": ... }`.

### 5.9 Identificadores

Os ids sao textos com prefixo por tipo, gerados por `Ids.next(prefixo)`:
`u-` (usuario), `p-` (prestador), `r-` (avaliacao), `f-` (frete), seguidos de
8 caracteres de um UUID. Ex.: `f-3fa85f64`. O prefixo ajuda a reconhecer o
que e cada id ao ler logs e o banco.

### 5.10 Dados de demonstracao (seed)

O `DemoDataLoader` roda na subida da API. **So age se a tabela de usuarios
estiver vazia** — entao nunca sobrescreve dados reais. Ele le
`src/main/resources/seed/demo.json` e grava:

- 2 usuarios (admin e cliente);
- 6 prestadores (4 `APROVADO`, 2 `PENDENTE`) com algumas avaliacoes;
- 2 fretes do cliente demo.

As senhas do JSON passam pelo BCrypt antes de gravar. Para recarregar o seed,
esvazie o banco (secao 6.3).

---

## 6. Banco de dados

### 6.1 Tabelas

```
app_user ◀──────────── freight_requests ───────────▶ providers
 (id, email unico,       (client_id obrigatorio,       (dados do prestador,
  role, password_hash)    provider_id opcional,         contatos, status)
                          status, datas)                     ▲  ▲  ▲
                                                             │  │  │
                                   provider_region ──────────┘  │  │
                                   (lista de regioes)           │  │
                                   provider_service ────────────┘  │
                                   (lista de servicos)             │
                                   reviews ────────────────────────┘
                                   (nota, comentario, author_id;
                                    unico por provider_id + author_id)
```

| Tabela             | Guarda                                   | Observacao                                   |
| ------------------ | ---------------------------------------- | -------------------------------------------- |
| `app_user`         | Contas de cliente e admin                | `email` unico                                |
| `providers`        | Perfis de prestador                      | Contatos sao colunas desta tabela            |
| `provider_region`  | Regioes de cada prestador                | Chave `(provider_id, position)`              |
| `provider_service` | Servicos de cada prestador               | Chave `(provider_id, position)`              |
| `reviews`          | Avaliacoes                               | Unico por `(provider_id, author_id)`         |
| `freight_requests` | Pedidos de frete                         | `provider_id` pode ser nulo                  |
| `flyway_schema_history` | Controle do Flyway                  | Nao mexer manualmente                        |

Datas/hora (`created_at`, `updated_at`) sao gravadas em **UTC**. A data do
frete (`scheduled_date`) e so dia, sem hora.

### 6.2 Migrations com Flyway

O schema e **versionado**: cada mudanca de estrutura e um arquivo SQL em
`backend/src/main/resources/db/migration/`, com nome no formato
`V<numero>__<descricao>.sql`. Hoje existe:

- `V1__initial_schema.sql` — cria todas as tabelas acima.

Na subida, o Flyway compara os arquivos com a tabela `flyway_schema_history`
e aplica, em ordem, os que ainda nao rodaram. Em seguida, o Hibernate roda em
modo **`validate`**: ele confere se as entidades Java batem com as tabelas e,
se algo divergir (coluna faltando, tipo diferente), **a API nao sobe**. Isso
pega cedo o erro classico de mudar a entidade e esquecer o banco.

**Como mudar o schema** (ex.: adicionar um campo):

1. Altere a entidade Java.
2. Crie `V2__descricao_curta.sql` com o `ALTER TABLE` correspondente.
3. Suba a API: o Flyway aplica a V2 e o `validate` confirma.
4. **Nunca edite uma migration que ja rodou** em algum banco — o Flyway guarda
   um checksum e recusa subir se o arquivo mudar. Erro numa migration antiga
   se corrige com uma nova.

A configuracao `baseline-on-migrate` permite adotar o Flyway num banco que ja
tinha tabelas; num banco vazio ela nao tem efeito.

### 6.3 Recomecar do zero em dev

```bash
psql -h localhost -U fretehub -d fretehub -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd backend && ./mvnw spring-boot:run
```

Isso apaga **todos** os dados do banco `fretehub`. O Flyway recria o schema e
o seed repovoa as contas de demonstracao. Use apenas no banco local.

---

## 7. Seguranca e autenticacao

### 7.1 Como funciona o login com JWT

O FreteHub usa autenticacao **stateless** (sem sessao no servidor):

1. O usuario envia e-mail e senha para `POST /api/auth/login`.
2. A API confere e devolve um **token JWT**: um texto assinado que contem o
   id, nome, e-mail e papel do usuario, e uma data de expiracao (12 horas por
   padrao).
3. O front guarda o token e o envia em toda requisicao, no cabecalho
   `Authorization: Bearer <token>`.
4. A cada requisicao, a API confere a **assinatura** do token. Se for valida e
   nao estiver expirado, sabe quem e o usuario sem consultar o banco.

A assinatura usa HMAC-SHA256 com a chave `JWT_SECRET`. Quem nao tem a chave
nao consegue forjar nem alterar um token (por exemplo, trocar o papel para
`ADMIN`). Por isso a chave precisa ser secreta e longa, e por isso trocar a
chave invalida todos os tokens emitidos.

Pecas envolvidas, em `security/`:

| Classe          | Papel                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| `JwtProperties` | Le `fretehub.jwt.secret` e `expiration-hours` da configuracao             |
| `JwtService`    | Resolve a chave (ver secao 4), cria e valida tokens                       |
| `JwtAuthFilter` | Em cada requisicao, le o cabecalho `Authorization` e identifica o usuario |
| `AuthUser`      | Os dados do usuario extraidos do token                                    |
| `CurrentUser`   | Atalho para os services: `CurrentUser.get()` devolve o usuario logado     |

Se o token for invalido, o filtro simplesmente nao identifica ninguem; a
requisicao segue como anonima e as regras de acesso decidem (rota publica
passa, rota protegida da `401`).

Detalhe de implementacao: o `JwtAuthFilter` e um bean do Spring, e o Spring
Boot registraria qualquer filtro automaticamente na cadeia do servidor. O
`SecurityConfig` desliga esse registro automatico (`FilterRegistrationBean`
com `setEnabled(false)`) para o filtro rodar **so uma vez**, dentro da cadeia
do Spring Security.

### 7.2 Regras de acesso

Definidas em [`SecurityConfig`](../backend/src/main/java/com/fretehub/config/SecurityConfig.java),
avaliadas de cima para baixo:

| Rotas                                                        | Acesso         |
| ------------------------------------------------------------ | -------------- |
| `POST /api/auth/login`, `POST /api/auth/register`            | Publico        |
| `GET /api/providers`, `GET /api/providers/*`, `GET /api/regions` | Publico    |
| `POST /api/providers` (cadastro de prestador)                | Publico        |
| `/api/admin/**`                                              | Papel `ADMIN`  |
| Qualquer outra rota `/api/**`                                | Logado         |
| Fora de `/api`                                               | Negado         |

Alem dessas regras de rota, os services checam **posse**: so o dono cancela o
proprio pedido, e "meus fretes" filtra pelo id do usuario do token.

### 7.3 Outras protecoes

- **Senhas** com BCrypt (secao 5.5).
- **CSRF desligado** — seguro aqui porque a autenticacao e por cabecalho
  `Authorization`, que o navegador nao envia sozinho como faria com cookies.
- **CORS** liberado apenas para os enderecos em `CORS_ALLOWED_ORIGINS`
  ([`CorsProperties`](../backend/src/main/java/com/fretehub/config/CorsProperties.java)),
  com os metodos GET, POST, PATCH e OPTIONS. Em dev, o padrao e o Vite
  (`http://localhost:5173` e `http://127.0.0.1:5173`); na versao publicada, a
  URL do site (secao 3.1). Qualquer outro site recebe 403.
- **Segredos fora do codigo** e falha explicita em `prod` sem eles (secao 4).

---

## 8. Referencia da API

Todas as rotas sao relativas a `/api`. Corpo e resposta em JSON. Em erro, a
resposta e `{ "message": "..." }` (secao 5.8).

### Autenticacao

| Metodo | Rota             | Acesso  | Corpo                         | Resposta             |
| ------ | ---------------- | ------- | ----------------------------- | -------------------- |
| POST   | `/auth/login`    | Publico | `{ email, password }`         | `{ user, token }`    |
| POST   | `/auth/register` | Publico | `{ name, email, password }`   | `{ user, token }`    |

`user` = `{ id, name, email, role }`.

### Prestadores (publico)

| Metodo | Rota                      | Acesso  | Descricao                                    |
| ------ | ------------------------- | ------- | -------------------------------------------- |
| GET    | `/providers`              | Publico | Catalogo de aprovados, filtrado e paginado   |
| GET    | `/providers/{id}`         | Publico | Perfil de um aprovado (`404` nos demais; ADMIN ve qualquer um, com nota) |
| GET    | `/regions`                | Publico | Regioes dos prestadores aprovados            |
| POST   | `/providers`              | Publico | Cadastro; entra como `PENDENTE`              |
| POST   | `/providers/{id}/reviews` | Logado  | Avalia um aprovado (`{ rating, comment }`); uma por usuario |

Parametros de `GET /providers` (todos opcionais): `search`, `vehicleType`,
`region`, `service`, `page` (padrao 1), `pageSize` (padrao 9, maximo 50).

Exemplo:

```bash
curl "http://localhost:8080/api/providers?region=santos&service=MUDANCA_RESIDENCIAL"
```

```json
{
  "items": [ { "id": "p-001", "name": "Carlos Transportes", "status": "APROVADO", "...": "..." } ],
  "total": 2,
  "page": 1,
  "pageSize": 9
}
```

Corpo de `POST /providers`:

```json
{
  "name": "Transportes Exemplo",
  "headline": "Fretes rapidos em Santos",
  "bio": "Texto livre",
  "photoUrl": "",
  "vehicleType": "VAN",
  "vehicleDescription": "Renault Master 12m3",
  "regions": ["Santos", "Sao Vicente"],
  "services": ["FRETE_PEQUENO", "CARGA_FRAGIL"],
  "contacts": { "phone": "", "whatsapp": "+55 13 90000-0000", "email": "" }
}
```

### Fretes (cliente)

| Metodo | Rota                     | Acesso         | Descricao                         |
| ------ | ------------------------ | -------------- | --------------------------------- |
| POST   | `/freights`              | Logado         | Abre um pedido                    |
| GET    | `/freights/mine`         | Logado         | Pedidos do usuario, mais novos primeiro |
| POST   | `/freights/{id}/cancel`  | Dono do pedido | Cancela (ate `EM_NEGOCIACAO`)     |

Corpo de `POST /freights`:

```json
{
  "providerId": "p-001",
  "origin": "Santos - Gonzaga",
  "destination": "Sao Vicente - Centro",
  "description": "Mudanca de kitnet: cama, guarda-roupa e geladeira.",
  "scheduledDate": "2026-10-20",
  "vehicleType": "FIORINO",
  "service": "MUDANCA_RESIDENCIAL"
}
```

`providerId`, `vehicleType` e `service` podem ser `null`.

### Administracao

| Metodo | Rota                     | Acesso | Corpo                         | Descricao                     |
| ------ | ------------------------ | ------ | ----------------------------- | ----------------------------- |
| GET    | `/admin/providers`       | ADMIN  | —                             | Todos os prestadores, qualquer status |
| PATCH  | `/admin/providers/{id}`  | ADMIN  | `{ status, documentNote? }`   | Curadoria                     |
| GET    | `/admin/freights`        | ADMIN  | —                             | Todos os pedidos              |
| PATCH  | `/admin/freights/{id}`   | ADMIN  | `{ status }`                  | Avanca ou cancela um pedido   |

---

## 9. Frontend

Codigo em `src/`. Tudo em TypeScript; a interface e em portugues sem acento.

```
src/
├── main.tsx            # monta o app: React Query, Router, sessao e icones
├── App.tsx             # tabela de rotas
├── index.css           # Tailwind + tokens do design system (cores, fonte, foco)
├── lib/
│   ├── api.ts          # todas as chamadas HTTP para a API
│   ├── auth.tsx        # sessao do usuario (login, logout, token)
│   ├── types.ts        # tipos que espelham o JSON da API + rotulos de tela
│   ├── format.ts       # datas, iniciais e limpeza de numeros
│   └── whatsapp.ts     # links wa.me com mensagem pronta
├── components/         # pecas reutilizaveis (ui.tsx, Navbar, cards, badges, rota protegida)
└── pages/              # uma tela por arquivo
```

### 9.1 Inicializacao (`main.tsx`)

O app e "embrulhado" em quatro provedores, de fora para dentro:

1. **`QueryClientProvider`** — cache de dados do React Query. Configurado
   para considerar os dados frescos por 30 segundos, nao recarregar ao trocar
   de aba e tentar de novo uma vez em caso de falha.
2. **`BrowserRouter`** — habilita as rotas por URL.
3. **`AuthProvider`** — disponibiliza a sessao para qualquer tela.
4. **`IconContext.Provider`** — padroes dos icones Phosphor: tamanho `1em`
   (acompanha o texto ao lado) e `aria-hidden`, porque quase todo icone vem
   junto de um texto visivel (secao 9.8).

O `main.tsx` tambem importa a fonte Plus Jakarta Sans
(`@fontsource-variable/plus-jakarta-sans`), que vai junto no build.

### 9.2 Rotas e telas

Definidas em [`App.tsx`](../src/App.tsx). Todas ficam dentro do `Layout`
(barra de navegacao + rodape).

| URL               | Tela               | Acesso  | O que faz                                                   |
| ----------------- | ------------------ | ------- | ----------------------------------------------------------- |
| `/`               | `Home`             | Publico | Apresentacao e prestadores em destaque                      |
| `/catalogo`       | `Catalog`          | Publico | Busca, filtros e paginacao                                  |
| `/prestador/:id`  | `ProviderProfile`  | Publico | Perfil, contatos (WhatsApp/telefone/e-mail) e avaliacoes    |
| `/seja-prestador` | `ProviderRegister` | Publico | Formulario de cadastro de prestador                         |
| `/login`          | `Login`            | Publico | Entrar                                                      |
| `/cadastro`       | `Register`         | Publico | Criar conta de cliente                                      |
| `/solicitar`      | `RequestFreight`   | Logado  | Abrir pedido; aceita `?prestador=<id>` para ja vir escolhido |
| `/meus-fretes`    | `MyFreights`       | Logado  | Acompanhar e cancelar os proprios pedidos                   |
| `/admin`          | `AdminDashboard`   | ADMIN   | Curadoria de prestadores + gestao de fretes (`AdminFreights`) |
| qualquer outra    | `NotFound`         | Publico | Pagina 404                                                  |

Os botoes de contato do perfil sao links nativos: `https://wa.me/<numero>?text=...`
abre o WhatsApp com uma saudacao ja escrita (secao 9.7), `tel:` abre o
discador e `mailto:` o cliente de e-mail. Nao ha nenhuma intermediacao da
plataforma nessa conversa: a mensagem so chega ao prestador se o cliente
enviar.

### 9.3 Rotas protegidas

O componente [`ProtectedRoute`](../src/components/ProtectedRoute.tsx) envolve
as telas restritas:

- sem login → redireciona para `/login`, guardando a pagina de origem para
  voltar depois de entrar;
- com `requireAdmin` e usuario nao-admin → redireciona para `/`.

Importante: isso e **so conforto de navegacao**. Quem garante a seguranca e a
API (secao 7.2). Mesmo que alguem burle o front, a API recusa a chamada.

### 9.4 Sessao (`lib/auth.tsx`)

O `AuthProvider` guarda `{ user, token }` e expoe pelo hook `useAuth()`:
`user`, `token`, `isAuthenticated`, `isAdmin`, `login()`, `register()` e
`logout()`.

A sessao e salva no `localStorage` com a chave **`fretehub:auth`**, entao
sobrevive a recarregar a pagina. `logout()` apaga essa chave.

**Sessao vencida.** O front encerra a sessao sozinho em tres situacoes:

1. **Ao abrir o app**, se o token salvo ja passou da validade (o campo `exp`
   do JWT), ele e descartado.
2. **No momento em que o token vence**, um timer faz o logout.
3. **Quando a API responde `401` a uma chamada que levou token** (token
   invalido, ou chave trocada — em dev, toda reinicializacao sem
   `JWT_SECRET`). O `request()` de `api.ts` dispara o evento
   `fretehub:session-expired`, e o `AuthProvider` limpa a sessao. O `401` do
   login com senha errada nao conta, porque essa chamada nao leva token.

Nos casos 2 e 3, o contexto marca `sessionExpired: true`. Se a pessoa estava
numa tela protegida, a `ProtectedRoute` a leva para `/login` (guardando a
pagina de origem) e o login mostra "Sua sessao expirou". O front so **le** o
`exp` para saber quando a sessao acaba; quem confere a assinatura e sempre a
API.

### 9.5 Acesso a API (`lib/api.ts`)

Todas as chamadas passam pela funcao `request()`, que:

1. monta a URL (`VITE_API_URL` + caminho; em dev, vazio → `/api` relativo);
2. adiciona `Content-Type: application/json` e o `Authorization: Bearer` lido
   do `localStorage`;
3. se a rede falhar, lanca "Nao foi possivel conectar ao servidor.";
4. se a API responder erro, lanca um `Error` com a `message` vinda da API.

Assim, as telas so precisam mostrar `error.message`. Cada rota da API tem uma
funcao correspondente (`listPublicProviders`, `createFreight`,
`updateProviderStatus`...), e `types.ts` define o formato exato de cada
resposta.

### 9.6 Dados nas telas (React Query)

As telas nao chamam `fetch` direto. Usam:

- **`useQuery`** para ler — ex.: `useQuery({ queryKey: ["providers", filtros, pagina], queryFn: ... })`.
  O React Query cuida de carregando/erro/cache. A `queryKey` identifica o
  dado: mudou a chave (ex.: outro filtro), busca de novo.
- **`useMutation`** para gravar — ex.: aprovar um prestador, cancelar um frete.

Depois de gravar, a tela **invalida** as chaves afetadas para recarregar o que
mudou. Exemplo: ao aprovar um prestador, o painel invalida
`["admin","providers"]`, `["providers"]` e `["regions"]`, porque o catalogo e
a lista de regioes mudaram tambem.

Chaves usadas:

| Chave                             | Dado                         |
| --------------------------------- | ---------------------------- |
| `["providers", filtros, pagina]`  | Pagina do catalogo           |
| `["providers", "destaques"]`      | Destaques da Home            |
| `["providers", "select"]`         | Opcoes de Solicitar frete    |
| `["provider", id]`                | Um perfil                    |
| `["regions"]`                     | Regioes para o filtro        |
| `["freights", "mine", clientId]`  | Meus fretes                  |
| `["freights", "all"]`             | Todos os fretes (admin)      |
| `["admin", "providers"]`          | Todos os prestadores (admin) |

No catalogo, a busca textual tem **debounce**: a consulta so dispara um
instante depois que a pessoa para de digitar, para nao chamar a API a cada
tecla.

### 9.7 Mensagem pronta no WhatsApp (`lib/whatsapp.ts`)

O FreteHub nao envia nada pelo WhatsApp. Ele so monta um link `wa.me` com o
texto preenchido; a conversa abre no WhatsApp do proprio cliente, que revisa,
edita se quiser e envia.

| Funcao                         | O que faz                                                                |
| ------------------------------ | ------------------------------------------------------------------------ |
| `whatsappNumber(raw)`          | Converte o numero cadastrado para o formato do wa.me (veja abaixo)       |
| `whatsappLink(numero, texto)`  | Monta `https://wa.me/<numero>?text=<texto codificado>`                   |
| `profileGreeting()`            | Saudacao do botao "Chamar no WhatsApp" do perfil                         |
| `freightMessage(pedido, nome)` | Texto com origem, destino, data, veiculo e servico (se houver) e a carga |

**Numero.** `whatsappNumber` deixa so os digitos e tira zeros a esquerda. Com
10 ou 11 digitos (DDD + numero) e sem `+` na frente, acrescenta o `55` do
Brasil; nos demais casos usa os digitos como estao. So devolve `null` (e a
tela esconde o WhatsApp) quando o campo nao tem nenhum digito. Um numero sem
DDD gera um link que o WhatsApp nao reconhece; por isso o cadastro de
prestador pede o DDD.

**Depois de registrar um pedido** (`/solicitar`): se o prestador escolhido tem
WhatsApp, o formulario da lugar a tela "Pedido registrado!", que mostra a
mensagem pronta e o botao "Enviar pelo WhatsApp" (abre em nova aba). O numero
vem da lista de prestadores do formulario ou do perfil que abriu a tela
(`?prestador=`). Sem prestador, ou com prestador sem WhatsApp, nada muda: a
tela vai direto para `/meus-fretes`. Abrir `/solicitar` de novo a partir da
tela de confirmacao (pelo rodape, por exemplo) traz o formulario em branco.

O WhatsApp nao abre sozinho porque a nova aba so seria criada depois da
resposta da API, e o navegador bloquearia como pop-up. Por isso o clique fica
com o cliente.

### 9.8 Design system e componentes de interface

O visual foi definido com a skill **ui-ux-pro-max** (perfil de catalogo e
logistica, estilo *flat*). As regras abaixo valem para qualquer tela nova.

**Estilo.** Sem sombras e sem gradientes: a separacao e feita com bordas e
contornos (`border`, `ring`). Transicoes de cor duram de 150 a 200 ms, e o
`prefers-reduced-motion` desliga animacoes e transicoes.

**Cores** (tokens no `@theme` de `index.css`; neutros na escala `slate`):

| Token     | Uso                                          |
| --------- | -------------------------------------------- |
| `primary` | Acoes, links, foco e estados ativos          |
| `accent`  | Marca e chamada principal sobre fundo escuro |
| `navy`    | Hero, rodape e paineis de destaque           |

Botoes `accent` usam texto `navy-950`, porque branco sobre laranja nao atinge
4.5:1. O botao de WhatsApp usa `emerald-700`: o verde da marca do WhatsApp nao
tem contraste suficiente com texto branco.

**Fonte.** Plus Jakarta Sans Variable.

**Icones.** Phosphor (`@phosphor-icons/react`), sempre pelos nomes com sufixo
`Icon` (ex.: `TruckIcon`). Sao decorativos por padrao (secao 9.1). Um icone
que carrega significado sozinho recebe `aria-hidden={false}`, `role="img"` e
`aria-label`.

**Componentes** em [`components/ui.tsx`](../src/components/ui.tsx):

| Componente                                | Para que serve                                                 |
| ----------------------------------------- | -------------------------------------------------------------- |
| `Button`, `ButtonLink`, `buttonClasses()` | Botao; link com cara de botao; as mesmas classes para um `<a>` |
| `Field`, `FieldSet`                       | Rotulo, dica e erro de um campo (ou de um grupo, com `legend`) |
| `Input`, `Textarea`, `Select`             | Campos; recebem do `Field` os atributos `aria-*`               |
| `Alert`, `ErrorNote`                      | Avisos (info, sucesso, atencao, erro)                          |
| `Spinner`, `ButtonSpinner`, `Skeleton`    | Carregando: pagina, dentro do botao e espaco reservado         |
| `Card`, `FormSection`, `PageHeader`       | Estrutura: cartao, bloco de formulario e titulo da pagina      |
| `EmptyState`, `DetailItem`, `BackLink`    | Lista vazia, item de detalhe com icone e link de voltar        |

Fora dele: `Badge` (status), `StatCard`, `VehicleIcon`, `ProviderCard`,
`RatingStars`, `AuthShell` (moldura do login e do cadastro) e `Logo`.

**Acessibilidade.**

- Contraste minimo de 4.5:1. Texto secundario usa `slate-500`/`600` no fundo
  claro e `slate-300`/`400` no navy.
- O foco e sempre visivel. Dentro de `.surface-dark` o contorno fica branco.
- O primeiro Tab leva ao link "Pular para o conteudo".
- Areas de toque de 40 a 48 px (`min-h-10`, `min-h-11`, `min-h-12`).
- Todo campo tem rotulo visivel (`Field`). O erro aparece abaixo do campo,
  ligado por `aria-describedby`. No celular a fonte dos campos e de 16 px,
  para o iOS nao dar zoom.
- Nunca `<Link><Button /></Link>`: sao dois elementos interativos para a
  mesma acao. Use `ButtonLink`, ou `buttonClasses()` num `<a>` externo.
- Links que abrem nova aba avisam "(abre em nova aba)" para leitor de tela.

---

## 10. Fluxos de ponta a ponta

### 10.1 Prestador entra no catalogo

1. O prestador preenche `/seja-prestador` → `POST /api/providers`.
2. A API valida e grava com status `PENDENTE`. Ele **nao** aparece no
   catalogo.
3. A equipe entra em `/admin`, confere os dados/documentos e registra uma nota
   interna (ex.: "CNH e CRLV validados").
4. A equipe aprova → `PATCH /api/admin/providers/{id}` com `APROVADO`.
5. O prestador passa a aparecer em `/catalogo` e pode ser escolhido em
   pedidos. A qualquer momento a equipe pode desativa-lo (`INATIVO`) e
   reativa-lo.

### 10.2 Cliente contrata um frete

1. O cliente busca em `/catalogo` e abre um perfil.
2. Fala com o prestador direto pelo WhatsApp (o botao do perfil ja abre a
   conversa com uma saudacao), telefone ou e-mail. Preco e detalhes sao
   combinados entre os dois.
3. Para registrar, clica em solicitar → `/solicitar?prestador=<id>` (precisa
   estar logado) → `POST /api/freights`. O pedido nasce `ABERTA`. Se o
   prestador tem WhatsApp, a tela seguinte oferece enviar os dados do pedido
   numa mensagem pronta (secao 9.7).
4. Acompanha em `/meus-fretes`. Pode cancelar enquanto `ABERTA` ou
   `EM_NEGOCIACAO`.
5. A equipe acompanha em `/admin` e avanca o status:
   `EM_NEGOCIACAO → CONFIRMADA → CONCLUIDA`.
6. Depois do servico, o cliente pode avaliar o prestador no perfil (uma vez).

O pedido tambem pode ser aberto **sem prestador**, quando o cliente ainda nao
escolheu ninguem.

---

## 11. Testes

Testes de API em `backend/src/test/java/com/fretehub/api/`. Rodar:

```bash
cd backend && ./mvnw test
```

**Como funcionam:** cada teste sobe a aplicacao inteira (`@SpringBootTest`) e
faz requisicoes HTTP simuladas com **MockMvc** — passa por seguranca,
controller, service e banco, como uma chamada real. O banco e um **H2 em
memoria** em modo compativel com PostgreSQL, entao nao precisa de Docker nem
de PostgreSQL rodando.

Cada teste roda dentro de uma transacao que e **desfeita ao final**
(`@Transactional`). Os dados do seed ficam sempre disponiveis e um teste nao
contamina o outro.

| Classe                     | O que cobre                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `AuthApiTest`              | Cadastro, e-mail duplicado, senha curta, login valido e invalido             |
| `ProviderCurationApiTest`  | Catalogo so com aprovados, visao do admin, aprovacao publica, cliente nao cura, cadastro entra pendente, cadastro sem contato, perfil pendente da `404` (anonimo e cliente), nota interna fora do perfil e do catalogo, admin ve pendente com nota, nao avalia pendente |
| `FreightStatusApiTest`     | Avanco de status, transicao invalida, cliente sem acesso a rota admin, cancelamento antes/depois da confirmacao, nao-dono nao cancela |
| `ReviewApiTest`            | Avaliacao unica por usuario, usuarios diferentes, nota fora de 1..5          |
| `CorsApiTest`              | Front configurado liberado no preflight, outro site recusado com `403`       |

`ApiTestSupport` e a base comum: tem o helper `login()` que devolve um token e
as credenciais do seed.

**Limite importante:** nos testes o schema e gerado pelo Hibernate e o Flyway
fica desligado. Ou seja, os testes validam a **logica**, nao as migrations. As
migrations sao validadas ao subir a API contra o PostgreSQL (o `validate` do
Hibernate falha se algo divergir).

O frontend nao tem testes automatizados; `npm run lint` checa os tipos.

---

## 12. Pontos de atencao e limitacoes conhecidas

Coisas que funcionam hoje, mas que convem saber antes de evoluir ou publicar.

**Cadastro aberto**

- O cadastro de prestador e publico e sem limite de envios. Hoje o risco e so
  de lixo na fila de curadoria, mas vale um limite por IP ou captcha antes de
  publicar.

**Regras de negocio**

- A curadoria aceita qualquer troca de status (ex.: `REJEITADO → APROVADO`
  direto), sem trilha de quem mudou e quando.
- Avaliacoes nao exigem frete concluido com o prestador. Qualquer usuario
  logado, inclusive admin, pode avaliar um prestador aprovado.
- A troca de status do frete nao registra historico; so `updated_at` muda.

**Sessao no front**

- O token fica no `localStorage`. E pratico, mas um script malicioso injetado
  na pagina (XSS) conseguiria le-lo. React ja escapa o conteudo exibido, o que
  reduz o risco; a alternativa mais forte seria cookie `HttpOnly`.
- Nao ha renovacao de token: depois de 12h (padrao), a pessoa precisa entrar
  de novo. O front percebe e encerra a sessao (secao 9.4).

**Escala e operacao**

- O filtro do catalogo roda **em memoria**: a cada busca, todos os prestadores
  aprovados (com regioes, servicos e avaliacoes) sao lidos do banco. Atende
  bem algumas centenas de prestadores; acima disso, mover os filtros para
  consultas SQL com paginacao no banco.
- Os ids usam 8 caracteres de um UUID (~4 bilhoes de combinacoes por
  prefixo). Colisao e improvavel no volume atual, mas nao impossivel; em caso
  de colisao a gravacao falha por chave duplicada.
- O deploy no Render (secao 3.1) roda a cada push na `main`, mas nao ha CI:
  os testes nao rodam antes. Tambem nao ha logs estruturados nem
  monitoramento.
- No plano free do Render, a API dorme apos 15 min sem acesso e o primeiro
  acesso seguinte leva 1 a 2 min.

**Fora do escopo, de proposito**

Conta de prestador, propostas de preco, notificacoes, chat, mapas, pagamento,
comissao e upload de foto (a foto e uma URL; o campo `photoUrl` ja e o
contrato para um futuro upload no Cloudinary).

---

## 13. Glossario

| Termo            | Significado                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| **Curadoria**    | Analise e aprovacao de prestadores pela equipe antes de aparecerem          |
| **DTO**          | Objeto que define o formato do JSON trocado entre front e API               |
| **Entidade**     | Classe Java que representa uma tabela do banco                              |
| **Migration**    | Arquivo SQL versionado que cria ou altera a estrutura do banco              |
| **JWT**          | Token assinado que prova quem e o usuario, enviado a cada requisicao        |
| **BCrypt**       | Algoritmo de hash de senha, lento de proposito para dificultar ataques      |
| **Stateless**    | O servidor nao guarda sessao; cada requisicao traz o proprio token          |
| **Proxy (Vite)** | O servidor do front repassa as chamadas `/api` para a API                   |
| **Perfil (Spring)** | Conjunto de configuracoes ativado por nome (`dev`, `prod`, `test`)       |
| **Seed**         | Dados de demonstracao carregados automaticamente num banco vazio            |
| **Lazy loading** | Relacao carregada do banco so quando acessada                               |
| **Debounce**     | Esperar o usuario parar de digitar antes de disparar a busca                |
| **CORS**         | Regra do navegador que controla quais sites podem chamar a API              |
