import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { registerEnumType } from "type-graphql";

export type MyContext = {
  req: Request & {
    session: Session & Partial<SessionData> & { userId?: number };
  };
  res: Response;
};

export enum Gender {
  FEMALE = "girls",
  MALE = "boys",
  BOTH = "both",
}

registerEnumType(Gender, { name: "Gender" });
