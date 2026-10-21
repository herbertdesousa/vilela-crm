# Vilela CRM — Contexto do Projeto

> Este arquivo existe para que qualquer sessão do Claude (ou de outro dev) entenda o domínio,
> as decisões já tomadas e os limites de escopo sem precisar reconstruir esse raciocínio do zero.
> Mantenha-o atualizado conforme o projeto evolui.

## 1. Quem é o usuário e qual problema resolvemos

Empresas prestadoras de serviço de **ar condicionado** (instalação, manutenção, limpeza,
recarga de gás etc.) precisam emitir **orçamentos** e **recibos** para clientes (pessoa física
ou jurídica) de forma rápida, **pelo celular**, muitas vezes em campo, logo após ou durante o
atendimento.

Já existe uma versão anterior (protótipo) desse produto: um site que gera esses documentos e
salva tudo em `localStorage` do navegador. Um export desse localStorage está em `docs.json` na
raiz do repo (299 documentos reais de clientes — **contém dados pessoais reais, não deve ser
commitado nem usado como exemplo público**; serve apenas como referência de modelo de dados e
casos de uso reais durante o desenvolvimento).

### Por que o protótipo está sendo substituído
- Estrutura de documento rígida (três "layers" fixos: cabeçalho, um único bloco de serviço,
  pagamento) — não dá pra adicionar seções, múltiplos itens de serviço bem discriminados, etc.
- Sem persistência real — tudo preso ao `localStorage` de um navegador/dispositivo específico,
  não dá pra reusar entre empresas/usuários nem sincronizar entre dispositivos.
- Não segue práticas de mercado nem exigências legais brasileiras para esse tipo de documento
  (ver seção 3).
- Pensado para uma empresa só, não para múltiplas empresas (multi-tenant).

## 2. Escopo deste projeto (agora)

**Foco exclusivo: Orçamentos e Recibos.**

O produto tem ambição de crescer para notas fiscais, PMOC (Plano de Manutenção, Operação e
Controle — obrigatório por lei para sistemas de ar condicionado acima de determinada
capacidade, Lei 13.589/2018 / Portaria GM 3.523/1998) e CRM completo de relacionamento com
cliente. **Esses módulos são propositalmente fora de escopo por enquanto** — devem ser
lembrados no design de dados (para não travar o crescimento futuro), mas não implementados
agora.

**Canal de entrada principal: WhatsApp, não formulário web.** O técnico cria o orçamento/recibo
mandando uma mensagem de texto livre no WhatsApp — não preenchendo um formulário. Ver seção 11
para a decisão completa. O frontend web não desaparece: passa a servir a revisão/edição do
rascunho extraído pela IA e a página pública que o cliente abre.

## 3. Requisitos de mercado e legais (Brasil)

### Orçamento (regido pelo Art. 40 do CDC — Lei 8.078/90)
Aplicável sempre que o cliente for consumidor (pessoa física contratando serviço para uso
próprio). Regras:
- O orçamento é **gratuito** e deve ser entregue previamente à execução do serviço.
- Deve **discriminar**: valor da mão de obra, valor de materiais/equipamentos, condições de
  pagamento, e datas estimadas de início e término do serviço.
- Salvo acordo em contrário, o orçamento tem **validade de 10 dias** a partir do recebimento
  pelo cliente.
- Uma vez aprovado (assinado/aceito) pelo cliente, o orçamento **vincula as partes** — só pode
  mudar por negociação livre entre as partes.
- Executar serviço sem orçamento prévio ou autorização expressa é **prática abusiva**.
- Cobrar custos não previstos no orçamento aprovado é vedado (o consumidor não responde por
  ônus de terceiros não previstos).

Implicações de design: cada orçamento precisa de campos explícitos para
prazo de validade, data de início/fim previstas, discriminação separada de mão de obra vs.
materiais, e um estado de aprovação/aceite (idealmente com assinatura ou registro de aceite).

### Recibo
Sem forma legal obrigatória (princípio da liberdade de forma), mas o mercado e a doutrina civil
convergem nos elementos que tornam um recibo válido como prova de pagamento:
- Título "RECIBO" em destaque.
- Nome e CPF/CNPJ de quem paga e de quem recebe.
- Valor em números **e por extenso**.
- Descrição clara do que está sendo pago (referência ao serviço/orçamento).
- Forma de pagamento (dinheiro, PIX, transferência, cheque etc.).
- Data de emissão.
- Assinatura (ou identificação equivalente) de quem recebeu.

