import "./env";
import "reflect-metadata";
import { __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { EventResolver } from "./resolvers/event";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";
import { createConnection } from "typeorm";
import { verify } from "jsonwebtoken";
import { User } from "./entities/User";
import { createAccessToken, createRefreshToken } from "./auth";
import { InterestResolver } from "./resolvers/interest";
import { ChatResolver } from "./resolvers/chat";
import { ForumResolver } from "./resolvers/forum";
import { createUserLoader } from "./resolvers/loaders/creatorLoader";
import { createInterestLoader } from "./resolvers/loaders/interestLoader";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";
import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
// import WebSocket from "ws";

const main = async () => {
  await createConnection();
  const app = express();

  app.get("/get_schema", async (_, res) => {
    return res.download(`${__dirname}/schema.graphql`, "schema.graphql");
  });

  app.post("/refresh_token", async (req, res) => {
    const authorization = req.headers["authorization"];
    const token = authorization?.split(" ")[1];
    if (!token) {
      return res.send({ ok: false, accessToken: "", refreshToken: "" });
    }

    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (e) {
      return res.send({ ok: false, accessToken: null, refreshToken: null });
    }

    const user = await User.findOneOrFail({ id: payload.userId });
    if (!user) {
      return res.send({ ok: false, accessToken: "", refreshToken: "" });
    }
    if (payload.refreshCount === user.refreshCount) {
      return res.send({
        ok: true,
        accessToken: createAccessToken(user),
        refreshToken: createRefreshToken(user),
      });
    } else {
      User.update(
        { id: user.id },
        { refreshCount: user.refreshCount ?? 0 + 1 }
      );
      return res.send({ ok: false, accessToken: null, refreshToken: null });
    }
  });

  const options = {
    host: "localhost",
    port: 6379,
    retryStrategy: (times: any) => Math.min(times * 50, 2000),
  };
  const pubSub = new RedisPubSub({
    publisher: new Redis(options),
    subscriber: new Redis(options),
  });

  const schema = await buildSchema({
    emitSchemaFile: `${__dirname}/schema.graphql`,
    resolvers: [
      HelloResolver,
      EventResolver,
      UserResolver,
      InterestResolver,
      ChatResolver,
      ForumResolver,
    ],
    validate: false,
    pubSub,
  });
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }): MyContext => ({
      req,
      res,
      userLoader: createUserLoader(),
      interestLoader: createInterestLoader(),
    }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
  const httpServer = createServer(app);
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      async onConnect(
        // connectionParams: Object,
        // webSocket: WebSocket,
        // context: MyContext
      ) {},
    },
    {
      server: httpServer,
      path: apolloServer.graphqlPath,
    }
  );

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => subscriptionServer.close());
  });

  httpServer.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main();
