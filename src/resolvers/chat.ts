import { Chat } from "../entities/Chat";
import { Forum } from "../entities/Forum";
import { User } from "../entities/User";
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
import { MyContext } from "../types";
import { hasLoader } from "../middleware/hasLoader";
import * as admin from "firebase-admin";
import { SurveyInput } from "./inputs/surveyInput";
import { Survey } from "../entities/Survey";
import { Answer } from "../entities/Answer";

@Resolver(() => Chat)
export class ChatResolver extends BaseEntity {
  @Query(() => ChatApiResponse)
  @UseMiddleware(isAuth)
  async chat(@Arg("id", () => Int) id: number): Promise<ChatApiResponse> {
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

  @Query(() => ChatsApiResponse)
  @UseMiddleware(isAuth)
  async flaggedChats(): Promise<ChatsApiResponse> {
    try {
      const chats = await Chat.createQueryBuilder("Chat")
        .leftJoinAndSelect("Chat.author", "Chat__author")
        .leftJoinAndSelect("Chat.forum", "Chat__forum")
        .relation("author")
        .relation("forum")
        .select()
        .where("Chat.flags > :flagged", { flagged: 0 })
        .orderBy("Chat.flags", "DESC")
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

  @Query(() => ChatsApiResponse)
  @UseMiddleware(isAuth)
  async chats(
    @Arg("forumId", () => Int) forumId: number,
    @Arg("take", () => Int, { nullable: true }) take: number | undefined,
    @Arg("skip", () => Int, { nullable: true }) skip: number | undefined
  ): Promise<ChatsApiResponse> {
    try {
      const chats = await Chat.createQueryBuilder("Chat")
        .leftJoinAndSelect("Chat.author", "Chat__author")
        .leftJoinAndSelect("Chat.forum", "Chat__forum")
        .leftJoinAndSelect("Chat.survey", "Chat__survey")
        .leftJoinAndSelect("Chat__survey.answers", "Chat__survey__answers")
        .leftJoinAndSelect(
          "Chat__survey__answers.votes",
          "Chat__survey__answers__votes"
        )
        .relation("author")
        .relation("forum")
        .relation("survey")
        .relation("survey.answers")
        .relation("survey.answers.votes")
        .select()
        .where("Chat__forum.id = :forumId", { forumId })
        .orderBy("Chat.createdAt", "DESC")
        .skip(skip)
        .take(take)
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

  @Subscription(() => Chat, {
    topics: ({ args }) => {
      return `${args.forumId}`;
    },
  })
  @UseMiddleware(hasLoader)
  async chatSubscription(
    @Arg("forumId", () => Int) _forumId: number,
    @Root() chat: Chat
  ): Promise<Chat> {
    chat.createdAt = new Date(chat.createdAt);
    if (chat.survey) {
      chat.survey.answers.forEach((a, i, as) => {
        as[i].votes.forEach((_, j, us) => {
          us[j].birthday = new Date(us[j].birthday);
        });
      });
    }
    return chat;
  }

  @Mutation(() => ChatApiResponse)
  @UseMiddleware(isAuth)
  async createChat(
    @Arg("options") chatOptions: ChatInput,
    @Arg("surveyOptions", { nullable: true }) surveyOptions: SurveyInput,
    @PubSub() pubSub: PubSubEngine
  ): Promise<ChatApiResponse> {
    try {
      const forum = await Forum.findOneOrFail(
        { id: chatOptions.forumId },
        { relations: ["userNotifications", "userNotifications.user"] }
      );
      const author = await User.findOneOrFail({ id: chatOptions.authorId });
      let survey: Survey | undefined = undefined;
      if (surveyOptions != null) {
        survey = new Survey();
        survey.question = surveyOptions.question;
        survey.answers = surveyOptions.answers.map<Answer>((answerText) => {
          let newAnswer = new Answer();
          newAnswer.votes = [];
          newAnswer.text = answerText;
          return newAnswer;
        });
        await survey.save();
      }
      const chat = await Chat.create({
        text: chatOptions.text,
        author,
        forum,
        survey,
      }).save();

      await pubSub.publish(`${chatOptions.forumId}`, chat);
      const message = {
        data: {
          type: "chat",
          forumId: `${chatOptions.forumId}`,
          eventId: `${chatOptions.eventId}`,
        },
        notification: {
          title: `New Message from ${author.name}`,
          body:
            chat.text.length > 20
              ? `${chat.text.substring(0, 20)}...`
              : chat.text,
        },
      };
      const options = {
        priority: "high",
        contentAvailable: true,
      };
      await admin
        .messaging()
        .sendToDevice(
          forum.userNotifications
            .filter((un) => !un.muted && un.user.deviceId != author.deviceId)
            .map((un) => un.user.deviceId),
          message,
          options
        )
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
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
  async deleteChat(@Arg("id", () => Int) id: number): Promise<BoolApiResponse> {
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

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("chatId", () => Int) chatId: number,
    @Arg("answerId", () => Int) answerId: number,
    @Arg("forumId", () => Int) forumId: number,
    @Ctx() { payload }: MyContext,
    @PubSub() pubSub: PubSubEngine
  ): Promise<BoolApiResponse> {
    try {
      const chat = await Chat.findOneOrFail(chatId, {
        relations: [
          "author",
          "survey",
          "survey.answers",
          "survey.answers.votes",
        ],
      });
      const oldanswer = chat.survey.answers.find((a) =>
        a.votes.map((e) => e.id).includes(Number(payload!.userId))
      );
      if (oldanswer) {
        oldanswer.votes = oldanswer.votes.filter(
          (a) => a.id != Number(payload!.userId)
        );
        await oldanswer.save();
      }
      const newanswer = chat.survey.answers.find((a) => a.id === answerId);
      const user = await User.findOneOrFail(payload!.userId);
      newanswer?.votes.push(user);
      await newanswer?.save();
      await pubSub.publish(`${forumId}`, chat);
      return {
        ok: true,
        nodes: true,
      };
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