Implicações de design: valor por extenso é um **campo derivado obrigatório** (calculado a
partir do valor numérico, não digitado à mão como no protótipo antigo, que guardava só uma
string tipo `"R$280,00"`), CPF/CNPJ de ambas as partes precisa existir no modelo (o protótipo
antigo tinha o campo `document` do cliente sempre vazio na prática), e forma de pagamento é
campo estruturado, não texto livre em "comments".

### Coisas que servem para os dois documentos
- Identificação completa do prestador (empresa emissora): razão social, CNPJ, endereço,
  contato — o protótipo tinha isso como opcional (`show_company_info`); para um documento
  profissional isso deveria ser a identidade fixa da empresa (tenant), não uma seção opcional.
- Numeração sequencial do documento (rastreabilidade, referência em conversas futuras).
- Muitas empresas do setor também anexam **dados bancários para pagamento** (o protótipo já
  tinha isso como seção opcional `add_bank_details_page`) e **campo de assinatura** das partes
  (`show_signatures`) — mantemos como práticas de mercado validadas, não como novidade.

## 4. O que aproveitar do modelo de dados antigo

Do `docs.json`, o modelo era:
```
Document { id, type: "orçamento" | "recibo", title, show_company_info, add_bank_details_page,
  show_signatures, layers: Layer[] }

Layer =
  | Header { date, representative_engineer, representative_architect, customer{name,document,representative}, address }
  | Block  { title, description, price: string, materials[], places[] }  // só existe 1 na prática
  | Payment { comments }
```
Pontos fortes a preservar conceitualmente:
- Separação entre cabeçalho (cliente/endereço/data) e corpo (serviço) e rodapé (pagamento).
- Ideia de seções que podem ser travadas (`isLock`) vs. reordenadas (`order`) — mobile-friendly,
  editor tipo "blocos".
- Um documento pode ter múltiplos `types` textuais além de orçamento/recibo puro (ex.: "laudo
  técnico", "contrato de manutenção") — sinal de que o mercado real do usuário já pede variações;
  vale desenhar o schema para comportar tipos de documento extensíveis, mesmo focando agora só
  em orçamento e recibo.

Pontos fracos a corrigir:
- `price` como string formatada (`"R$2.200,00"`) em vez de valor numérico + moeda — impossível
  somar, formatar por extenso ou fazer relatórios.
- Um único `block` de serviço por documento na prática — precisa virar lista de itens
  (descrição, quantidade, valor unitário, categoria mão-de-obra/material) para atender à
  discriminação exigida pelo Art. 40 do CDC.
- `document` (CPF/CNPJ) do cliente e endereço quase sempre vazios — o app não pedia isso de
  forma natural; o novo fluxo mobile precisa tornar esses campos fáceis de preencher rápido
  (autocomplete de clientes já cadastrados, já que a mesma empresa atende os mesmos clientes
  recorrentes).
- Nenhuma referência entre orçamento aprovado → recibo gerado a partir dele (perde a
  rastreabilidade e a vinculação exigida por lei quando o orçamento é aceito).
- Tudo preso a uma única empresa implícita (sem conceito de tenant/empresa emissora).

## 5. Vocabulário técnico do setor (ar condicionado)

Fonte: `C:\MyStuffs\old-vilela-crm` — uma versão mais madura do protótipo antigo (arquitetura em
camadas, `src/@domain`, `src/@data`, `src/@view`), **repositório separado do `docs.json`**, com
listas de referência (`src/database/documents/*.json`) que carregam vocabulário real do setor,
validado pelo uso:

- **Marcas de equipamento atendidas**: Samsung, Fujitsu, LG, Midea, Carrier, Elgin, Gree,
  Hitachi, Springer, Daikin, Consul, Komeco, Fontaine.
- **Capacidades (BTU/h) usuais**: 7.000, 9.000, 12.000, 15.000, 16.000, 18.000, 21.000, 24.000,
  27.000, 28.000, 30.000, 32.000, 36.000, 40.000, 42.000, 48.000, 56.000.
- **Tipos de instalação**: Split Hi-Wall, Split Cassete (K7) 1 via, Split Cassete (K7) 4 vias,
  Split Piso-Teto, Split Quatro-Lados, Split Canto-Teto, Split Inverter, Split Janela, Portátil,
  VRF.
- **Partes do equipamento**: Evaporadora, Condensadora (tratadas como unidades separadas no
  atendimento; "Ar Condicionado" genérico para portáteis).
- **Materiais de instalação reais**: cano de cobre, isolamento térmico, caixa de infra, cabo PP
  (4 vias), cano/conexões em PVC, silver tape, buchas, abraçadeiras, parafusos, pés de borracha,
  carga de gás, bomba de vácuo, nitrogênio, suporte de condensadora, mangueira de dreno.
- **Local dentro do imóvel**: por pavimento (Térreo, Primeiro/Segundo/Terceiro Andar ou Piso,
  Pavimento I/II) e por cômodo (Sala, Sacada, Suíte I–IV, Suíte Master, Quarto I/II, Quarto de
  Hóspede/Visita).
- **Nomes usuais de seção de serviço**: Infraestrutura, Instalação, "Infraestrutura e
  Instalação", Manutenção Mensal, Serviço, Descrição.
- **Tipos de documento além de orçamento/recibo já usados na prática**: "contrato de
  manutenção" — relevante quando avaliarmos PMOC/contratos recorrentes no futuro (fora do
  escopo atual, ver seção 2).

