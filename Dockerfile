# Imagem de publicacao (ver render.yaml): o build do front vai para
# classpath:/static e a API entrega as telas e a /api no mesmo endereco.

# 1. Front. Imagem com glibc: o package-lock traz os binarios linux-x64-gnu
#    do rollup, do tailwind e do lightningcss.
FROM node:22-slim AS front
WORKDIR /front
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# 2. API, com o front embutido no jar.
FROM maven:3.9-eclipse-temurin-21 AS api
WORKDIR /api
COPY backend/pom.xml ./
COPY backend/src ./src
COPY --from=front /front/dist ./src/main/resources/static
RUN mvn -q -DskipTests package

# 3. Execucao. O plano free do Render tem 512 MB e 0,1 CPU: heap limitado,
#    GC serial e so o compilador C1, que sobe mais rapido.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=api /api/target/fretehub-api-*.jar app.jar
COPY docker-start.sh ./
ENV JAVA_OPTS="-Xmx256m -Xss512k -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
CMD ["sh", "/app/docker-start.sh"]
