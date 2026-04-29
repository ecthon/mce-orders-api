# Rotas de Autenticação — MCE Orders API

## Contexto

Sistema de autenticação **sem senha (passwordless)** baseado em CPF.
O usuário se cadastra com dados pessoais e entra na plataforma usando apenas o CPF.

> [!NOTE]
> **Fase atual:** os dados são armazenados em um **array em memória**. Isso significa que os usuários são perdidos ao reiniciar o servidor. Quando Prisma for integrado, basta trocar as operações no array pelas queries do Prisma.

> [!IMPORTANT]
> O login é feito **somente com CPF**, sem senha. O CPF funciona como identificador único e fator de autenticação.

---

## Separação de Responsabilidades

A arquitetura segue o padrão **Route → Controller → Data**:

| Camada | Arquivo | Responsabilidade |
|--------|---------|-----------------|
| **Route** | `src/routes/auth.ts` | Declarar os endpoints, registrar schemas de validação (Zod), delegar para o controller |
| **Controller** | `src/controllers/authController.ts` | Conter a lógica de negócio: validar CPF, buscar/criar usuário, assinar JWT |
| **Data** | Array em memória (→ Prisma futuramente) | Persistência dos dados |

> [!TIP]
> Essa separação torna a migração para Prisma mais limpa: apenas o `authController.ts` precisará ser alterado — as rotas permanecem intactas.

---

## Modelo de Dados (em memória)

```typescript
// Tipo que representa um usuário
interface User {
  id:        string
  firstName: string
  lastName:  string
  cpf:       string   // somente dígitos: "12345678901"
  phone:     string
  role:      'CUSTOMER' | 'ADMIN'
  createdAt: string
}

// Array que simula o banco de dados
const users: User[] = []
```

> [!NOTE]
> O CPF deve ser armazenado **somente os dígitos** (sem pontos e traço), ex: `"12345678901"`.
> A formatação é responsabilidade do frontend.

---

## Dependências necessárias

Nenhuma dependência nova — tudo já está no `package.json`:
- `fastify` ✅
- `@fastify/jwt` ✅
- `zod` ✅

---

## Estrutura de pastas

```
src/
├── controllers/
│   └── authController.ts    ← lógica de negócio (register, login)
├── routes/
│   └── auth.ts              ← declaração dos endpoints, validação Zod
├── utils/
│   └── cpf.ts               ← validação/formatação do CPF
├── app.ts
└── server.ts
```

---

## 1. `src/utils/cpf.ts`

```typescript
// Remove formatação: "123.456.789-01" → "12345678901"
export function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

// Valida se o CPF tem 11 dígitos (validação básica)
export function isValidCPF(cpf: string): boolean {
  const clean = sanitizeCPF(cpf)
  return clean.length === 11
}
```

> [!TIP]
> Para produção, implemente o algoritmo completo de validação de CPF (verificação dos dígitos verificadores).

---

## 2. `src/controllers/authController.ts`

Contém toda a **lógica de negócio** — o que acontece após a rota receber e validar os dados.

```typescript
import { FastifyInstance, FastifyReply } from 'fastify'
import { randomUUID } from 'crypto'
import { sanitizeCPF } from '../utils/cpf'

// ─── Tipos ───────────────────────────────────────────────────
export interface User {
  id:        string
  firstName: string
  lastName:  string
  cpf:       string
  phone:     string
  role:      'CUSTOMER' | 'ADMIN'
  createdAt: string
}

// ─── "Banco de dados" em memória ─────────────────────────────
// Substituir por `prisma.user` quando migrar para Prisma
const users: User[] = []

// ─── Tipos dos dados já validados (vêm do Zod nas rotas) ─────
export interface RegisterDTO {
  firstName: string
  lastName:  string
  cpf:       string
  phone:     string
}

export interface LoginDTO {
  cpf: string
}

// ─── Handlers ────────────────────────────────────────────────

export async function registerHandler(
  app: FastifyInstance,
  data: RegisterDTO,
  reply: FastifyReply
) {
  const cpf = sanitizeCPF(data.cpf)

  const existing = users.find(u => u.cpf === cpf)
  if (existing) {
    return reply.status(409).send({ error: 'CPF já cadastrado' })
  }

  const user: User = {
    id:        randomUUID(),
    firstName: data.firstName,
    lastName:  data.lastName,
    cpf,
    phone:     data.phone,
    role:      'CUSTOMER',
    createdAt: new Date().toISOString(),
  }

  users.push(user)

  const token = app.jwt.sign(
    { sub: user.id, role: user.role },
    { expiresIn: '7d' }
  )

  const { createdAt, ...publicUser } = user

  return reply.status(201).send({ user: publicUser, token })
}

export async function loginHandler(
  app: FastifyInstance,
  data: LoginDTO,
  reply: FastifyReply
) {
  const cpf = sanitizeCPF(data.cpf)

  const user = users.find(u => u.cpf === cpf)
  if (!user) {
    return reply.status(404).send({ error: 'Usuário não encontrado' })
  }

  const token = app.jwt.sign(
    { sub: user.id, role: user.role },
    { expiresIn: '7d' }
  )

  const { createdAt, ...publicUser } = user

  return reply.status(200).send({ user: publicUser, token })
}
```

