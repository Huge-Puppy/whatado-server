import "dotenv/config";
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

const main = async () => {
  await createConnection();
  // await createConnection({
  // type: "postgres",
  // database: "whatado",
  // username: process.env.POSTGRES_USERNAME,
  // password: process.env.POSTGRES_SECRET,
  // logging: true,
  // synchronize: !__prod__,
  // entities: [Event, User, Interest, Forum, Chat],
  // });

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, EventResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main();
