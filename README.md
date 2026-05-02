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

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3333
JWT_SECRET=sua-chave-secreta-aqui
```
