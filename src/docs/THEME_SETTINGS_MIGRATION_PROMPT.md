# Migração de site imobiliário para os valores do tema (veploy-theme-pro / custom)

Use este documento ao migrar um site WordPress + Elementor para o tema **veploy-theme-custom da IMOVEISPB url do site: **https://www.imoveispb.com.br/** **.

## O arquivo que você vai produzir

`src/config/settings_data.json`, no formato do modelo Shopify, esse arquivo não deve por hipótese nenhuma ir ao git, confirme antes de tudo que ele esteja no .gitignore:

```json
{ "base_version": "<hash do valor que está no ar>", "current": { "colors": {}, "header": {} } }
```

Tudo que este documento ensina a extrair entra dentro de **`current`**. Os grupos são os
mesmos de sempre (`colors`, `header`, `footer`, `sections`, `navigation`…): o que mudou foi
só o invólucro e para onde o arquivo vai.

> Antes existia um `theme-settings.json` solto, enviado por `upload-theme-settings.mjs` para a
> coluna `workspaces.theme_settings`. Aquele caminho é legado. O conteúdo é o mesmo, hoje
> dentro de `current`.

## Limites que o servidor aplica

512 KB no arquivo, 8 níveis de profundidade, 64 KB por texto, 500 itens por lista. Cada grupo
de `current` precisa ser um objeto. As chaves `__proto__`, `constructor` e `prototype` são
recusadas.

## Como entregar (NÃO edite o arquivo do site à mão)

Numa pasta do tema conectada à imobiliária de destino:

```bash
veploy login                 # conecta esta máquina à imobiliária
veploy pull                  # traz os valores REAIS do site no ar
# edite src/config/settings_data.json: troque o conteúdo de "current"
veploy publish --with-settings
```

O `pull` é obrigatório e vem primeiro: ele traz o `base_version` do que está no ar. Sem isso o
publish é recusado com `THEME_SETTINGS_STALE`, que é a trava que impede você de apagar o que
alguém ajustou pelo painel enquanto você trabalhava. Se alguém mexer no meio do caminho, o
publish recusa e pede um `pull` novo.

O `--with-settings` mostra o que muda chave a chave e pede confirmação.

## Imagens

As imagens do `wp-content` precisam ir para o armazenamento da Veploy antes de tudo; essa
etapa é feita pela equipe da Veploy. O que mudou é só o destino final do JSON.

---

> Schema canônico: [`src/config/schemas.json`](../config/schemas.json) v1.0.8.
> Páginas renderizadas: [`src/pages/*.ploy`](../pages/).

---

## DIFERENÇAS-CHAVE EM RELAÇÃO AO `veploy-theme-base`

Mesmo padrão arquitetural (chaves prefixadas por página, schema-driven), mas o **pro** estende com seções novas e campos extras:

| Mudança | Onde | O que muda |
|---------|------|-----------|
| Hero suporta vídeo | `home/hero-carousel` | Novos campos `title`, `subtitle`, e cada slide aceita `video_desktop`/`video_mobile` além das imagens |
| Eyebrow nas seções | `home/shortcuts-grid`, `home/featured-properties`, `home/highlights`, `home/about-section`, `advertise/*` | Cada uma aceita `eyebrow` + `eyebrow_color` (bullet colorido antes do título) |
| About-section com título 3-partes | `home/about-section` | Trocou `title`/`subtitle`/`description` por `title_before` + `title_highlight` + `title_after`; ganhou segunda imagem `image2`, `cta_url` |
| Featured-properties com texto | `home/featured-properties` | Ganhou `title` + `description` |
| Seção `home/highlights` | nova | Carrossel de imóveis lançamento (até 5 slides com `image`, `title`, `description`, `subtitle`, `cta_text`, `cta_url`) |
| Página Anuncie completa | `advertise/hero`, `advertise/benefits`, `advertise/process`, `advertise/cta` | 4 seções novas (hero com vídeo opcional + benefícios em texto + processo passo-a-passo + CTA do form) |
| `about-us` é page setting | `pages.about-us` | Não é mais `about-us/hero` em `sections` — vai como objeto direto em `sections.about-us` (ou `sections.about` no formato legado) com `bg_color`, `text_color`, `hero_image`, `hero_title`, `hero_description`. **A `about-us.ploy` atual só renderiza o hero**; serviços/diferenciais inline da página antiga **não são consumidos** |
| `careers` é page setting único | `pages.careers` | Não é mais split em `careers/form` + `careers/benefits` — é `sections.careers` com `image` + `benefits.items[]` (com `default[]` no schema fornecendo 4 benefícios prontos com SVG) |
| Logo negativa | `brand_identity.logo_negative` | Versão clara/branca pra header transparente sobre hero escuro |
| Botões mais ricos | `buttons.*` | `primary_bg`, `primary_text`, `primary_hover_bg`, `secondary_bg`, `secondary_text`, `secondary_hover_bg`, `secondary_border` |
| Cores extras no kit | `colors.*` | `accent`, `background`, `text` além de `primary`/`secondary` |

