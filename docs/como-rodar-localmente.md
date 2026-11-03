# Como baixar e rodar o FreteHub no seu computador

Guia para a equipe. Ao final voce tera o site em http://localhost:5173, com a
API e o banco rodando na sua maquina e as contas de demonstracao prontas para
uso. Leva uns 15 minutos na primeira vez.

## 1. Instale as ferramentas

| Ferramenta | Versao | Onde baixar |
| --- | --- | --- |
| Git | qualquer recente | https://git-scm.com/downloads |
| Node.js | 22 (LTS) | https://nodejs.org |
| Java (JDK) | 21 ou mais recente | https://adoptium.net (Temurin) |
| PostgreSQL | 16 | veja o passo 3 (Docker ou instalador) |

O Maven nao precisa ser instalado: o projeto traz o `mvnw`, que baixa tudo
sozinho.

Confira no terminal:

```bash
git --version
node -v      # v22.x
java -version  # 21 ou mais
```

No macOS, se `java -version` nao achar o Java instalado, rode
`export JAVA_HOME=$(/usr/libexec/java_home)` no terminal antes de subir a API.

## 2. Baixe o codigo

```bash
git clone https://github.com/ricardopanighel/FreteHub.git
cd FreteHub
```

Enquanto a versao nova nao estiver na `main`, mude para o branch dela:

```bash
git checkout motoristas-e-fluxo-de-aceite
```

Para pegar atualizacoes depois: `git pull`.

## 3. Prepare o banco (PostgreSQL)

A API espera um banco `fretehub` em `localhost:5432`, com usuario `fretehub` e
senha `fretehub`. Escolha **uma** das opcoes.

**Opcao A: Docker** (igual em Windows, macOS e Linux; precisa do
[Docker Desktop](https://www.docker.com/products/docker-desktop/)):

```bash
docker run --name fretehub-db -d -p 5432:5432 \
  -e POSTGRES_USER=fretehub -e POSTGRES_PASSWORD=fretehub -e POSTGRES_DB=fretehub \
  postgres:16
```

No PowerShell (Windows), escreva o comando numa linha so, sem as `\`.
Nas proximas vezes, basta `docker start fretehub-db`.

**Opcao B: macOS com Homebrew:**

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s fretehub
psql -d postgres -c "ALTER USER fretehub WITH PASSWORD 'fretehub';"
createdb -O fretehub fretehub
```

**Opcao C: Windows com instalador:** instale o PostgreSQL 16 por
https://www.postgresql.org/download/windows/ e abra o **SQL Shell (psql)**
com o usuario `postgres`. Depois rode:

```sql
CREATE USER fretehub WITH PASSWORD 'fretehub' SUPERUSER;
CREATE DATABASE fretehub OWNER fretehub;
```

Voce nao precisa criar tabelas. A API cria tudo na primeira subida e carrega
os dados de demonstracao.

## 4. Suba a API

Num terminal, a partir da pasta do projeto:

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

A primeira vez demora alguns minutos, porque o Maven baixa as dependencias. A
API esta pronta quando aparece `Started FreteHubApplication`. Ela fica em
http://localhost:8080; deixe esse terminal aberto.

## 5. Suba o site

Em **outro** terminal, tambem na pasta do projeto:

```bash
npm install
npm run dev
```

Abra http://localhost:5173. O site encaminha as chamadas `/api` para a API do
passo 4.

## 6. Entre com uma conta de demonstracao

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Equipe (admin) | admin@fretehub.com | admin123 |
| Cliente | cliente@fretehub.com | cliente123 |
| Motorista aprovado | motorista@fretehub.com | motorista123 |

Um motorista novo, cadastrado em "Seja um motorista", so aparece no catalogo
depois que a equipe aprova o cadastro no painel `/admin`.

## 7. Upload de fotos (opcional)

Sem configuracao, o cadastro de motorista pede a **URL** da foto. Para enviar
o arquivo pelo Cloudinary, crie um arquivo `.env.local` na raiz do projeto
(o git ignora esse arquivo) com:

```
VITE_CLOUDINARY_CLOUD_NAME=<cloud name>
VITE_CLOUDINARY_UPLOAD_PRESET=<nome do preset>
```

Peca os dois valores ao Ricardo e reinicie o `npm run dev`.

## Problemas comuns

Os comandos com `VARIAVEL=valor` na frente sao do macOS/Linux. No PowerShell,
defina antes: `$env:SERVER_PORT="8081"`, e depois rode o comando.

| Sintoma | Causa e solucao |
| --- | --- |
| API para com `Connection refused` ou `password authentication failed` | O PostgreSQL nao esta rodando ou o usuario/senha nao e `fretehub`. Refaca o passo 3. |
| `Port 5432 is already in use` no Docker | Ja existe um PostgreSQL na maquina. Pare o outro ou use a opcao B/C com ele. |
| `Port 8080 was already in use` | Outra aplicacao usa a porta. Suba a API com `SERVER_PORT=8081 ./mvnw spring-boot:run` e o site com `VITE_PROXY_TARGET=http://localhost:8081 npm run dev`. |
| `release version 21 not supported` | O Java e antigo. Instale o JDK 21 ou mais recente. |
| Site abre, mas nenhuma lista carrega | A API nao esta no ar. Veja o terminal do passo 4. |
| Login para de funcionar depois de reiniciar a API | Normal em desenvolvimento: a chave das sessoes muda a cada subida. Entre de novo. |

## Recomecar o banco do zero

Para voltar aos dados de demonstracao originais, apague o banco **local** e
suba a API de novo:

```bash
docker rm -f fretehub-db    # opcao A; depois repita o docker run do passo 3
# ou, nas opcoes B e C:
psql -U fretehub -d postgres -c "DROP DATABASE fretehub;" -c "CREATE DATABASE fretehub;"
```

Isso nao afeta a versao publicada online, que usa outro banco.

## Testes

```bash
npm run build                # checagem de tipos e build do site
cd backend && ./mvnw test    # testes da API (nao precisam do PostgreSQL)
```
