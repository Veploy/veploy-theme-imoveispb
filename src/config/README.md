# Configuração do Tema

Este diretório contém todas as configurações do tema, incluindo internacionalização (i18n).

## 📁 Estrutura

```
config/
├── config.json          # Configurações gerais do tema
├── routes.json          # Rotas para cada locale (não usado em runtime, apenas documentação)
└── locales/             # Traduções (source of truth - usado em produção e desenvolvimento)
    ├── pt_BR.json       # Português (Brasil) - locale padrão
    ├── en_US.json       # Inglês (EUA)
    └── es_ES.json       # Espanhol (Espanha)
```

---

## 📄 config.json

Arquivo principal de configuração do tema.

```json
{
  "name": "Tema Base",
  "version": "0.0.3",
  "description": "Tema base para sites imobiliarios",
  "author": "Veploy",
  "license": "MIT",
  "default_locale": "pt_BR",
  "supported_locales": ["pt_BR", "en_US", "es_ES"],
  "settings": {
    "colors": { ... },
    "typography": { ... },
    "header": { ... },
    "footer": { ... }
  }
}
```

---

## 🗺️ routes.json

**⚠️ Apenas para documentação!** O código TypeScript em `src/services/i18n/locale-config.ts` é o source of truth para rotas.

Este arquivo documenta todas as rotas traduzidas para cada locale:

```json
{
  "pt_BR": {
    "prefix": "",
    "routes": {
      "home": "/",
      "properties": "/imoveis",
      "blog": "/blog",
      "contact": "/contato"
    }
  },
  "en_US": {
    "prefix": "en",
    "routes": {
      "home": "/",
      "properties": "/properties",
      "blog": "/blog",
      "contact": "/contact"
    }
  }
}
```

### Mapeamento de Rotas Equivalentes

| Rota         | PT-BR               | EN-US              | ES-ES                  |
|--------------|---------------------|--------------------|------------------------|
| home         | /                   | /en/               | /es/                   |
| properties   | /imoveis            | /en/properties     | /es/inmuebles          |
| property     | /imovel/:sku        | /en/property/:sku  | /es/inmueble/:sku      |
| blog         | /blog               | /en/blog           | /es/blog               |
| contact      | /contato            | /en/contact        | /es/contacto           |
| favorites    | /favoritos          | /en/favorites      | /es/favoritos          |

---

## 💬 locales/

Diretório com todos os arquivos de tradução. **Este é o source of truth usado tanto em desenvolvimento quanto em produção.**

### Caminho de Carregamento

**Desenvolvimento (Node.js):**
```typescript
// src/services/i18n/translations-loader.ts
const filePath = `themes/base/config/locales/${locale}.json`;
```

**Produção (Cloudflare Workers):**
```typescript
// src/worker.ts
const path = `config/locales/${locale}.json`;
```

### Estrutura de um Arquivo de Tradução

```json
{
  "_meta": {
    "locale": "pt_BR",
    "name": "Português (Brasil)"
  },
  "nav": {
    "sale": "Venda",
    "rent": "Locação",
    "blog": "Blog"
  },
  "property": {
    "bedrooms": "quartos",
    "bathrooms": "banheiros"
  },
  "search": {
    "title": "Buscar imóveis",
    "property_code": "Código do Imóvel"
  },
  "blog_page": {
    "title": "Blog",
    "subtitle": "Dicas e tendências"
  }
}
```

### Usando Traduções nos Templates Liquid

```liquid
<!-- Acesso simples -->
<h1>{{ t.blog_page.title }}</h1>

<!-- Usando filtro 't' (tradução) -->
<label>{{ 'search.property_code' | t }}</label>

<!-- Interpolação com variáveis -->
<p>{{ t.property.bedrooms }} disponíveis</p>
```

---

## 🚀 Como Adicionar um Novo Idioma

### 1. Atualize `config.json`

```json
{
  "supported_locales": ["pt_BR", "en_US", "es_ES", "fr_FR"]
}
```

### 2. Atualize o código TypeScript (Source of Truth)

Edite `src/services/i18n/locale-config.ts`:

```typescript
export const SUPPORTED_LOCALES = ['pt_BR', 'en_US', 'es_ES', 'fr_FR'] as const;

export const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  // ... locales existentes
  fr_FR: {
    code: 'fr_FR',
    prefix: 'fr',
    routes: {
      home: '/',
      properties: '/proprietes',
      contact: '/contact',
      // ... todas as rotas
    }
  }
};
```

### 3. Atualize `routes.json` (documentação)

Adicione a seção `fr_FR` com as mesmas rotas do locale-config.ts.

### 4. Crie o arquivo de traduções

```bash
cp config/locales/pt_BR.json config/locales/fr_FR.json
# Edite config/locales/fr_FR.json com as traduções
```

---

## 📝 Como Adicionar Novas Chaves de Tradução

### 1. Adicione a chave em TODOS os arquivos de locale

```bash
# Edite os 3 arquivos:
config/locales/pt_BR.json
config/locales/en_US.json
config/locales/es_ES.json
```

### 2. Exemplo - Adicionando tradução para página de serviços

```json
// pt_BR.json
{
  "services_page": {
    "title": "Nossos Serviços",
    "subtitle": "Veja o que podemos fazer por você"
  }
}

// en_US.json
{
  "services_page": {
    "title": "Our Services",
    "subtitle": "See what we can do for you"
  }
}

// es_ES.json
{
  "services_page": {
    "title": "Nuestros Servicios",
    "subtitle": "Vea lo que podemos hacer por usted"
  }
}
```

### 3. Use no template

```liquid
<h1>{{ t.services_page.title }}</h1>
<p>{{ t.services_page.subtitle }}</p>
```

---

## ✅ Checklist de Manutenção

Ao atualizar traduções, certifique-se de:

- [ ] Adicionar/atualizar a chave em **TODOS** os arquivos de locale (pt_BR, en_US, es_ES)
- [ ] Testar em desenvolvimento local (`npm run dev`)
- [ ] Incrementar a versão em `config.json`
- [ ] Fazer commit e deploy
- [ ] Testar em produção em todos os idiomas

---

## 🐛 Troubleshooting

### Tradução não aparece em produção

1. **Verifique se a chave existe em TODOS os arquivos de locale**
   ```bash
   grep -r "property_code" config/locales/
   ```

2. **Limpe o cache do Cloudflare**
   - As traduções são cacheadas por 1 hora
   - Force purge no dashboard do Cloudflare

3. **Verifique a versão do tema**
   - Incrementou a versão em `config.json`?
   - Deploy foi feito corretamente?

### Tradução funciona localmente mas não em produção

- **Ambos usam o mesmo caminho agora:** `config/locales/`
- Verifique se o arquivo foi enviado para o R2/S3 corretamente
- Verifique os logs do Workers

---

## 📚 Referências

- **Código TypeScript de rotas:** `src/services/i18n/locale-config.ts`
- **Loader de traduções (dev):** `src/services/i18n/translations-loader.ts`
- **Loader de traduções (prod):** `src/worker.ts` (função `createTranslationsLoader`)
- **Guia do tema:** `/THEME_GUIDE.md`