---

## MAPA DE CHAVES DE SEÇÕES (schema atual)

| Chave em `sections` | Origem | Conteúdo |
|---------------------|--------|----------|
| `home/hero-carousel` | home | `title`, `subtitle`, `slides.items[]` (image_desktop/mobile, video_desktop/mobile, redirect_url) |
| `home/shortcuts-grid` | home | `eyebrow`, `eyebrow_color`, `title`, `description`, `shortcuts.items[]` (até 3) |
| `home/highlights` | home | `eyebrow`, `eyebrow_color`, `title`, `description`, `slides.items[]` (até 5) |
| `home/featured-properties` | home | `eyebrow`, `eyebrow_color`, `title`, `description`, `featured_skus.value[]` (limite 6) |
| `home/differentials` | home | `title`, `description`, `icon_color`, `icon_bg_color`, `differentials.items[]` (até 8) |
| `home/about-section` | home | `eyebrow`, `eyebrow_color`, `title_before`, `title_highlight`, `title_after`, `description`, `cta_text`, `cta_url`, `image`, `image2` |
| `home/promo-banners` | home | `banners.items[]` (title, image, url) |
| `home/blog-section` | home | `posts.value[]` + autofill |
| `advertise/hero` | anuncie | `eyebrow`, `heading_before`, `heading_underline`, `description`, `image`, `video`, `cta_whatsapp_text`, `cta_primary_text`, `cta_primary_url` |
| `advertise/benefits` | anuncie | `eyebrow`, `eyebrow_color`, `heading`, `description`, `benefits.items[]` (até 4: title, description — **sem ícones**) |
| `advertise/process` | anuncie | `eyebrow`, `heading`, `description`, `process.items[]` (até 8: title, description) |
| `advertise/cta` | anuncie | `eyebrow`, `heading`, `description` (form é renderizado pelo tema) |
| `about-us` (em `sections`) | sobre-nos | Page setting: `bg_color`, `text_color`, `hero_image`, `hero_title`, `hero_description` |
| `careers` (em `sections`) | trabalhe-conosco | Page setting: `image`, `benefits.items[]` (4 itens: title, description, icon, icon_viewBox) |
| `archive:property` | listing | `default_sort`, `default_view`, `show_properties_count` |
| `single:property` | imóvel | `address_display`, `show_map`, `show_share_buttons` |

> **Ordem de renderização da home** (definida em [`home.ploy`](../pages/home.ploy)): `hero-carousel` → `shortcuts-grid` → `highlights` → `featured-properties` → `differentials` → `about-section` → `promo-banners` → `blog-section`.
> **Ordem de Anuncie** (em [`advertise.ploy`](../pages/advertise.ploy)): `hero` → `benefits` → `process` → `cta`.

---

## MÉTODO PRINCIPAL: API de Export (Veploy)

Sites com plugin `ploymob-api` instalado expõem dados estruturados — use este método primeiro. Header `X-Veploy-Token` obrigatório (constante `WORDPRESS_API_TOKEN` em [`pmob-property.php`](../../../ploymob-property/pmob-property.php) ou env var).

```bash
BASE="https://[URL_DO_SITE]/wp-json/ploymob/v1"
TOKEN="[WORDPRESS_API_TOKEN]"

curl -s "$BASE/website/status"      -H "X-Veploy-Token: $TOKEN" | jq .   # confirmar API ativa
curl -s "$BASE/export/contact"      -H "X-Veploy-Token: $TOKEN" | jq .   # phone/whatsapp/email/address/social
curl -s "$BASE/export/pages"        -H "X-Veploy-Token: $TOKEN" | jq .   # IDs das páginas
curl -s "$BASE/export/pages/{ID}"   -H "X-Veploy-Token: $TOKEN" | jq .   # Elementor JSON da página
curl -s "$BASE/theme"               -H "X-Veploy-Token: $TOKEN" | jq .   # slides ACF + SKUs em destaque
curl -s "$BASE/export/global"       -H "X-Veploy-Token: $TOKEN" | jq .   # cores Kit + header/footer Elementor
curl -s "$BASE/export/menus"        -H "X-Veploy-Token: $TOKEN" | jq .   # todos os menus WP
```

### Passo a passo

**1. Cores globais (Kit Elementor):**

```bash
curl -s "$BASE/export/global" -H "X-Veploy-Token: $TOKEN" | jq '.colors'
```

Mapeamento (mesma lógica do base):
- `id: "primary"` → `colors.primary` (estrutural — texto, fundos escuros)
- `id: "secondary"` → `colors.secondary` + `buttons.secondary_bg` + `header.button_bg_color` (acento — botões CTA)
- `title: "Hover"` → `header.button_hover_bg_color`
- Cor pastel clara (ex: `#FFF0F3`) → `differentials.icon_bg_color`

