#!/bin/sh
# Ponto de entrada do container (ver Dockerfile).
#
# O Neon entrega o banco como uma connection string
#   postgresql://usuario:senha@host/banco?sslmode=require&...
# e o Spring precisa de URL JDBC, usuario e senha separados (application-prod.yml).
# Se DB_URL ja vier definido, ele e usado como esta.
set -e

if [ -n "$DATABASE_URL" ] && [ -z "$DB_URL" ]; then
  rest="${DATABASE_URL#*://}"
  credentials="${rest%@*}"
  # O endereco "-pooler" passa pelo PgBouncer do Neon, que nao combina com o
  # Flyway; a API ja tem pool proprio (Hikari) e usa a conexao direta.
  address=$(printf '%s' "${rest##*@}" | sed 's/-pooler\././')

  export DB_USER="${credentials%%:*}"
  export DB_PASSWORD="${credentials#*:}"
  export DB_URL="jdbc:postgresql://$address"
fi

exec java $JAVA_OPTS -jar /app/app.jar --server.port="${PORT:-8080}"
