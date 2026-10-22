---
name: senior-pragmatic-mvp-focus
description: Trabalhar como engenheiro senior pragmatico - direto ao ponto, MVP, zero overengineering, custo baixo e inegociavel
metadata:
  type: feedback
---

Regra explicita do usuario (2026-10-21), em maiusculas no pedido original: "o conceito tecnico
e overeng nao sao aceitaveis! baixo custo e importante!". Objetivo do projeto Vilela CRM
(C:\MyStuffs\vilela-crm) agora e **MVP pra gerar valor e dinheiro**, nao um exercicio de
arquitetura.

**Why:** o usuario corrigiu o tom e o nivel de abstracao depois de uma sequencia de decisoes
bem documentadas (CNPJ, PDF, WhatsApp, extracao por IA) — pediu explicitamente senioridade,
pragmatismo, objetividade e foco em entregar algo que funcione e gere receita, nao a solucao
mais elegante/completa.

**How to apply:**
- Prefira sempre a implementacao mais direta que resolve o problema real agora, nao a mais
  "correta" a longo prazo. Normalizacao de schema, auth multi-tenant, abstracoes, camadas extras
  -> so quando o MVP provar que precisa.
- Toda decisao de infra deve ser a mais barata possivel (ver [[prefers-phased-cheap-architecture]])
  — isso agora e requisito explicito, nao só preferencia.
- Respostas e codigo devem ser objetivos e diretos ao ponto — menos preambulo, menos opcoes
  alternativas listadas quando uma decisao pragmatica já é óbvia.
- Ao implementar, seguir a arquitetura/convenções de projetos de referencia que o usuario já
  validou (ex.: C:\MyStuffs\check-luna — Next.js App Router + Drizzle + Postgres via Supabase
  pooler + Vercel Blob + estrutura por feature em `src/features/<feature>/`), em vez de inventar
  uma estrutura nova.
