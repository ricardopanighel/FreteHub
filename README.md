# FreteHub - Front-end (MVP)

Plataforma web de intermediacao de **fretes urbanos e pequenas mudancas**.
Na primeira entrega, funciona como um **catalogo com curadoria**: a equipe
cadastra e valida os prestadores, e os clientes os contatam diretamente pelo
canal que preferirem (WhatsApp, telefone ou e-mail).

Equipe: Caio Monte Alegre, Lucas Silva Fagundes, Ricardo Panighel Lazarini.

## Stack

| Camada      | Tecnologia                          |
| ----------- | ----------------------------------- |
| Build/UI    | React 18 + Vite                     |
| Estilo      | Tailwind CSS v4                     |
| Roteamento  | React Router v6                     |
| Dados/cache | TanStack React Query v5             |
| Linguagem   | TypeScript                          |

> O back-end planejado e **Spring Boot + PostgreSQL + JWT**, com imagens no
> **Cloudinary**. Neste MVP de front-end, a API e simulada em
> `src/lib/api.ts` usando `localStorage`, com a **mesma assinatura** que as
> chamadas REST terao - basta trocar o corpo das funcoes por `fetch`.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
```

Outros scripts:

```bash
npm run build    # type-check + build de producao
npm run preview  # serve o build localmente
npm run lint     # type-check (tsc --noEmit)
```

## Funcionalidades do MVP

- **Home** com explicacao do fluxo e prestadores em destaque.
- **Catalogo publico** (sem login) com:
  - busca textual (nome, regiao, servico) com debounce;
  - filtros por tipo de veiculo, regiao e servico;
  - paginacao no "back-end" (mock).
- **Perfil do prestador** com dados completos, regioes, servicos, avaliacoes e
  **canais de contato direto** (WhatsApp / telefone / e-mail).
- **Cadastro de prestador** ("Seja um prestador") que entra como `PENDENTE`.
- **Autenticacao** (cliente e admin) com contexto + token simulado.
- **Painel da equipe (admin)**: fluxo de curadoria para aprovar, rejeitar,
  desativar e reativar prestadores. Rota protegida por role `ADMIN`.
- **Avaliacoes**: clientes logados podem avaliar prestadores.
- Design **responsivo** (mobile/desktop).

## Contas de demonstracao

| Perfil  | E-mail                | Senha       |
| ------- | --------------------- | ----------- |
| Admin   | admin@fretehub.com    | admin123    |
| Cliente | cliente@fretehub.com  | cliente123  |

> Os dados de demonstracao sao semeados no `localStorage` na primeira vez que
> a aplicacao carrega. Para resetar, limpe o `localStorage` do navegador
> (chaves com prefixo `fretehub:`).

## Estrutura

```
src/
  components/      # UI reutilizavel (Navbar, Footer, cards, inputs...)
  lib/
    types.ts       # tipos de dominio (espelham o contrato da API)
    seed.ts        # dados iniciais de demonstracao
    api.ts         # camada de dados mock (trocar por fetch -> Spring Boot)
    auth.tsx       # contexto de autenticacao (JWT simulado)
  pages/           # paginas/rotas
  App.tsx          # definicao das rotas
  main.tsx         # bootstrap (Router + React Query + Auth)
```

## Visao futura (fora do MVP)

Solicitacao de fretes, envio de propostas por motoristas, acompanhamento de
status, notificacoes, chat em tempo real e integracao com mapas. Os tipos e a
camada de dados ja foram pensados para evoluir nessa direcao.
