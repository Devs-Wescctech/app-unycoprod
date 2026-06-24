# Documento Técnico — Fluxo de Reserva de Hotéis no UNYCO

> **Autor:** Luis Henrique Marques (desenvolvedor responsável pela integração)
> **Destinatário:** equipe técnica da Coobmais
> **Objetivo:** mostrar, em ordem, **todo o caminho** que uma reserva percorre no
> UNYCO — quais dados o cliente envia, o que o servidor faz com eles, qual API é
> chamada em cada momento, o que volta de cada chamada e como esse retorno alimenta
> a próxima etapa.

---

## 1. Introdução

Olá, time da Coobmais! Sou o Luis Henrique Marques, desenvolvedor da integração do
UNYCO. Este documento descreve **o fluxo de ponta a ponta** de uma reserva: a
sequência de rotas que o pedido percorre, do momento em que o cliente digita o
destino até a reserva confirmada.

Nosso backend é um servidor **Node.js/Express** que funciona como intermediário
entre o navegador do cliente e as APIs de vocês (Coobmais) e da Vindi (pagamento).
O navegador conversa só com o nosso servidor; é o servidor que adiciona a
autenticação e chama as APIs externas.

Cada seção abaixo segue sempre a mesma lógica:

1. **O que o cliente envia** (entrada).
2. **O que o servidor pega desses dados** e prepara.
3. **Qual API é chamada** (interna → externa) e com qual corpo.
4. **O que volta** dessa API.
5. **Como esse retorno alimenta o próximo passo.**

As duas APIs externas do fluxo:

| API | Papel | Autenticação |
| --- | --- | --- |
| **Coobmais** | Cidades, hotéis, apartamentos, disponibilidade e confirmação da reserva | JWT Bearer (login automático via `Authenticate`) |
| **Vindi** | Pagamento (cartão e PIX) | Basic Auth com API key |

URL base da Coobmais: `https://apiprod.coobmais.com.br/unico/api`
URL base da Vindi: `https://app.vindi.com.br/api/v1`

---

## 2. Mapa do fluxo (visão geral)

```
CLIENTE envia                  UNYCO pega / chama                  API retorna o que alimenta
─────────────                  ──────────────────                  ──────────────────────────
destino digitado     ─►  POST /api/lp/cities       ─► Coobmais GetCities    → google_place_id
destino + datas      ─►  POST /api/lp/hotels       ─► Coobmais GetCities    → google_place_id
                                                     ─► Coobmais GetHotels   → lista de hotéis (id, cost)
clica num hotel      ─►  GET  /api/lp/hotel-info    ─► Coobmais InfoHotels   → fotos, dados do hotel
escolhe datas/quarto ─►  POST /api/lp/info-apartment─► Coobmais InfoApartment→ booking_code + cost
clica "reservar"     ─►  POST /api/lp/availability-book ─► Coobmais AvailabilityBook → disponível?
escolhe pagamento    ─►  POST /api/vindi/create-bill─► Vindi POST /bills     → bill_id (+ PIX QR)
(PIX) aguarda        ─►  GET  /api/vindi/bill/:id   ─► Vindi GET /bills/:id  → status: paid
pagamento ok         ─►  POST /api/lp/booking-confirmation ─► Coobmais BookingConfirmation → localizador
reserva confirmada   ─►  POST /api/lp/bookings      ─► PostgreSQL            → reserva gravada
```

O `google_place_id` da cidade, o `id` do hotel, o `booking_code` do apartamento, o
`bill_id` do pagamento e o `localizador` da reserva são os "fios" que conectam um
passo ao outro. Cada um nasce em uma etapa e é consumido na seguinte.

---

## 3. Autenticação (acontece automaticamente nos bastidores)

### 3.1 Coobmais — JWT com cache e renovação automática

Antes de qualquer chamada à Coobmais, o servidor garante que tem um token válido
(`ensureCoobToken()`):

- Se já existe um token em cache com mais de 5 min até expirar, ele é reutilizado.
- Senão, o servidor faz login em `Authenticate` com `AccessKey` + `password`, recebe
  o JWT e guarda em cache até perto do `exp`.

Login (feito internamente pelo servidor):

