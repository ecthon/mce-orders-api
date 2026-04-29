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

O servidor sobe em `http://localhost:3333`.

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

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3333
JWT_SECRET=sua-chave-secreta-aqui
```