---

## 3. `src/routes/auth.ts`

As rotas ficam **enxutas**: só lidam com validação de entrada (Zod) e delegam para o controller.

```typescript
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { isValidCPF } from '../utils/cpf'
import { registerHandler, loginHandler } from '../controllers/authController'

export async function authRoutes(app: FastifyInstance) {

  // ─────────────────────────────────────────
  // POST /auth/register
  // ─────────────────────────────────────────
  app.post('/auth/register', async (request, reply) => {
    const registerSchema = z.object({
      firstName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
      lastName:  z.string().min(2, 'Sobrenome deve ter no mínimo 2 caracteres'),
      cpf:       z.string().refine(isValidCPF, { message: 'CPF inválido' }),
      phone:     z.string().min(10, 'Telefone inválido').max(15),
    })

    const parsed = registerSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    return registerHandler(app, parsed.data, reply)
  })


  // ─────────────────────────────────────────
  // POST /auth/login
  // ─────────────────────────────────────────
  app.post('/auth/login', async (request, reply) => {
    const loginSchema = z.object({
      cpf: z.string().refine(isValidCPF, { message: 'CPF inválido' }),
    })

    const parsed = loginSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    return loginHandler(app, parsed.data, reply)
  })

}
```

---

## 4. Registrar as rotas no `app.ts`

```typescript
import fastifyJwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'

app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })
app.register(authRoutes, { prefix: '/api' })
// → POST /api/auth/register
// → POST /api/auth/login
```

---

## Contratos da API

### `POST /api/auth/register`

**Body:**
```json
{
  "firstName": "João",
  "lastName":  "Silva",
  "cpf":       "123.456.789-01",
  "phone":     "(11) 91234-5678"
}
```

**Resposta 201:**
```json
{
  "user": {
    "id": "uuid",
    "firstName": "João",
    "lastName": "Silva",
    "cpf": "12345678901",
    "phone": "(11) 91234-5678",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `400`  | Dados inválidos (CPF mal formatado, campos faltando) |
| `409`  | CPF já cadastrado |

---

### `POST /api/auth/login`

**Body:**
```json
{
  "cpf": "123.456.789-01"
}
```

**Resposta 200:**
```json
{
  "user": {
    "id": "uuid",
    "firstName": "João",
    "lastName": "Silva",
    "cpf": "12345678901",
    "phone": "(11) 91234-5678",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `400`  | CPF inválido |
| `404`  | Usuário não encontrado |

---

## Variáveis de ambiente necessárias

```env
JWT_SECRET="sua-chave-secreta-aqui"
```

---

## Checklist de implementação

- [ ] Criar `src/utils/cpf.ts`
- [ ] Criar `src/controllers/authController.ts` (inclui o array `users[]` e os handlers)
- [ ] Criar `src/routes/auth.ts` (apenas validação Zod + chamada ao controller)
- [ ] Registrar JWT no `app.ts` com `app.register(jwt, { secret: process.env.JWT_SECRET })`
- [ ] Registrar as rotas no `app.ts` com o prefix `/api`
- [ ] Testar com Insomnia/Postman os dois endpoints

---

## Migração futura para Prisma

Quando for integrar o banco de dados, as únicas mudanças necessárias ficam **isoladas no `authController.ts`**:

| Troque | Por |
|--------|-----|
| `const users: User[] = []` | `import { prisma } from '../lib/prisma'` |
| `users.find(u => u.cpf === cpf)` | `prisma.user.findUnique({ where: { cpf } })` |
| `users.push(user)` | `prisma.user.create({ data: user })` |

> [!TIP]
> As **rotas não precisam ser alteradas** na migração — toda a lógica de acesso a dados está encapsulada no controller.
