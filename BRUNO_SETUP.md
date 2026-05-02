# Testando a API com Bruno

Este guia mostra como testar os endpoints da API no [Bruno](https://www.usebruno.com/).

---

## 1. Instalação do Bruno

- Baixe em: https://www.usebruno.com/
- Instale na sua máquina (Windows, Mac ou Linux)
- Abra Bruno

---

## 2. Criando a Collection

1. Abra Bruno
2. Clique em **"Create New Collection"**
3. Dê um nome: `MCE Orders API`
4. Escolha uma pasta para salvar (ex.: `e:\mce-orders-api\bruno` ou qualquer outra)
5. Clique em **"Create Collection"**

---

## 3. Configurar Variáveis de Ambiente

Bruno permite usar variáveis para não repetir URLs e tokens.

1. Na collection, clique em **"Settings"** (engrenagem no canto superior)
2. Vá para a aba **"Variables"**
3. Adicione as variáveis globais:

```
base_url = http://localhost:3001
admin_token = (você preencherá após fazer login)
customer_token = (você preencherá após fazer login)
event_id = event-1
order_id = (você preencherá após criar um pedido)
```

4. Clique em **"Save"**

---

## 4. Testando os Endpoints

### **1️⃣ Teste de Saúde**

Cria um novo request:
1. Clique em **"New Request"** na collection
2. Nomeie como `GET /ping`
3. Selecione método **GET**
4. URL: `{{base_url}}/ping`
5. Clique em **"Send"**

**Resultado esperado:**
```json
{
  "pong": true
}
```

---

### **2️⃣ Login do Cliente**

1. **New Request** → Nomeie `POST /auth/login (Cliente)`
2. Método: **POST**
3. URL: `{{base_url}}/auth/login`
4. Aba **"Body"** → Selecione **JSON**
5. Cole:
```json
{
  "cpf": "12436462938"
}
```
6. Clique em **"Send"**

**Resultado esperado:**
```json
{
  "user": {
    "id": "a22c01e6-4051-4510-9e33-e74404de02ab",
    "firstName": "Ecthon",
    "lastName": "Almeida",
    "cpf": "12436462938",
    "phone": "994012345",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Importante:** Copie o `token` e salve na variável `customer_token` (Settings → Variables)

---

### **3️⃣ Login do Admin**

1. **New Request** → Nomeie `POST /auth/login (Admin)`
2. Método: **POST**
3. URL: `{{base_url}}/auth/login`
4. Aba **"Body"** → Selecione **JSON**
5. Cole:
```json
{
  "cpf": "12345678901"
}
```
6. Clique em **"Send"**

**Resultado esperado:** Um token JWT para o admin.

**⚠️ Importante:** Copie o `token` e salve na variável `admin_token` (Settings → Variables)

---

### **4️⃣ Listar Eventos**

1. **New Request** → Nomeie `GET /events`
2. Método: **GET**
3. URL: `{{base_url}}/events`
4. Clique em **"Send"**

**Resultado esperado:**
```json
{
  "events": [
    {
      "id": "event-1",
      "title": "Almoço de domingo - Churrasquinho",
      "date": "20/10/2026",
      "active": true,
      "items": [
        {
          "id": 1,
          "name": "Frango combo",
          "description": "Espetinho de frango, arroz, farofa e batatonese.",
          "price": 20.0
        },
        ...
      ]
    }
  ]
}
```

---

### **5️⃣ Criar um Pedido (POST /orders/:eventId)**

1. **New Request** → Nomeie `POST /orders/event-1`
2. Método: **POST**
3. URL: `{{base_url}}/orders/{{event_id}}`
4. Aba **"Headers"** → Adicione:
   - Key: `Authorization`
   - Value: `Bearer {{customer_token}}`
5. Aba **"Body"** → Selecione **JSON** e cole:
```json
{
  "items": [
    { "menuItemId": 1, "quantity": 2 },
    { "menuItemId": 3, "quantity": 1 }
  ],
  "observations": "sem cebola, ponto bem passado"
}
```
6. Clique em **"Send"**

**Resultado esperado:**
```json
{
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "a22c01e6-4051-4510-9e33-e74404de02ab",
    "eventId": "event-1",
    "items": [
      {
        "menuItemId": 1,
        "name": "Frango combo",
        "quantity": 2,
        "priceAtOrder": 20.0
      },
      {
        "menuItemId": 3,
        "name": "Carne combo",
        "quantity": 1,
        "priceAtOrder": 30.0
      }
    ],
    "observations": "sem cebola, ponto bem passado",
    "status": "PENDING",
    "totalPrice": 70.0,
    "createdAt": "2026-05-02T10:30:00.000Z",
    "updatedAt": "2026-05-02T10:30:00.000Z"
  }
}
```

**⚠️ Importante:** Copie o `id` do pedido e salve na variável `order_id`

---

### **6️⃣ Buscar o Pedido do Cliente (GET /orders/:eventId)**

1. **New Request** → Nomeie `GET /orders/event-1`
2. Método: **GET**
3. URL: `{{base_url}}/orders/{{event_id}}`
4. Aba **"Headers"** → Adicione:
   - Key: `Authorization`
   - Value: `Bearer {{customer_token}}`
5. Clique em **"Send"**

**Resultado esperado:** O pedido criado no passo anterior com todas as informações do cliente e do evento.

---

### **7️⃣ Atualizar um Pedido (PUT /orders/:orderId)**

1. **New Request** → Nomeie `PUT /orders/:orderId`
2. Método: **PUT**
3. URL: `{{base_url}}/orders/{{order_id}}`
4. Aba **"Headers"** → Adicione:
   - Key: `Authorization`
   - Value: `Bearer {{customer_token}}`
5. Aba **"Body"** → Selecione **JSON** e cole:
```json
{
  "items": [
    { "menuItemId": 1, "quantity": 3 },
    { "menuItemId": 2, "quantity": 1 }
  ],
  "observations": "aumentar a quantidade de frango"
}
```
6. Clique em **"Send"**

**Resultado esperado:** O pedido atualizado com novos itens e novo `totalPrice`.

---

### **8️⃣ Cancelar um Pedido (DELETE /orders/:orderId)**

1. **New Request** → Nomeie `DELETE /orders/:orderId`
2. Método: **DELETE**
3. URL: `{{base_url}}/orders/{{order_id}}`
4. Aba **"Headers"** → Adicione:
   - Key: `Authorization`
   - Value: `Bearer {{customer_token}}`
5. Clique em **"Send"**

**Resultado esperado:** O pedido com `status: "CANCELLED"`.

---

## 5. Usando Scripts do Bruno para Automação

Bruno permite executar scripts antes/depois de requisições. Para automação:

### **Extrair Token Automaticamente (Após Login)**

1. Abra o request de login do cliente
2. Vá para a aba **"Tests"**
3. Cole o script:
```javascript
const token = res.body.token;
bru.setVar("customer_token", token);
console.log("Token do cliente salvo:", token);
```
4. Salve o request

Agora, toda vez que você executa o login, o token é automaticamente salvo na variável `customer_token`.

### **Extrair ID do Pedido Automaticamente (Após Criar Pedido)**

1. Abra o request `POST /orders/event-1`
2. Vá para a aba **"Tests"**
3. Cole o script:
```javascript
const orderId = res.body.order.id;
bru.setVar("order_id", orderId);
console.log("ID do pedido salvo:", orderId);
```
4. Salve o request

---

## 6. Fluxo Recomendado de Testes

1. ✅ `GET /ping` → Verifica se API está no ar
2. ✅ `POST /auth/login (Cliente)` → Obter token do cliente (com script para salvar)
3. ✅ `GET /events` → Listar eventos
4. ✅ `POST /orders/event-1` → Criar pedido (com script para salvar ID)
5. ✅ `GET /orders/event-1` → Verificar pedido criado
6. ✅ `PUT /orders/:orderId` → Atualizar pedido
7. ✅ `DELETE /orders/:orderId` → Cancelar pedido

---

## 7. Dicas Úteis

- **Visualizar histórico:** Bruno salva automaticamente as requisições na pasta do projeto
- **Copiar como cURL:** Clique com botão direito na requisição → "Copy as cURL"
- **Variáveis:** Use `{{variable_name}}` em qualquer campo (URL, Headers, Body)
- **Ambiente:** Configure diferentes ambientes (Development, Staging, Production) em Settings → Environments
- **Documentação:** Clique em "Docs" para visualizar toda a coleção documentada

---

## Problemas Comuns

| Erro | Solução |
|------|---------|
| `401 Unauthorized` | Verifique se o token está correto em `customer_token`. Re-execute o login. |
| `404 Not Found` | Verifique se o `event_id` e `order_id` estão corretos nas variáveis. |
| `400 Bad Request` | Valide o JSON enviado. Verifique se os `menuItemId` existem no evento. |
| `ECONNREFUSED` | O servidor não está rodando. Execute `npm run dev` no terminal. |

---

**Pronto!** 🎉 Você está pronto para testar a API no Bruno.
