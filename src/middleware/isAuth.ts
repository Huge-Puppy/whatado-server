import { AuthenticationError } from "apollo-server-express";
import { verify } from "jsonwebtoken";
import { MyContext } from "../types";
import { MiddlewareFn } from "type-graphql";
import { __prod__ } from "../constants";

if (__prod__) {
  console.log = function () { };
}

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  const authorization = context.req.headers['authorization'];
  if (!authorization) {
    throw new Error("not authenticated");
  }
  try {
    const token = authorization.split(" ")[1]
    const payload = verify(token ?? " ", process.env.ACCESS_TOKEN_SECRET!);
    context.payload = payload as any;
  } catch(e) {
    console.log(e);
    throw new AuthenticationError("not authenticated");
  }
  return next();
};
