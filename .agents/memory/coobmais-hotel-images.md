---
name: Coobmais hotel main image (01.jpg) may 404
description: External Coobmais quirk where a hotel's default main image can be missing; how to resolve a valid one.
---

# Coobmais hotel image quirk

Coobmais builds each hotel's main image URL as `.../images/hotel/{id}/01.jpg`, but
for some hotels `01.jpg` returns **HTTP 404** and the real photos start at `02.jpg`
(confirmed: id 6425 ACONCHEGO PORTO DE GALINHAS → 01.jpg 404, 02.jpg 200; id 4882/7254 → 01.jpg 200).

When `01.jpg` 404s, LP cards/carousels fell back to the generic placeholder
(`/lp/assets/img/gtr.jpg`), looking like a bug.

**Authoritative source:** `Book/InfoHotels` returns a `photos[]` array of full URLs
of the photos that actually exist. Resolution rule used on the backend
(`resolveMainImage`): if the default image is in `photos`, keep it; else use
`photos[0]`; if `photos` is empty, keep current (client placeholder handles it).

**Why:** avoids per-card HEAD checks. The search/featured endpoints already fetch
InfoHotels per hotel for category rates, so photo resolution reuses that 30min
cache (`getHotelInfoCached`) with no extra network calls when rates exist.

**How to apply:** any new LP surface that renders a hotel's main image should rely
on the backend-resolved `image`, not reconstruct `01.jpg`. The detail modal
carousel should source from `details.photos` (authoritative), not prepend the raw
`hotel.image`.
