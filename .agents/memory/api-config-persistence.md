---
name: Central de APIs persistence & Vindi credential precedence
description: How Central de APIs configs are stored and how Vindi's API key is resolved (401 fix)
---
Central de APIs configs (TOTVS, Coobmais, Vindi, SerpAPI) persist in Postgres
`system_config` key `api_config` (JSON blob), NOT in `server/api-config.json`.
The JSON file is ephemeral inside the container and was wiped on every redeploy,
losing all configured connections.

**Why:** the DB lives outside the container (host Postgres) so it survives redeploys,
matching how `whatsapp_config`/`smtp_config` already work.

**How to apply:**
- `loadApiConfigFromDb()` runs at startup (after `initializeDatabase`, before `app.listen`).
  If DB has a non-empty `api_config`, it replaces in-memory `apiConfigOverrides`.
  Otherwise it migrates the legacy `api-config.json` once into the DB.
- `applyApiConfigOverrides()` maps the blob onto runtime vars in ONE place — keep all
  per-API var assignments consistent there.
- `saveApiConfigToDb()` is called on every write (PUT `/api/central/apis/:name` and the
  Coobmais token auto-refresh). Don't reintroduce `fs.writeFileSync(API_CONFIG_FILE)`.

**Vindi 401 root cause:** a stale Vindi token saved in `api-config.json` overrode the
correct `.env` `VINDI_API_KEY`, causing HTTP 401 against `app.vindi.com.br`.
- Precedence: explicit DB override wins; otherwise fall back to `process.env.VINDI_API_KEY`.
- Migration from JSON DISCARDS the Vindi token on purpose (don't carry the bad key over).
- `POST /api/central/vindi/clear-token` clears the override and reverts to the env key
  (UI button in the Vindi edit modal).

**Prod-only Vindi 401 (committed api-config.json has NO Vindi entry):** when the repo's
`api-config.json` has no Vindi block, the effective key is always `process.env.VINDI_API_KEY`.
A prod 401 with dev working means the prod `.env` Vindi key is wrong/sandbox while the
Replit secret is a valid PRODUCTION key. Quick diagnosis: the same key gives 200 on
`app.vindi.com.br` and 401 on `sandbox-app.vindi.com.br` — so it's a production key.
Fastest fix WITHOUT SSH/redeploy: PUT the correct key to the live app's
`/api/central/apis/Vindi` (`{ token, baseUrl: "https://app.vindi.com.br" }`) — same path
as the UI "Editar" button; it persists to DB (`api_config`) and overrides `.env`.
**Why:** no code bug — purely a prod credential mismatch; pushing to GitHub does nothing.