```bash
curl -X POST 'https://apiprod.coobmais.com.br/auth/api/Users/Authenticate' \
  -H 'Content-Type: application/json' \
  -d '{"AccessKey":"SEU_ACCESS_KEY","password":"SUA_SENHA"}'
```

Retorno:

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Depois disso, **toda** chamada à Coobmais leva: `Authorization: Bearer <JWT>`.

### 3.2 Vindi — Basic Auth

Para a Vindi, o servidor envia a API key como usuário e senha vazia:
`Authorization: Basic base64("<API_KEY>:")`.

---

## 4. O fluxo, passo a passo

### Passo 1 — Cliente digita o destino → buscamos a cidade

**Cliente envia:** o texto do destino (ex.: "Rio de Janeiro").

**Servidor pega:** esse texto e monta o corpo da chamada à Coobmais.

| | |
| --- | --- |
| Rota interna | `POST /api/lp/cities` |
| API externa chamada | Coobmais — `POST {BASE}/Book/GetCities` |
| Corpo enviado | `{ "cidade": "Rio de Janeiro" }` |

```bash
curl -X POST 'https://unycoclub.com.br/api/lp/cities' \
  -H 'Content-Type: application/json' \
  -d '{"cidade":"Rio de Janeiro"}'
```

**Coobmais retorna:**

```json
{
  "ok": true,
  "data": [
    { "cidade": "RIO DE JANEIRO", "uf": "RJ", "google_place_id": "ChIJW6AIkVXemwARTtIvZ2xC3FA" }
  ]
}
```

**Como alimenta o próximo passo:** o `google_place_id` retornado é o identificador da
cidade. É ele que usamos para buscar os hotéis daquela cidade.

---

### Passo 2 — Cliente busca hotéis → buscamos cidade e depois hotéis

**Cliente envia:** destino + datas (check-in/check-out) + número de hóspedes.

**Servidor pega:** esses dados e executa **duas chamadas em sequência**:

1. Primeiro chama `Book/GetCities` para obter o `google_place_id` da cidade (mesmo do
   passo 1 — se o front já mandou o `google_place_id`, pula esta chamada).
2. Em seguida chama `Book/GetHotels`, passando o `google_place_id` retornado, as datas
   e os hóspedes.

| | |
| --- | --- |
| Rota interna | `POST /api/lp/hotels` |
| API externa 1 | Coobmais — `POST {BASE}/Book/GetCities` (→ `google_place_id`) |
| API externa 2 | Coobmais — `POST {BASE}/Book/GetHotels` (usa o `google_place_id`) |

Corpo que o servidor envia ao `Book/GetHotels`:

```json
{
  "start_date": "2026-07-10",
  "end_date": "2026-07-13",
  "adults": 2,
  "children": 0,
  "children_age": 0,
  "google_place_id": "ChIJW6AIkVXemwARTtIvZ2xC3FA",
  "qtde_linhas": 1000
}
```

```bash
curl -X POST 'https://unycoclub.com.br/api/lp/hotels' \
  -H 'Content-Type: application/json' \
  -d '{
    "cidade": "Rio de Janeiro",
    "checkIn": "2026-07-10",
    "checkOut": "2026-07-13",
    "adults": 2,
    "children": 0
  }'
```

**Coobmais retorna** a lista de hotéis (com `id` e o `cost` de cada um). O servidor
aplica a tarifa comercial do UNYCO sobre esse custo e devolve:

```json
{
  "ok": true,
  "data": [
    {
      "id": 12345,
      "name": "Hotel Exemplo Copacabana",
      "city": "Rio de Janeiro",
      "state": "RJ",
      "total_price": 1200.00,
      "cost": [
        { "daily": 400.00, "extras": 0 },
        { "daily": 400.00, "extras": 0 },
        { "daily": 400.00, "extras": 0 }
      ]
    }
  ]
}
```

**Como alimenta o próximo passo:** o `id` de cada hotel é o que usamos para abrir os
detalhes e, depois, para buscar os apartamentos.

---

### Passo 3 — Cliente abre um hotel → buscamos os detalhes

**Cliente envia:** o `hotel_id` do hotel escolhido.

| | |
| --- | --- |
| Rota interna | `GET /api/lp/hotel-info?hotel_id=<id>` |
| API externa chamada | Coobmais — `GET {BASE}/Book/InfoHotels?hotel_id=<id>` |

