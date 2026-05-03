# Integração Frontend - Consulta de Pedidos Admin

Este arquivo serve como instrução para aplicar a rota de administração de pedidos no seu projeto frontend.

## 1. Rota backend utilizada

- Método: `GET`
- Caminho: `/orders`
- Requer autenticação JWT
- Apenas usuários com `role: 'ADMIN'` podem acessar

O backend retorna um JSON no formato:

```json
{
  "orders": [
    {
      "id": "string",
      "userId": "string",
      "eventId": "string",
      "items": [
        {
          "menuItemId": 1,
          "name": "string",
          "quantity": 1,
          "priceAtOrder": 10
        }
      ],
      "observations": "string | null",
      "status": "PENDING | CONFIRMED | CANCELLED",
      "totalPrice": 0,
      "createdAt": "string",
      "updatedAt": "string",
      "user": {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "cpf": "string",
        "phone": "string"
      },
      "event": {
        "id": "string",
        "title": "string",
        "date": "string",
        "active": true
      }
    }
  ]
}
```

---

## 2. Adicionar helper `getAdminOrders` em `@/lib/orders.ts`

Se você já possui `@/lib/orders.ts`, adicione o seguinte código abaixo das outras funções de pedidos.

```ts
export interface AdminOrderUser {
  id: string
  firstName: string
  lastName: string
  cpf: string
  phone: string
}

export interface AdminOrderEvent {
  id: string
  title: string
  date: string
  active: boolean
}

export interface AdminOrderResponse {
  id: string
  userId: string
  eventId: string
  items: Array<{
    menuItemId: number
    name: string
    quantity: number
    priceAtOrder: number
  }>
  observations?: string | null
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  totalPrice: number
  createdAt: string
  updatedAt: string
  user: AdminOrderUser
  event: AdminOrderEvent
}

export async function getAdminOrders(): Promise<AdminOrderResponse[]> {
  const response = await api.get<{ orders: AdminOrderResponse[] }>(`/orders`)
  return response.data.orders
}
```

Se você não usa `api` como instância Axios, substitua a chamada por `fetch` ou pelo cliente HTTP do seu projeto.

---

## 3. Exemplo de implementação na página admin

A página já está quase pronta. Basta garantir que `getAdminOrders` retorne `data.orders` e que a autenticação esteja funcionando.

```tsx
'use client'

import { useEffect, useState } from 'react'
import HeaderUser from '@/components/header-user'
import { getAdminOrders, AdminOrderResponse } from '@/lib/orders'

export default function AdminPage() {
  const [orders, setOrders] = useState<AdminOrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const adminOrders = await getAdminOrders()
        setOrders(adminOrders)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar pedidos.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return (
    <div className="flex flex-col">
      <HeaderUser />
      {/* restante do componente */}
    </div>
  )
}
```

---

## 4. Autenticação

A requisição precisa enviar o token JWT do usuário admin.

Exemplo se usar `api` com Axios e interceptors:

```ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return config
})
```

Se você não usa interceptores, faça manualmente:

```ts
export async function getAdminOrders(): Promise<AdminOrderResponse[]> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Falha ao carregar pedidos')
  }
  const data = await response.json()
  return data.orders
}
```

---

## 5. Observações finais

- Use `GET /orders` apenas para a view admin.
- `GET /orders/:eventId` é para o cliente buscar seu pedido em um evento específico.
- O backend exige um usuário com `role: 'ADMIN'`.
- Ajuste `event.title` e `order.user.firstName` no frontend conforme sua estrutura de tipos.
