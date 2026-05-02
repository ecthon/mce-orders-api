import type { FastifyReply, FastifyRequest } from "fastify"
import { randomUUID } from "crypto"
import type { EventItem, MenuItem } from "./eventsController.js"
import { events } from "./eventsController.js"

export interface OrderItem {
    menuItemId: number
    name: string
    quantity: number
    priceAtOrder: number
}

export interface Order {
    id: string
    userId: string
    eventId: string
    items: OrderItem[]
    observations?: string | null
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
    totalPrice: number
    createdAt: string
    updatedAt: string
}

// Simulando um "banco de dados" em memória
const orders: Order[] = []

export interface CreateOrderDTO {
    items: Array<{ menuItemId: number; quantity: number }>
    observations?: string | null
}

export interface UpdateOrderDTO {
    items: Array<{ menuItemId: number; quantity: number }>
    observations?: string | null
}

/**
 * Busca um evento pelo ID
 */
function getEventById(eventId: string): EventItem | undefined {
    return events.find((event) => event.id === eventId)
}

/**
 * Busca um item de menu dentro de um evento
 */
function getMenuItemFromEvent(event: EventItem, menuItemId: number): MenuItem | undefined {
    return event.items.find((item) => item.id === menuItemId)
}

/**
 * Valida os itens do pedido contra o menu do evento
 */
function validateOrderItems(
    event: EventItem,
    items: Array<{ menuItemId: number; quantity: number }>
): { valid: boolean; error?: string } {
    if (items.length === 0) {
        return { valid: false, error: 'Pedido deve conter pelo menos um item' }
    }

    for (const item of items) {
        if (item.quantity <= 0) {
            return { valid: false, error: `Quantidade deve ser maior que 0 para item ${item.menuItemId}` }
        }

        const menuItem = getMenuItemFromEvent(event, item.menuItemId)
        if (!menuItem) {
            return { valid: false, error: `Item ${item.menuItemId} não encontrado no menu do evento` }
        }
    }

    return { valid: true }
}

/**
 * Cria um novo pedido
 */
