import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import dotenv from 'dotenv'
import { AuthRoutes } from './routes/auth.js'
import { EventsRoutes } from './routes/events.js'
import { OrdersRoutes } from './routes/orders.js'

dotenv.config()

const app = Fastify({
    logger: true
})


app.register(cors)
app.register(fastifyJwt, { secret: process.env.JWT_SECRET ?? 'dev-secret' })

// Middleware de autenticação
app.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify()
    } catch (error) {
        reply.status(401).send({ error: 'Token inválido ou expirado' })
    }
})

new AuthRoutes(app)
new EventsRoutes(app)
new OrdersRoutes(app)

app.get('/ping', async (request, reply) => {
    return { pong: true }
})

export default app