# Guia de Deploy — app-unycoprod

## 1. Criar o banco de dados no servidor

```bash
sudo -u postgres psql

CREATE DATABASE unycoprod;
CREATE USER auth_bd WITH PASSWORD '4uth@1307BD';
GRANT ALL PRIVILEGES ON DATABASE unycoprod TO auth_bd;
\c unycoprod
GRANT ALL ON SCHEMA public TO auth_bd;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO auth_bd;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO auth_bd;
\q
```

## 2. Importar o esquema do banco

```bash
sudo -u postgres psql -d unycoprod -f /var/www/html/app-unycoprod/scripts/db-schema.sql
```

> O servidor também cria as tabelas automaticamente ao iniciar (initializeDatabase), mas este script garante que o esquema completo está correto.

## 3. Migrar dados do Replit (opcional)

Se houver dados no Replit para migrar:

```bash
# No Replit, exportar dados:
pg_dump -h <REPLIT_HOST> -U <REPLIT_USER> -d <REPLIT_DB> --data-only --inserts > data-dump.sql

# No servidor, importar:
sudo -u postgres psql -d unycoprod -f data-dump.sql
```

## 4. Configurar o diretório da aplicação

```bash
sudo mkdir -p /var/www/html/app-unycoprod/data
cd /var/www/html/app-unycoprod

# Clonar o repositório (só para ter o docker-compose.yml e scripts)
sudo git clone https://github.com/Devs-Wescctech/app-unycoprod.git .
```

## 5. Configurar o docker-compose.yml

Editar `/var/www/html/app-unycoprod/docker-compose.yml`:

```yaml
services:
  app-unycoprod:
    image: ghcr.io/devs-wescctech/app-unycoprod:latest
    container_name: app-unycoprod
    restart: unless-stopped
    ports:
      - "5100:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_URL=postgresql://auth_bd:4uth%401307BD@172.17.0.1:5432/unycoprod
      - DB_SSL=false
      - TOTVS_API_TOKEN=dW5pY28uaW50ZWdyYToxbmljQCM=
      - VINDI_API_KEY=<CHAVE_VINDI_PRODUCAO>
    volumes:
      - /var/www/html/app-unycoprod/data:/app/server/data
    networks:
      - unycoprod-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

networks:
  unycoprod-network:
    driver: bridge
```

**Portas em uso no servidor:**
- 5000: app-politicall
- 5200: app-bomflow
- 5300: app-salestwo
- **5100: app-unycoprod** (disponível)

## 6. Login no GitHub Container Registry

```bash
echo "<GITHUB_TOKEN>" | docker login ghcr.io -u Devs-Wescctech --password-stdin
```

## 7. Subir o container

```bash
cd /var/www/html/app-unycoprod
docker compose pull
docker compose up -d
```

## 8. Verificar

```bash
# Logs
docker logs app-unycoprod -f

# Health check
curl http://localhost:5100/api/health

# Status
docker ps | grep unycoprod
```

## 9. Configurar proxy reverso (Nginx/Caddy)

Apontar `appunyco.wescctech.com.br` para `localhost:5100`:

```nginx
server {
    server_name appunyco.wescctech.com.br;

    location / {
        proxy_pass http://localhost:5100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 10. Atualizar (deploys futuros)

O GitHub Actions builda e publica a imagem automaticamente a cada push na `main`.

Para atualizar no servidor:

```bash
cd /var/www/html/app-unycoprod
docker compose pull
docker compose up -d
```

## Variáveis de ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|:-----------:|
| `NODE_ENV` | `production` | Sim |
| `PORT` | Porta interna (5000) | Sim |
| `DATABASE_URL` | Connection string PostgreSQL | Sim |
| `DB_SSL` | `true` ou `false` (default: false) | Não |
| `TOTVS_API_TOKEN` | Token Basic Auth TOTVS (base64) | Sim |
| `VINDI_API_KEY` | Chave API Vindi | Sim |
