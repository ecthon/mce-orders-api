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

const users: IUser[] = [
    {
        id: 'c22c01e6-4051-4510-9e33-e74404de02ab',
        firstName: 'admin',
        lastName: 'admin',
        cpf: '12345678901',
        phone: '12345678901',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'a22c01e6-4051-4510-9e33-e74404de02ab',
        firstName: 'Ecthon',
        lastName: 'Almeida',
        cpf: '12436462938',
        phone: '994012345',
        role: 'CUSTOMER',
        createdAt: new Date().toISOString(),
    }
]

export function getUserById(userId: string) {
    return users.find((user) => user.id === userId)
}

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

export async function loginHandler(
    app: FastifyInstance,
    data: LoginDTO,
    reply: FastifyReply
) {
    const cpf = sanitizeCPF(data.cpf)

    const user = users.find((user) => user.cpf === cpf)
    if (!user) {
        return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    const token = app.jwt.sign(
        { sub: user.id, role: user.role },
        { expiresIn: '7d' }
    )

    const { createdAt, ...publicUser } = user

    return reply.status(200).send({ user: publicUser, token })
}
