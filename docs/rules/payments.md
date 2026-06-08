# Regras do Fluxo de Pagamento

## Métodos aceitos
- `pix_unyco` — Pix via gateway Vindi Pagamentos (conta Itaú/Vindi)
- `cartao_unyco` — Cartão de crédito via e.Rede REST
- Não adicionar ou renomear métodos sem verificar configuração na conta Vindi

## Fluxo PIX
1. Frontend chama `handleChooseMethod('pix_unyco')`
2. `handlePayment('pix_unyco')` envia para `/api/vindi/create-bill`
3. Backend cria bill na Vindi com `payment_method_code: 'pix_unyco'`
4. Retorna `pix.qrcode_path` (imagem SVG) e `pix.qrcode_original_path` (EMV/Copia e Cola)
5. Frontend exibe QR Code e inicia polling a cada 5s em `/api/vindi/bill/:id`
6. Polling detecta `charge_status === 'paid'` e chama `onPaymentSuccess`

## Fluxo Cartão
1. Frontend chama `handleChooseMethod('cartao_unyco')` → abre formulário
2. `handleCreditCardSubmit()` valida e chama `handlePayment('cartao_unyco')`
3. Backend cria payment_profile na Vindi com os dados do cartão
4. Cria bill vinculada ao payment_profile
5. Status imediato: aprovado → `onPaymentSuccess`, recusado → `onPaymentFailure`

## Extração do QR Code (backend)
- Verificar: `payment_method_code === 'pix' || 'pix_unyco' || 'pix_bank_slip'`
- Campos do gateway: `qrcode_original_path`, `qrcode_text`, `qr_code_emv`, `qrCodeEmv`
- Imagem: `qrcode_path`, `qr_code_image_url`, `qrCodeImageUrl`

## Registro de pagamentos
- Todos os pagamentos salvos na tabela `payments` após criação da bill
- Status normalizado: `paid`, `pending`, `canceled`
- Mapeamento de status Vindi: `charge_underpaid` → `paid`, `waiting/processing` → `pending`

## Estatísticas (query payments)
- Cartão: `payment_method IN ('credit_card', 'cartao_unyco')`
- PIX: `payment_method IN ('pix', 'pix_unyco', 'pix_bank_slip')`
- Manter ambos os códigos antigo e novo para compatibilidade com registros históricos

## Produto Vindi
- ID fixo: `1980987` — "PROJETO UNYCO"
- Fallback por nome: `HOSP_UNYCO`
- Não alterar sem confirmar com o cliente
