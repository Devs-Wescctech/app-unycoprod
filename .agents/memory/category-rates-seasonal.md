---
name: Tarifas por categoria são sazonais (alta/baixa) para todas
description: Diamante deixou de ter valor fixo único; todas as categorias seguem low/high season
---

# Tarifas por categoria de hotel são todas sazonais

Todas as categorias (Silver/Gold/Diamante) usam `low_season_rate` e `high_season_rate`
editáveis separadamente. Diamante **não** é mais valor fixo único.

**Regra de cálculo (idêntica em todos os pontos):**
`appliedRate = isHighSeason ? (highRate || lowRate) : (lowRate || highRate)`
e `season_label = isHighSeason ? 'Alta' : 'Baixa'`. Não pode existir branch `isDiamante`
nem rótulo `'Fixa'`.

**Pontos que precisam ficar em lockstep** (se mexer num, conferir os outros):
backend `/api/lp/hotels` e featured hotels; `BookingFlow.applyRates`;
`BookingAlternativesModal.applyHotelRate`; admin `Configuracoes.jsx` (layout único de 2 campos).

**Why:** pedido do dono — Diamante deveria seguir o mesmo padrão de Gold/Silver. O banco
já tinha as duas colunas (Diamante gravava o mesmo valor nas duas), então a mudança foi só
remover o tratamento especial; sem migração.

**Resíduo conhecido (não corrigido):** o seed de FAQ em `server/index.js` ainda diz
"Luxo: Ano todo R$ 775,00" (preço-exemplo fixo). Mudar exige decisão de negócio sobre o
preço de alta temporada do Luxo/Diamante — não inventar número.
