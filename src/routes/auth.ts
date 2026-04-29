import type { FastifyInstance } from "fastify";
import { loginHandler, registerHandler, type LoginDTO, type RegisterDTO } from "../controllers/authController.js";

class AuthRoutes {
    constructor(app: FastifyInstance) {
        app.post<{ Body: RegisterDTO }>('/auth/register', async (request, reply) => {
            return registerHandler(app, request.body, reply)
        })

        app.post<{ Body: LoginDTO }>('/auth/login', async (request, reply) => {
            return loginHandler(app, request.body, reply)
        })
    }
}

export { AuthRoutes }