import { Event } from "../entities/Event";
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
import { EventFilterInput, EventInput } from "./inputs/eventInputs";
import { EventApiResponse, EventsApiResponse } from "./outputs/modelOutputs";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";
import { Forum } from "../entities/Forum";
import { User } from "../entities/User";
import { MyContext } from "../types";
import { ChatNotification } from "../entities/ChatNotification";
import { Wannago } from "../entities/Wannago";
import { DateRangeInput } from "./inputs/general";
import { Between, MoreThan } from "typeorm";
import * as admin from "firebase-admin";

@Resolver(() => Event)
export class EventResolver {
  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async flaggedEvents(): Promise<EventsApiResponse> {
    try {
      const events = await Event.find({
        where: {
          flags: MoreThan(0),
        },
        order: {
          flags: "DESC",
        },
        relations: [
          "relatedInterests",
          "creator",
          "wannago",
          "wannago.user",
          "invited",
        ],
      });
      return { ok: true, nodes: events };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
  }

  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async events(
    @Arg("dateRange", () => DateRangeInput) dateRange: DateRangeInput,
    @Arg("take", () => Int) take: number,
    @Arg("skip", () => Int) skip: number
  ): Promise<EventsApiResponse> {
    try {
      const events = await Event.find({
        where: {
          time: Between(dateRange.startDate, dateRange.endDate),
        },
        order: {
          time: "ASC",
        },
        skip: skip,
        take: take,
        relations: [
          "relatedInterests",
          "creator",
          "wannago",
          "wannago.user",
          "invited",
        ],
      });
      return { ok: true, nodes: events };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
  }

  @Mutation(() => BoolApiResponse)
  async flagEvent(
    @Arg("eventId", () => Int) eventId: number
  ): Promise<BoolApiResponse> {
    try {
      var event = await Event.findOneOrFail(eventId);
      event.flags = event.flags + 1;
      await event.save();
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "flag user", message: e.message }],
      };
    }
  }

  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async myEvents(@Ctx() { payload }: MyContext): Promise<EventsApiResponse> {
    try {
      const events = await Event.createQueryBuilder("Event")
        .leftJoinAndSelect("Event.relatedInterests", "Event__relatedInterests")
        .leftJoinAndSelect("Event.creator", "Event__creator")
        .leftJoinAndSelect("Event.wannago", "Event__wannago")
        .leftJoinAndSelect("Event.invited", "Event__invited")
        .relation("relatedInterests")
        .relation("creator")
        .relation("wannago")
        .relation("invited")
        .select()
        .where("Event__invited.id = :invitedId", { invitedId: payload!.userId })
        .orWhere("Event__creator.id = :creatorId", {
          creatorId: payload!.userId,
        })
        .orderBy("Event.time", "ASC")
        .getMany();
      return { ok: true, nodes: events };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "myevent server", message: e.message }],
      };
    }
  }

  @Query(() => EventApiResponse)
  @UseMiddleware(isAuth)
  async event(@Arg("id", () => Int) id: number): Promise<EventApiResponse> {
    try {
      return { ok: true, nodes: await Event.findOne(id) };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "event",
            message: e.message,
          },
        ],
      };
    }
  }

  @Mutation(() => EventApiResponse)
  @UseMiddleware(isAuth)
  async createEvent(
    @Arg("options") options: EventInput,
    @Ctx() { payload }: MyContext
  ): Promise<EventApiResponse> {
    try {
      const cn = await ChatNotification.create({
        user: { id: payload!.userId as any },
        notifications: 0,
      }).save();
      const forum = await Forum.create({
        userNotifications: [cn],
        chats: [],
      }).save();
      const relatedInterests = options.relatedInterestsIds.map((id) => ({
        id: id,
      }));
      console.log("saving interests", relatedInterests);
      const event = await Event.create({
        time: options.time,
        location: options.location,
        pictureUrl: options.pictureUrl,
        title: options.title,
        description: options.description,
        filterAge: options.filterAge,
        filterGender: options.filterGender,
        filterRadius: options.filterRadius,
        creator: { id: options.creatorId },
        wannago: [],
        invited: [],
        relatedInterests,
        forum: forum,
      }).save();
      return { ok: true, nodes: event };
    } catch (e) {
      return {
        ok: false,
        errors: [{ message: e.message }],
      };
    }
  }

  @Mutation(() => EventApiResponse)
  @UseMiddleware(isAuth)
  async updateEvent(
    @Arg("options") options: EventFilterInput
  ): Promise<EventApiResponse> {
    try {
      // should create new interests with client call before updating event
      const relatedInterests =
        options.relatedInterestsIds?.map(
          (id) =>
            ({
              id,
            } as any)
        ) ?? undefined;
      const creator = { id: options.creatorId };
      const forum = { id: options.forumId };
      const wannago =
        options.wannagoIds?.map((id) => ({ id } as any)) ?? undefined;
      const invited =
        options.invitedIds?.map((id) => ({ id } as any)) ?? undefined;
      delete options.relatedInterestsIds;
      delete options.creatorId;
      delete options.forumId;
      delete options.wannagoIds;
      delete options.invitedIds;
      const event = await Event.update(
        { id: options.id },
        {
          ...options,
          relatedInterests,
          creator,
          forum,
          wannago,
          invited,
        }
      );
      return { ok: true, nodes: event.raw[0] };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "updating event",
            message: `error updating event: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async deleteEvent(
    @Arg("eventId", () => Int) eventId: number
  ): Promise<BoolApiResponse> {
    try {
      await Event.delete(eventId);
      return { ok: true, nodes: true };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
  }

  @Mutation(() => EventApiResponse)
  @UseMiddleware(isAuth)
  async addInvite(
    @Arg("eventId", () => Int) eventId: number,
    @Arg("userId", () => Int) userId: number
  ): Promise<EventApiResponse> {
    try {
      const user = await User.findOneOrFail(userId);
      const event = await Event.findOneOrFail(eventId, {
        relations: [
          "creator",
          "relatedInterests",
          "wannago",
          "wannago.user",
          "invited",
        ],
      });
      event.invited = [...event.invited, user];
      await event.save();
      const message = {
        token: user.deviceId,
        data: {type: "event"},
        notification: {
          title: "You're Invited!",
          body: `You're invited to ${event.title}`,
        },
        contentAvailable: true,
        priority: "high",
      };
      await admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
      return { ok: true, nodes: event };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
  }

  @Mutation(() => EventApiResponse)
  @UseMiddleware(isAuth)
  async addWannago(
    @Arg("eventId", () => Int) eventId: number,
    @Arg("userId", () => Int) userId: number
  ): Promise<EventApiResponse> {
    try {
      await Wannago.create({
        declined: false,
        user: { id: userId },
        event: { id: eventId },
      }).save();
      const event = await Event.findOneOrFail(eventId, {
        relations: [
          "creator",
          "relatedInterests",
          "wannago",
          "wannago.user",
          "invited",
        ],
      });
      return { ok: true, nodes: event };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async deleteWannago(
    @Arg("id", () => Int) id: number
  ): Promise<BoolApiResponse> {
    try {
      await Wannago.delete(id);
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
    return { ok: true };
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async updateWannago(
    @Arg("id", () => Int) id: number,
    @Arg("declined") declined: boolean
  ): Promise<BoolApiResponse> {
    try {
      const wannago = await Wannago.findOneOrFail(id);
      wannago.declined = declined;
      await wannago.save();
      return { ok: true, nodes: true };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
  }

  @FieldResolver()
  async creator(
    @Root() event: Event,
    @Ctx() { userLoader }: MyContext
  ): Promise<User> {
    return userLoader.load(event.creatorId);
  }
  @FieldResolver()
  async wannago(@Root() event: Event, @Ctx() { wannagoLoader }: MyContext) {
    if (event.wannago == null) return [];
    return wannagoLoader.loadMany(event.wannago.map((wannago) => wannago.id));
  }
  @FieldResolver()
  async invited(@Root() event: Event, @Ctx() { userLoader }: MyContext) {
    if (event.invited == null) return [];
    return userLoader.loadMany(event.invited.map((user) => user.id));
  }

  @FieldResolver()
  relatedInterests(@Root() event: Event, @Ctx() { interestLoader }: MyContext) {
    return interestLoader.loadMany(
      event.relatedInterests.map((interest) => interest.id)
    );
  }
}
