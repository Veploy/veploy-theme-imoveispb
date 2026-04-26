# Implementação de Formulários - Estilo Shopify

## Visão Geral

Os formulários do tema enviam dados para rotas limpas (sem `/api`) que devem ser interceptadas pelo **engine (proxy)**. O engine é responsável por:
- Processar os formulários
- Aplicar segurança (rate limiting, CSRF, honeypot, timestamp)
- Retornar JSON (para AJAX) ou redirecionar (para form normal)

## Rotas que o Engine Deve Interceptar

### 1. POST `/contact`
**Formulário de contato geral**

**Campos esperados:**
- `form_type`: "contact"
- `name`: string (min: 2 caracteres)
- `email`: string (email válido)
- `phone`: string (min: 10 caracteres)
- `subject`: string (opcional)
- `message`: string (min: 10 caracteres)

**Resposta AJAX (JSON):**
```json
{
  "message": "Mensagem enviada com sucesso! Entraremos em contato em breve."
}
```

**Resposta Form Normal:**
Redireciona para `/contact?success=true`

---

### 2. POST `/schedule-visit`
**Agendamento de visita a imóvel**

**Campos esperados:**
- `form_type`: "schedule-visit"
- `property_id`: string (opcional)
- `property_sku`: string (opcional)
- `name`: string (min: 2 caracteres)
- `email`: string (email válido)
- `phone`: string (min: 10 caracteres)
- `preferred_date`: string (data)
- `message`: string (opcional)

**Resposta AJAX (JSON):**
```json
{
  "message": "Solicitação de visita enviada! Entraremos em contato para confirmar."
}
```

**Resposta Form Normal:**
Redireciona para a página do imóvel ou `/schedule-visit?success=true`

---

### 3. POST `/work-with-us`
**Formulário trabalhe conosco**

**Campos esperados:**
- `form_type`: "work-with-us"
- `name`: string (min: 2 caracteres)
- `email`: string (email válido)
- `phone`: string (min: 10 caracteres)
- `message`: string (opcional)

**Resposta AJAX (JSON):**
```json
{
  "message": "Currículo enviado com sucesso! Entraremos em contato em breve."
}
```

**Resposta Form Normal:**
Redireciona para `/work-with-us?success=true`

---

### 4. POST `/advertise`
**Formulário anunciar imóvel**

**Campos esperados:**
- `form_type`: "advertise"
- `name`: string (min: 2 caracteres)
- `email`: string (email válido)
- `phone`: string (min: 10 caracteres)
- `property_type`: string (opcional)
- `intent`: enum ("vender", "alugar", "vender_alugar")

**Resposta AJAX (JSON):**
```json
{
  "message": "Solicitação enviada! Entraremos em contato para avaliar seu imóvel."
}
```

**Resposta Form Normal:**
Redireciona para `/advertise?success=true`

---

## Segurança do Engine

### 1. Detecção de AJAX
```javascript
const isAjax = request.headers['x-requested-with'] === 'XMLHttpRequest';
```

### 2. Rate Limiting
- Limite: 5 requisições por minuto por IP
- Resposta HTTP 429 se exceder

### 3. Honeypot Field
- Campo: `_hp_field`
- Deve estar vazio
- Se preenchido: rejeitar como bot

```javascript
if (body._hp_field && body._hp_field !== '') {
  return reject("Validação de segurança falhou");
}
```

### 4. Timestamp Validation
- Campo: `_timestamp`
- Formulário deve estar aberto por pelo menos 2 segundos
- Máximo de 1 hora (proteção contra replay)

```javascript
const timestamp = parseInt(body._timestamp, 10);
const now = Date.now();
const timeDiff = now - timestamp;

if (timeDiff < 2000) {
  return reject("Formulário enviado muito rápido");
}

if (timeDiff > 3600000) {
  return reject("Formulário expirado");
}
```

### 5. Sanitização
Remover HTML tags de todos os campos string:
```javascript
sanitizeHtml(value, {
  allowedTags: [],
  allowedAttributes: {}
});
```

