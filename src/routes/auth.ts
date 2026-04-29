import type { FastifyInstance } from "fastify";

class AuthRoutes {
    constructor(app: FastifyInstance) {
        app.post('/auth/register', async (request, reply) => { })
        app.post('/auth/login', async (request, reply) => { })
    }
}

export { AuthRoutes }