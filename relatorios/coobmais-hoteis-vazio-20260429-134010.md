# Relatório — Busca de hotéis na API Coobmais retornando vazio

**Data do teste:** 29/04/2026 13:40:10 (UTC: 2026-04-29T13:40:10Z)
**Ambiente:** Produção
**Aplicação:** UNYCO CRM / Landing Page de reservas
**Solicitante:** Wescctech (suporte@wescctech.com.br)

---

## Resumo

A busca de hotéis (`POST /Book/GetHotels`) está retornando lista vazia
(`{"accommodations": []}`) para **todas as cidades testadas**, mesmo as
de alto volume como São Paulo, Rio de Janeiro, Foz do Iguaçu e
Caldas Novas. As respostas chegam com HTTP 200 e tempo médio < 1s,
indicando que a autenticação e o roteamento estão OK — o problema está
no inventário/disponibilidade retornado pela Coobmais.

## Como o sistema autentica

| Item | Valor |
|---|---|
| Endpoint de autenticação | `POST https://apiprod.coobmais.com.br/auth/api/Users/Authenticate` |
| Body | `{"AccessKey":"<...>", "password":"<...>"}` |
| Token JWT obtido (preview) | `eyJhbGciOiJIUzI1Ni...OoGwokCufO2w` |
| Validade do token | 2026-05-29T12:48:03.000Z (~31 dias) |
| Status | OK — autenticação aceita normalmente |

## Como a busca de hotéis está sendo feita

```http
POST https://apiprod.coobmais.com.br/unico/api/Book/GetHotels
Authorization: Bearer <JWT obtido acima>
Content-Type: application/json
```

Payload (mesmo formato sempre, variando apenas o `google_place_id`):

```json
{
  "google_place_id": "<ID retornado por /Book/GetCities ou Google Places>",
  "start_date": "2026-05-29",
  "end_date": "2026-05-31",
  "adults": 2,
  "children": 0,
  "rooms": 1
}
```

## Testes executados


### Foz do Iguacu
- **google_place_id:** `ChIJj7UPqVhJ_5QRqaRl7mvxnYg`
- **HTTP:** 200 | **Tempo:** 0.916698s | **Tamanho do body:** 21 bytes
- **Hotéis retornados:** 0
- **Resposta:** `{"accommodations":[]}`


### Sao Paulo
- **google_place_id:** `ChIJ0WGkg4FEzpQRrlsz_whLqZs`
- **HTTP:** 200 | **Tempo:** 0.962136s | **Tamanho do body:** 21 bytes
- **Hotéis retornados:** 0
- **Resposta:** `{"accommodations":[]}`


### Rio de Janeiro
- **google_place_id:** `ChIJW6AIkVXemwARTtIvZ2xC3FA`
- **HTTP:** 200 | **Tempo:** 0.851602s | **Tamanho do body:** 21 bytes
- **Hotéis retornados:** 0
- **Resposta:** `{"accommodations":[]}`


### Caldas Novas
- **google_place_id:** `ChIJa4H8FySkk5QRGI5K4q8SFlA`
- **HTTP:** 200 | **Tempo:** 0.792972s | **Tamanho do body:** 21 bytes
- **Hotéis retornados:** 0
- **Resposta:** `{"accommodations":[]}`

---

## Conclusão

- A autenticação está funcionando (token JWT válido por ~31 dias).
- O endpoint `/Book/GetHotels` responde HTTP 200 em todas as chamadas.
- O array `accommodations` vem **vazio** para todos os `google_place_id`
  testados, incluindo destinos de grande inventário.
- Não há nenhuma alteração recente do nosso lado no payload (mesmo formato
  que vinha funcionando em ambientes anteriores).

## Pedido

Por favor, verificar se há algo em nossa conta (cadastro, contrato,
permissões, filtros de inventário) que esteja zerando os resultados na
`/Book/GetHotels` em produção. Caso o formato do payload ou algum campo
obrigatório tenha mudado, agradecemos o ajuste correto.

