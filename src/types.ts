import { Request, Response } from "express";
import { registerEnumType } from "type-graphql";
import { createUserLoader } from "./resolvers/loaders/userLoader";
import { createInterestLoader } from "./resolvers/loaders/interestLoader";
import { createChatNotificationLoader } from "./resolvers/loaders/chatNotificationLoader";
import { createEventLoader } from "./resolvers/loaders/eventLoader";
import { createChatLoader } from "./resolvers/loaders/chatLoader";
import { createForumLoader } from "./resolvers/loaders/forumLoader";

export type MyContext = {
  req: Request;
  res: Response;
  payload?: { userId: string; refreshCount: string };
  userLoader: ReturnType<typeof createUserLoader>;
  interestLoader: ReturnType<typeof createInterestLoader>;
  chatNotificationLoader: ReturnType<typeof createChatNotificationLoader>;
  eventLoader: ReturnType<typeof createEventLoader>;
  chatLoader: ReturnType<typeof createChatLoader>;
  forumLoader: ReturnType<typeof createForumLoader>;
};

export enum Gender {
  FEMALE = "girls",
  MALE = "boys",
  BOTH = "both",
}

registerEnumType(Gender, { name: "Gender" });
