import { Chat } from "../entities/Chat";
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  PubSub,
  PubSubEngine,
  Query,
  Resolver,
  Root,
  Subscription,
  UseMiddleware,
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { ChatApiResponse, ChatsApiResponse } from "./outputs/modelOutputs";
import { ChatFilterInput, ChatInput } from "./inputs/chatInputs";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";

@Resolver(() => Chat)
export class ChatResolver extends BaseEntity {
  @Query(() => ChatApiResponse)
  @UseMiddleware(isAuth)
  async chat(@Arg("id") id: number): Promise<ChatApiResponse> {
    try {
      const chat = await Chat.findOneOrFail({ where: { id } });
      return { nodes: chat };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "chat", message: `error finding chat: ${e.message}` },
        ],
      };
    }
  }

  @Query(() => ChatApiResponse)
  @UseMiddleware(isAuth)
  async lastChat(
    @Arg("forumId", () => Int) forumId: number
  ): Promise<ChatApiResponse> {
    try {
      const chat = await Chat.createQueryBuilder("Chat")
        .leftJoinAndSelect("Chat.author", "Chat__author")
        .leftJoinAndSelect("Chat.forum", "Chat__forum")
        .relation("author")
        .relation("forum")
        .select()
        .where("Chat__forum.id = :forumId", { forumId })
        .orderBy("Chat.createdAt", "DESC")
        .getOne();

      console.log(chat);
      return { ok: true, nodes: chat };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "chat", message: `error finding chat: ${e.message}` },
        ],
      };
    }
  }

  @Subscription(() => Chat, {
    // topics: ({args, payload, context }) => {
      // console.log(payload);
      // console.log(args);
      // console.log(context);
      // return "HELLO";
    // },
    topics: "CHAT"
  })
  chatSubscription(@Root() chat: Chat): Chat {
    console.log('new event');
    return chat;
  }

  @Query(() => ChatsApiResponse)
  @UseMiddleware(isAuth)
  async chats(
    @Arg("forumId", () => Int) forumId: number
  ): Promise<ChatsApiResponse> {
    try {
      const chats = await Chat.createQueryBuilder("Chat")
        .leftJoinAndSelect("Chat.author", "Chat__author")
        .leftJoinAndSelect("Chat.forum", "Chat__forum")
        .relation("author")
        .relation("forum")
        .select()
        .where("Chat__forum.id = :forumId", { forumId })
        .orderBy("Chat.createdAt", "DESC")
        .getMany();
      return { ok: true, nodes: chats };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "chat", message: `error retrieving chats: ${e.message}` },
        ],
      };
    }
  }

  @Mutation(() => ChatApiResponse)
  @UseMiddleware(isAuth)
  async createChat(
    @Arg("options") options: ChatInput,
    @PubSub() pubSub: PubSubEngine
  ): Promise<ChatApiResponse> {
    try {
      const chat = await Chat.create({
        text: options.text,
        author: { id: options.authorId },
        forum: { id: options.forumId },
      }).save();
      
      await pubSub.publish("CHAT", chat);
      console.log('sent chat');
      return { nodes: chat };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "chat", message: `error creating chat: ${e.message}` },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async deleteChat(@Arg("id") id: number): Promise<BoolApiResponse> {
    try {
      await Chat.delete({ id });
    } catch (e) {
      return { ok: false, errors: [{ message: e.message }] };
    }
    return { nodes: true };
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async updateChat(
    @Arg("options") options: ChatFilterInput
  ): Promise<BoolApiResponse> {
    try {
      await Chat.update({ id: options.id }, { text: options.text });
      return { nodes: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "chat", message: `error updating chat: ${e.message}` },
        ],
      };
    }
  }

  @FieldResolver()
  async author(@Root() chat: Chat, @Ctx() { userLoader }: MyContext) {
    if (chat.author == null) return [];
    return userLoader.load(chat.author.id);
  }

  @FieldResolver()
  async forum(@Root() chat: Chat, @Ctx() { forumLoader }: MyContext) {
    if (chat.forum == null) return [];
    return forumLoader.load(chat.author.id);
  }
}
