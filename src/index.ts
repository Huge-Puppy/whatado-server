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
import { verify } from "jsonwebtoken";
import { User } from "./entities/User";
import { createAccessToken, createRefreshToken } from "./auth";

const main = async () => {
  await createConnection();

  const app = express();

  app.get("/get_schema", async (_, res) => {
    return res.download(`${__dirname}/schema.graphql`, "schema.graphql");
  });

  app.post("/refresh_token", async (req, res) => {
    const token = req.body.refreshToken;
    if (!token) {
      return res.send({ ok: false, accessToken: "", refreshToken: "" });
    }

    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (e) {
      return res.send({ ok: false, accessToken: "", refreshToken: "" });
    }

    const user = await User.findOneOrFail({ id: payload.userId });
    if (!user) {
      return res.send({ ok: false, accessToken: "", refreshToken: "" });
    }
    return res.send({
      ok: true,
      accessToken: createAccessToken(user),
      refreshToken: createRefreshToken(user),
    });
  });

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      emitSchemaFile: `${__dirname}/schema.graphql`,
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