```bash
curl 'https://unycoclub.com.br/api/lp/hotel-info?hotel_id=12345'
```

**Coobmais retorna** os dados completos do hotel (fotos, comodidades, endereço,
contato):

```json
{
  "ok": true,
  "data": {
    "id": 12345,
    "name": "Hotel Exemplo Copacabana",
    "address": "Av. Atlântica, 1000 - Copacabana",
    "phone": "(21) 0000-0000",
    "email": "reservas@hotelexemplo.com.br",
    "photos": ["https://.../01.jpg", "https://.../02.jpg"],
    "amenities": ["Wi-Fi", "Piscina", "Café da manhã"]
  }
}
```

**Como alimenta o próximo passo:** com o hotel aberto e as datas escolhidas, o cliente
parte para a escolha do apartamento.

---

### Passo 4 — Cliente escolhe datas/quarto → buscamos os apartamentos

**Cliente envia:** `hotel_id` + datas + hóspedes.

**Servidor pega:** esses dados e chama `Book/InfoApartment`. (Internamente, o servidor
repete a chamada por alguns segundos caso a Coobmais ainda esteja montando a
disponibilidade, mas o conceito é uma chamada só.)

| | |
| --- | --- |
| Rota interna | `POST /api/lp/info-apartment` |
| API externa chamada | Coobmais — `POST {BASE}/Book/InfoApartment` |

Corpo enviado à Coobmais:

```json
{
  "hotel_id": 12345,
  "start_date": "2026-07-10",
  "end_date": "2026-07-13",
  "adults": 2,
  "children": 0
}
```

```bash
curl -X POST 'https://unycoclub.com.br/api/lp/info-apartment' \
  -H 'Content-Type: application/json' \
  -d '{
    "hotel_id": 12345,
    "start_date": "2026-07-10",
    "end_date": "2026-07-13",
    "adults": 2,
    "children": 0
  }'
```

**Coobmais retorna** os apartamentos disponíveis, cada um com seu `booking_code` e seu
`cost`:

```json
{
  "ok": true,
  "data": [
    {
      "booking_code": "ABC123XYZ",
      "apartment_type": "Standard Casal",
      "availability": "imediata",
      "cost": [
        { "daily": 400.00, "extras": 0 },
        { "daily": 400.00, "extras": 0 },
        { "daily": 400.00, "extras": 0 }
      ]
    }
  ]
}
```

**Como alimenta o próximo passo:** o `booking_code` do apartamento escolhido é a chave
que carregamos por todo o resto do fluxo (pré-reserva, pagamento e confirmação).

---

### Passo 5 — Cliente clica em reservar → pré-reserva na Coobmais

**Cliente envia:** o `booking_code` do apartamento + o `hotel_id`.

**Servidor pega:** esses dados e monta a chamada à Coobmais usando o **CNPJ
institucional do UNYCO** e o identificador do associado institucional (`vfb_identifier`,
que o servidor obtém antes via `Associate/GetAssociate`).

| | |
| --- | --- |
| Rota interna | `POST /api/lp/availability-book` |
| API externa chamada | Coobmais — `POST {BASE}/Book/AvailabilityBook` (e `GET {BASE}/Associate/GetAssociate` para o `vfb_identifier`) |

Corpo enviado à Coobmais:

```json
{
  "token": "ABC123XYZ",
  "cpf": "1573933000130",
  "hotel_id": 12345,
  "vfb_points": 0,
  "vfb_identifier": "<nic institucional>",
  "third_guest_name": "",
  "third_guest_cpf": "",
  "third_guest_ddd": "",
  "third_guest_cellphone": "",
  "third_guest_email": ""
}
```

```bash
curl -X POST 'https://unycoclub.com.br/api/lp/availability-book' \
  -H 'Content-Type: application/json' \
  -d '{ "booking_code": "ABC123XYZ", "hotel_id": 12345 }'
```

**Coobmais retorna** se o apartamento segue disponível:

```json
{ "ok": true, "data": { "sucesso": 1, "mensagem": "Disponível" } }
```

**Como alimenta o próximo passo:** confirmada a disponibilidade, seguimos para o
pagamento na Vindi.

---

### Passo 6 — Cliente escolhe forma de pagamento → criamos a cobrança na Vindi

