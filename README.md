# mce-orders-api

API REST para o sistema de pedidos MCE, construída com **Fastify** + **TypeScript**.

---

## Requisitos

- Node.js 18+
- npm

---

## Instalação

```bash
npm install
```

## Rodando em desenvolvimento

```bash
npm run dev
```

O servidor sobe em `http://localhost:3001` por padrão.

---

## Testando a API

### Com Bruno (Recomendado)

Veja o guia completo em [BRUNO_SETUP.md](BRUNO_SETUP.md) para instruções passo a passo, incluindo:
- Como criar uma collection
- Configurar variáveis de ambiente
- Testar todos os endpoints
- Automatizar com scripts

### Resumo rápido

1. Baixe e instale [Bruno](https://www.usebruno.com/)
2. Crie uma collection com a URL base: `http://localhost:3001`
3. Configure variáveis para `customer_token` e `admin_token` (obtidas fazendo login)
4. Use `Authorization: Bearer {{token}}` nos headers para endpoints autenticados

---

## Rotas disponíveis

### `GET /ping`

Verifica se a API está no ar.

**Resposta:**
```json
{ "pong": true }
```

---

### `POST /auth/register`

Cria um novo usuário e retorna um token JWT.

**URL:** `http://localhost:3333/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "João",
  "lastName": "Silva",
  "cpf": "123.456.789-09",
  "phone": "11999999999"
}
```

**Resposta de sucesso (`201 Created`):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "João",
    "lastName": "Silva",
    "cpf": "12345678909",
    "phone": "11999999999",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de erro — CPF já cadastrado (`409 Conflict`):**
```json
{
  "error": "CPF já cadastrado"
}
```

---

### `POST /auth/login`

Realiza o login de um usuário utilizando o CPF. Para facilitar os testes, a API já possui dois usuários *mockados* em memória:
- **Admin:** `12345678901`
- **Cliente:** `12436462938`

**URL:** `http://localhost:3001/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "cpf": "12345678901"
}
```

*(O CPF também pode ser enviado com máscara: `"123.456.789-01"`)*

**Resposta de sucesso (`200 OK`):**
```json
{
  "user": {
    "id": "c22c01e6-4051-4510-9e33-e74404de02ab",
    "firstName": "admin",
    "lastName": "admin",
    "cpf": "12345678901",
    "phone": "12345678901",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta de erro — Usuário não encontrado (`404 Not Found`):**
```json
{
  "error": "Usuário não encontrado"
}
```

---

### `GET /events`

Retorna eventos ativos por padrão.

**URL:** `http://localhost:3001/events`

**Query params:**
- `active=true` — apenas eventos ativos
- `active=false` — apenas eventos inativos
- `all=true` — todos os eventos

**Resposta de sucesso (`200 OK`):**
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
        }
      ]
    }
  ]
}
```

---

### `GET /events/:id`

Retorna um evento específico pelo `id`.

**URL:** `http://localhost:3001/events/event-1`

**Resposta de sucesso (`200 OK`):**
```json
{
  "event": {
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
      }
    ]
  }
}
```

**Resposta de erro — Evento não encontrado (`404 Not Found`):**
```json
{
  "error": "Evento não encontrado"
}
```

---

### `PATCH /events/:id/active`

Ativa ou desativa um evento pelo `id`.

**URL:** `http://localhost:3001/events/event-1/active`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "active": false
}
```

**Resposta de sucesso (`200 OK`):**
```json
{
  "event": {
    "id": "event-1",
    "title": "Almoço de domingo - Churrasquinho",
    "date": "20/10/2026",
    "active": false,
    "items": [
      {
        "id": 1,
        "name": "Frango combo",
        "description": "Espetinho de frango, arroz, farofa e batatonese.",
        "price": 20.0
      }
    ]
  }
}
```

---

### `POST /orders/:eventId`

Cria um novo pedido para um evento específico. **Requer autenticação JWT**.

**URL:** `http://localhost:3001/orders/event-1`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <seu-token-jwt>
```

**Body:**
```json
{
  "items": [
    { "menuItemId": 1, "quantity": 2 },
    { "menuItemId": 3, "quantity": 1 }
  ],
  "observations": "sem cebola, ponto bem passado"
}
```

**Resposta de sucesso (`201 Created`):**
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

**Respostas de erro:**
- `400 Bad Request` — Itens inválidos ou quantidade zero
- `401 Unauthorized` — Token JWT ausente ou inválido
- `404 Not Found` — Evento não encontrado

---

### `GET /orders/:eventId`

Busca o pedido do cliente logado para um evento específico. **Requer autenticação JWT**.

**URL:** `http://localhost:3001/orders/event-1`

