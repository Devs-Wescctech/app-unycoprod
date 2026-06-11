---
name: Email flow hotel recipient
description: Como a automação de E-mail resolve o destinatário hotel e o ponto incerto da API Coobmais
---
# Destinatário do e-mail (Cliente/Hotel/Ambos)

Cada nó de e-mail no construtor visual guarda `data.recipient_type` (`client`/`hotel`/`both`, default `client`), persistido em `metadata.flow_nodes`. `triggerEmailFlow` agrega os tipos dos nós de e-mail e envia para cliente e/ou hotel; fluxos legados sem `flow_nodes` => Cliente.

**Resolução do e-mail do hotel:** `resolveHotelEmail(localizador, hotelId)` chama Coobmais `GET /Book/GetBookDetails?localizador=...` (auth via `ensureCoobToken`) e cai em fallback `GET /Book/InfoHotels?hotel_id=...` (`hotel.email`). Cache em memória curto (10min hit / 2min miss). `bookingVars`/`cancelVars` passam `hotel_id` para o fallback.

**Why / ponto incerto:** o nome exato do campo de e-mail do hotel na resposta de GetBookDetails NÃO foi confirmado (sem credenciais Coobmais ao vivo no ambiente de dev). `extractHotelEmailFromDetails` tenta vários candidatos (`hotel_email`, `hotelEmail`, `hotel.email`, etc.). Se o envio ao hotel sempre depender do fallback InfoHotels, confirmar o campo real e ajustar.

**How to apply:** ao mexer no envio ao hotel, valide com um localizador real e confira o log `[EMAIL] GetBookDetails`. Falha ao achar e-mail do hotel é logada em `email_logs` (status error) e não bloqueia o envio ao cliente.
