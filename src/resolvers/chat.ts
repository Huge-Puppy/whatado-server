import { Chat } from "../entities/Chat";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { BaseEntity } from "typeorm";
import { ChatApiResponse, ChatsApiResponse } from "./outputs/chatOutputs";
import { ChatInput } from "./inputs/chatInputs";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";

@Resolver()
export class ChatResolver extends BaseEntity {
  @Query(() => ChatApiResponse)
  @UseMiddleware(isAuth)
  async chat(@Arg("id") id: number): Promise<ChatApiResponse> {
    try {
      const chat = await Chat.findOneOrFail({ where: { id } });
      return { nodes: chat };
    } catch (e) {
      return {
        errors: [
          { field: "chat", message: `error finding chat: ${e.message}` },
        ],
      };
    }
  }

  @Query(() => ChatsApiResponse)
  @UseMiddleware(isAuth)
  async chats(@Arg("options") options: ChatInput): Promise<ChatsApiResponse> {
    let chats;
    try {
      chats = await Chat.find({ where: { ...options } });
    } catch (e) {
      return {
        errors: [
          { field: "chat", message: `error retrieving chats: ${e.message}` },
        ],
      };
    }
    return { nodes: chats };
  }

  @Mutation(() => ChatApiResponse)
  @UseMiddleware(isAuth)
  async createChat(
    @Arg("options") options: ChatInput
  ): Promise<ChatApiResponse> {
    let chat;
    try {
      chat = await Chat.create({ ...options }).save();
    } catch (e) {
      return {
        errors: [
          { field: "chat", message: `error creating chat: ${e.message}` },
        ],
      };
    }
    return { nodes: chat };
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async deleteChat(@Arg("id") id: number): Promise<BoolApiResponse> {
    try {
      await Chat.delete({ id });
    } catch (e) {
      return { nodes: false, errors: [{ message: e.message }] };
    }
    return { nodes: true };
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async updateChat(
    @Arg("options") options: ChatInput
  ): Promise<BoolApiResponse> {
    try {
      await Chat.update({ id: options.id }, { ...options });
      return { nodes: true };
    } catch (e) {
      return {
        errors: [
          { field: "chat", message: `error updating chat: ${e.message}` },
        ],
      };
    }
  }
}