**2. Footer bg via CSS compilado:**

Footer pode ter múltiplos top-level entries — o real costuma ser o que tem `bg_bg == "classic"` ou `"gradient"` E não tem `css_classes` tipo `whatsapp`/`popup`. Para resolver `var(--e-global-color-X)`:

```bash
# Pegar template ID do footer
FOOTER_ID=$(curl -s "https://[URL]/" | grep -oP 'data-elementor-type="footer"[^>]*data-elementor-id="\K[0-9]+' | head -1)

# Listar candidatos
curl -s "$BASE/export/global" -H "X-Veploy-Token: $TOKEN" | \
  jq '.footer.elementor_data | map({id, elType, bg: .settings.background_color, bg_globals: .settings.__globals__.background_color, bg_bg: .settings.background_background, css_classes: .settings.css_classes})'

# Pegar o background-color real do CSS compilado
curl -s --compressed "https://[URL]/wp-content/uploads/elementor/css/post-$FOOTER_ID.css" | \
  grep -oE "elementor-element-{OUTER_ID}[^{]*\{[^}]*background[^}]*\}"

# Resolver a variável (kit costuma ser ID 11 por convenção, mas confirme)
curl -s --compressed "https://[URL]/wp-content/uploads/elementor/css/post-11.css" | \
  grep -oE -- '--e-global-color-[a-z0-9-]+:[^;}]+' | sort -u
```

> Se o footer for `gradient` (linear-gradient entre duas cores), pegue a cor de topo do gradient como `footer.bg_color` — o tema atual não suporta gradient bg em footer.

**3. Fontes:**

```bash
# Kit Elementor (CSS variables de tipografia)
curl -sf "https://[URL]/wp-content/uploads/elementor/css/post-11.css" | \
  grep -oE -- '--e-global-typography-[a-z0-9-]+-font-family:[^;}]+' | sort -u
```

- Se vier `"Lopes Sans"` ou outra fonte custom não-Google → `fonts.custom_font: true` + `custom_files[]` com os arquivos `.woff2` (upload via painel Veploy).
- Se vier nome de Google Font (Inter, Poppins, etc) → preencher `fonts.body`/`fonts.heading` com o nome e omitir `custom_font`/`custom_files`.

**4. Logo (positivo + negativo) e favicon:**

```bash
curl -s "https://[URL]/" | grep -oP 'src="[^"]+\.(png|svg|jpg)[^"]*"' | grep -i "logo\|marca" | head -10
curl -s "https://[URL]/" | grep -oP 'href="[^"]+favicon[^"]*"' | head -5
```

- **Logo positivo** (`brand_identity.logo`): versão escura/colorida pra fundo claro
- **Logo negativo** (`brand_identity.logo_negative`): versão branca pra header transparente sobre hero escuro
- **Favicon**: prefira a versão `192x192`

**5. Mapear containers da home pelo widget signature:**

```bash
HOME_ID=$(curl -s "$BASE/export/pages" -H "X-Veploy-Token: $TOKEN" | jq '.[] | select(.is_front_page == true) | .id')
curl -s "$BASE/export/pages/$HOME_ID" -H "X-Veploy-Token: $TOKEN" | \
  jq '.elementor_data[] | {id, elType, widgets: ([.. | objects | select(.widgetType?) | .widgetType] | unique | sort)}'
```

> **Nunca hardcode IDs** — eles variam por site. Identifique pelo conjunto de widgets, depois extraia pelo ID descoberto.

#### Regra de identificação por assinatura de widgets

| Widgets presentes | Mapeia para |
|-------------------|-------------|
| `wp-widget-ploymob_slideshow_widget` | `home/hero-carousel` (mas use `/theme` pra obter os slides) |
| `heading` + `wp-widget-property_filters_widget` | Hero alternativo (texto + barra de busca) — `home/hero-carousel.title/subtitle` |
| `heading` + `text-editor` (sem image/icon-box) | `home/shortcuts-grid` (variante regiões com bg em sub-containers) |
| `button` + `heading` + `image` + `text-editor` (sem icon-box) | `home/shortcuts-grid` (cards com banner) ou banner único — heurística: se `headings[0]` falar "explore/regiões/imóveis" é shortcuts; se for banner único de parceiro/financiamento, **ignorar** |
| `image` apenas | `home/promo-banners` |
| `heading` + `slides` (widget Elementor "slides") | `home/highlights` — extrair `settings.slides[]` do widget |
| `button` + `heading` + `icon-box` + `text-editor` | `home/differentials` (+ `home/about-section` no mesmo container, se houver `<button>` "Conheça nossa história" depois dos icon-boxes) |
| `button` + `heading` + `image` + `text-editor` (com 1-2 imagens grandes) | `home/about-section` (variante com `image` + `image2`) |
| `heading` + `loop-grid` + `text-editor` | `home/featured-properties` — extrair `eyebrow`/`title`/`description` do container; SKUs vêm de `/theme` |
| `template` | Footer/header embutido — **ignorar** |