Essa versão mais madura também tinha uma hierarquia estruturada rica: `Bloco de serviço →
Local (andar + cômodo) → Equipamento (tipo, marca, capacidade, quantidade, modo)`. Isso é mais
granular do que qualquer documento real que apareceu no `docs.json` — nas ~299 amostras reais,
`materials` e `places` quase sempre vieram **vazios**, e o técnico escreveu tudo como texto
livre em `description`. **Leitura direta desse dado**: quando o formulário estruturado exige
mais toques do que só escrever, o usuário ignora a estrutura e usa texto livre — reforça o
princípio da seção 6 (usuário não-técnico, simplicidade > flexibilidade). Ao desenhar o editor
de itens do novo app, os campos de marca/capacidade/tipo/local devem ser **atalhos opcionais e
rápidos** (autocomplete com as listas acima), nunca obrigatórios, com a descrição em texto livre
sempre disponível como caminho principal.

Nota de qualidade de dados: a lista de materiais salva pelo protótipo antigo acumulou lixo
(fragmentos de autocomplete digitados parcialmente: `"cv"`, `"cva"`, `"caixa de infra"`, erros
de digitação como `"asd"`) — um autocomplete que salva qualquer texto novo digitado, sem
curadoria, degrada rápido. Na reconstrução: lista de materiais/marcas/capacidades deve ser uma
lista curada e fixa (seed do produto, como as listas acima), e se permitirmos adicionar itens
novos via autocomplete, normalizar (trim, capitalização) e exigir confirmação antes de persistir
como opção reutilizável — nunca salvar rascunho de digitação como opção.

## 6. Perfil real do usuário final (restrição de design mais importante)

Os usuários que de fato preenchem esses orçamentos/recibos no dia a dia (técnicos de ar
condicionado, donos de empresas pequenas do setor) **não são familiarizados com tecnologia**.
Isso não é um detalhe — é a restrição que deve guiar toda decisão de produto e de interface:

- **Simplicidade sempre vence sobre flexibilidade.** Prefira menos opções na tela, valores
  padrão inteligentes, e fluxos lineares (passo a passo) em vez de telas com muitos campos e
  configurações simultâneas — mesmo que isso signifique menos poder para o usuário avançado.
- **Editor "de blocos" livre, tipo o antigo, é um risco de UX**, não uma feature a preservar
  literalmente: reordenar/travar seções pressupõe um usuário confortável manipulando estrutura.
  Prefira formulários guiados (ex.: "adicionar item de serviço" com campos fixos e claros) a um
  canvas flexível.
- **Nomeie tudo em português simples e no vocabulário do setor**, nunca em termos técnicos ou
  jurídicos crus (ex.: mostrar "Validade da proposta: 10 dias" em vez de citar o artigo de lei;
  a lei informa o *padrão*, não o *texto que o usuário vê*).
