# Imagem da API (ver render.yaml). O front e publicado a parte, como site
# estatico.

# 1. Build do jar.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /api
COPY pom.xml ./
COPY src ./src
RUN mvn -q -DskipTests package

# 2. Execucao. O plano free do Render tem 512 MB e 0,1 CPU: heap limitado,
#    GC serial e so o compilador C1, que sobe mais rapido.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /api/target/fretehub-api-*.jar app.jar
COPY docker-start.sh ./
ENV JAVA_OPTS="-Xmx256m -Xss512k -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
CMD ["sh", "/app/docker-start.sh"]
