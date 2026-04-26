# JavaScript do tema

Tudo em **alpine:init**: Alpine (defer) roda depois do parse, o DOM já está pronto. Store + DOM inits no mesmo lugar.

## main.js

- `loadFavorites()`, `initPropertyCardSwipers(root)` – helpers e inits.
- `domInits` – array `[initPropertyCardSwipers, ...]`.
- `alpine:init` → `Alpine.store('favorites', ...)` e, em seguida, `domInits.forEach(fn => fn(root))` com `root = document.querySelector('main') || document`. Cada `fn` em `try/catch`.

Nada em `window`.

## Como adicionar uma init

1. Crie `function initMinhaFeature(root) { ... }`.
2. `domInits.push(initMinhaFeature)`.

## Ordem de execução

1. Swiper e Alpine (CDN) carregam.
2. `main.js` roda e registra o listener `alpine:init`.
3. Alpine inicia (já com DOM pronto) → `alpine:init` → store + `domInits.forEach(...)`.

## Componentes Alpine no tema

- **header** – `x-data="{ mobileOpen: false }"`
- **search-form** – `x-data="{ searchByCode: false }"`
- **hero-carousel** – `x-data="{}"` + `x-init` com Swiper
- **property-card** – `$store.favorites`