- **Preenchimento rápido em campo, com o celular na mão e sujeira/luvas envolvidas**: campos
  grandes, poucos toques, autocomplete de clientes já cadastrados, valores numéricos com
  teclado numérico automático, o mínimo de digitação possível.
- **Evite qualquer tela que pareça "configuração de sistema"** (ex.: permissões, roles,
  múltiplos usuários por empresa) — se multi-usuário por empresa for necessário, esconda essa
  complexidade atrás de um fluxo simples ("convidar alguém da equipe"), nunca exponha conceitos
  como "tenant", "role", "permission" na interface.
- **Mensagens de erro e validação devem ser instruções diretas do que fazer**, não jargão
  técnico nem mensagens genéricas.
- Ao gerar o PDF final (o artefato que o cliente do usuário vê), ele deve parecer
  profissional por padrão, sem exigir que o usuário configure nada — a conformidade legal
  (seção 3) deve ser automática, não uma escolha que o usuário precisa entender e ativar.

Sempre que houver conflito entre "o jeito tecnicamente mais correto/flexível" e "o jeito mais
simples de usar", **priorize o segundo**, e documente a troca feita.

## 7. Princípios de produto para esta reconstrução

1. **Mobile-first, rápido**: criar um orçamento ou recibo em campo, em poucos toques.
2. **Multi-empresa (multi-tenant)** desde o início do modelo de dados, mesmo que o MVP rode
   para uma empresa só — para não repetir o erro do protótipo.
3. **Profissional e conforme a lei**: os campos obrigatórios (Art. 40 CDC para orçamento,
   elementos de recibo válido) não são opcionais escondidos, são o padrão do documento.
4. **Extensível**: o schema de documento não deve assumir que só existem "orçamento" e "recibo"
   para sempre — notas, PMOC e CRM vêm depois, então tipos de documento e relacionamento com
   cliente devem ser modelados como entidades primeiras (Empresa, Cliente, Documento), não
   hardcoded.

## 8. Decisões de arquitetura (confirmadas com o usuário)

- **Backend real desde o início**: banco de dados relacional (Postgres) + API routes do
  Next.js, em vez de continuar local-first em `localStorage`. Justificativa: multi-dispositivo,
  multi-usuário por empresa, e base necessária para notas/PMOC/CRM no futuro.
- **Multi-tenant com autenticação desde o início**: cada empresa tem login próprio e só enxerga
  seus próprios dados (clientes, documentos). Isolamento por `empresa_id` em todas as tabelas de
  domínio.
- **Busca de cliente por CNPJ**: `BrasilAPI` como fonte primária (gratuita, sem chave), `CNPJá`
  como fallback (plano grátis, 50 créditos/mês, cache até 45 dias) se a primeira falhar ou não
  retornar. Ambas gratuitas — sem custo para o MVP. Encapsular atrás de uma função única
  (`buscarEmpresaPorCnpj(cnpj)`), e **sempre salvar o resultado na tabela `Cliente` local** ao
  encontrar — isso funciona como cache permanente e reduz a dependência das APIs externas ao
  longo do tempo. Reavaliar self-host da base pública da Receita Federal (dados abertos CNPJ,
  ~20-30GB em Postgres, atualização mensal) só se o volume de buscas justificar — complexidade
  desnecessária para o volume esperado do MVP.
- **CPF: sem busca/enriquecimento por API.** Não existe base oficial de busca reversa (nome a
  partir do CPF) — os serviços de mercado que oferecem isso usam bases de dados privadas/de
  origem duvidosa (vazamentos, scraping), sem base legal clara sob a LGPD para uso por terceiros
  sem consentimento do titular. Decisão: o técnico **digita o nome e CPF do cliente
  manualmente** (ele já tem essa informação do atendimento presencial) — o sistema apenas
  **valida o dígito verificador do CPF** (algoritmo público, local, sem chamada externa, sem
  dado pessoal saindo do servidor) para pegar erro de digitação. Mais simples de usar e sem
  risco jurídico. Reavaliar apenas se surgir necessidade real de KYC formal (fora do escopo
  atual de orçamento/recibo).
