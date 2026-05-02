import type { FastifyReply, FastifyRequest } from "fastify"

export interface MenuItem {
    id: number
    name: string
    description: string
    price: number
}

export interface EventItem {
    id: string
    title: string
    date: string
    active: boolean
    items: MenuItem[]
}

export const events: EventItem[] = [
    {
        id: 'event-1',
        title: 'Almoço de domingo - Churrasquinho',
        date: '20/10/2026',
        active: true,
        items: [
            { id: 1, name: 'Frango combo', description: 'Espetinho de frango, arroz, farofa e batatonese.', price: 20.0 },
            { id: 2, name: 'Frango simples', description: 'Espetinho de frango, arroz e farofa.', price: 15.0 },
            { id: 3, name: 'Carne combo', description: 'Espetinho de carne, arroz, farofa e batatonese. Suco e pudim inclusos', price: 30.0 },
            { id: 4, name: 'Carne simples', description: 'Espetinho de carne, arroz e farofa.', price: 20.0 },
        ],
    },
    {
        id: 'event-2',
        title: 'Jantar de sábado - Rodízio de massas',
        date: '19/10/2026',
        active: false,
        items: [
            { id: 1, name: 'Rodízio de Massas', description: 'Fettuccine, talharim, penne e canelone com molhos variados.', price: 55.0 },
            { id: 2, name: 'Sobremesa Especial', description: 'Pudim ou mousse à escolha.', price: 10.0 },
        ],
    },
]

export async function getEventsHandler(
    request: FastifyRequest<{ Querystring: { active?: string; all?: string } }>,
    reply: FastifyReply
) {
    const { all, active } = request.query

    if (all === 'true') {
        return reply.send({ events })
    }

    if (active !== undefined) {
        const isActive = active === 'true'
        return reply.send({ events: events.filter((event) => event.active === isActive) })
    }

    return reply.send({ events: events.filter((event) => event.active) })
}

export async function getEventByIdHandler(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params
    const event = events.find((event) => event.id === id)

    if (!event) {
        return reply.status(404).send({ error: 'Evento não encontrado' })
    }

    return reply.send({ event })
}

export interface UpdateEventActiveDTO {
    active: boolean
}

export async function updateEventActiveStatusHandler(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateEventActiveDTO }>,
    reply: FastifyReply
) {
    const { id } = request.params
    const { active } = request.body
    const event = events.find((event) => event.id === id)

    if (!event) {
        return reply.status(404).send({ error: 'Evento não encontrado' })
    }

    event.active = active

    return reply.send({ event })
}
