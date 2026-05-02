# Integração com Frontend - API de Pedidos

Este arquivo contém o código TypeScript pronto para usar no seu projeto Next.js.

---

## 1. Arquivo: `lib/orders.ts`

```typescript
import { api } from '@/lib/api'

// ========================================
// TIPOS/INTERFACES
// ========================================

export interface OrderItem {
  menuItemId: number
  quantity: number
}

export interface CreateOrderPayload {
  items: OrderItem[]
  observations?: string | null
}

export interface OrderResponse {
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
}

export interface GetOrderResponse {
  order: OrderResponse
  user: {
    id: string
    firstName: string
    lastName: string
    cpf: string
    phone: string
    role: string
  }
  event: {
    id: string
    title: string
    date: string
    active: boolean
  }
}

// ========================================
// FUNÇÕES DA API
// ========================================

/**
 * Criar um novo pedido para um evento
 */
export async function createOrder(
  eventId: string,
  payload: CreateOrderPayload
): Promise<OrderResponse> {
  try {
    const response = await api.post<{ order: OrderResponse }>(
      `/orders/${eventId}`,
      payload
    )
    return response.data.order
  } catch (error) {
    throw handleOrderError(error)
  }
}

/**
 * Buscar o pedido do cliente logado para um evento específico
 */
export async function getOrderByEvent(
  eventId: string
): Promise<GetOrderResponse> {
  try {
    const response = await api.get<GetOrderResponse>(`/orders/${eventId}`)
    return response.data
  } catch (error) {
    throw handleOrderError(error)
  }
}

/**
 * Atualizar um pedido existente
 */
export async function updateOrder(
  orderId: string,
  payload: CreateOrderPayload
): Promise<OrderResponse> {
  try {
    const response = await api.put<{ order: OrderResponse }>(
      `/orders/${orderId}`,
      payload
    )
    return response.data.order
  } catch (error) {
    throw handleOrderError(error)
  }
}

/**
 * Cancelar um pedido
 */
export async function cancelOrder(
  orderId: string
): Promise<OrderResponse> {
  try {
    const response = await api.delete<{ order: OrderResponse }>(
      `/orders/${orderId}`
    )
    return response.data.order
  } catch (error) {
    throw handleOrderError(error)
  }
}

// ========================================
// TRATAMENTO DE ERROS
// ========================================

interface ApiError {
  response?: {
    status: number
    data?: {
      error?: string
    }
  }
  message?: string
}

function handleOrderError(error: any): Error {
  const apiError = error as ApiError

  if (apiError.response) {
    const status = apiError.response.status
    const message = apiError.response.data?.error || 'Erro na requisição'

    switch (status) {
      case 400:
        return new Error(`Dados inválidos: ${message}`)
      case 401:
        return new Error('Sessão expirada. Faça login novamente.')
      case 403:
        return new Error('Você não tem permissão para esta ação.')
      case 404:
        return new Error('Pedido ou evento não encontrado.')
      case 409:
        return new Error('Conflito nos dados. Tente novamente.')
      case 500:
        return new Error('Erro no servidor. Tente mais tarde.')
      default:
        return new Error(message)
    }
  }

  return new Error('Erro ao conectar com o servidor.')
}

// ========================================
// FUNÇÃO AUXILIAR PARA VALIDAR PEDIDO
// ========================================

export function validateOrderData(
  items: Array<{ menuItemId: number; quantity: number }>
): { valid: boolean; error?: string } {
  if (items.length === 0) {
    return { valid: false, error: 'Adicione pelo menos um item ao pedido' }
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      return {
        valid: false,
        error: `Quantidade deve ser maior que 0`,
      }
    }
  }

  return { valid: true }
}
```

---

## 2. Arquivo: `hooks/useOrder.ts`

Hook customizado para gerenciar estado e lógica de pedidos:

