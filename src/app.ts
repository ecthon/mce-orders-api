import Fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'

dotenv.config()

const app = Fastify({
    logger: true
})


app.register(cors)


app.get('/ping', async (request, reply) => {
    return { pong: true }
})

export default app