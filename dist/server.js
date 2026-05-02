// src/app.ts
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";

// src/utils/cpf.ts
function sanitizeCPF(cpf) {
  return cpf.replace(/\D/g, "");
}

// src/controllers/authController.ts
import { randomUUID } from "crypto";
var users = [
  {
    id: "c22c01e6-4051-4510-9e33-e74404de02ab",
    firstName: "admin",
    lastName: "admin",
    cpf: "12345678901",
    phone: "12345678901",
    role: "ADMIN",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "a22c01e6-4051-4510-9e33-e74404de02ab",
    firstName: "Ecthon",
    lastName: "Almeida",
    cpf: "12436462938",
    phone: "994012345",
    role: "CUSTOMER",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
async function registerHandler(app2, data, reply) {
  const cpf = sanitizeCPF(data.cpf);
  const existigUser = users.find((user2) => user2.cpf === cpf);
  if (existigUser) {
    return reply.status(409).send({ error: "CPF j\xE1 cadastrado" });
  }
  const user = {
    id: randomUUID(),
    firstName: data.firstName,
    lastName: data.lastName,
    cpf,
    phone: data.phone,
    role: "CUSTOMER",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  users.push(user);
  const token = app2.jwt.sign(
    { sub: user.id, role: user.role },
    { expiresIn: "7d" }
  );
  const { createdAt, ...publicUser } = user;
  return reply.status(201).send({ user: publicUser, token });
}
async function loginHandler(app2, data, reply) {
  const cpf = sanitizeCPF(data.cpf);
  const user = users.find((user2) => user2.cpf === cpf);
  if (!user) {
    return reply.status(404).send({ error: "Usu\xE1rio n\xE3o encontrado" });
  }
  const token = app2.jwt.sign(
    { sub: user.id, role: user.role },
    { expiresIn: "7d" }
  );
  const { createdAt, ...publicUser } = user;
  return reply.status(200).send({ user: publicUser, token });
}

// src/routes/auth.ts
var AuthRoutes = class {
  constructor(app2) {
    app2.post("/auth/register", async (request, reply) => {
      return registerHandler(app2, request.body, reply);
    });
    app2.post("/auth/login", async (request, reply) => {
      return loginHandler(app2, request.body, reply);
    });
  }
};

// src/controllers/eventsController.ts
var events = [
  {
    id: "event-1",
    title: "Almo\xE7o de domingo - Churrasquinho",
    date: "20/10/2026",
    active: true,
    items: [
      { id: 1, name: "Frango combo", description: "Espetinho de frango, arroz, farofa e batatonese.", price: 20 },
      { id: 2, name: "Frango simples", description: "Espetinho de frango, arroz e farofa.", price: 15 },
      { id: 3, name: "Carne combo", description: "Espetinho de carne, arroz, farofa e batatonese. Suco e pudim inclusos", price: 30 },
      { id: 4, name: "Carne simples", description: "Espetinho de carne, arroz e farofa.", price: 20 }
    ]
  },
  {
    id: "event-2",
    title: "Jantar de s\xE1bado - Rod\xEDzio de massas",
    date: "19/10/2026",
    active: false,
    items: [
      { id: 1, name: "Rod\xEDzio de Massas", description: "Fettuccine, talharim, penne e canelone com molhos variados.", price: 55 },
      { id: 2, name: "Sobremesa Especial", description: "Pudim ou mousse \xE0 escolha.", price: 10 }
    ]
  }
];
async function getEventsHandler(request, reply) {
  const { all, active } = request.query;
  if (all === "true") {
    return reply.send({ events });
  }
  if (active !== void 0) {
    const isActive = active === "true";
    return reply.send({ events: events.filter((event) => event.active === isActive) });
  }
  return reply.send({ events: events.filter((event) => event.active) });
}
async function getEventByIdHandler(request, reply) {
  const { id } = request.params;
  const event = events.find((event2) => event2.id === id);
  if (!event) {
    return reply.status(404).send({ error: "Evento n\xE3o encontrado" });
  }
  return reply.send({ event });
}
async function updateEventActiveStatusHandler(request, reply) {
  const { id } = request.params;
  const { active } = request.body;
  const event = events.find((event2) => event2.id === id);
  if (!event) {
    return reply.status(404).send({ error: "Evento n\xE3o encontrado" });
  }
  event.active = active;
  return reply.send({ event });
}

// src/routes/events.ts
var EventsRoutes = class {
  constructor(app2) {
    app2.get(
      "/events",
      async (request, reply) => {
        return getEventsHandler(request, reply);
      }
    );
    app2.get(
      "/events/:id",
      async (request, reply) => {
        return getEventByIdHandler(request, reply);
      }
    );
    app2.patch(
      "/events/:id/active",
      async (request, reply) => {
        return updateEventActiveStatusHandler(request, reply);
      }
    );
  }
};

// src/app.ts
dotenv.config();
var app = Fastify({
  logger: true
});
app.register(cors);
app.register(fastifyJwt, { secret: process.env.JWT_SECRET ?? "dev-secret" });
new AuthRoutes(app);
new EventsRoutes(app);
app.get("/ping", async (request, reply) => {
  return { pong: true };
});
var app_default = app;

// src/server.ts
app_default.listen({ port: Number(process.env.PORT) || 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening on ${address}`);
});