**Cliente envia:** dados do pagador (nome, CPF, e-mail), o `booking_code`, o `hotel_id`,
as datas, os hóspedes, o método (`pix` ou `cartao_unyco`) e, no cartão, os dados do
cartão.

**Servidor pega:** esses dados e, na Vindi, faz em sequência:

1. **Cria/reusa o cliente** (`POST /customers`) pelo CPF.
2. **Cartão:** cria o perfil de pagamento (`POST /payment_profiles`) com os dados do
   cartão.
3. **Cria a fatura** (`POST /bills`) com o produto, o valor e a `metadata` contendo o
   `booking_code` (assim a fatura fica amarrada a esta reserva).
4. **Guarda o pagamento** no nosso banco (`vindi_bill_id`, valor, status).
5. **PIX:** extrai da resposta da Vindi o QR Code (imagem) e o copia-e-cola (EMV) e
   devolve ao cliente.

| | |
| --- | --- |
| Rota interna | `POST /api/vindi/create-bill` |
| APIs externas | Vindi — `POST /customers`, `POST /payment_profiles` (cartão), `POST /bills` |

Corpo do `POST /bills` (exemplo, cartão):

```json
{
  "customer_id": 987654,
  "payment_method_code": "cartao_unyco",
  "bill_items": [{ "product_id": 1980987, "amount": 1200.00 }],
  "installments": 1,
  "metadata": { "booking_code": "ABC123XYZ" },
  "payment_profile": { "id": 555444 }
}
```

```bash
curl -X POST 'https://unycoclub.com.br/api/vindi/create-bill' \
  -H 'Content-Type: application/json' \
  -d '{
    "payment_method_code": "pix",
    "customer_name": "João da Silva",
    "customer_cpf": "12345678909",
    "customer_email": "joao@email.com",
    "amount": 1200.00,
    "hotel_id": 12345,
    "booking_code": "ABC123XYZ",
    "check_in": "2026-07-10",
    "check_out": "2026-07-13",
    "adults": 2,
    "children": 0
  }'
```

**Vindi retorna** (PIX):

```json
{
  "ok": true,
  "data": {
    "bill_id": 11223344,
    "charge_id": 99887766,
    "charge_status": "pending",
    "amount": 1200.00,
    "payment_method": "pix",
    "pix": {
      "qrcode_path": "https://.../qrcode.png",
      "qrcode_original_path": "00020126...5204000053039865802BR...",
      "max_days_to_keep_waiting_payment": 1
    }
  }
}
```

No **cartão**, o retorno é parecido, mas já vem com `charge_status: "paid"` e sem o
bloco `pix`.

**Como alimenta o próximo passo:** o `bill_id` é a chave do pagamento. No PIX, o
cliente paga olhando o QR Code e o servidor passa a consultar esse `bill_id` até ele
virar pago.

---

### Passo 7 — (PIX) Cliente paga → consultamos o status da fatura

**Cliente envia:** nada extra — o navegador apenas consulta o `bill_id` a cada 5
segundos enquanto o cliente paga o PIX. (No cartão, esse passo é instantâneo, pois a
cobrança já volta paga.)

| | |
| --- | --- |
| Rota interna | `GET /api/vindi/bill/:id` |
| API externa chamada | Vindi — `GET /bills/:id` |

```bash
curl 'https://unycoclub.com.br/api/vindi/bill/11223344'
```

**Vindi retorna** o status atual:

```json
{
  "ok": true,
  "data": {
    "bill_id": 11223344,
    "status": "paid",
    "amount": 1200.00,
    "charge_status": "paid",
    "paid_at": "2026-06-24T12:34:56-03:00"
  }
}
```

**Como alimenta o próximo passo:** quando o `charge_status` vira `paid`, seguimos para
confirmar a reserva na Coobmais.

---

### Passo 8 — Pagamento confirmado → confirmamos a reserva na Coobmais

**Cliente envia:** o `booking_code`, o `hotel_id` e o `bill_id` pago.

**Servidor pega:** esses dados e chama `Book/BookingConfirmation`, novamente com o CNPJ
institucional e o `vfb_identifier`.

