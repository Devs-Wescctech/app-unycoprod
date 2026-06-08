---
name: Hero video single-click unmute (React quirks)
description: Por que "ativar som no vídeo" exigia 2 cliques e a combinação de causas que resolveu.
---

## Sintoma
Vídeo hero da LP (src/pages/lp/LPHome.jsx) tocava mudo via autoplay; clicar para ativar som fazia o badge "Toque para ativar som" sumir mas o vídeo continuava mudo — só o 2º clique trazia o som.

## Três causas independentes (todas precisaram ser corrigidas)
1. **Ref callback inline re-muta a cada render.** `ref={(el)=>{ el.muted=true; ... }}` tem identidade nova a cada render, então o React reexecuta o callback em TODA re-renderização. `setHeroMuted(false)` dispara re-render → callback roda → `el.muted=true` de volta. **Fix:** ref estável (`ref={heroVideoRef}`) + setup imperativo (muted + setAttribute playsinline etc.) num `useEffect(..., [])` que roda só na montagem.
2. **Props `muted`/`defaultMuted` no JSX.** React reconcilia `<video muted>` e força `el.muted=true` em re-renders. **Fix:** remover `muted` e `defaultMuted` do JSX; controlar mudo só por JS.
3. **`onCanPlay` forçava `v.muted=true`.** `canplay` dispara várias vezes (buffer) e re-mutava após o clique. **Fix:** `onCanPlay` só chama `v.play()` se `v.paused`, sem mexer em muted.

**Why:** O segundo clique funcionava porque não mudava estado → sem re-render → nada re-mutava.
**How to apply:** Para qualquer `<video>`/`<audio>` controlado por estado React, NÃO use ref callback inline com efeitos colaterais nem a prop `muted`; faça setup imperativo uma vez via useEffect e nunca force muted em handlers que disparam repetidamente (canplay/timeupdate). Interação do usuário (1 clique) deve tentar `play()` já com som (gesto permite áudio), com fallback mudo.