> **Sites Lopes recentes** usam `icon-list` (com 1 item de bullet "•") como **eyebrow** da seção. Detecte isso e use `settings.icon_list[0].text` como `eyebrow`.

**6. Extrair conteúdo de cada seção** (após identificar o ID do container):

```bash
HOME_ID={ID}
CID={ID_DO_CONTAINER}

curl -s "$BASE/export/pages/$HOME_ID" -H "X-Veploy-Token: $TOKEN" | \
  jq --arg cid "$CID" '
  .elementor_data[] | select(.id == $cid) | {
    headings:    [.. | objects | select(.widgetType? == "heading") | .settings.title],
    texts:       [.. | objects | select(.widgetType? == "text-editor") | .settings.editor],
    buttons:     [.. | objects | select(.widgetType? == "button") | {text: .settings.text, link: .settings.link.url}],
    images:      [.. | objects | select(.widgetType? == "image") | .settings.image.url],
    bg_images:   [.. | objects | select(.settings?.background_image?.url? and (.settings.background_image.url | length > 0)) | .settings.background_image.url],
    icon_boxes:  [.. | objects | select(.widgetType? == "icon-box") | {title: .settings.title_text, description: .settings.description_text, icon_fa: .settings.selected_icon.value}],
    icon_lists:  [.. | objects | select(.widgetType? == "icon-list") | .settings.icon_list | map({text, link: .link.url, icon: .selected_icon.value})],
    slides_widget: [.. | objects | select(.widgetType? == "slides") | .settings.slides]
  }'
```

---

## EXTRAÇÃO POR SEÇÃO

### `home/hero-carousel`

- **Slides**: vêm de `/theme` → `front_page.slides[]`. Cada slide tem `desktop_media`→`image_desktop`, `mobile_media`→`image_mobile`, `link`→`redirect_url`.
- **Vídeo opcional**: se o site tem hero em vídeo (não em slides ACF), use `video_desktop`/`video_mobile` em um slide único — extraia a URL do MP4 do HTML do tema ou do CDN do cliente.
- **Title/subtitle**: pegue do `<h1>` do container do hero (signatures `heading + property_filters` ou `heading + image + button`). O texto do `<h1>` vai pra `title`, e qualquer subtítulo abaixo pra `subtitle`.

### `home/shortcuts-grid` (até 3 cards)

- `eyebrow`: `icon_list[0].text` se existir, senão default "MAIS BUSCADOS"
- `title`: `headings[0]` (sem `<span>`)
- `description`: `texts[0]` (HTML stripped)
- `shortcuts.items[]`: combina `headings[1:]` (títulos das regiões/tipos) com `bg_images[]` (background dos sub-containers)
- `url`: deduzir como `/imoveis/comprar/{slug}` ou `/imoveis/tipo/{slug}` conforme contexto (regiões → comprar, tipos → tipo)

### `home/highlights` (carrossel de lançamentos)

> **Esta é a seção exclusiva do pro** — não existe no base.

Identifique pelo widget `slides` (não confundir com `wp-widget-ploymob_slideshow_widget`). O widget Elementor "slides" tem `settings.slides[]` com:
- `heading` → `title`
- `description` → `description` (o tema renderiza HTML)
- `button_text` → `cta_text`
- `__dynamic__.link` ou `link.url` → `cta_url` (pode ser ACF tag — resolver manualmente ou apontar pro imóvel)
- `background_image.url` → `image`
- `subtitle` → não vem do widget; preencha com a marca (ex: "Lopes Class") ou deixe vazio

`eyebrow` da seção: `icon_list[0].text` (default "LANÇAMENTOS"), `title`/`description` dos `headings[0]`/`texts[0]` do container.

### `home/featured-properties`

- `eyebrow`: `icon_list[0].text` (ex: "Em destaque")
- `title`: `headings[0]`
- `description`: `texts[0]`
- `featured_skus.value[]`: vem de `/theme` → `highlighted_properties.sku[]`
- `featured_skus.autofill_*`: defaults sensatos (`enabled: true`, `source: "price_above"`, `price_threshold: 700000-1000000` conforme padrão regional)

### `home/differentials`

Container com `icon-box` widgets. Mapeie cada icon-box pra `{title, description, icon}`. **Se o site não tem icon-boxes na home**, omita a seção inteira do `settings_data.json` (o tema tem fallback que esconde a seção sem dados).

Para o `icon` (objeto `icon_picker`): no schema do pro, é `icon_picker` — formato esperado é objeto `{svg, viewBox}` ou string com SVG path. Os ícones FA do Elementor (`selected_icon.value` tipo `"fas fa-building"`) precisam ser convertidos pra SVG path:

1. Acesse [fontawesome.com/icons](https://fontawesome.com/icons), busque pelo nome
2. Copie o `d` do `<path>` e o `viewBox` do `<svg>`
3. Use o formato:
```json
{ "title": "...", "description": "...", "icon": "M256 8C119...", "icon_viewBox": "0 0 512 512" }
```

### `home/about-section`

Container costuma ter:
- `eyebrow`: `icon_list[0].text` (ex: "SOBRE NÓS")
- Título do `<h1>`/`<h2>` quebra em 3 partes — o Elementor usa `<span>` pro destaque:
  - `title_before`: texto antes do `<span>`
  - `title_highlight`: conteúdo dentro do `<span>`
  - `title_after`: texto depois do `<span>`
- `description`: `texts[0]` (HTML stripped)
- `cta_text`: `buttons[0].text`
- `cta_url`: `buttons[0].link` (deixe vazio se for placeholder `#` ou inválido — o tema tem default)
- `image`: primeira `images[]` do container (widget `image`)
- `image2`: segunda `images[]` do container (algumas variações usam composição com 2 fotos)

> **Heurística do `<span>`**: `<h1>Conectamos você aos <span>melhores imóveis</span> no litoral norte</h1>` quebra em `title_before: "Conectamos você aos "`, `title_highlight: "melhores imóveis"`, `title_after: " no litoral norte"`. Preserve espaços ao redor.

### `home/promo-banners`

Container com apenas widgets `image`. Cada `image.url` vira um banner. Omita a seção se o site não tem banners promocionais separados.

### `home/blog-section`

Sempre autofill recent (limite 3) — não precisa extrair conteúdo do WP. Default:
```json
"home/blog-section": {
  "posts": { "value": [], "autofill_enabled": true, "autofill_source": "recent", "limit": 3 }
}
```

### `advertise/hero`

Página `/anuncie-seu-imovel/` (id descoberto em `/export/pages`). Container do hero:
- `eyebrow`: `icon_list[0].text` (default "ANUNCIE CONOSCO")
- Título quebra em 2: `heading_before` (sem destaque) + `heading_underline` (parte sublinhada — o Elementor usa `<span>` pra isso)
- `description`: `texts[0]`
- `image`: `bg_images[0]` (background do sub-container do hero, **não** widget image)
- `video`: opcional — só se houver MP4 no hero
- `cta_whatsapp_text`: `buttons[]` cujo link contenha `wa.me`
- `cta_primary_text`: `buttons[]` que aponta pro form (link `#` ou âncora interna)
- `cta_primary_url`: o link do botão primário (default `#anunciar-form`)

### `advertise/benefits`

Container com `icon-box` widgets (ou apenas `heading`/`text-editor` agrupados). Mapeie cada par título+descrição pra `{title, description}`. **Sem ícones** nesta seção.

### `advertise/process`

Mesmo padrão do `benefits`, mas pra etapas do processo. Cada `icon-box` ou par heading/text vira um `{title, description}`. Limite 8.

### `advertise/cta`

Container final, antes do form. Pegue `eyebrow`, `heading`, `description`. O form em si é renderizado pelo tema com `{% form 'contact' %}`.

### `about-us` (page setting)

> **`sections.about-us`** ou **`sections.about`** (ambas as chaves funcionam por compat). A `about-us.ploy` atual **só renderiza o hero** — não consome serviços inline da página WP.

- `hero_title`: primeiro `heading` da página (sem `<span>`)
- `hero_description`: primeiro `text-editor` da página (HTML stripped)
- `hero_image`: primeira `images[]` ou `bg_images[]`
- `bg_color`: default `#ffffff` (ou o que o site usar visualmente)
- `text_color`: default `#181A20` (deriva de `colors.primary`)

### `careers` (page setting)

> **`sections.careers`** unificada — não há mais split em `careers/form` + `careers/benefits`.

- `image`: `bg_images[0]` do container que contém o `form` widget
- `benefits.items[]`: 4 icon-boxes (o schema fornece 4 defaults com SVG paths prontos em [`schemas.json`](../config/schemas.json) → `pages.careers.benefits.default[]`).

Se os títulos do Elementor coincidirem com os defaults do schema, copie o SVG path do schema. Se forem títulos diferentes (caso comum), mapeie cada `icon_fa` pro SVG correspondente do FontAwesome:

```bash
# Extrair SVGs inline do HTML renderizado
curl -s "https://[URL]/trabalhe-conosco/" | python3 -c "
import sys, re
html = sys.stdin.read()
titles = ['Capacitação contínua', 'Ferramentas e tecnologia', '...']
for title in titles:
    idx = html.find(title)
    if idx > 0:
        chunk = html[max(0,idx-3000):idx+200]
        paths = re.findall(r'd=\"([^\"]{20,})\"', chunk)
        vbs   = re.findall(r'viewBox=\"([^\"]+)\"', chunk)
        if paths and vbs:
            print(f'{title}\n  viewBox: {vbs[-1]}\n  path: {paths[-1]}')
"
```

---

## NAVEGAÇÃO

### Regra arquitetural

Toda URL em `navigation.{main_menu,mobile_menu,side_menu}` **DEVE** usar template literals `{{routes.X}}` — nunca hardcode `/imoveis/comprar`, `/contato`, etc. Garante:
- Trocas de slug sem editar tenants
- Consistência entre tenants do mesmo theme
- Resolução correta com locale prefix

Labels seguem padrão Veploy (Comprar/Alugar, não Venda/Locação).

### Mapeamento WP → templates

| URL no WP | Template Veploy | Label padrão |
|-----------|-----------------|--------------|
| `/imoveis/venda`, `/imoveis/?operation=sale` | `{{routes.properties}}{{routes.operation_sale}}` | `Comprar` |
| `/imoveis/locacao`, `/imoveis?operation=rent` | `{{routes.properties}}{{routes.operation_rent}}` | `Alugar` |
| `/imoveis/lancamentos` | `{{routes.properties}}/lancamentos` | `Lançamentos` |
| `/imoveis/exclusivos`, qualquer "imóveis exclusivos" | `/imoveis/exclusivos` | `Imóveis Exclusivos` |
| `/contato` | `{{routes.contact}}` | `Contato` |
| `/sobre-nos`, `/sobre` | `{{routes.about-us}}` | `Sobre nós` |
| `/blog`, `/noticias` | `{{routes.blog}}` | `Blog` |
| `/anuncie-seu-imovel` | `{{routes.advertise}}` | `Anuncie seu imóvel` |
| `/trabalhe-conosco`, `/carreiras` | `{{routes.careers}}` | `Trabalhe conosco` |
| `/favoritos` | `{{routes.favorites}}` | `Favoritos` |
| `/politica-de-privacidade` | `{{routes.privacy-policy}}` | `Política de Privacidade` |

### `side_menu` (lado direito do header desktop)

Quando configurado, **substitui** o default (Favoritos + CTA Anuncie). Itens suportam `icon` (`"heart"`/`"user"`), `dynamic_count: "favorites"`, `variant: "primary"|"secondary"` (botão sólido com cor do tema), `children[]` (dropdown).

```json
"side_menu": [
  { "url": "{{routes.favorites}}", "label": "Favoritos", "icon": "heart", "dynamic_count": "favorites" },
  { "url": "{{routes.advertise}}", "label": "Anuncie seu imóvel", "variant": "primary" }
]
```

> **Atenção:** se incluir `Anuncie` como `variant: "primary"` no `side_menu`, **remova** o mesmo item do `main_menu` pra evitar duplicação. `side_menu` aparece **apenas no desktop** — repita os relevantes em `mobile_menu`.

### Submenus (dropdown, 1 nível)

```json
{ "url": "", "label": "Área do cliente", "children": [
  { "url": "https://...", "label": "Área do proprietário", "target": "_blank" }
]}
```

Detecção via API: items com `parent != 0` são filhos.

---

## NOTAS IMPORTANTES

### Imagens com nomes acentuados (NFD encoding)

Sempre validar com `curl -sI "URL" | head -1`. Se 404 com char literal precomposto (`é`, `ç`, `ã`), re-encode pra NFD:

| Char | NFD encoded |
|------|-------------|
| `é` | `e%CC%81` |
| `ó` | `o%CC%81` |
| `á` | `a%CC%81` |
| `ã` | `a%CC%83` |
| `ç` | `c%CC%A7` |
| `í` | `i%CC%81` |

Conversão automática:
```bash
python3 -c "
import sys, unicodedata, urllib.parse
url = sys.argv[1]
nfd = unicodedata.normalize('NFD', url)
parts = nfd.rsplit('/', 1)
parts[-1] = urllib.parse.quote(parts[-1], safe='-._~')
print('/'.join(parts))
" "URL_AQUI"
```

Aplicar em: `shortcuts-grid` images, `home/about-section.image`/`image2`, `about-us.hero_image`, `careers.image`, `advertise/hero.image`.

### Imagens — caminhos

- `/wp-content/uploads/` do WP original → URL **absoluta** com domínio WP (depois da migração re-hosp na CDN)
- `assets.veploycdn.com` → URL absoluta completa

### E-mail Cloudflare protegido

Se vier `data-cfemail="..."`, decodificar via XOR com primeiro byte — ou deixar em branco e preencher manualmente.

### Fallback: scraping HTML

Sem `ploymob-api`, use scraping com user-agent de browser:
```bash
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" "https://[URL]/"
```

Dados ficam em `data-settings` JSON dos elementos Elementor, em `href="tel:..."`, `href="mailto:..."`, etc.

---

## JSON TEMPLATE

```json
{
  "fonts": {
    "body": "Inter",
    "heading": "Inter",
    "header": "",
    "buttons": "",
    "custom_font": false
  },
  "colors": {
    "primary": "",
    "secondary": ""
  },
  "header": {
    "bg_color": "#ffffff",
    "text_color": "#181A20",
    "button_bg_color": "",
    "button_text_color": "#ffffff",
    "button_hover_bg_color": ""
  },
  "footer": {
    "bg_color": "#ffffff",
    "text_color": "#181A20"
  },
  "buttons": {
    "primary_bg": "",
    "primary_text": "#ffffff",
    "primary_hover_bg": "",
    "secondary_bg": "",
    "secondary_text": "#ffffff",
    "secondary_hover_bg": "",
    "secondary_border": ""
  },
  "brand_identity": {
    "logo": "",
    "logo_negative": "",
    "favicon": ""
  },
  "contact": {
    "phone": "",
    "whatsapp": "",
    "whatsapp_link": "",
    "email": "",
    "address": "",
    "hours": "",
    "creci": "",
    "instagram": "",
    "facebook": "",
    "tiktok": "",
    "linkedin": "",
    "pinterest": "",
    "youtube": ""
  },
  "features": {
    "header_sticky": true,
    "header_show_phone": false,
    "footer_show_social": true,
    "whatsapp_show_float": true
  },
  "listings": {
    "default_sort": "recent",
    "show_properties_count": true
  },
  "navigation": {
    "main_menu": [
      { "url": "{{routes.properties}}/lancamentos", "label": "Lançamentos" },
      { "url": "{{routes.properties}}{{routes.operation_sale}}", "label": "Comprar" },
      { "url": "{{routes.properties}}{{routes.operation_rent}}", "label": "Alugar" },
      { "url": "{{routes.contact}}", "label": "Contato" }
    ],
    "side_menu": [],
    "mobile_menu": [
      { "url": "{{routes.properties}}{{routes.operation_sale}}", "label": "Comprar" },
      { "url": "{{routes.properties}}{{routes.operation_rent}}", "label": "Alugar" },
      { "url": "{{routes.properties}}/lancamentos", "label": "Lançamentos" },
      { "url": "{{routes.favorites}}", "label": "Favoritos" },
      { "url": "{{routes.about-us}}", "label": "Sobre nós" },
      { "url": "{{routes.advertise}}", "label": "Anuncie seu imóvel" },
      { "url": "{{routes.contact}}", "label": "Contato" }
    ]
  },
  "sections": {
    "home/hero-carousel": {
      "title": "",
      "subtitle": "",
      "slides": {
        "items": [
          { "image_desktop": "", "image_mobile": "", "video_desktop": "", "video_mobile": "", "redirect_url": "" }
        ]
      }
    },
    "home/shortcuts-grid": {
      "eyebrow": "MAIS BUSCADOS",
      "title": "",
      "description": "",
      "shortcuts": {
        "items": [
          { "title": "", "image": "", "url": "" },
          { "title": "", "image": "", "url": "" },
          { "title": "", "image": "", "url": "" }
        ]
      }
    },
    "home/highlights": {
      "eyebrow": "LANÇAMENTOS",
      "title": "",
      "description": "",
      "slides": {
        "items": [
          { "image": "", "title": "", "description": "", "subtitle": "", "cta_text": "Mais informações", "cta_url": "" }
        ]
      }
    },
    "home/featured-properties": {
      "eyebrow": "",
      "title": "",
      "description": "",
      "featured_skus": {
        "value": [],
        "autofill_enabled": true,
        "autofill_source": "price_above",
        "price_threshold": 1000000
      }
    },
    "home/about-section": {
      "eyebrow": "SOBRE NÓS",
      "title_before": "",
      "title_highlight": "",
      "title_after": "",
      "description": "",
      "cta_text": "Conheça nossa história",
      "cta_url": "",
      "image": "",
      "image2": ""
    },
    "home/blog-section": {
      "posts": { "value": [], "autofill_enabled": true, "autofill_source": "recent", "limit": 3 }
    },
    "advertise/hero": {
      "eyebrow": "ANUNCIE CONOSCO",
      "heading_before": "",
      "heading_underline": "",
      "description": "",
      "image": "",
      "video": "",
      "cta_whatsapp_text": "Chamar no WhatsApp",
      "cta_primary_text": "Anunciar agora",
      "cta_primary_url": "#anunciar-form"
    },
    "advertise/benefits": {
      "eyebrow": "BENEFÍCIOS",
      "heading": "",
      "description": "",
      "benefits": {
        "items": [
          { "title": "", "description": "" },
          { "title": "", "description": "" },
          { "title": "", "description": "" },
          { "title": "", "description": "" }
        ]
      }
    },
    "advertise/process": {
      "eyebrow": "COMO FUNCIONA",
      "heading": "",
      "description": "",
      "process": {
        "items": [
          { "title": "", "description": "" }
        ]
      }
    },
    "advertise/cta": {
      "eyebrow": "COMECE AGORA",
      "heading": "",
      "description": ""
    },
    "about-us": {
      "bg_color": "#ffffff",
      "text_color": "#181A20",
      "hero_image": "",
      "hero_title": "",
      "hero_description": ""
    },
    "careers": {
      "image": "",
      "benefits": {
        "items": [
          { "title": "", "description": "", "icon": "", "icon_viewBox": "0 0 512 512" },
          { "title": "", "description": "", "icon": "", "icon_viewBox": "0 0 512 512" },
          { "title": "", "description": "", "icon": "", "icon_viewBox": "0 0 512 512" },
          { "title": "", "description": "", "icon": "", "icon_viewBox": "0 0 512 512" }
        ]
      }
    },
    "archive:property": {
      "default_sort": "recent",
      "default_view": "grid",
      "show_properties_count": true
    },
    "single:property": {
      "address_display": "hide_number",
      "show_map": true,
      "show_share_buttons": true
    }
  }
}
```

---

## PROMPT PARA COLAR

```
Preciso montar o "current" do settings_data.json para [URL_DO_SITE] no veploy-theme-pro.

TOKEN: [WORDPRESS_API_TOKEN]
BASE: https://[URL_DO_SITE]/wp-json/ploymob/v1

Execute em paralelo:

curl -s "$BASE/website/status"  -H "X-Veploy-Token: $TOKEN" | jq .
curl -s "$BASE/export/contact"  -H "X-Veploy-Token: $TOKEN" | jq .
curl -s "$BASE/export/global"   -H "X-Veploy-Token: $TOKEN" | jq '{colors: .colors, header_top: (.header.elementor_data | map({id, bg: .settings.background_color})), footer_top: (.footer.elementor_data | map({id, bg_globals: .settings.__globals__.background_color, bg_bg: .settings.background_background, css_classes: .settings.css_classes}))}'
curl -s "$BASE/export/menus"    -H "X-Veploy-Token: $TOKEN" | jq '[.[] | {name, slug, items: [.items[] | {label, url, parent}]}]'
curl -s "$BASE/theme"           -H "X-Veploy-Token: $TOKEN" | jq .
curl -s "$BASE/export/pages"    -H "X-Veploy-Token: $TOKEN" | jq '.[] | {id, title, slug, has_elementor, is_front_page}'
curl -s "https://[URL_DO_SITE]/" | grep -oP 'src="[^"]+\.(png|svg)[^"]*"' | grep -i logo | head -10
curl -s "https://[URL_DO_SITE]/" | grep -oP 'href="[^"]+favicon[^"]*"' | head -5
curl -sf "https://[URL_DO_SITE]/wp-content/uploads/elementor/css/post-11.css" | grep -oE -- '--e-global-typography-[a-z0-9-]+-font-family:[^;}]+' | sort -u

Depois, mapeie cada página relevante:

curl -s "$BASE/export/pages/{HOME_ID}"     -H "X-Veploy-Token: $TOKEN" | jq '.elementor_data[] | {id, widgets: ([.. | objects | select(.widgetType?) | .widgetType] | unique | sort)}'
curl -s "$BASE/export/pages/{SOBRE_ID}"    -H "X-Veploy-Token: $TOKEN" | jq '[.. | objects | select(.widgetType?) | {widget: .widgetType, title: .settings.title?, image: .settings.image.url?, editor: .settings.editor?}]'
curl -s "$BASE/export/pages/{ANUNCIE_ID}"  -H "X-Veploy-Token: $TOKEN" | jq '...'
curl -s "$BASE/export/pages/{CAREERS_ID}"  -H "X-Veploy-Token: $TOKEN" | jq '...'

Use as regras de identificação por widget signature da seção "EXTRAÇÃO POR SEÇÃO" deste documento.

Não invente dados — deixe "" para o que não encontrar.
```

---

## CHECKLIST FINAL

Antes de salvar `settings_data.json`, valide:

- [ ] `colors.primary`/`secondary` vêm do `/export/global` (não do grep HTML)
- [ ] `footer.bg_color` foi resolvido via CSS compilado (não confiar em `__globals__` de sub-container)
- [ ] **Validar visualmente no browser** — overrides de theme/plugin podem mascarar o JSON. Se o usuário corrigir uma cor, ele tem razão
- [ ] Todas as URLs de imagem retornaram 200 (`curl -o /dev/null -s -w "%{http_code}"`)
- [ ] Acentos em URLs foram NFD-encoded onde necessário
- [ ] `navigation` usa `{{routes.X}}` em todos os items
- [ ] Operações WP "Venda"/"Locação" foram normalizadas pra "Comprar"/"Alugar"
- [ ] Seções sem dados foram **omitidas** do JSON (não preencher com strings vazias se a seção não existe no site)
- [ ] `home/about-section`: `<span>` foi quebrado corretamente em `title_before`/`title_highlight`/`title_after` preservando espaços
- [ ] `careers.benefits.items[]` tem 4 itens com SVG path válido em `icon` e `icon_viewBox`
