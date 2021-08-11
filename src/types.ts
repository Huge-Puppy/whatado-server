import { Request, Response } from "express";
import { registerEnumType } from "type-graphql";
import { createUserLoader } from "./resolvers/loaders/creatorLoader";
import { createInterestLoader } from "./resolvers/loaders/interestLoader";

export type MyContext = {
  req: Request;
  res: Response;
  payload?: { userId: string; refreshCount: string };
  userLoader: ReturnType<typeof createUserLoader>;
  interestLoader: ReturnType<typeof createInterestLoader>;
};

export enum Gender {
  FEMALE = "girls",
  MALE = "boys",
  BOTH = "both",
}

registerEnumType(Gender, { name: "Gender" });
