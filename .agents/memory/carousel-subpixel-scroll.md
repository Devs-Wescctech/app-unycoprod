---
name: Auto-scroll carrossel (sub-pixel scrollLeft)
description: Por que o auto-scroll infinito do carrossel de destaques da LP parava e como mantê-lo girando.
---

# Auto-scroll infinito via scrollLeft

**Regra:** Para auto-scroll contínuo por RAF, NÃO use `el.scrollLeft += passo` com passo sub-pixel (ex.: 0.6px). Mantenha a posição num ref float (fonte da verdade), incremente nela e só então `el.scrollLeft = posRef.current`. Durante drag do usuário, sincronize `posRef = el.scrollLeft`.

**Why:** Vários navegadores arredondam/truncam o setter de `scrollLeft` para inteiro. Lendo de volta sempre o mesmo inteiro, o incremento de 0.6px é perdido a cada frame e o carrossel fica parado (sintoma: "não gira infinitamente"). Com acumulador float, a posição avança mesmo que o navegador arredonde a aplicação visual, cruzando limites de pixel e gerando movimento.

**How to apply:** Carrossel de "Melhores Oportunidades"/Destaques em `src/pages/lp/LPHome.jsx` usa 3 cópias da lista e faz wrap entre `copyWidth` e `copyWidth*2`. O loop RAF roda com deps `[]` (carouselRef pode ser null no mount; o tick reagenda sempre e assume quando o nó montar). Pausa proposital de 5s ao clicar num card (highlight) — isso é UX, não bug.
