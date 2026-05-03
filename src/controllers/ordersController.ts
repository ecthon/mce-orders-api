import type { FastifyReply, FastifyRequest } from "fastify"
import { randomUUID } from "crypto"
import type { EventItem, MenuItem } from "./eventsController.js"
import { events } from "./eventsController.js"
import { getUserById } from "./authController.js"

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
const orders: Order[] = [
    {
        id: 'order-1',
        userId: 'user-1',
        eventId: 'event-1',
        items: [
            { menuItemId: 1, name: 'Frango combo', quantity: 2, priceAtOrder: 20.0 },
            { menuItemId: 4, name: 'Carne simples', quantity: 1, priceAtOrder: 20.0 },
        ],
        observations: 'Sem cebola, por favor',
        status: 'PENDING',
        totalPrice: 60.0,
        createdAt: '2026-09-10T10:00:00.000Z',
        updatedAt: '2026-09-10T10:00:00.000Z',
    },
    {
        id: 'order-2',
        userId: 'user-2',
        eventId: 'event-1',
        items: [
            { menuItemId: 3, name: 'Carne combo', quantity: 1, priceAtOrder: 30.0 },
            { menuItemId: 2, name: 'Frango simples', quantity: 2, priceAtOrder: 15.0 },
        ],
        observations: null,
        status: 'CONFIRMED',
        totalPrice: 60.0,
        createdAt: '2026-09-11T14:30:00.000Z',
        updatedAt: '2026-09-11T14:35:00.000Z',
    },
    {
        id: 'order-3',
        userId: 'user-3',
        eventId: 'event-2',
        items: [
            { menuItemId: 1, name: 'Rodízio de Massas', quantity: 1, priceAtOrder: 55.0 },
            { menuItemId: 2, name: 'Sobremesa Especial', quantity: 1, priceAtOrder: 10.0 },
        ],
        observations: 'Adicionar molho à parte',
        status: 'CANCELLED',
        totalPrice: 65.0,
        createdAt: '2026-09-12T19:00:00.000Z',
        updatedAt: '2026-09-12T19:10:00.000Z',
    },
]

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

interface JwtUser {
    sub: string
    role?: 'CUSTOMER' | 'ADMIN'
}

function getUserId(request: FastifyRequest): string | null {
    const user = request.user
    if (typeof user === 'object' && user !== null && 'sub' in user && typeof (user as JwtUser).sub === 'string') {
        return (user as JwtUser).sub
    }
    return null
}

function getUserRole(request: FastifyRequest): JwtUser['role'] | null {
    const user = request.user
    if (typeof user === 'object' && user !== null && 'role' in user && typeof (user as JwtUser).role === 'string') {
        return (user as JwtUser).role
    }
    return null
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
        const userId = getUserId(request)
        if (!userId) {
            return reply.status(401).send({ error: 'Usuário não autenticado' })
        }

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
        const userId = getUserId(request)
        if (!userId) {
            return reply.status(401).send({ error: 'Usuário não autenticado' })
        }

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
 * Busca todos os pedidos (admin)
 */
export async function getAdminOrdersHandler(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const userId = getUserId(request)
        const userRole = getUserRole(request)

        if (!userId) {
            return reply.status(401).send({ error: 'Usuário não autenticado' })
        }

        if (userRole !== 'ADMIN') {
            return reply.status(403).send({ error: 'Acesso negado' })
        }

        const adminOrders = orders.map((order) => {
            const orderUser = getUserById(order.userId)
            const event = getEventById(order.eventId)

            return {
                ...order,
                user: orderUser
                    ? {
                          id: orderUser.id,
                          firstName: orderUser.firstName,
                          lastName: orderUser.lastName,
                          cpf: orderUser.cpf,
                          phone: orderUser.phone,
                      }
                    : null,
                event: event
                    ? {
                          id: event.id,
                          title: event.title,
                          date: event.date,
                          active: event.active,
                      }
                    : null,
            }
        })

        return reply.send({ orders: adminOrders })
    } catch (error) {
        console.error('Error fetching admin orders:', error)
        return reply.status(500).send({ error: 'Erro ao buscar pedidos' })
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
        const userId = getUserId(request)
        if (!userId) {
            return reply.status(401).send({ error: 'Usuário não autenticado' })
        }

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
        const userId = getUserId(request)
        if (!userId) {
            return reply.status(401).send({ error: 'Usuário não autenticado' })
        }

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
