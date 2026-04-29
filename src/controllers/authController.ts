import type { FastifyInstance, FastifyReply } from "fastify"
import { sanitizeCPF } from "../utils/cpf.js"
import { randomUUID } from "crypto"

export interface IUser {
    id: string
    firstName: string
    lastName: string
    cpf: string
    phone: string
    role: 'CUSTOMER' | 'ADMIN'
    createdAt: string
}

const users: IUser[] = []

export interface RegisterDTO {
    firstName: string
    lastName: string
    cpf: string
    phone: string
}

export interface LoginDTO {
    cpf: string
}

export async function registerHandler(
    app: FastifyInstance,
    data: RegisterDTO,
    reply: FastifyReply
) {
    const cpf = sanitizeCPF(data.cpf)

    const existigUser = users.find((user) => user.cpf === cpf)

    if (existigUser) {
        return reply.status(409).send({ error: 'CPF já cadastrado' })
    }

    const user: IUser = {
        id: randomUUID(),
        firstName: data.firstName,
        lastName: data.lastName,
        cpf,
        phone: data.phone,
        role: 'CUSTOMER',
        createdAt: new Date().toISOString(),
    }

    users.push(user)

    const token = app.jwt.sign(
        { sub: user.id, role: user.role },
        { expiresIn: '7d' }
    )

    const { createdAt, ...publicUser } = user

    return reply.status(201).send({ user: publicUser, token })
}