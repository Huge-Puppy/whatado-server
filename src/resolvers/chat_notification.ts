import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { ChatNotificationsApiResponse } from "./outputs/modelOutputs";
import { isAuth } from "../middleware/isAuth";
import { ChatNotification } from "../entities/ChatNotification";
import { BoolApiResponse } from "./outputs/general";

@Resolver(() => ChatNotification)
export class ChatNotificationResolver {
  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async access(@Arg("id", () => Int) id: number): Promise<BoolApiResponse> {
    try {
      const cn = await ChatNotification.findOneOrFail(id);
      cn.lastAccessed = new Date();
      cn.save();
      return { ok: true, nodes: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "chat notification",
            message: `error accessing chat notification: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async mute(@Arg("id", () => Int) id: number): Promise<BoolApiResponse> {
    try {
      const cn = await ChatNotification.findOneOrFail(id);
      cn.muted = true;
      cn.save();
      return { ok: true, nodes: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "chat notification",
            message: `error muting forum: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async unmute(
    @Arg("id", () => Int) id: number,
  ): Promise<BoolApiResponse> {
    try {
      const cn = await ChatNotification.findOneOrFail(id);
      cn.muted = false;
      cn.save();
      return { ok: true, nodes: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "chat notification",
            message: `error unmuting forum: ${e.message}`,
          },
        ],
      };
    }
  }

  @Query(() => ChatNotificationsApiResponse)
  @UseMiddleware(isAuth)
  async myChatNotifications(
    @Ctx() { payload }: MyContext
  ): Promise<ChatNotificationsApiResponse> {
    try {
      const cns = await ChatNotification.createQueryBuilder("CN")
        .leftJoinAndSelect("CN.forum", "CN__forum")
        .leftJoinAndSelect("CN.user", "CN__user")
        .leftJoinAndSelect("CN.userNotifications", "CN__userNotifications")
        .relation("user")
        .relation("forum")
        .select()
        .andWhere("CN__user.id EQ (:id)", {
          id: payload?.userId,
        })
        .getRawAndEntities();

      return { ok: true, nodes: cns.entities };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "chatnotification",
            message: `error getting chat notifications: ${e.message}`,
          },
        ],
      };
    }
  }

  @FieldResolver()
  user(@Root() cn: ChatNotification, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(cn.user.id);
  }

  @FieldResolver()
  forum(@Root() cn: ChatNotification, @Ctx() { forumLoader }: MyContext) {
    return forumLoader.load(cn.forum.id);
  }
}