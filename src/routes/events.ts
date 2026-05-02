import type { FastifyInstance } from "fastify"
import {
    getEventsHandler,
    getEventByIdHandler,
    updateEventActiveStatusHandler,
} from "../controllers/eventsController.js"

class EventsRoutes {
    constructor(app: FastifyInstance) {
        app.get<{ Querystring: { active?: string; all?: string } }>(
            '/events',
            async (request, reply) => {
                return getEventsHandler(request, reply)
            }
        )

        app.get<{ Params: { id: string } }>(
            '/events/:id',
            async (request, reply) => {
                return getEventByIdHandler(request, reply)
            }
        )

        app.patch<{ Params: { id: string }; Body: { active: boolean } }>(
            '/events/:id/active',
            async (request, reply) => {
                return updateEventActiveStatusHandler(request, reply)
            }
        )
    }
}

export { EventsRoutes }
