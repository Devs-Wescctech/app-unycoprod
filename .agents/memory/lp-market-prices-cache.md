---
name: LP market prices / SerpAPI cache
description: Regras de cálculo de % de desconto e cache mensal SerpAPI nas superfícies da landing page (carrossel, comparativo, card verde).
---

## Referência de mercado = median, nunca max
A "% abaixo do mercado" e a diferença de preço devem comparar contra o **median** dos preços SerpAPI, não o `max`.
**Why:** os labels da UI dizem "preço médio de mercado". Usar `max` (listagem mais cara) inflava a % e fazia hotéis que NÃO eram oferta real (unyco > preço típico) aparecerem como ofertas. Foi exatamente a causa dos "dados incorretos" reportados.
**How to apply:** no backend `marketPrice = serp.median || serp.max`; no frontend mapear `median: d.data.median || d.data.max`. As 4 superfícies usam a mesma base median: card verde (banner de busca), overlay do carrossel, badge do HotelCard, e seção "Comparativo de Preços" (economia/diferença baseadas em `marketPrice`, não em `topSource`). Hotéis onde median < unyco são marcados `hidden` e filtrados (`!h.hidden`) no frontend.

## Query SerpAPI DEVE ser por cidade, nunca por nome de hotel
`/api/lp/market-prices` deve montar `q = "<Cidade>, Brasil"` (igual ao card verde), não `nome_do_hotel + cidade`.
**Why:** o engine google_hotels retorna **0 properties** para query de nome de hotel arbitrário (ex.: "MARSOL BEACH RESORT Natal"), enquanto cidade retorna ~16-20 com preço. Quando era por nome, todo hotel ficava `marketPrice: null` e o carrossel/Comparativo ficavam vazios em produção.
**How to apply:** todas as 4 superfícies usam a mesma base median por cidade.

## NUNCA cachear blob de market-prices sem preço real
Os guards de gravação E leitura (memória + DB blob) devem checar `data.some(r => r.marketPrice)` — NÃO `unycoPrice` (que sempre existe).
**Why:** um blob com todos os preços null era gravado em `market_prices_cache` e servido por 30 dias (SNAPSHOT_TTL_MS), travando o estado quebrado. Com o guard, leitura ignora blob sem preço → endpoint reconstrói → produção se auto-corrige no deploy seguinte.

## Modelo de dados: tudo por-noite
`hotel.price` no frontend = `cost[0].daily` (diária aplicada). SerpAPI coleta `rate_per_night.extracted_lowest` (por noite). Comparação por-noite vs por-noite é válida — NÃO há mismatch total-vs-diária.

## Cache mensal (30 dias) e sinergia entre superfícies
- `/api/lp/market-prices` (carrossel): memória chave estática `'current'` (24h) → blob completo em `system_config` key `market_prices_cache` (30d, preserva `sourcePrices`) → SerpAPI sequencial (sleep 600ms, break no 429) só em miss. Ao computar, grava também snapshot por cidade em `market_price_snapshots`.
- `/api/lp/serp-prices` (card verde): lê `market_price_snapshots (city, month)` antes de chamar SerpAPI → reaproveita o que o carrossel já gravou (retorna `cached:"db"`).

## Chaves de cidade DEVEM ser normalizadas
Escrita (carrossel `hotel.city`) e leitura (card verde `extractCityFromQuery`) precisam passar por `normalizeCity()` (NFD + strip acentos + lowercase + colapsa espaços).
**Why:** sem isso, "maceió" (escrita) ≠ "maceio" (leitura) → cache miss → SerpAPI extra, anulando a economia de chamadas.
**How to apply:** sempre normalizar em qualquer INSERT/SELECT de `market_price_snapshots`. Ao mudar o esquema de normalização, limpar snapshots antigos (são regeneráveis) pois chaves divergentes viram linhas mortas.

## Comparativo usa janela de ALTA temporada + filtro de hotel comparável
`/api/lp/market-prices` consulta SerpAPI nas próximas janelas de **alta temporada** (meses de `season_config.high_season_months`, dia 20, 5 noites), não no mês seguinte genérico. Fallback para offsets genéricos só se nenhuma alta retornar preço.
**Why:** o valor da "tarifa fixa" Unyco só aparece na alta temporada, quando o mercado dispara (R$566–1223) vs. tarifa fixa (R$385–775). Consultar baixa temporada (ex.: agosto) fazia o mercado ficar ABAIXO do Unyco em todas as cidades → `hideFromFeatured` ocultava tudo → carrossel/comparativo vaziam ("não carregam"). SerpAPI sempre rodou; o problema era data + contaminação da mediana.
**How to apply:** `highSeasonWindows(highMonths)` gera os offsets que caem em meses de alta. `collectSerpPrices` filtra `isComparableHotel` (`type==='hotel' && extracted_hotel_class>=3`) para excluir flats/aluguéis de temporada/hostels que puxavam a mediana para baixo; fallback para todas as propriedades se houver <3 comparáveis. Hotéis cuja mediana de alta ainda fica < tarifa Unyco (ex.: Florianópolis Diamante R$775) continuam `hidden` — é honesto. Ao mudar a estratégia de datas, limpar `market_prices_cache` e `market_price_snapshots`.
