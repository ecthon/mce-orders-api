import type { FastifyInstance } from "fastify"
import {
    createOrderHandler,
    getOrderByEventHandler,
    updateOrderHandler,
    cancelOrderHandler,
} from "../controllers/ordersController.js"

class OrdersRoutes {
    constructor(app: FastifyInstance) {
        // Criar novo pedido para um evento
        app.post<{ Params: { eventId: string }; Body: { items: Array<{ menuItemId: number; quantity: number }>; observations?: string | null } }>(
            '/orders/:eventId',
            { onRequest: [app.authenticate] },
            async (request, reply) => {
                return createOrderHandler(request, reply)
            }
        )

        // Buscar o pedido do cliente para um evento específico
        app.get<{ Params: { eventId: string } }>(
            '/orders/:eventId',
            { onRequest: [app.authenticate] },
            async (request, reply) => {
                return getOrderByEventHandler(request, reply)
            }
        )

        // Atualizar um pedido existente
        app.put<{ Params: { orderId: string }; Body: { items: Array<{ menuItemId: number; quantity: number }>; observations?: string | null } }>(
            '/orders/:orderId',
            { onRequest: [app.authenticate] },
            async (request, reply) => {
                return updateOrderHandler(request, reply)
            }
        )

        // Cancelar um pedido
        app.delete<{ Params: { orderId: string } }>(
            '/orders/:orderId',
            { onRequest: [app.authenticate] },
            async (request, reply) => {
                return cancelOrderHandler(request, reply)
            }
        )
    }
}

export { OrdersRoutes }
