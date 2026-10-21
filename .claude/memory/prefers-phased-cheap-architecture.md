---
name: prefers-phased-cheap-architecture
description: Usuário prefere sempre começar pela opção gerenciada/gratuita mais barata e só considerar self-host ou infra pesada quando o volume justificar
metadata:
  type: feedback
---

Padrão confirmado repetidamente no projeto Vilela CRM (C:\MyStuffs\vilela-crm): ao decidir
arquitetura, sempre propor primeiro a opção mais barata/gerenciada e documentar a alternativa
mais pesada (self-host) como "fase 2, reavaliar só se o volume justificar" — nunca como ponto de
partida.

**Why:** o usuário disse explicitamente "o foco é ser o mais barato possível" ao pedir a
arquitetura de ingestão por WhatsApp, e validou esse raciocínio em pelo menos três decisões
distintas sem pushback: busca de CNPJ (API gratuita + fallback, self-host da base da Receita só
se o volume crescer — ver [[vilela-crm-whatsapp-ingestion]] para o contexto do projeto), geração
de PDF (impressão nativa do navegador em vez de headless Chromium/serviço externo), e extração
por IA via mensagem (modelo hospedado "mini/flash" em vez de self-host de LLM via Ollama).

**How to apply:** em qualquer decisão de infraestrutura neste projeto (e provavelmente em
projetos futuros deste usuário com perfil parecido — pequena empresa, custo sensível), apresentar
a opção gerenciada/gratuita como padrão, e só sugerir self-host ou infraestrutura própria quando
houver um gatilho concreto de volume/custo que justifique — nunca como primeira recomendação.
