# Como baixar e rodar o FreteHub no Windows

Guia para quem usa Windows 10 ou 11. Todos os comandos sao do **PowerShell**
(menu Iniciar → "PowerShell"). Ao final voce tera o site em
http://localhost:5173, com a API e o banco rodando na sua maquina. Leva uns
20 minutos na primeira vez.

> Usa macOS ou Linux? Veja [como-rodar-localmente.md](como-rodar-localmente.md).

## 1. Instale as ferramentas

O jeito mais rapido e o `winget`, que ja vem no Windows 10/11. Abra o
PowerShell e rode, um por vez:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id EclipseAdoptium.Temurin.21.JDK -e
```

O PostgreSQL vai pelo instalador do site (tabela abaixo), porque ele pede a
senha do administrador durante a instalacao.

Instaladores de site (o PostgreSQL sempre por aqui; os demais, se nao
quiser usar o `winget`):

| Ferramenta | Onde baixar |
| --- | --- |
| Git | https://git-scm.com/download/win |
| Node.js 22 (LTS) | https://nodejs.org |
| Java JDK 21 (Temurin) | https://adoptium.net. No instalador, marque **"Set JAVA_HOME variable"**. |
| PostgreSQL 16 | https://www.postgresql.org/download/windows/ |

No instalador do PostgreSQL:
- defina uma senha para o usuario `postgres` e **anote**;
- mantenha a porta **5432**;
- o "Stack Builder" no final pode ser pulado.

**Feche e abra o PowerShell de novo** para ele enxergar os programas novos.
Depois confira:

```powershell
git --version
node -v          # v22.x
java -version    # 21 ou mais
echo $env:JAVA_HOME
```

Se `echo $env:JAVA_HOME` sair vazio, defina a variavel apontando para o JDK
instalado e abra o PowerShell de novo:

```powershell
$jdk = (Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory | Select-Object -Last 1).FullName
[Environment]::SetEnvironmentVariable("JAVA_HOME", $jdk, "User")
```

## 2. Baixe o codigo

Use uma pasta fora do OneDrive (por exemplo `C:\dev`). A sincronizacao do
OneDrive trava a pasta `node_modules`.

```powershell
mkdir C:\dev -Force
cd C:\dev
git clone https://github.com/ricardopanighel/FreteHub.git
cd FreteHub
git checkout motoristas-e-fluxo-de-aceite
```

O `checkout` e necessario enquanto a versao nova nao estiver na `main`. Para
pegar atualizacoes depois: `git pull`.

## 3. Crie o banco

Abra o **SQL Shell (psql)** pelo menu Iniciar. Aperte Enter nas perguntas de
servidor, banco, porta e usuario (os padroes servem) e digite a senha do
`postgres` que voce anotou. Depois rode:

```sql
CREATE USER fretehub WITH PASSWORD 'fretehub' SUPERUSER;
CREATE DATABASE fretehub OWNER fretehub;
\q
```

Voce nao precisa criar tabelas. A API cria tudo na primeira subida e carrega
os dados de demonstracao.

<details>
<summary>Alternativa: banco no Docker em vez do instalador</summary>

Precisa do [Docker Desktop](https://www.docker.com/products/docker-desktop/)
com WSL 2 ligado. Nao instale o PostgreSQL nesse caso, porque os dois disputam
a porta 5432.

```powershell
docker run --name fretehub-db -d -p 5432:5432 -e POSTGRES_USER=fretehub -e POSTGRES_PASSWORD=fretehub -e POSTGRES_DB=fretehub postgres:16
```

Nas proximas vezes, basta `docker start fretehub-db`.
</details>

## 4. Suba a API

No PowerShell, dentro da pasta do projeto:

```powershell
cd C:\dev\FreteHub\backend
.\mvnw.cmd spring-boot:run
```

A primeira vez demora alguns minutos, porque o Maven baixa as dependencias. Se
o Windows Firewall perguntar sobre o Java, permita em rede privada. A API esta
pronta quando aparece `Started FreteHubApplication` e fica em
http://localhost:8080. **Deixe essa janela aberta.**

## 5. Suba o site

Abra **outra** janela do PowerShell:

```powershell
cd C:\dev\FreteHub
npm install
npm run dev
```

Abra http://localhost:5173 no navegador.

Se aparecer *"a execucao de scripts foi desabilitada neste sistema"*, libere
os scripts para o seu usuario uma vez e rode de novo:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

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
o arquivo pelo Cloudinary, peca os dois valores ao Ricardo e crie o arquivo
`.env.local` na pasta do projeto pelo PowerShell (o Bloco de Notas costuma
salvar como `.env.local.txt`, e ai nao funciona):

```powershell
cd C:\dev\FreteHub
"VITE_CLOUDINARY_CLOUD_NAME=<cloud name>", "VITE_CLOUDINARY_UPLOAD_PRESET=<preset>" | Out-File -Encoding ascii .env.local
```

Depois pare o site (Ctrl+C) e rode `npm run dev` de novo.

## Dia a dia

Duas janelas do PowerShell, sempre nesta ordem:

```powershell
# janela 1
cd C:\dev\FreteHub\backend; .\mvnw.cmd spring-boot:run
# janela 2
cd C:\dev\FreteHub; npm run dev
```

O PostgreSQL instalado sobe sozinho com o Windows. No Docker, rode antes
`docker start fretehub-db`.

## Problemas comuns

| Sintoma | Solucao |
| --- | --- |
| `'git'`, `'node'` ou `'java'` nao e reconhecido | Feche e abra o PowerShell. Se continuar, reinstale marcando "Add to PATH". |
| `JAVA_HOME not found` ou `JAVA_HOME is set to an invalid directory` | Refaca o final do passo 1, apontando para a pasta do JDK (sem `\bin` no final). |
| `release version 21 not supported` | O Java e antigo. Instale o JDK 21 e ajuste o `JAVA_HOME`. |
| `password authentication failed for user "fretehub"` | O usuario do banco nao foi criado com a senha `fretehub`. Refaca o passo 3. |
| `Connection refused` na porta 5432 | O PostgreSQL esta parado. Abra "Servicos" (`services.msc`) e inicie `postgresql-x64-16`. |
| `Port 8080 was already in use` | Rode `$env:SERVER_PORT="8081"; .\mvnw.cmd spring-boot:run` e, na janela do site, `$env:VITE_PROXY_TARGET="http://localhost:8081"; npm run dev`. |
| Site abre, mas nenhuma lista carrega | A API nao esta no ar. Veja a janela do passo 4. |
| Login para de funcionar depois de reiniciar a API | Normal em desenvolvimento: a chave das sessoes muda a cada subida. Entre de novo. |

## Recomecar o banco do zero

Para voltar aos dados de demonstracao originais, pare a API e, no
**SQL Shell (psql)** com o usuario `postgres`:

```sql
DROP DATABASE fretehub;
CREATE DATABASE fretehub OWNER fretehub;
```

No Docker: `docker rm -f fretehub-db` e repita o `docker run` do passo 3.
Isso nao afeta a versao publicada online, que usa outro banco.

## Testes

```powershell
cd C:\dev\FreteHub; npm run build
cd backend; .\mvnw.cmd test      # nao precisa do PostgreSQL
```
