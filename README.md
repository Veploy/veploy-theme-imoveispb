# Veploy Theme Elegance

Tema Veploy customizado para a **Lopes Elegance Piracicaba** (`www.lopeselegance.com.br`).

Estruturalmente espelhado em [`veploy-theme-urban`](../veploy-theme-urban): mesmo layout de pastas, mesma `base.ploy`, mesmos componentes globais. As diferenças por tenant ficam em `src/config/theme-settings.json` e nos defaults de `tailwind.config.js`.

## Como rodar em desenvolvimento

### Pré-requisitos

- **Node.js** 18+
- **npm**

### Setup

```bash
cp .env.example .env
npm install
npm run dev
```

O servidor sobe em `http://localhost:3004` com hot reload.

Para conectar a um workspace real no Supabase, descomente `SUPABASE_RENDERER_TOKEN` e `DEV_WORKSPACE_HOST` no `.env`.

### Scripts disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor + Tailwind watch + hot reload |
| `npm run preview` | Só o servidor, sem watch |
| `npm run deploy` | Deploy global (ploy + assets) |
| `npm run deploy:workspace` | Deploy de overrides do workspace |

---

## Estrutura

Mesma estrutura do `veploy-theme-urban`. Resumo:

```
veploy-theme-elegance/
├── src/
│   ├── layout/base.ploy              # HTML shell, head, fontes, GTM, JSON-LD
│   ├── pages/*.ploy                  # home, properties, property, blog, article, contact, about-us, advertise, careers, favorites, privacy-policy, page, 404
│   ├── sections/                     # uma .ploy por seção
│   │   ├── home/                     # seções específicas da home
│   │   ├── about/                    # seções da página sobre-nos
│   │   └── advertise/                # seções da página anuncie
│   ├── components/
│   │   ├── global/                   # header, footer, pre-footer, whatsapp-float, form/*, ui/*
│   │   └── *.ploy                    # property-card, article-card, property-filters, etc.
│   ├── config/
│   │   ├── config.json               # name, version, settings_schema (form do admin)
│   │   ├── theme-settings.json       # valores extraídos da Lopes Elegance
│   │   ├── schemas.json              # schema editável por seção (admin)
│   │   ├── routes.json               # slugs localizados (somente pt_BR)
│   │   ├── scripts.json              # ordem de carregamento de JS por rota
│   │   └── locales/pt_BR.json        # strings traduzíveis
│   └── assets/
│       ├── css/main.css              # Tailwind + CSS custom
│       ├── js/*.js                   # módulos vanilla
│       └── images/                   # placeholders compartilhados
└── tailwind.config.js                # mesmas screens do urban; cores fallback ajustadas para Lopes Elegance
```

## Marca / Tokens

Definidos em `src/config/theme-settings.json` (CSS vars wired em `layout/base.ploy`):

| Token | Valor |
|-------|-------|
| `colors.primary` | `#181A20` (preto-grafite estrutural) |
| `colors.secondary` | `#000000` (preto) |
| `header.bg_color` | `#000000` |
| `header.button_bg_color` | `#FFEBCD` (creme — CTA "Anuncie") |
| `header.button_hover_bg_color` | `#CC0E3B` (vermelho hover) |
| `footer.bg_color` | `#000000` |
| `buttons.secondary_bg` | `#FFEBCD` |
| Fonte | `Inter` (única no site original) |

Os fallbacks em `tailwind.config.js` usam estes mesmos valores para o caso de o engine não setar as CSS vars em runtime.

## Locales

Apenas `pt_BR`. Para adicionar `en_US` / `es_ES`, copie a estrutura de `veploy-theme-urban` (em `src/config/routes.json` + `src/config/locales/`) e atualize `config.json` `supported_locales`.

## Origem dos dados

Conteúdo extraído via `ploymob-api` da Lopes Elegance (`/wp-json/ploymob/v1/*`) — ver `EXTRACTION_REPORT.md` para detalhes do que foi importado, o que ficou vazio e por quê.
