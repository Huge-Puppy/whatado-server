import { MyContext } from "../types";
import { MiddlewareFn } from "type-graphql";
import { createChatLoader } from "../resolvers/loaders/chatLoader";
import { createUserLoader } from "../resolvers/loaders/userLoader";
import { createInterestLoader } from "../resolvers/loaders/interestLoader";
import { createChatNotificationLoader } from "../resolvers/loaders/chatNotificationLoader";
import { createEventLoader } from "../resolvers/loaders/eventLoader";
import { createForumLoader } from "../resolvers/loaders/forumLoader";
import { createGroupLoader } from "../resolvers/loaders/groupLoader";

export const hasLoader: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.isDataLoaderAttached) {
    context.isDataLoaderAttached = true;
      context.userLoader= createUserLoader();
      context.interestLoader= createInterestLoader();
      context.chatNotificationLoader= createChatNotificationLoader();
      context.eventLoader= createEventLoader();
      context.chatLoader= createChatLoader();
      context.forumLoader= createForumLoader();
      context.groupLoader= createGroupLoader();
  }
  return next();
};