```typescript
'use client'

import { useState } from 'react'
import {
  createOrder,
  getOrderByEvent,
  updateOrder,
  cancelOrder,
  type OrderResponse,
  type GetOrderResponse,
} from '@/lib/orders'

interface UseOrderState {
  order: OrderResponse | null
  fullOrder: GetOrderResponse | null
  loading: boolean
  error: string | null
}

export function useOrder() {
  const [state, setState] = useState<UseOrderState>({
    order: null,
    fullOrder: null,
    loading: false,
    error: null,
  })

  // Criar pedido
  const handleCreateOrder = async (
    eventId: string,
    items: Array<{ menuItemId: number; quantity: number }>,
    observations?: string | null
  ) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const order = await createOrder(eventId, {
        items,
        observations,
      })
      setState((prev) => ({ ...prev, order, loading: false }))
      return order
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro desconhecido'
      setState((prev) => ({ ...prev, loading: false, error }))
      throw err
    }
  }

  // Buscar pedido
  const handleFetchOrder = async (eventId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const fullOrder = await getOrderByEvent(eventId)
      setState((prev) => ({
        ...prev,
        order: fullOrder.order,
        fullOrder,
        loading: false,
      }))
      return fullOrder
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro desconhecido'
      setState((prev) => ({ ...prev, loading: false, error }))
      // Não lançar erro - pode ser que não exista pedido ainda
      return null
    }
  }

  // Atualizar pedido
  const handleUpdateOrder = async (
    orderId: string,
    items: Array<{ menuItemId: number; quantity: number }>,
    observations?: string | null
  ) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const order = await updateOrder(orderId, {
        items,
        observations,
      })
      setState((prev) => ({ ...prev, order, loading: false }))
      return order
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro desconhecido'
      setState((prev) => ({ ...prev, loading: false, error }))
      throw err
    }
  }

  // Cancelar pedido
  const handleCancelOrder = async (orderId: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const order = await cancelOrder(orderId)
      setState((prev) => ({ ...prev, order, loading: false }))
      return order
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Erro desconhecido'
      setState((prev) => ({ ...prev, loading: false, error }))
      throw err
    }
  }

  // Limpar estado
  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }))
  }

  const clearOrder = () => {
    setState((prev) => ({
      ...prev,
      order: null,
      fullOrder: null,
      error: null,
    }))
  }

  return {
    // Estado
    order: state.order,
    fullOrder: state.fullOrder,
    loading: state.loading,
    error: state.error,
    // Ações
    createOrder: handleCreateOrder,
    fetchOrder: handleFetchOrder,
    updateOrder: handleUpdateOrder,
    cancelOrder: handleCancelOrder,
    clearError,
    clearOrder,
  }
}
```

---

## 3. Integração no Seu Componente

Atualize o seu componente `page.tsx` para usar o hook:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import CardItem, { MenuItem } from '@/components/card-item'
import HeaderUser from '@/components/header-user'
import EventHeader from '@/components/event-header'
import OrderFooter from '@/components/order-footer'

import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle03Icon } from '@hugeicons/core-free-icons'
import { api } from '@/lib/api'
import { useOrder, validateOrderData } from '@/lib/orders'

interface EventData {
  id: string
  title: string
  date: string
  active: boolean
  items: MenuItem[]
}

