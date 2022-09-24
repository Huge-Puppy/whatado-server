import "./env";
import "reflect-metadata";
import { __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
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
import { createUserLoader } from "./resolvers/loaders/userLoader";
import { createInterestLoader } from "./resolvers/loaders/interestLoader";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";
import { createServer } from "http";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { createChatNotificationLoader } from "./resolvers/loaders/chatNotificationLoader";
import { createEventLoader } from "./resolvers/loaders/eventLoader";
import { createChatLoader } from "./resolvers/loaders/chatLoader";
import { createForumLoader } from "./resolvers/loaders/forumLoader";
import { createWannagoLoader } from "./resolvers/loaders/wannagoLoader";
import * as admin from "firebase-admin";
import { ChatNotificationResolver } from "./resolvers/chat_notification";
import { customAuthChecker } from "./middleware/authorized";
import { createGroupLoader } from "./resolvers/loaders/groupLoader";
import { GroupResolver } from "./resolvers/group";
import axios from "axios";
import { ReferralResolver } from "./resolvers/referral";
import { GroupIconResolver } from "./resolvers/groupIcon";
import { createGroupIconLoader } from "./resolvers/loaders/groupIconLoader";
var serviceAccount = require("../firebase-adminsdk.json");

if (__prod__) {
  console.log = function () {};
}

const main = async () => {
  await createConnection();
  const app = express();

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://whatado-default-rtdb.firebaseio.com",
  });

  app.get("/get_schema", async (_, res) => {
    return res.download(`${__dirname}/schema.graphql`, "schema.graphql");
  });

  app.get("/autocomplete", async (req, res) => {
    const authorization = req.headers["authorization"];
    const token = authorization?.split(" ")[1];
    if (!token) {
      return res.send({
        data: null,
      });
    }
    let payload: any = null;
    payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
    if (!payload) {
      return res.send({
        data: null,
      });
    }
    const partial = req.query.partial;
    const location = req.query.location;
    let url: string = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${partial}&location=${location}&key=${process.env.PLACES_KEY}`;
    console.log(url);
    let response = await axios.get(url);
    let data = response.data;
    return res.send({ data });
  });

  app.get("/place_details", async (req, res) => {
    try {
      const authorization = req.headers["authorization"];
      const token = authorization?.split(" ")[1];
      if (!token) {
        return res.send({
          ok: null,
        });
      }
      let payload: any = null;
      payload = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      if (!payload) {
        return res.send({
          data: null,
        });
      }
      const place_id = req.query.placeId;
      const fields = "name,geometry,adr_address";
      let url: string = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${process.env.PLACES_KEY}`;
      let response = await axios.get(url);
      let data = response.data;
      return res.send({ data });
    } catch (e) {
      return res.send({
        ok: null,
      });
    }
  });

  app.post("/refresh_token", async (req, res) => {
    const authorization = req.headers["authorization"];
    const token = authorization?.split(" ")[1];
    if (!token) {
      return res.send({
        ok: false,
        accessToken: null,
        refreshToken: null,
        userId: null,
      });
    }

    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
      const user = await User.findOneOrFail({ id: payload.userId });
      if (!user) {
        return res.send({
          ok: false,
          accessToken: null,
          refreshToken: null,
          userId: null,
        });
      }
      if (payload.refreshCount === user.refreshCount) {
        return res.send({
          ok: true,
          accessToken: createAccessToken(user),
          refreshToken: createRefreshToken(user),
          userId: payload.userId,
        });
      } else {
        return res.send({
          ok: false,
          accessToken: null,
          refreshToken: null,
          userId: null,
        });
      }
    } catch (e) {
      return res.send({
        ok: false,
        accessToken: null,
        refreshToken: null,
        userId: null,
      });
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
      EventResolver,
      UserResolver,
      InterestResolver,
      ChatResolver,
      ForumResolver,
      ChatNotificationResolver,
      GroupResolver,
      ReferralResolver,
      GroupIconResolver,
    ],
    validate: false,
    pubSub,
    authMode: "null",
    authChecker: customAuthChecker,
  });
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req, res }): MyContext => ({
      req,
      res,
      userLoader: createUserLoader(),
      interestLoader: createInterestLoader(),
      chatNotificationLoader: createChatNotificationLoader(),
      eventLoader: createEventLoader(),
      chatLoader: createChatLoader(),
      forumLoader: createForumLoader(),
      wannagoLoader: createWannagoLoader(),
      groupLoader: createGroupLoader(),
      groupIconLoader: createGroupIconLoader(),
      isDataLoaderAttached: true,
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
        context: MyContext
      ) {
        return context;
      },
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
