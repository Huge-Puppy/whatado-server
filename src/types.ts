import { Request, Response } from "express";
import { registerEnumType } from "type-graphql";

export type MyContext = {
  req: Request;
  res: Response;
  payload?: { userId: string; refreshCount: string };
};

export enum Gender {
  FEMALE = "girls",
  MALE = "boys",
  BOTH = "both",
}

registerEnumType(Gender, { name: "Gender" });
