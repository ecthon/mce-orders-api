import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import dotenv from 'dotenv'
import { AuthRoutes } from './routes/auth.js'
import { EventsRoutes } from './routes/events.js'

dotenv.config()

const app = Fastify({
    logger: true
})


app.register(cors)
app.register(fastifyJwt, { secret: process.env.JWT_SECRET ?? 'dev-secret' })

new AuthRoutes(app)
new EventsRoutes(app)

app.get('/ping', async (request, reply) => {
    return { pong: true }
})

export default app