export default function Page() {
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [observations, setObservations] = useState('')
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  // Hook customizado para gerenciar pedidos
  const { createOrder, error: orderError, loading: orderLoading } = useOrder()

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await api.get<{ event: EventData }>('/events/event-1')
        setEvent(response.data.event)
        setQuantities(
          Object.fromEntries(response.data.event.items.map((item) => [item.id, 0]))
        )
      } catch (err) {
        console.error('Failed to fetch event:', err)
        setError('Falha ao carregar o evento')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [])

  const handleQuantityChange = (id: number, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [id]: quantity }))
  }

  const handleConfirmOrder = async () => {
    if (!event) return

    // Validar dados
    const items = event.items
      .filter((item) => (quantities[item.id] ?? 0) > 0)
      .map((item) => ({
        menuItemId: item.id,
        quantity: quantities[item.id],
      }))

    const validation = validateOrderData(items)
    if (!validation.valid) {
      setError(validation.error || 'Erro ao validar pedido')
      return
    }

    try {
      // Criar pedido via API
      await createOrder(event.id, items, observations.trim() || null)

      console.log('✅ Pedido criado com sucesso!')
      setOrderConfirmed(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar pedido'
      setError(message)
      console.error('Erro ao criar pedido:', err)
    }
  }

  const handleEditOrder = () => {
    setOrderConfirmed(false)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <HeaderUser />
        <div className="flex items-center justify-center min-h-svh">
          <p className="text-zinc-600">Carregando evento...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col">
        <HeaderUser />
        <div className="flex items-center justify-center min-h-svh">
          <p className="text-red-600">{error || 'Evento não encontrado'}</p>
        </div>
      </div>
    )
  }

  const selectedItems = event.items.filter((item) => (quantities[item.id] ?? 0) > 0)
  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0)
  const totalPrice = event.items.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
    0
  )

  return (
    <div className="flex flex-col">
      <HeaderUser />
      <div className={`flex flex-col gap-4 min-h-svh -mt-10 p-4 max-w-lg mx-auto w-full ${orderConfirmed ? 'pb-20' : 'pb-28'}`}>

        <EventHeader title={event.title} date={event.date} />

        {/* Exibir erro se houver */}
        {orderError && (
          <div className="flex items-center gap-3 bg-red-100/70 rounded-xl px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-red-200 flex items-center justify-center shrink-0">
              ⚠️
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900 leading-tight">{orderError}</p>
            </div>
          </div>
        )}

        {orderConfirmed ? (
          <div className="flex flex-col gap-3">
            {/* Banner de sucesso */}
            <div className="flex items-center gap-3 bg-emerald-100/70 rounded-xl px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={CheckmarkCircle03Icon} size={20} strokeWidth={2} className="text-emerald-900 shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 leading-tight">Pedido realizado com sucesso!</p>
              </div>
            </div>

            {/* Resumo dos itens */}
            <div className="flex flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden">
              {selectedItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${index < selectedItems.length - 1 ? 'border-b border-zinc-100' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-zinc-600 bg-zinc-200 rounded-md w-6 h-6 flex items-center justify-center shrink-0">
                      {quantities[item.id]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{item.name}</p>
                      <p className="text-xs text-zinc-400">R$ {item.price.toFixed(2).replace('.', ',')} / unid.</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-zinc-700 shrink-0">
                    R$ {(item.price * quantities[item.id]).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
                <p className="text-sm font-semibold text-zinc-500">Total</p>
                <p className="text-base font-bold text-zinc-900">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            {/* Observações */}
            {observations.trim() && (
              <div className="border border-zinc-200 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-zinc-400 mb-1">Observações</p>
                <p className="text-sm text-zinc-700 leading-relaxed">{observations.trim()}</p>
              </div>
            )}
          </div>

        ) : (
          <>
            <div className="flex flex-col gap-3 w-full">
              {event.items.map((item) => (
                <CardItem
                  key={item.id}
                  item={item}
                  quantity={quantities[item.id] ?? 0}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="observations" className="text-sm font-medium text-zinc-700">
                Observações
              </label>
              <Textarea
                id="observations"
                placeholder="Ex: sem cebola, ponto da carne bem passado..."
                className="resize-none text-sm"
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          </>
        )}

      </div>

      <OrderFooter
        items={event.items}
        quantities={quantities}
        observations={observations}
        onConfirm={handleConfirmOrder}
        orderConfirmed={orderConfirmed}
        onEdit={handleEditOrder}
        isLoading={orderLoading}
      />
    </div>
  )
}
```

---

## 4. Atualizar OrderFooter (se necessário)

Se seu `OrderFooter` não tiver a prop `isLoading`, adicione:

```typescript
interface OrderFooterProps {
  items: MenuItem[]
  quantities: Record<number, number>
  observations: string
  onConfirm: () => void
  orderConfirmed: boolean
  onEdit: () => void
  isLoading?: boolean  // ← Adicionar isso
}

export default function OrderFooter({
  items,
  quantities,
  observations,
  onConfirm,
  orderConfirmed,
  onEdit,
  isLoading = false,  // ← Adicionar isso
}: OrderFooterProps) {
  // ... seu código

  return (
    <footer>
      {orderConfirmed ? (
        <button
          onClick={onEdit}
          disabled={isLoading}
          className="..."
        >
          Editar Pedido
        </button>
      ) : (
        <button
          onClick={onConfirm}
          disabled={isLoading}  // ← Desabilitar enquanto carrega
          className={`... ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Enviando...' : 'Confirmar Pedido'}
        </button>
      )}
    </footer>
  )
}
```

---

## 5. Fluxo Completo

1. ✅ Usuário seleciona itens
2. ✅ Usuário adiciona observações
3. ✅ Clica em "Confirmar Pedido"
4. ✅ Código chama `createOrder(event.id, items, observations)`
5. ✅ API cria o pedido no backend
6. ✅ Se sucesso: mostra mensagem de confirmação
7. ✅ Se erro: mostra mensagem de erro

---

## 🎯 Próximos Passos Opcionais

Se quiser permitir **editar pedidos existentes**:

```typescript
// No useEffect, buscar pedido existente
useEffect(() => {
  if (event?.id) {
    const fetchExistingOrder = async () => {
      try {
        const existingOrder = await getOrderByEvent(event.id)
        if (existingOrder?.order) {
          // Pré-preencher com dados do pedido existente
          const newQuantities: Record<number, number> = {}
          existingOrder.order.items.forEach((item) => {
            newQuantities[item.menuItemId] = item.quantity
          })
          setQuantities(newQuantities)
          setObservations(existingOrder.order.observations || '')
        }
      } catch (err) {
        // Nenhum pedido encontrado = novo pedido
      }
    }

    fetchExistingOrder()
  }
}, [event?.id])
```

---

**Pronto!** 🚀 Copie os arquivos `lib/orders.ts` e `hooks/useOrder.ts` para seu projeto e integre no componente. Teste com o servidor rodando!
