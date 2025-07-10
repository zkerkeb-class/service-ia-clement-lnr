const fastify = require("fastify")({ logger: true });
const cors = require("@fastify/cors");
const { PrismaClient } = require('./generated/prisma')
const chatbot = require("./routes/chat.js");

// Prisma
const prisma = new PrismaClient()

// CORS
fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    if (!origin || allowedOrigins.includes(origin) || origin.includes('apex.com')) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'PUT', 'POST', 'OPTIONS', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// hello route
fastify.get("/", function (request, reply) {
  reply.send({ hello: "Welcome to Apex chatbot API !" });
});

// app routes
fastify.register(chatbot, { prefix: "api/chat" });

// Run the server
fastify.listen({ port: process.env.FASTIFY_PORT || 4002 , host: '0.0.0.0' }, function (error, address) {
  if (error) {
    fastify.log.error(error);
    process.exit(1);
  }
  fastify.log.info(`server listening on ${address}`)
});
