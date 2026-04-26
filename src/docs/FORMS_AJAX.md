# Sistema de Formulários AJAX

## Visão Geral

Todos os formulários do tema agora enviam dados via AJAX, permanecendo na mesma página e exibindo feedback visual ao usuário. A segurança é implementada no **engine (backend)**, não no tema.

## Como Usar

### 1. Adicionar o atributo `data-ajax` ao formulário

Para habilitar o envio via AJAX, adicione o atributo `data-ajax` à tag `<form>`:

```liquid
<form action="/api/contact" method="POST" data-ajax>
  <!-- campos do formulário -->
</form>
```

### 2. Formulários GET (busca/filtros)

Para formulários de busca/filtros que usam método GET:

```liquid
<form action="/imoveis" method="GET" data-ajax data-ajax-method="GET">
  <!-- campos do formulário -->
</form>
```

**Nota:** Formulários GET redirecionam o usuário para a URL com os parâmetros de busca.

## Recursos

### Feedback Visual Automático

O sistema exibe automaticamente:

- **Mensagens de sucesso** (verde) quando o formulário é enviado com sucesso
- **Mensagens de erro** (vermelho) quando há problemas no envio
- **Estado de carregamento** com texto "Enviando..." e desabilitação de campos

### Estados do Formulário

Durante o envio:
- Botão de submit mostra "Enviando..."
- Todos os campos são desabilitados
- Classe `.form-loading` é adicionada ao formulário

### Reset Automático

Após sucesso, o formulário é automaticamente limpo (reset).

## Eventos Personalizados

O módulo dispara eventos customizados que podem ser usados para lógica adicional:

```javascript
// Sucesso
form.addEventListener('form:success', function(event) {
  console.log('Formulário enviado com sucesso!', event.detail);
  // event.detail contém a resposta do servidor
});

// Erro
form.addEventListener('form:error', function(event) {
  console.log('Erro no formulário', event.detail);
  // event.detail contém informações do erro
});
```

## Estrutura da Resposta do Backend

O backend deve retornar JSON no seguinte formato:

### Sucesso (HTTP 200)
```json
{
  "message": "Formulário enviado com sucesso!",
  "data": {
    // dados adicionais opcionais
  }
}
```

### Erro (HTTP 4xx ou 5xx)
```json
{
  "message": "Erro ao processar formulário",
  "errors": {
    // erros de validação opcionais
  }
}
```

## Segurança

### Backend (Engine)

A segurança é implementada no **engine/backend** e deve incluir:

1. **CSRF Protection** - Token de proteção contra Cross-Site Request Forgery
2. **Rate Limiting** - Limite de requisições por IP/usuário
3. **Honeypot Fields** - Campos invisíveis para detectar bots
4. **Timestamp Validation** - Validação de tempo mínimo de preenchimento
5. **Input Sanitization** - Limpeza e validação de todos os inputs
6. **Captcha** (opcional) - Para formulários críticos

### Frontend (Tema)

O tema apenas:
- Envia requisições AJAX
- Valida campos HTML5 (required, email, etc.)
- Exibe feedback visual

## Formulários Implementados

Todos os formulários do tema foram atualizados:

1. ✅ **Contato** (`/pages/contact.liquid`)
2. ✅ **Agendar Visita** (`/pages/property.liquid`)
3. ✅ **Trabalhe Conosco** (`/pages/trabalhe-conosco.liquid`)
4. ✅ **Anunciar Imóvel** (`/pages/advertise.liquid`)
5. ✅ **Busca de Imóveis** (`/components/search-form.liquid`)
6. ✅ **Filtros** (`/components/property-filters.liquid`)

## Arquivos

- `/assets/js/form-ajax.js` - Módulo principal de AJAX
- `/layout/base.liquid` - Inclusão do script no layout
- Este documento - Documentação

## Exemplo Completo

```liquid
<form action="/api/contact" method="POST" class="space-y-4" data-ajax>
  <input type="hidden" name="form_type" value="contact">
  
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
      Nome
    </label>
    <input 
      type="text" 
      id="name" 
      name="name" 
      required
      class="w-full border border-gray-200 rounded-lg px-4 py-3 
             focus:ring-2 focus:ring-primary/20 focus:border-primary">
  </div>

  <div>
    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
      Email
    </label>
    <input 
      type="email" 
      id="email" 
      name="email" 
      required
      class="w-full border border-gray-200 rounded-lg px-4 py-3 
             focus:ring-2 focus:ring-primary/20 focus:border-primary">
  </div>

  <button 
    type="submit" 
    class="w-full bg-primary hover:bg-primary/90 text-white 
           px-6 py-3 rounded-lg font-semibold transition-colors">
    Enviar
  </button>
</form>
```

## Compatibilidade

- ✅ Funciona com Alpine.js
- ✅ Funciona sem Alpine.js
- ✅ Compatível com todos os navegadores modernos
- ✅ Degradação graciosa em caso de erro

## Troubleshooting

### O formulário não envia via AJAX

1. Verifique se o atributo `data-ajax` está presente
2. Verifique se o script `form-ajax.js` está carregado
3. Verifique o console do navegador por erros

### Mensagens não aparecem

1. Verifique se o backend está retornando JSON
2. Verifique se o formato da resposta está correto
3. Verifique se há CSS conflitante com `.form-alert`

### Formulário envia mas não reseta

1. Verifique se o backend retorna HTTP 200 para sucesso
2. Verifique se a resposta JSON contém a chave `message`
