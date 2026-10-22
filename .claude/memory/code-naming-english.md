---
name: code-naming-english
description: Nomes no codigo (variaveis, funcoes, arquivos, tabelas, tipos) devem ser em ingles, mesmo em projetos de dominio brasileiro
metadata:
  type: feedback
---

Correcao do usuario (2026-10-21) no projeto Vilela CRM (C:\MyStuffs\vilela-crm): eu tinha escrito
nomes de arquivos, funcoes, variaveis e colunas de banco em portugues (ex.: `extrair-documento.ts`,
`enviarMensagem`, `textoOriginal`). O usuario pediu explicitamente: "nomes do codigo deve ser
ingles!".

**Why:** convencao de codigo em ingles, independente do dominio do produto ser brasileiro e a
UI/copy ser em portugues.

**How to apply:** em qualquer projeto deste usuario, nomes de arquivos, pastas, funcoes,
variaveis, tipos/interfaces e colunas/tabelas de banco vao em ingles (`extract-document.ts`,
`sendMessage`, `originalText`, `tb_documents`). Texto voltado ao usuario final (labels de UI,
mensagens de WhatsApp, conteudo de documento) continua em portugues, porque é produto pra
brasileiros — a regra é sobre nomes de codigo, nao sobre copy/conteudo.
