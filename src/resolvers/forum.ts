import { Forum } from "../entities/Forum";
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
import { BaseEntity } from "typeorm";
import { ForumApiResponse, ForumsApiResponse } from "./outputs/modelOutputs";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { ChatNotification } from "../entities/ChatNotification";

@Resolver(() => Forum)
export class ForumResolver extends BaseEntity {
  @Query(() => ForumApiResponse)
  @UseMiddleware(isAuth)
  async forum(@Arg("id", () => Int) id: number): Promise<ForumApiResponse> {
    try {
      const forum = await Forum.findOneOrFail(id, {
        relations: ["chats", "event", "userNotifications"],
      });
      return { ok: true, nodes: forum };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "forum", message: `error finding forum: ${e.message}` },
        ],
      };
    }
  }

  @Query(() => ForumsApiResponse)
  @UseMiddleware(isAuth)
  async forumsByEventId(
    @Arg("ids", () => [Int!]!) ids: number[],
    @Ctx() { payload }: MyContext
  ): Promise<ForumsApiResponse> {
    try {
      const forums = await Forum.createQueryBuilder("Forum")
        .leftJoinAndSelect("Forum.chats", "Forum__chats")
        .leftJoinAndSelect("Forum.event", "Forum__event")
        .leftJoinAndSelect("Forum.moderators", "Forum__moderators")
        .leftJoinAndSelect(
          "Forum.userNotifications",
          "Forum__userNotifications"
        )
        .relation("chats")
        .relation("event")
        .relation("userNotifications")
        .relation("moderators")
        .select()
        .where("Forum__event.id IN (:...ids)", {
          ids: ids,
        })
        .andWhere("Forum__userNotifications.user.id = :myId", {
          myId: payload!.userId,
        })
        .getRawAndEntities();

      return { ok: true, nodes: forums.entities };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "forum", message: `error retrieving forums: ${e.message}` },
        ],
      };
    }
  }

  @Mutation(() => ForumApiResponse)
  @UseMiddleware(isAuth)
  async createForum(
    @Arg("eventId", () => Int) eventId: number,
    @Ctx() { payload }: MyContext
  ): Promise<ForumApiResponse> {
    try {
      const forum = Forum.create({ chats: [], event: { id: eventId } });
      ChatNotification.create({
        forum: forum,
        lastAccessed: new Date(),
        user: { id: payload!.userId as any },
      });
      return {
        nodes: forum,
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "forum", message: `error creating forum: ${e.message}` },
        ],
      };
    }
  }
  @FieldResolver()
  async userNotifications(
    @Root() forum: Forum,
    @Ctx() { chatNotificationLoader }: MyContext
  ) {
    const val = await chatNotificationLoader.loadMany(
      forum.userNotifications.map((cn) => cn.id)
    );
    return val;
  }

  @FieldResolver()
  event(@Root() forum: Forum, @Ctx() { eventLoader }: MyContext) {
    return eventLoader.load(forum.event.id);
  }

  @FieldResolver()
  chats(@Root() forum: Forum, @Ctx() { chatLoader }: MyContext) {
    if (forum.chats == null) return [];
    return chatLoader.loadMany(forum.chats.slice(forum.chats.length-1).map((chat) => chat.id));
  }
}
