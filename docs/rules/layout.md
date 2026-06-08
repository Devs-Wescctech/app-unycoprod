# Regras de Layout e UI

## Separação LP / CRM
- Componentes da Landing Page ficam em `src/pages/lp/` e `src/pages/lp/components/`
- Componentes do CRM ficam em `src/pages/` e `src/components/`
- Nunca misturar componentes LP com CRM

## Estilo e CSS
- Framework: Tailwind CSS — não adicionar CSS global sem necessidade
- Biblioteca de componentes: Radix UI + padrão shadcn/ui
- Nunca alterar `src/index.css` ou classes globais sem solicitação explícita
- Paleta principal: azul `#1e40af` (CRM), verde `#10b981` (LP/sucesso)
- Ícones: Lucide React — não substituir por outra biblioteca

## Responsividade
- Todo componente novo deve ser responsivo (mobile-first)
- Sidebar do CRM tem comportamento colapsável — não alterar sem solicitação

## Animações
- Não remover animações existentes (fadeSlideIn, etc.) sem solicitação
- Não adicionar bibliotecas de animação além das já existentes (Framer Motion)

## Header e Sidebar
- Não alterar estrutura do Header ou Sidebar do CRM sem solicitação explícita
- Menu de navegação da LP (`LPHeader`) é independente do CRM

## Regras de cor por status
- Verde: sucesso, ativo, pago
- Vermelho: erro, cancelado, inativo
- Âmbar/laranja: aviso, sob consulta, pendente
- Azul: informação, ação primária
- Cinza: desativado, secundário

## Vídeo Hero (LPHome)
- Controle de volume com slider ao hover
- Click para pausar/reproduzir
- Não remover nem simplificar esse comportamento