| | |
| --- | --- |
| Rota interna | `POST /api/lp/booking-confirmation` |
| API externa chamada | Coobmais — `POST {BASE}/Book/BookingConfirmation` |

Corpo enviado à Coobmais:

```json
{
  "token": "ABC123XYZ",
  "cpf": "1573933000130",
  "hotel_id": 12345,
  "vfb_points": 0,
  "vfb_identifier": "<nic institucional>",
  "third_guest_name": "",
  "third_guest_cpf": "",
  "third_guest_ddd": "",
  "third_guest_cellphone": "",
  "third_guest_email": ""
}
```

```bash
curl -X POST 'https://unycoclub.com.br/api/lp/booking-confirmation' \
  -H 'Content-Type: application/json' \
  -d '{ "booking_code": "ABC123XYZ", "hotel_id": 12345, "bill_id": 11223344 }'
```

**Coobmais retorna** a reserva confirmada, com o `localizador` oficial:

```json
{
  "ok": true,
  "data": { "sucesso": 1, "localizador": "UNY-2026-000123", "mensagem": "Reserva confirmada" }
}
```

**Como alimenta o próximo passo:** o `localizador` é o número oficial da reserva. É ele
que gravamos no nosso banco.

---

### Passo 9 — Reserva confirmada → gravamos no nosso banco

**Cliente envia:** os dados da reserva confirmada (`localizador`, `booking_code`,
`bill_id`, `hotel_id`, nome do hotel, datas, hóspedes, valor).

**Servidor pega:** esses dados e grava a reserva no PostgreSQL, vinculando-a ao
pagamento. (Se o `localizador` já existir, não duplica.)

| | |
| --- | --- |
| Rota interna | `POST /api/lp/bookings` |
| Persistência | PostgreSQL — tabelas `bookings` e `payments` |

```bash
curl -X POST 'https://unycoclub.com.br/api/lp/bookings' \
  -H 'Content-Type: application/json' \
  -d '{
    "localizador": "UNY-2026-000123",
    "bill_id": 11223344,
    "booking_code": "ABC123XYZ",
    "hotel_id": 12345,
    "hotel_name": "Hotel Exemplo Copacabana",
    "check_in": "2026-07-10",
    "check_out": "2026-07-13",
    "adults": 2,
    "children": 0,
    "total_price": 1200.00
  }'
```

**Retorno:**

```json
{
  "ok": true,
  "data": {
    "id": 321,
    "localizador": "UNY-2026-000123",
    "status": "confirmed",
    "total_price": 1200.00
  }
}
```

Pronto — a reserva está confirmada na Coobmais, paga na Vindi e registrada no nosso
banco. Depois disso, o UNYCO ainda dispara avisos ao cliente (WhatsApp/e-mail), mas
isso é interno e não envolve as APIs de reserva.

---

## 5. Resumo das rotas (na ordem do fluxo)

| # | Rota interna (UNYCO) | Método | API externa | Endpoint externo | O que produz |
| --- | --- | --- | --- | --- | --- |
| — | (login automático) | POST | Coobmais | `Authenticate` | JWT |
| 1 | `/api/lp/cities` | POST | Coobmais | `Book/GetCities` | `google_place_id` |
| 2 | `/api/lp/hotels` | POST | Coobmais | `Book/GetCities` + `Book/GetHotels` | lista de hotéis (`id`, `cost`) |
| 3 | `/api/lp/hotel-info` | GET | Coobmais | `Book/InfoHotels` | detalhes do hotel |
| 4 | `/api/lp/info-apartment` | POST | Coobmais | `Book/InfoApartment` | `booking_code` |
| 5 | `/api/lp/availability-book` | POST | Coobmais | `Book/AvailabilityBook` | disponibilidade |
| 6 | `/api/vindi/create-bill` | POST | Vindi | `POST /customers`, `/payment_profiles`, `/bills` | `bill_id` (+ PIX) |
| 7 | `/api/vindi/bill/:id` | GET | Vindi | `GET /bills/:id` | status do pagamento |
| 8 | `/api/lp/booking-confirmation` | POST | Coobmais | `Book/BookingConfirmation` | `localizador` |
| 9 | `/api/lp/bookings` | POST | PostgreSQL | — | reserva gravada |

---

*Fico à disposição para qualquer dúvida ou ajuste. — Luis Henrique Marques*
