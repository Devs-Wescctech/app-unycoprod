#!/bin/bash
set -e

echo "============================================"
echo "  DEPLOY - app-unycoprod"
echo "============================================"
echo ""

APP_DIR="/var/www/html/app-unycoprod"
DB_NAME="unycoprod"
DB_USER="auth_bd"
DB_HOST="172.17.0.1"
DB_PORT="5432"

echo "[1/5] Preparando diretório..."
cd "$APP_DIR"

echo ""
echo "[2/5] Configurando banco de dados..."

DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
  echo "  -> Criando banco '$DB_NAME'..."
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
  sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
  sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
  sudo -u postgres psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"
  echo "  -> Banco criado com sucesso."
else
  echo "  -> Banco '$DB_NAME' já existe."
fi

echo ""
echo "[3/5] Importando esquema do banco..."
sudo -u postgres psql -d "$DB_NAME" -f "$APP_DIR/scripts/db-schema.sql"
echo "  -> Esquema importado."

echo ""
echo "[4/5] Subindo container Docker..."
docker compose pull
docker compose up -d

echo ""
echo "[5/5] Verificando saúde da aplicação..."
echo "  -> Aguardando 15 segundos para inicialização..."
sleep 15

HEALTH=$(curl -s http://localhost:5100/api/health 2>/dev/null || echo '{"status":"error"}')
echo "  -> Health check: $HEALTH"

echo ""
echo "============================================"
echo "  DEPLOY CONCLUÍDO!"
echo ""
echo "  Container: docker ps | grep unycoprod"
echo "  Logs:      docker logs app-unycoprod -f"
echo "  Health:    curl http://localhost:5100/api/health"
echo "============================================"