export async function createOrderHandler(
    request: FastifyRequest<{ Params: { eventId: string }; Body: CreateOrderDTO }>,
    reply: FastifyReply
) {
    try {
        const { eventId } = request.params
        const { items, observations } = request.body
        const userId = request.user.sub // Vem do JWT

        // Valida se o evento existe
        const event = getEventById(eventId)
        if (!event) {
            return reply.status(404).send({ error: 'Evento não encontrado' })
        }

        // Valida os itens do pedido
        const validation = validateOrderItems(event, items)
        if (!validation.valid) {
            return reply.status(400).send({ error: validation.error })
        }

        // Cria o array de itens do pedido com dados do menu
        const orderItems: OrderItem[] = items.map((item) => {
            const menuItem = getMenuItemFromEvent(event, item.menuItemId)!
            return {
                menuItemId: item.menuItemId,
                name: menuItem.name,
                quantity: item.quantity,
                priceAtOrder: menuItem.price,
            }
        })

        // Calcula o preço total
        const totalPrice = orderItems.reduce(
            (sum, item) => sum + item.priceAtOrder * item.quantity,
            0
        )

        // Cria o pedido
        const order: Order = {
            id: randomUUID(),
            userId,
            eventId,
            items: orderItems,
            observations: observations || null,
            status: 'PENDING',
            totalPrice,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        orders.push(order)

        return reply.status(201).send({ order })
    } catch (error) {
        console.error('Error creating order:', error)
        return reply.status(500).send({ error: 'Erro ao criar pedido' })
    }
}

/**
 * Busca o pedido do cliente logado para um evento específico
 */
export async function getOrderByEventHandler(
    request: FastifyRequest<{ Params: { eventId: string } }>,
    reply: FastifyReply
) {
    try {
        const { eventId } = request.params
        const userId = request.user.sub // Vem do JWT

        // Valida se o evento existe
        const event = getEventById(eventId)
        if (!event) {
            return reply.status(404).send({ error: 'Evento não encontrado' })
        }

        // Busca o pedido do cliente para este evento
        const order = orders.find((o) => o.userId === userId && o.eventId === eventId && o.status !== 'CANCELLED')

        if (!order) {
            return reply.status(404).send({ error: 'Pedido não encontrado' })
        }

        // Retorna o pedido com informações do cliente e do evento
        return reply.send({
            order,
            user: request.user, // Dados do JWT
            event: {
                id: event.id,
                title: event.title,
                date: event.date,
                active: event.active,
            },
        })
    } catch (error) {
        console.error('Error fetching order:', error)
        return reply.status(500).send({ error: 'Erro ao buscar pedido' })
    }
}

/**
 * Atualiza um pedido existente
 */
export async function updateOrderHandler(
    request: FastifyRequest<{ Params: { orderId: string }; Body: UpdateOrderDTO }>,
    reply: FastifyReply
) {
    try {
        const { orderId } = request.params
        const { items, observations } = request.body
        const userId = request.user.sub // Vem do JWT

        // Busca o pedido
        const order = orders.find((o) => o.id === orderId)
        if (!order) {
            return reply.status(404).send({ error: 'Pedido não encontrado' })
        }

        // Valida se o pedido pertence ao usuário
        if (order.userId !== userId) {
            return reply.status(403).send({ error: 'Você não tem permissão para alterar este pedido' })
        }

        // Valida se o pedido já foi cancelado
        if (order.status === 'CANCELLED') {
            return reply.status(400).send({ error: 'Não é possível alterar um pedido cancelado' })
        }

        // Busca o evento
        const event = getEventById(order.eventId)
        if (!event) {
            return reply.status(404).send({ error: 'Evento não encontrado' })
        }

        // Valida os itens do pedido
        const validation = validateOrderItems(event, items)
        if (!validation.valid) {
            return reply.status(400).send({ error: validation.error })
        }

        // Atualiza os itens do pedido
        const orderItems: OrderItem[] = items.map((item) => {
            const menuItem = getMenuItemFromEvent(event, item.menuItemId)!
            return {
                menuItemId: item.menuItemId,
                name: menuItem.name,
                quantity: item.quantity,
                priceAtOrder: menuItem.price,
            }
        })

        // Calcula o novo preço total
        const totalPrice = orderItems.reduce(
            (sum, item) => sum + item.priceAtOrder * item.quantity,
            0
        )

        // Atualiza o pedido
        order.items = orderItems
        order.observations = observations || null
        order.totalPrice = totalPrice
        order.updatedAt = new Date().toISOString()

        return reply.send({ order })
    } catch (error) {
        console.error('Error updating order:', error)
        return reply.status(500).send({ error: 'Erro ao atualizar pedido' })
    }
}

/**
 * Cancela um pedido
 */
export async function cancelOrderHandler(
    request: FastifyRequest<{ Params: { orderId: string } }>,
    reply: FastifyReply
) {
    try {
        const { orderId } = request.params
        const userId = request.user.sub // Vem do JWT

        // Busca o pedido
        const order = orders.find((o) => o.id === orderId)
        if (!order) {
            return reply.status(404).send({ error: 'Pedido não encontrado' })
        }

        // Valida se o pedido pertence ao usuário
        if (order.userId !== userId) {
            return reply.status(403).send({ error: 'Você não tem permissão para cancelar este pedido' })
        }

        // Valida se o pedido já foi cancelado
        if (order.status === 'CANCELLED') {
            return reply.status(400).send({ error: 'Este pedido já foi cancelado' })
        }

        // Cancela o pedido
        order.status = 'CANCELLED'
        order.updatedAt = new Date().toISOString()

        return reply.send({ order })
    } catch (error) {
        console.error('Error cancelling order:', error)
        return reply.status(500).send({ error: 'Erro ao cancelar pedido' })
    }
}