- **Entrega do documento: link, não arquivo — e PDF gerado no frontend.** O documento nunca é
  guardado como PDF; o banco de dados é a fonte da verdade. Cada `Documento` tem um `token`
  aleatório e não-sequencial (não usar o `id` interno, para não permitir enumerar documentos de
  outras empresas), servido numa rota pública somente-leitura (`/d/{token}`) que renderiza o
  documento em HTML direto dos dados atuais — é esse link que o prestador manda pro cliente
  (WhatsApp etc.). Editar o orçamento atualiza automaticamente o que aparece nesse link, sem
  reprocessar nada.
  - **Geração de PDF: 100% no frontend, via CSS de impressão nativo do navegador**
    (`@page`, `@media print`, `break-inside: avoid`) + botão "Baixar PDF" que chama
    `window.print()`. O próprio navegador (motor de impressão nativo, presente em
    Chrome/Safari/Android/iOS) decide a paginação e produz um PDF vetorial de verdade — sem
    servidor, sem serviço externo, sem custo, sem dependência.
  - **Por que isso evita o bug do protótipo antigo**: o app anterior tirava um "print" do DOM
    com `html2canvas` + `jsPDF`, alternando uma propriedade CSS não padrão (`zoom`) com
    `transform: scale(4,4)` na hora de gerar o PDF, e media a altura/largura de cada bloco em
    JS (`blocksInPage`) pra decidir manualmente onde cortar a página — frágil porque depende de
    fontes já carregadas, pixel ratio do aparelho e zoom do navegador do usuário no momento da
    medição. Deixar a paginação a cargo do motor de impressão do navegador (via CSS de
    impressão padrão) remove essa classe inteira de bug.
  - **Fora de escopo por enquanto** (reavaliar só se surgir necessidade real): gerar PDF no
    servidor sem interação humana (ex.: anexar automaticamente em e-mail/WhatsApp, job
    automático, ou "congelar" uma cópia bit-a-bit no momento da aprovação do orçamento) — isso
    exigiria um serviço de HTML→PDF (ex.: PDFShift) ou Chromium headless (Playwright), que hoje
    não é necessário porque o fluxo real é "cliente abre o link e opcionalmente salva/imprime".
- **Canal de entrada: WhatsApp + extração por IA, com revisão humana obrigatória antes de
  compartilhar.** Detalhe completo na seção 11.

## 9. Modelo de dados (entidades principais)

```
Empresa (tenant)
  id, razao_social, nome_fantasia, cnpj, endereco, telefone, email,
  logo_url, dados_bancarios, created_at

Usuario
  id, empresa_id, nome, email, senha (via auth), role, created_at

Cliente
  id, empresa_id, nome, cpf_cnpj, telefone, email, endereco, created_at

Documento
  id, empresa_id, cliente_id, tipo ("orcamento" | "recibo"),
  numero (sequencial por empresa), status ("rascunho" | "enviado" | "aprovado" | "pago" | "cancelado"),
  data_emissao,
  -- campos específicos de orçamento (Art. 40 CDC):
  validade_dias (default 10), data_inicio_previsto, data_fim_previsto,
  -- vínculo legal orçamento -> recibo:
  orcamento_origem_id (nullable, aponta pro orçamento que originou este recibo),
  forma_pagamento, dados_bancarios_snapshot, observacoes,
  assinatura_cliente_url, assinatura_empresa_url,
  valor_total (derivado da soma dos itens, nunca digitado à mão)

ItemDocumento
  id, documento_id, descricao, categoria ("mao_de_obra" | "material"),
  quantidade, valor_unitario, ordem
```

Motivação de cada decisão de schema está na seção 4 (o que corrigir do modelo antigo).

## 10. Estrutura de pastas proposta (Next.js App Router)

