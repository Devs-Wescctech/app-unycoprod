---
name: LP hotels by_request filtering
description: How "sob consulta" (by_request) hotels survive the /lp/hotels availability filter and get CRM pricing
---

# /lp/hotels e hotéis "sob consulta" (by_request)

`POST /api/lp/hotels` busca no n8n, aplica tarifas do CRM por categoria, e depois
faz um probe InfoApartment por hotel filtrando só os que têm `availability === 'imediata'`.

**Regra:** hotéis marcados pelo n8n com `by_request: true` (sob consulta) NÃO têm
apartamento "imediata", então o filtro os eliminava — e cidades 100% sob consulta
(ex.: Gramado) voltavam `{ ok: true, data: [] }`.

**Decisão:** o filtro mantém o hotel quando `hasImediata || hotel.by_request === true`.
Hotéis que NÃO são by_request continuam exigindo imediata (não regredir).

**Why:** usuário percebia cidade inteira como "retorna só true" (lista vazia).

**Cost/tarifa:** by_request frequentemente vem sem array `cost`. A aplicação de
tarifa do CRM mapeia sobre `h.cost`; se vazio, total_price ficaria 0. Por isso,
quando `cost` está vazio e há nights (calculado de checkIn/checkOut), sintetiza-se
`cost` = nights entradas com `{ daily: appliedRate, extras: 0 }`. Hotéis com cost
existente mantêm comportamento original.

**Flags:** `by_request` e `is_preferential` chegam ao front por passthrough do
objeto do hotel (SearchForm.jsx já lê esses campos).