### 6. Campos de Segurança
O JavaScript do tema adiciona automaticamente:
- `_csrf`: Token de sessão (opcional, por enquanto)
- `_timestamp`: Timestamp de quando o form foi carregado
- `_hp_field`: Campo honeypot invisível

**Estes campos devem ser removidos do body antes de processar:**
```javascript
delete body._hp_field;
delete body._timestamp;
delete body._csrf;
```

---

## Fluxo de Processamento

```
1. Request chega → POST /contact
2. Engine verifica segurança:
   ├─ Rate limit OK?
   ├─ Honeypot vazio?
   ├─ Timestamp válido?
   └─ Sanitiza campos
3. Engine valida dados:
   └─ Zod/Joi validation
4. Engine processa:
   ├─ Salva no banco (form_submissions)
   ├─ Cria lead no CRM
   ├─ Envia email
   └─ Dispara webhooks
5. Engine responde:
   ├─ Se AJAX: JSON com message
   └─ Se Form: Redirect com query param
```

---

## Tabela de Banco de Dados

O engine deve criar a tabela `form_submissions`:

```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  form_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  data JSONB, -- Campos adicionais específicos do form
  ip_address VARCHAR(45),
  user_agent TEXT,
  source_url TEXT,
  status VARCHAR(20) DEFAULT 'new', -- new, contacted, completed, spam
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_workspace ON form_submissions(workspace_id);
CREATE INDEX idx_form_submissions_type ON form_submissions(form_type);
CREATE INDEX idx_form_submissions_created ON form_submissions(created_at);
```

---

## Exemplo de Implementação (Pseudocódigo)

```typescript
// Engine intercepta POST /contact
async function handleFormSubmission(request, reply) {
  const isAjax = request.headers['x-requested-with'] === 'XMLHttpRequest';
  
  try {
    // 1. Segurança
    await validateSecurity(request.body, request.ip);
    
    // 2. Validação
    const data = validateFormData(request.body);
    
    // 3. Processamento
    const result = await processForm(data, request.workspace);
    
    // 4. Resposta
    if (isAjax) {
      return reply.json({
        message: result.message
      });
    } else {
      return reply.redirect(`${request.url}?success=true`);
    }
  } catch (error) {
    if (isAjax) {
      return reply.status(400).json({
        message: error.message
      });
    } else {
      return reply.redirect(`${request.url}?error=${encodeURIComponent(error.message)}`);
    }
  }
}
```

---

## Progressive Enhancement

O sistema funciona sem JavaScript:
1. **Com JS**: Envia via AJAX, mostra mensagem inline
2. **Sem JS**: Envia form normal, redireciona com query param

**No tema, para mostrar mensagens sem JS:**

```liquid
{% if request.query.success %}
<div class="alert alert-success">
  Formulário enviado com sucesso!
</div>
{% endif %}

{% if request.query.error %}
<div class="alert alert-error">
  {{ request.query.error }}
</div>
{% endif %}
```

---

## Checklist de Implementação

- [ ] Criar tabela `form_submissions`
- [ ] Implementar rate limiting (5 req/min por IP)
- [ ] Implementar validação honeypot
- [ ] Implementar validação timestamp
- [ ] Implementar sanitização de inputs
- [ ] Detectar requisições AJAX
- [ ] Retornar JSON para AJAX
- [ ] Redirecionar para form normal
- [ ] Salvar submissions no banco
- [ ] Integrar com CRM (criar leads)
- [ ] Enviar emails de notificação
- [ ] Logs de segurança (bots detectados)

---

## Mensagens de Erro Padrão

**Português:**
- "Validação de segurança falhou."
- "Por favor, preencha o formulário corretamente."
- "Formulário expirado. Por favor, recarregue a página."
- "Muitas tentativas. Por favor, aguarde um momento."
- "Erro ao processar formulário. Tente novamente."

**Inglês:**
- "Security validation failed."
- "Please fill out the form correctly."
- "Form expired. Please reload the page."
- "Too many attempts. Please wait a moment."
- "Error processing form. Please try again."