```
app/
  (public)/                    # área sem autenticação
    page.tsx                   # landing
    login/page.tsx
    cadastro/page.tsx          # cadastro de nova empresa
    d/[token]/page.tsx         # documento público — o link que vai pro cliente, CSS de impressão nativo
  (app)/                       # área autenticada — layout valida sessão + empresa
    layout.tsx
    dashboard/page.tsx
    orcamentos/
      page.tsx                 # lista
      novo/page.tsx
      [id]/page.tsx            # ver/editar
    recibos/
      page.tsx
      novo/page.tsx
      [id]/page.tsx
    rascunhos/
      [id]/page.tsx            # revisão/edição do rascunho extraído da mensagem de WhatsApp
    clientes/
      page.tsx
      [id]/page.tsx
    configuracoes/
      empresa/page.tsx         # CNPJ, logo, dados bancários
  api/
    auth/[...nextauth]/route.ts
    orcamentos/route.ts
    recibos/route.ts
    clientes/route.ts
    whatsapp/
      webhook/route.ts         # recebe mensagem, dispara extração por IA, responde com link de revisão

lib/
  db/
    schema.ts                  # schema Drizzle (entidades da seção 9)
    index.ts                   # client do banco
  auth.ts                      # config de autenticação
  whatsapp/
    client.ts                  # chamadas à WhatsApp Business Cloud API (enviar/responder mensagem)
  ia/
    extrair-documento.ts       # prompt + saída estruturada: texto livre -> rascunho de Documento (seção 11)
  documents/
    valor-por-extenso.ts       # número -> texto por extenso (obrigatório em recibo)
  validations/                 # schemas zod por entidade (empresa, cliente, documento)

components/
  ui/                          # design system compartilhado
  documentos/                  # preview do documento, tela de revisão do rascunho, etc.

drizzle/                       # migrations geradas
docs/
  PROJECT_CONTEXT.md            # este arquivo
```

Stack sugerida (a confirmar antes de instalar): **Drizzle ORM + Postgres** (Supabase free tier)
para o banco, **Auth.js (NextAuth v5)** para autenticação multi-tenant, **Zod** para validação.
PDF é gerado no frontend via impressão nativa do navegador (seção 8) — nenhuma lib de PDF no
servidor. Extração por IA via API de um modelo "mini/flash" hospedado (seção 11) — sem
self-host de LLM por enquanto.

## 11. Canal de entrada: WhatsApp + extração por IA (decisão de arquitetura)

Em vez de o técnico preencher um formulário web pra criar o orçamento/recibo, ele manda uma
mensagem de texto livre pelo WhatsApp — jeito que ele já usa todo dia — e o sistema extrai os
dados estruturados automaticamente. É a aplicação mais direta do princípio da seção 6: zero
fricção de entrada, nenhuma tela nova pra aprender.

Exemplos reais de mensagem (fonte de verdade pro desenho do parser):
1. *"Orçamento infraestrutura e instalação / Endereço Terra Preta / Sala, / Infraestrutura e
   instalação 2 aparelhos cassete 4 vias 1 de 22.000 btus e outro 18.000 btus (...) retirar os
   aparelhos na casa Vila Maria, lavar eles (...) / Valor total 13.000.00"* — sem nome de
   cliente; serviço inclui retirar equipamento de outro endereço e lavar, não só instalar.
2. *"Orçamento infraestrutura e instalação / Rua Marechal Deodoro 389 apart.1108 / Sala
   infraestrutura (...) 18.000 btus / Suíte (...) 9.000 btus / Escritório (...) 9.000 btus /
   Materiais utilizados (...) / Valor total 6000.00"* — sem cliente; 3 ambientes, lista de
   materiais em texto corrido.
3. *"Orçamento / Cliente Toninho, Padaria Campo Belo / Portas, cortina de ar total de duas (...)
   retirar as queimadas e no local instalação e fornecimento das duas cortinas / Valor total
   1900.00"* — tem cliente; equipamento é cortina de ar, fora da lista de split da seção 5.

### Fluxo
1. Técnico manda a mensagem pro número/canal de WhatsApp da empresa.
2. Webhook recebe o texto cru e chama um LLM de extração com um prompt + schema de saída
   (mesmas entidades da seção 9 — `Documento` + `ItemDocumento` — com campos podendo vir nulos).
3. O resultado estruturado é salvo como rascunho (`status: rascunho`), ligado à empresa pelo
   número/canal de origem.
