import { Request, Response } from "express";
import { registerEnumType } from "type-graphql";
import { createUserLoader } from "./resolvers/loaders/userLoader";
import { createInterestLoader } from "./resolvers/loaders/interestLoader";
import { createChatNotificationLoader } from "./resolvers/loaders/chatNotificationLoader";
import { createEventLoader } from "./resolvers/loaders/eventLoader";
import { createChatLoader } from "./resolvers/loaders/chatLoader";
import { createForumLoader } from "./resolvers/loaders/forumLoader";
import { createWannagoLoader } from "./resolvers/loaders/wannagoLoader";
import { createGroupLoader } from "./resolvers/loaders/groupLoader";
import { createGroupIconLoader } from "./resolvers/loaders/groupIconLoader";
import { createFriendRequestLoader } from "./resolvers/loaders/friendRequestLoader";

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
  wannagoLoader: ReturnType<typeof createWannagoLoader>;
  friendRequestLoader: ReturnType<typeof createFriendRequestLoader>;
  groupLoader: ReturnType<typeof createGroupLoader>;
  groupIconLoader: ReturnType<typeof createGroupIconLoader>;
  isDataLoaderAttached: Boolean;
};

export enum Gender {
  FEMALE = "female",
  MALE = "male",
  BOTH = "both",
}

export enum Privacy {
  PUBLIC = "public",
  GROUP = "friends",
  PRIVATE = "private",
}

export enum SortType {
  NEWEST = "newest",
  SOONEST = "soonest",
}

registerEnumType(Gender, { name: "Gender" });
registerEnumType(Privacy, { name: "Privacy" });
registerEnumType(SortType, { name: "SortType" });
