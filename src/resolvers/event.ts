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
import { Gender, MyContext, Privacy, SortType } from "../types";
import { ChatNotification } from "../entities/ChatNotification";
import { Wannago } from "../entities/Wannago";
import { DateRangeInput } from "./inputs/general";
import { MoreThan, Brackets } from "typeorm";
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
    @Ctx() { payload }: MyContext,
    @Arg("dateRange", () => DateRangeInput) dateRange: DateRangeInput,
    @Arg("take", () => Int) take: number,
    @Arg("skip", () => Int) skip: number,
    @Arg("sortType", () => SortType) sortType: SortType
  ): Promise<EventsApiResponse> {
    try {
      const me = await User.findOneOrFail(payload!.userId, {
        relations: ["interests", "friends", "inverseFriends"],
      });
      //calculate birthday
      const now = new Date();
      var age = now.getFullYear() - me.birthday.getFullYear();
      if (now.getMonth() < me.birthday.getMonth()) {
        age--;
      } else if (now.getMonth() == me.birthday.getMonth()) {
        if (now.getDay() < me.birthday.getDay()) {
          age--;
        }
      }
      const intIds = me.interests.map((i) => i.id);
      // get events filtered
      const events = await Event.createQueryBuilder("Event")
        .leftJoinAndSelect("Event.relatedInterests", "Event__relatedInterests")
        .leftJoinAndSelect("Event.creator", "Event__creator")
        .leftJoinAndSelect("Event.wannago", "Event__wannago")
        .leftJoinAndSelect("Event.invited", "Event__invited")
        .leftJoinAndSelect("Event__wannago.user", "Event__wannago__user")
        .relation("relatedInterests")
        .relation("creator")
        .relation("wannago")
        .relation("wannago.user")
        .relation("invited")
        .select()
        .where("Event.time BETWEEN :time1 AND :time2", {
          time1: dateRange.startDate,
          time2: dateRange.endDate,
        })
        .andWhere("Event.filterMinAge <= :userAge1", { userAge1: age })
        .andWhere("Event.filterMaxAge >= :userAge2", { userAge2: age })
        .andWhere(
          new Brackets((qb) => {
            qb.where("Event.privacy = :privacy1", {
              privacy1: Privacy.PUBLIC,
            }).orWhere(
              new Brackets((qb2) => {
                qb2
                  .where("Event.privacy =:privacy2", {
                    privacy2: Privacy.FRIENDS,
                  })
                  .andWhere("Event__creator.id IN (:...userIds1)", {
                    userIds1: [
                      ...me.friends.map((f) => f.id),
                      ...me.inverseFriends.map((f) => f.id),
	  0
                    ],
                  });
              })
            );
          })
        )
        .andWhere(
          new Brackets((qb) => {
            qb.where("Event.filterGender = :gender1", {
              gender1: me.gender,
            }).orWhere("Event.filterGender = :gender2", {
              gender2: Gender.BOTH,
            });
          })
        )
        .andWhere(
          new Brackets((qb) => {
            qb.where("Event_Event__relatedInterests.eventId IS NULL").orWhere(
              "Event__relatedInterests.id IN (:...intIds)",
              { intIds }
            );
          })
        )
        .orderBy(
          sortType === SortType.SOONEST ? "Event.time" : "Event.createdAt",
          sortType === SortType.SOONEST ? "ASC" : "DESC"
        )
        .skip(skip)
        .take(take)
        .getMany();

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
      return {
        ok: true,
        nodes: await Event.findOneOrFail(id, {
          relations: [
            "relatedInterests",
            "creator",
            "wannago",
            "wannago.user",
            "invited",
          ],
        }),
      };
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
        lastAccessed: new Date(),
      }).save();
      const forum = await Forum.create({
        userNotifications: [cn],
        chats: [],
      }).save();
      const user = await User.findOneOrFail(options.creatorId);
      const relatedInterests = options.relatedInterestsIds.map((id) => ({
        id: id,
      }));
      const invited = options.invitedIds.map((id) => ({
        id: id,
      }));

      const event = await Event.create({
        time: options.time,
        location: options.location,
        pictureUrl: options.pictureUrl,
        title: options.title,
        description: options.description,
        filterMinAge: options.filterMinAge,
        filterMaxAge: options.filterMaxAge,
        filterGender: options.filterGender,
        filterRadius: options.filterRadius,
        privacy: options.privacy,
        creator: user,
        forum: forum,
        wannago: [],
        invited,
        relatedInterests,
      }).save();

      if (event.privacy == Privacy.PRIVATE) {
        const invitedUsers = await User.findByIds(options.invitedIds);
        // Send invites to all privately invited users
        const message = {
          data: {
            type: "event",
            eventId: `${event.id}`,
          },
          notification: {
            title: "You're Invited!",
            body: `You're invited to ${event.title}`,
          },
        };

        const messageOptions = {
          priority: "high",
          contentAvailable: true,
        };
        await admin
          .messaging()
          .sendToDevice(
            invitedUsers.map((u) => u.deviceId),
            message,
            messageOptions
          )
          .then((response) => {
            console.log("Successfully sent message:", response);
          })
          .catch((error) => {
            console.log("Error sending message:", error);
          });
      }
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
          "forum",
        ],
      });
      event.invited = [...event.invited, user];
      await event.save();
      const message = {
        data: {
          type: "event",
          eventId: `${event.id}`,
        },
        notification: {
          title: "You're Invited!",
          body: `You're invited to ${event.title}`,
        },
      };
      const options = {
        contentAvailable: true,
        priority: "high",
      };
      await admin
        .messaging()
        .sendToDevice(user.deviceId, message, options)
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
  async removeInvite(
    @Arg("eventId", () => Int) eventId: number,
    @Arg("userId", () => Int) userId: number
  ): Promise<EventApiResponse> {
    try {
      const wannago = await Wannago.createQueryBuilder("Wannago")
        .leftJoinAndSelect("Wannago.user", "Wannago__user")
        .leftJoinAndSelect("Wannago.event", "Wannago__event")
        .relation("user")
        .relation("event")
        .select()
        .where("Wannago__user.id = :userId", { userId })
        .andWhere("Wannago__event.id = :eventId", {
          eventId,
        })
        .getOneOrFail();

      wannago.declined = true;
      await wannago.save();

      const event = await Event.findOneOrFail(eventId, {
        relations: [
          "creator",
          "relatedInterests",
          "wannago",
          "wannago.user",
          "invited",
          "forum",
        ],
      });
      const i = event.invited.findIndex((u) => u.id == userId);
      event.invited.splice(i, 1);
      const wi = event.wannago.findIndex((w) => w.user.id == userId);
      event.wannago[wi] = wannago;
      await event.save();
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
      const message = {
        data: { type: "event", eventId: `${event.id}` },
        notification: {
          title: "Event Activity",
          body: `Someone wants to go to your event!`,
        },
      };
      const options = {
        contentAvailable: true,
        priority: "high",
      };
      await admin
        .messaging()
        .sendToDevice(event.creator.deviceId, message, options)
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
  async forum(
    @Root() event: Event,
    @Ctx() { forumLoader }: MyContext
  ): Promise<Forum> {
    return forumLoader.load(event.forum.id);
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
