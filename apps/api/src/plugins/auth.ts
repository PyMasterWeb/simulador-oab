import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { env } from "../utils/env.js";

export default fp(async (app) => {
  app.register(jwt, { secret: env.jwtSecret });

  app.decorate("authenticate", async function authenticate(request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ message: "Não autorizado" });
    }
  });
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}
