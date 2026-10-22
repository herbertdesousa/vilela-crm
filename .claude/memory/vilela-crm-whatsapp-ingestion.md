---
name: vilela-crm-whatsapp-ingestion
description: Vilela CRM usa WhatsApp como canal principal de criação de orçamento/recibo, com extração por IA e revisão humana obrigatória
metadata:
  type: project
---

Decidido em 2026-10-20: no projeto Vilela CRM (C:\MyStuffs\vilela-crm), o técnico não preenche
um formulário web para criar orçamento/recibo — ele manda uma mensagem de texto livre no
WhatsApp (jeito que já usa no dia a dia). Um webhook recebe a mensagem, um LLM hospedado
("mini/flash", ex. Gemini Flash ou Claude Haiku) extrai os dados estruturados (cliente, local,
itens, equipamentos, materiais, valor), e o resultado é salvo como rascunho.

**Status em 2026-10-21**: MVP completo implementado (WhatsApp Z-API → Claude Haiku 4.5 →
Postgres/Supabase via Drizzle → página pública `/d/[id]`), pronto pra subir na Vercel. Z-API
(pago) foi usado em vez da Meta Cloud API oficial (grátis) — troca por rapidez de setup, vale
revisitar custo depois. **Simplificação deliberada do MVP**: a etapa de revisão humana antes do
link ir pro cliente (descrita abaixo) ainda não está implementada — o webhook já responde com o
link direto. Isso é uma dívida técnica consciente pra validar o pipeline rápido, não pra usar
com cliente real ainda. Detalhe completo em `.claude/docs/PROJECT_CONTEXT.md` seção 11,
"Status: MVP implementado".

**Why:** usuários finais deste produto não são familiarizados com tecnologia (ver
[[prefers-phased-cheap-architecture]] e o princípio geral de simplicidade do projeto) — WhatsApp
é zero fricção porque é o canal que eles já usam, contra um formulário que é uma tela nova pra
aprender.

**Restrição crítica**: o rascunho extraído pela IA **nunca** é enviado automaticamente ao
cliente. O bot responde no WhatsApp com um link de revisão; o técnico confere/edita e só depois
confirma, e aí sim o link público vira compartilhável. Mensagens reais de exemplo mostraram
texto bem ambíguo (serviços implícitos como "retirar aparelho e lavar", equipamentos fora do
catálogo usual como "cortina de ar", valores em formatação solta) — confiar direto na extração
sem revisão humana quebraria a confiança do usuário não-técnico no primeiro erro.

**How to apply**: qualquer trabalho futuro de implementação neste projeto deve tratar o webhook
de WhatsApp + extração por IA como o caminho principal de criação de documento; o frontend web
passa a ser a tela de revisão do rascunho + a página pública que o cliente abre (não mais a
tela principal de entrada de dados). Documentação completa de arquitetura, custo e formato de
mensagens-exemplo está em `.claude/docs/PROJECT_CONTEXT.md` (seção 11) dentro do próprio repo —
este memo é só o apontador rápido pra sessões futuras lembrarem que essa decisão existe.