**Headers:**
```
Authorization: Bearer <seu-token-jwt>
```

**Resposta de sucesso (`200 OK`):**
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
  },
  "user": {
    "id": "a22c01e6-4051-4510-9e33-e74404de02ab",
    "firstName": "Ecthon",
    "lastName": "Almeida",
    "cpf": "12436462938",
    "phone": "994012345",
    "role": "CUSTOMER"
  },
  "event": {
    "id": "event-1",
    "title": "Almoço de domingo - Churrasquinho",
    "date": "20/10/2026",
    "active": true
  }
}
```

**Respostas de erro:**
- `401 Unauthorized` — Token JWT ausente ou inválido
- `404 Not Found` — Evento ou pedido não encontrado

---

### `PUT /orders/:orderId`

Atualiza um pedido existente (alterar itens, quantidades ou observações). **Requer autenticação JWT**. O cliente só pode alterar seus próprios pedidos.

**URL:** `http://localhost:3001/orders/550e8400-e29b-41d4-a716-446655440001`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <seu-token-jwt>
```

**Body:**
```json
{
  "items": [
    { "menuItemId": 1, "quantity": 3 },
    { "menuItemId": 2, "quantity": 1 }
  ],
  "observations": "aumentar a quantidade de frango"
}
```

**Resposta de sucesso (`200 OK`):**
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
        "quantity": 3,
        "priceAtOrder": 20.0
      },
      {
        "menuItemId": 2,
        "name": "Frango simples",
        "quantity": 1,
        "priceAtOrder": 15.0
      }
    ],
    "observations": "aumentar a quantidade de frango",
    "status": "PENDING",
    "totalPrice": 75.0,
    "createdAt": "2026-05-02T10:30:00.000Z",
    "updatedAt": "2026-05-02T11:00:00.000Z"
  }
}
```

**Respostas de erro:**
- `400 Bad Request` — Itens inválidos ou pedido cancelado
- `401 Unauthorized` — Token JWT ausente ou inválido
- `403 Forbidden` — Tentando alterar pedido de outro usuário
- `404 Not Found` — Pedido não encontrado

---

### `DELETE /orders/:orderId`

Cancela um pedido existente (muda o status para `CANCELLED`). **Requer autenticação JWT**. O cliente só pode cancelar seus próprios pedidos.

**URL:** `http://localhost:3001/orders/550e8400-e29b-41d4-a716-446655440001`

**Headers:**
```
Authorization: Bearer <seu-token-jwt>
```

**Resposta de sucesso (`200 OK`):**
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
        "quantity": 3,
        "priceAtOrder": 20.0
      },
      {
        "menuItemId": 2,
        "name": "Frango simples",
        "quantity": 1,
        "priceAtOrder": 15.0
      }
    ],
    "observations": "aumentar a quantidade de frango",
    "status": "CANCELLED",
    "totalPrice": 75.0,
    "createdAt": "2026-05-02T10:30:00.000Z",
    "updatedAt": "2026-05-02T11:05:00.000Z"
  }
}
```

**Respostas de erro:**
- `401 Unauthorized` — Token JWT ausente ou inválido
- `403 Forbidden` — Tentando cancelar pedido de outro usuário
- `404 Not Found` — Pedido não encontrado
- `400 Bad Request` — Pedido já foi cancelado

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3333
JWT_SECRET=sua-chave-secreta-aqui
```
