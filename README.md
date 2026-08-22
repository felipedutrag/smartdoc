# ⚖️ SmartDoc / Extrajus

> **Plataforma de Notificação Extrajudicial com Inteligência Artificial** — Conte seu problema por voz ou texto e receba um documento jurídico profissional em minutos.

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Fluxo da Aplicação](#-fluxo-da-aplicação)
- [Páginas](#-páginas)
- [API Routes](#-api-routes)
- [Componentes](#-componentes)
- [Hooks](#-hooks)
- [Utils / Lib](#-utils--lib)
- [Estilos e Tema](#-estilos-e-tema)
- [Estrutura de Diretórios](#-estrutura-de-diretórios)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Como Rodar](#-como-rodar)
- [Deploy](#-deploy)

---

## ✨ Funcionalidades

### 🤖 Inteligência Artificial (Gemini + Groq)

| Funcionalidade | Descrição |
|---|---|
| **Assistente de Voz "Aura"** | Conversação em tempo real via WebSocket com Gemini 3.1 Flash Live. Coleta fatos, tira dúvidas e guia o usuário. |
| **Chat de Triagem** | Modo texto usando Gemini 2.5 Flash + Function Calling para estruturar a coleta de dados. |
| **Geração Automática de Documentos** | IA redige notificações extrajudiciais completas em HTML com fundamentação jurídica (CC, CDC, CF, etc.). |
| **Edição Cirúrgica por Voz/Texto** | Edite trechos específicos do documento conversando com a IA. Usa Groq (Llama 3.3-70B) com fallback para Gemini 3.1 Flash Lite. |
| **Highlight de Alterações (Diff Visual)** | Trechos modificados são destacados com `<mark>` azul para fácil identificação. |
| **Desconto Negociado por IA** | A IA pode ativar ofertas e contagem regressiva via `apply_discount`. |
| **Ping Pró-ativo** | Após 45s de inatividade, a IA inicia conversa automaticamente. |

### 📝 Editor de Documentos (TipTap v3)

| Funcionalidade | Descrição |
|---|---|
| **Editor WYSIWYG Completo** | Headings (H1-H6), parágrafos, listas, imagens, links, citações, código. |
| **Formatação de Texto** | Negrito, itálico, sublinhado, tachado, subscrito, sobrescrito, código inline. |
| **Alinhamento** | Esquerda, centro, direita, justificado. |
| **Highlight Colorido** | Paleta de cores para destaque de texto (verde, azul, vermelho, roxo, amarelo). |
| **Background de Bloco** | Extensão personalizada para cor de fundo em parágrafos, headings, blockquotes. |
| **Upload de Imagens** | Upload com drag-and-drop via nó personalizado. |
| **Listas** | Ordenadas, não ordenadas e task lists. |
| **Barra de Ferramentas Responsiva** | Layout adaptável para desktop e mobile. |
| **Atalhos de Teclado** | Exibidos em tooltips (⌘B, ⌘I, etc.). |
| **Tema Claro/Escuro** | Alterna entre light/dark mode. |

### 💳 Monetização

| Funcionalidade | Descrição |
|---|---|
| **Pagamento via Pix** | Integração com GGPix API para gerar QR Code e código Pix Copia e Cola. |
| **Checkout Multi-etapas** | Step 1: dados do cliente + upsells. Step 2: QR Code Pix. |
| **Upsell - Revisão de Advogado** | Opção de revisão e assinatura por advogado parceiro (+R$ 47,00). |
| **Upsell - WhatsApp** | Opção de entrega e acompanhamento via WhatsApp (+R$ 27,00). |
| **Contagem Regressiva de Desconto** | Timer de oferta especial com estilização vermelha pulsante. |
| **Proteção Anti-Cópia** | Bloqueia copiar/recortar/menu de contexto antes do pagamento. |

### 📄 Exportação

| Funcionalidade | Descrição |
|---|---|
| **DOCX Profissional** | Gera arquivo .docx formatado com padrões jurídicos brasileiros. |
| **HTML para Word** | Conversão de HTML para DOCX via `html-to-docx`. |
| **Estilos Inline para Word** | Injeção automática de estilos CSS inline (justificação, formatação de headings). |

### 📧 Email (Resend)

| Funcionalidade | Descrição |
|---|---|
| **Confirmação ao Cliente** | Email automático após pagamento com link para o editor e DOCX anexado. |
| **Alerta ao Administrador** | Notificação por email com dados do cliente, fatos narrados e rascunho do documento. |

### 🔒 Segurança e Sessão

| Funcionalidade | Descrição |
|---|---|
| **Persistência em localStorage** | Sessão de voz, rascunho e dados de checkout salvos localmente. |
| **Sessão de Voz** | Reconecta automaticamente com histórico preservado. |
| **Detecção de Rascunho** | Banner na home page avisa sobre rascunho em andamento. |
| **Modo Dev** | Comando oculto "modo dev" para testar com dados fictícios. |

### 📊 Analytics

| Funcionalidade | Descrição |
|---|---|
| **Google Ads Conversion Tracking** | Eventos de pageview, início de checkout e compra. |
| **SEO** | Meta tags OG, keywords, favicon. |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 16.2.9 (App Router) |
| **Linguagem** | TypeScript 5 |
| **UI / Estilização** | React 19.2.4 + Tailwind CSS v4 + SCSS |
| **Editor** | TipTap v3.26.1 (`@tiptap/react`, `@tiptap/core`, `@tiptap/pm`) |
| **IA Principal** | Google Gemini 2.5 Flash / 3.1 Flash Live (`@google/generative-ai`) |
| **IA Fallback (Edição)** | Groq Llama 3.3-70B / Gemini 3.1 Flash Lite |
| **Componentes** | Radix UI Popover + DropdownMenu, Floating UI |
| **Ícones** | Lucide React + 38 ícones SVG customizados |
| **Pagamento** | GGPix API (Pix) |
| **Email** | Resend |
| **Exportação DOCX** | html-to-docx |
| **QR Code** | qrcode.react |
| **Real-time** | WebSocket (ws) |
| **Utilitários** | clsx, tailwind-merge, class-variance-authority, lodash.throttle |

---

## 🔄 Fluxo da Aplicação

```
Usuário acessa a Home (/)
  │
  ├─ Modo Voz: Conecta via WebSocket com "Aura"
  │   └─ IA faz 4+ perguntas sobre o conflito
  │   └─ Coleta completa → redirect para /editor?generate=true
  │
  ├─ Modo Chat: Usuário descreve o problema em texto
  │   └─ POST /api/gemini → se IA coletou tudo, redirect
  │   └─ Ou salva direto no localStorage e redirect
  │
  └─ Redireciona para /editor
      │
      ├─ POST /api/gemini/document → stream HTML para o editor
      │
      ├─ Editor exibe o documento (não editável, sem export)
      │   └─ IA "Aura" disponível para conversa + edições
      │   └─ Edições via POST /api/gemini/rewrite (Groq → Gemini)
      │
      ├─ Checkout (multi-step):
      │   Step 1: Nome, Email, WhatsApp, Upsells
      │   Step 2: QR Code Pix (POST /api/payment)
      │   └─ Polling a cada 3s (GET /api/payment/status)
      │
      ├─ Pagamento Confirmado:
      │   ├─ POST /api/payment/confirm-email
      │   ├─ Editor liberado para edição
      │   ├─ Botão "Baixar DOCX" aparece
      │   └─ POST /api/document/docx → download
      │
      └─ Documento finalizado
```

---

## 📄 Páginas

### `/` — Home / Landing Page
- `src/app/page.tsx`
- Coleta de fatos via voz (WebSocket Gemini Live) ou chat (texto)
- Orbe animada reativa ao nível de áudio
- Carrossel de depoimentos (6 relatos)
- Alternância modo Voz/Chat
- Tema claro/escuro
- Banner de rascunho persistente
- Google Ads conversion tracking
- Comando oculto "modo dev"

### `/editor` — Editor + Checkout
- `src/app/editor/page.tsx`
- Editor TipTap com streaming de documento gerado por IA
- Assistente de voz "Aura" para tirar dúvidas e editar o documento
- Paywall completo com checkout Pix multi-etapas
- Timer de desconto com negociação por IA
- Proteção anti-cópia antes do pagamento
- Exportação DOCX após pagamento
- Envio de email de confirmação

### `/simple` — Editor Simples (Demo)
- `src/app/simple/page.tsx`
- Renderiza o `<SimpleEditor />` isolado para testes.

---

## 🌐 API Routes

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/gemini` | POST | Chat de triagem com Gemini 2.5 Flash + function calling |
| `/api/gemini/document` | POST | Gera documento jurídico em HTML (streaming) |
| `/api/gemini/rewrite` | POST | Edita trecho do documento (Groq → Gemini fallback) |
| `/api/config/gemini-live-setup` | GET | Configuração WebSocket para voz na home |
| `/api/config/gemini-editor-setup` | GET | Configuração WebSocket para voz no editor |
| `/api/payment` | POST | Gera cobrança Pix via GGPix |
| `/api/payment/status` | GET | Polling de status do pagamento |
| `/api/payment/confirm-email` | POST | Envia email de confirmação + alerta admin |
| `/api/document/docx` | POST | Exporta documento para .docx |

---

## 🧩 Componentes

### Templates
| Componente | Descrição |
|---|---|
| `simple-editor` | Editor TipTap completo com toolbar responsiva, theming, proteção anti-cópia, paywall e integração com IA. |

### Extensões TipTap
| Extensão | Descrição |
|---|---|
| `node-background-extension` | Adiciona cor de fundo a blocos (parágrafos, headings, blockquotes). |

### Nodes TipTap
| Node | Descrição |
|---|---|
| `image-upload-node` | Upload de imagens com drag-and-drop |
| `horizontal-rule-node` | Linha horizontal customizada |
| `blockquote-node`, `code-block-node`, `heading-node`, `image-node`, `list-node`, `paragraph-node` | Estilizações SCSS |

### UI Components (tiptap-ui)
| Componente | Descrição |
|---|---|
| `mark-button` | Botão toggle para marks (bold, italic, underline, strike, code) |
| `heading-dropdown-menu` | Dropdown de níveis de heading (H1-H6) |
| `list-dropdown-menu` | Dropdown de tipos de lista |
| `link-popover` | Popover para inserir/editar/remover links |
| `color-highlight-popover` | Popover com paleta de cores para highlight |
| `text-align-button` | Botão de alinhamento (esquerda, centro, direita, justificado) |
| `undo-redo-button` | Botões desfazer/refazer |
| `blockquote-button`, `code-block-button`, `image-upload-button` | Botões específicos |

### UI Primitives (tiptap-ui-primitive)
| Componente | Descrição |
|---|---|
| `button` | Botão reutilizável com tooltip, atalho, variantes e tamanhos |
| `toolbar` | Toolbar acessível com navegação por teclado |
| `tooltip` | Tooltip customizado com Floating UI (delay, portal, hover/focus) |
| `popover` | Wrapper do Radix UI Popover |
| `dropdown-menu` | Wrapper do Radix UI DropdownMenu |
| `separator`, `spacer`, `badge`, `button-group`, `card`, `input` | Componentes utilitários |

### Ícones (38 SVG Components)
`align-center`, `align-justify`, `align-left`, `align-right`, `arrow-left`, `ban`, `blockquote`, `bold`, `check`, `chevron-down`, `close`, `code-block`, `code2`, `corner-down-left`, `external-link`, `heading` (1-6), `highlighter`, `image-plus`, `italic`, `link`, `list`, `list-ordered`, `list-todo`, `moon-star`, `redo2`, `strike`, `subscript`, `sun`, `superscript`, `trash`, `underline`, `undo2`

---

## 🪝 Hooks

| Hook | Descrição |
|---|---|
| `useGeminiLive` | Gerencia conexão WebSocket bidirecional com Gemini 3.1 Flash Live. Áudio, transcrição, tool calls, sessão. |
| `useTiptapEditor` | Wrapper do `useCurrentEditor` + `useEditorState` para gerenciar o editor ativo. |
| `useMenuNavigation` | Navegação por teclado (setas, Tab, Enter, Escape) para menus/paletas. |
| `useComposedRef` | Compõe refs de bibliotecas com refs do usuário. |
| `useCursorVisibility` | Mantém o cursor visível quando oculto atrás da toolbar fixa. |
| `useElementRect` | Monitora bounding rect de elementos com ResizeObserver. |
| `useIsBreakpoint` | Media query CSS para breakpoints responsivos. |
| `useScrolling` | Detecta se o usuário está rolando a página. |
| `useThrottledCallback` | Throttle de callbacks com lodash.throttle. |
| `useUnmount` | Executa callback no unmount do componente. |
| `useWindowSize` | Monitora visual viewport (útil para teclado mobile). |

---

## 🔧 Utils / Lib

### utils/
| Arquivo | Descrição |
|---|---|
| `audio-player.ts` | `AudioStreamPlayer` — toca áudio PCM16 (24kHz) do Gemini Live. Singleton `globalAudioPlayer`. |
| `docx.ts` | `getWordBuffer()`, `compileWordHtml()`, `generateDocxBase64()` — geração de arquivos DOCX. |

### lib/
| Arquivo | Descrição |
|---|---|
| `tiptap-utils.ts` | Utilitários: `cn()`, `isMac()`, `formatShortcutKey()`, `handleImageUpload()`, `sanitizeUrl()`, `findNodeAtPosition()`, etc. |
| `resend.ts` | Inicialização do cliente Resend. |

---

## 🎨 Estilos e Tema

### Sistema de Design (`_variables.scss`)
- Escalas de cinza (alpha e sólida) para light/dark
- Cores de marca (âmbar/dourado)
- Cores semânticas (verde, amarelo, vermelho)
- Sombras, border-radius, transições
- Cores de texto e highlight com variantes dark

### Animações (`_keyframe-animations.scss`)
- `waveformPulse`, `fadeInUp`, `fadeOut`, `zoomIn/Out`
- `slideFromTop/Right/Left/Bottom`
- `pulseGreen`, `spin`, `breathe`

### Orb (Globo Animado)
- Animações CSS: `spaceTimeMesh`, `spaceTimeGlow`, `orbFloat`, `orbPulse`, `orbRotate`, `shimmer`
- Camadas: glow, base, highlight, atmosphere, shadow, noise
- Reagente ao nível de áudio
- Reflexo "puddle" e anel de água

### Tema
- Light/dark mode com detecção de preferência do sistema
- CSS custom properties via `globals.css`
- Botão de toggle no header

---

## 📁 Estrutura de Diretórios

```
extrajus/
├── .env.local                      # Variáveis de ambiente
├── AGENTS.md                       # Instruções para agentes de IA
├── next.config.ts                  # Configuração Next.js
├── package.json                    # Dependências e scripts
├── postcss.config.mjs              # PostCSS + Tailwind
├── tsconfig.json                   # TypeScript config
├── eslint.config.mjs               # ESLint config
│
├── public/                         # Assets estáticos
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Layout raiz (SEO, GA, tema)
│   │   ├── page.tsx                # Home / Landing Page
│   │   ├── globals.css             # Estilos globais + animações
│   │   ├── favicon.ico
│   │   │
│   │   ├── editor/page.tsx         # Editor + Checkout
│   │   ├── simple/page.tsx         # Editor demo isolado
│   │   │
│   │   └── api/
│   │       ├── gemini/route.ts
│   │       ├── gemini/document/route.ts
│   │       ├── gemini/rewrite/route.ts
│   │       ├── config/gemini-live-setup/route.ts
│   │       ├── config/gemini-editor-setup/route.ts
│   │       ├── payment/route.ts
│   │       ├── payment/status/route.ts
│   │       ├── payment/confirm-email/route.ts
│   │       ├── document/docx/route.ts
│   │       ├── auth/google/callback/ (placeholder)
│   │       └── docs/create/ (placeholder)
│   │
│   ├── components/
│   │   ├── footer.tsx
│   │   ├── tiptap-templates/simple/  # SimpleEditor, ThemeToggle
│   │   ├── tiptap-extension/         # Extensões customizadas
│   │   ├── tiptap-node/              # Nodes com estilos SCSS
│   │   ├── tiptap-ui/                # Componentes de UI do editor
│   │   ├── tiptap-ui-primitive/      # Primitivas reutilizáveis
│   │   └── tiptap-icons/             # 38 ícones SVG
│   │
│   ├── hooks/                        # 11 hooks customizados
│   ├── lib/                          # Utilitários e configurações
│   ├── styles/                       # SCSS variables + animações
│   ├── types/                        # Tipagens (html-to-docx)
│   └── utils/                        # Audio player, DOCX generator
│
└── test-ws.mjs
```

---

## 🔑 Variáveis de Ambiente

```env
# GEMINI
GEMINI_API_KEY=
GEMINI_AUDIO_API_KEY=
GEMINI_API_KEY_FALLBACK_2=
NEXT_PUBLIC_GEMINI_API_KEY=
NEXT_PUBLIC_GEMINI_API_KEY_FALLBACK_2=
NEXT_PUBLIC_GEMINI_API_KEY_FALLBACK_3=

# GROQ (Edição de Documento)
GROQ_API_KEY=

# PAGAMENTO (GGPix)
GGPIX_API_KEY=
GGPIX_WEBHOOK_SECRET=

# EMAIL (Resend)
RESEND_API_KEY=

# APP
NEXT_PUBLIC_APP_URL=
```

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 20+
- npm, yarn, pnpm ou bun

### Instalação

```bash
git clone https://github.com/fdutragon/extrajus.git
cd extrajus
npm install
cp .env.example .env.local   # Preencha as chaves necessárias
npm run dev
```

O servidor sobe em [http://localhost:3001](http://localhost:3001).

### Scripts

```bash
npm run dev      # Desenvolvimento (porta 3001)
npm run build    # Build de produção
npm run start    # Inicia build de produção
npm run lint     # Lint do código
```

---

## 📦 Deploy

O projeto é otimizado para deploy na **Vercel**:

```bash
vercel deploy
# Ou conecte o repositório em https://vercel.com/new
```

---

## 📄 Licença

Projeto privado — todos os direitos reservados © 2026 Extrajus.

---

<p align="center">
  Feito com ⚖️ e ☕ por <a href="https://github.com/fdutragon">Felipe Dutra</a>
</p>