4. O bot responde no WhatsApp com um resumo curto + o link de revisão (rota
   `app/(app)/rascunhos/[id]`) — **nunca manda direto pro cliente sem confirmação humana**: texto
   livre é ambíguo (ex. 1: "retirar e lavar" não é um item de serviço óbvio; ex. 3: "cortina de
   ar" é um tipo de equipamento que a IA pode não reconhecer).
5. Técnico abre o link, confere/edita (reaproveitando a mesma tela e o mesmo template visual dos
   orçamentos/recibos), confirma.
6. Só depois da confirmação o link público (`/d/{token}`, seção 8) existe pra ser mandado ao
   cliente.

Isso não elimina o frontend web — muda o papel dele: de tela principal de criação de dados para
(a) tela de revisão/edição do rascunho extraído e (b) página pública que o cliente abre. A
decisão da seção 8 (link tokenizado + PDF via impressão nativa) segue valendo sem mudança.

### Custo da arquitetura (prioridade: o mais barato possível)

| Componente | Opção recomendada | Custo esperado no volume do MVP |
|---|---|---|
| Canal WhatsApp | **Meta WhatsApp Business Cloud API** (oficial) | Grátis — mensagem dentro da janela de 24h de conversa iniciada pelo usuário (o técnico manda pro bot) não é cobrada; só mensagem de template fora dessa janela custa |
| Servidor | Next.js (API route de webhook) na Vercel, free tier | Grátis no volume esperado |
| Banco de dados | Supabase free tier (Postgres) | Grátis até 500MB — ok pro MVP |
| Extração por IA | Modelo "mini/flash" hospedado via API (ex.: Gemini Flash — tier grátis generoso — ou Claude Haiku, ambos muito baratos por chamada), com saída estruturada (JSON/function-calling) | Centavos por mês no volume esperado (mensagens curtas, poucas por dia) |

**Por que não self-host de um modelo de IA agora**: rodar um LLM pequeno (Llama/Qwen/Phi via
Ollama) no próprio servidor exige uma VPS com CPU/GPU dedicada rodando 24/7 — o custo fixo disso
tende a superar o custo por chamada de um modelo "mini" hospedado, dado o volume baixo esperado
(uma empresa pequena manda poucos orçamentos por dia). Self-host só compensa em alto volume —
mesma lógica de fases já usada nas decisões de CNPJ (seção 8) e de PDF (seção 8): começar pelo
serviço gerenciado mais barato/gratuito, reavaliar self-host só se o volume justificar.

**Risco a evitar**: bibliotecas não-oficiais de WhatsApp (Baileys, whatsapp-web.js) são "de
graça" mas automatizam uma conta pessoal via QR code, violam os termos de uso do WhatsApp e
arriscam banimento do número — não usar em produção.

### O que o parser precisa tolerar

Os 3 exemplos reais mostram a variedade do texto que vai chegar:
- Nem sempre tem nome de cliente (exemplos 1 e 2 não têm).
- Quantidade/capacidade de equipamento embutida no texto corrido, sem campo separado.
- Serviços implícitos além da instalação (retirar aparelho antigo de outro endereço, lavar,
  fornecer peça) — não cabem limpo nas categorias rígidas "mão de obra"/"material" da seção 9;
  o campo `descricao` em texto livre do item continua sendo o escape hatch (mesmo padrão da
  seção 5).
- Tipo de equipamento nem sempre é ar-condicionado split (exemplo 3: cortina de ar) — as listas
  da seção 5 são atalho de autocomplete, nunca uma restrição fechada de schema.
- Valor total em formato solto e inconsistente ("13.000.00", "6000.00", "1900.00") — o parser de
  valor precisa tolerar isso.

Por isso, **a revisão humana antes de confirmar não é opcional** — é a rede de segurança para
qualquer erro de interpretação da IA, consistente com o princípio da seção 6 de nunca expor o
cliente final a um erro do sistema.

### Fora de escopo por enquanto (fase 3)
Cadastro de clientes recorrentes, resolução automática ("esse cliente já existe?") e pedir
informação adicional ao técnico via WhatsApp quando a mensagem vier incompleta — ficam para
depois. Por ora, cada mensagem gera um rascunho novo e o técnico completa o que faltar na tela
de revisão.

## Referências
- [Art. 40 do CDC (Lei 8.078/90)](https://www.jusbrasil.com.br/topicos/10602210/artigo-40-da-lei-n-8078-de-11-de-setembro-de-1990)
- [PROCON-SC — Orçamento obrigatório, gratuito e discriminado](https://www.procon.sc.gov.br/orcamento-para-servicos-e-obrigatorio-gratuito-e-discriminado/)
- [Elementos obrigatórios de um recibo válido](https://modeloinicial.com.br/materia/direito-civil-obrigacoes-recibo-requisitos-praticos-validade)
