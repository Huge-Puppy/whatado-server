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
import { MoreThan, Brackets, ILike } from "typeorm";
import * as admin from "firebase-admin";
import { Group } from "../entities/Group";
import { Interest } from "../entities/Interest";

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
        .select()
        .where("Event.time BETWEEN :time1 AND :time2", {
          time1: dateRange.startDate,
          time2: dateRange.endDate,
        })
        .andWhere(
          "ST_DWithin(Event.coordinates ::Geometry, :userLoc ::Geometry, 10)",
          {
            // userLoc: me.location,
            userLoc: {
              type: "Point",
              coordinates: [
                me.location?.coordinates[0],
                me.location?.coordinates[1],
              ],
              crs: { type: "name", properties: { name: "EPSG:4326" } },
            },
          }
        )
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
                    privacy2: Privacy.GROUP,
                  })
                  .andWhere("Event__creator.id IN (:...userIds1)", {
                    userIds1: [
                      ...me.friends.map((f) => f.id),
                      ...me.inverseFriends.map((f) => f.id),
                      0,
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

      console.log(events.length);
      return { ok: true, nodes: events };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
  }

  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async otherEvents(
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
      const qb = Event.createQueryBuilder("Event");
      const events = await qb
        .innerJoinAndSelect("Event.relatedInterests", "Event__relatedInterests")
        .leftJoinAndSelect("Event.creator", "Event__creator")
        .leftJoinAndSelect("Event.wannago", "Event__wannago")
        .leftJoinAndSelect("Event.invited", "Event__invited")
        .leftJoinAndSelect("Event__wannago.user", "Event__wannago__user")
        .select()
        .where("Event.time BETWEEN :time1 AND :time2", {
          time1: dateRange.startDate,
          time2: dateRange.endDate,
        })
        .andWhere("Event.filterMinAge <= :userAge1", { userAge1: age })
        .andWhere("Event.filterMaxAge >= :userAge2", { userAge2: age })
        .andWhere(
          new Brackets((qb2) => {
            qb2
              .where("Event.privacy = :privacy1", {
                privacy1: Privacy.PUBLIC,
              })
              .orWhere(
                new Brackets((qb3) => {
                  qb3
                    .where("Event.privacy =:privacy2", {
                      privacy2: Privacy.GROUP,
                    })
                    .andWhere("Event__creator.id IN (:...userIds1)", {
                      userIds1: [
                        ...me.friends.map((f) => f.id),
                        ...me.inverseFriends.map((f) => f.id),
                        0,
                      ],
                    });
                })
              );
          })
        )
        .andWhere(
          new Brackets((qb2) => {
            qb2
              .where("Event.filterGender = :gender1", {
                gender1: me.gender,
              })
              .orWhere("Event.filterGender = :gender2", {
                gender2: Gender.BOTH,
              });
          })
        )
        .andWhere(
          "NOT EXISTS" +
            qb
              .subQuery()
              .select()
              .from(Event, "SubEvent")
              .innerJoinAndSelect(
                "SubEvent.relatedInterests",
                "SubEvent__relatedInterests"
              )
              .where("SubEvent.id = Event.id")
              .andWhere("SubEvent__relatedInterests.id IN (:...intIds)")
              .getQuery()
        )
        .setParameter("intIds", intIds)
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
  async suggestedEvents(
    @Ctx() { payload }: MyContext
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
        .select()
        .addSelect((subQuery) => {
          return subQuery
            .select("COUNT(u.id)", "count")
            .from(User, "u")
            .where("u.id = Event__invited.id");
        }, "count")
        .orderBy("count", "DESC")
        .loadRelationCountAndMap("Event.invited", "Event.invited")
        .leftJoinAndSelect("Event.relatedInterests", "Event__relatedInterests")
        .leftJoinAndSelect("Event.creator", "Event__creator")
        .leftJoinAndSelect("Event.wannago", "Event__wannago")
        .leftJoinAndSelect("Event.invited", "Event__invited")
        .leftJoinAndSelect("Event__wannago.user", "Event__wannago__user")
        .where("Event.time > :time1", {
          time1: now,
        })
        .andWhere(
          "ST_DWithin(Event.coordinates ::Geometry, :userLoc ::Geometry, 10)",
          {
            userLoc: {
              type: "Point",
              coordinates: [
                me.location?.coordinates[0],
                me.location?.coordinates[1],
              ],
              crs: { type: "name", properties: { name: "EPSG:4326" } },
            },
          }
        )
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
                    privacy2: Privacy.GROUP,
                  })
                  .andWhere("Event__creator.id IN (:...userIds1)", {
                    userIds1: [
                      ...me.friends.map((f) => f.id),
                      ...me.inverseFriends.map((f) => f.id),
                      0,
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
        .take(10)
        .getMany();

      console.log("jcl", events);
      return { ok: true, nodes: events };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "suggested events server", message: e.message }],
      };
    }
  }

  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async searchEvents(
    @Arg("partial", () => String) partial: String
  ): Promise<EventsApiResponse> {
    // TODO implement pagination
    try {
      const events = await Event.find({
        where: { title: ILike(`%${partial}%`) },
        take: 50,
        relations: [
          "relatedInterests",
          "creator",
          "wannago",
          "invited",
          "wannago.user",
        ],
      });
      return { ok: true, nodes: events };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "myevent server", message: e.message }],
      };
    }
  }

  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async myEvents(@Ctx() { payload }: MyContext): Promise<EventsApiResponse> {
    try {
      const me = await User.findOneOrFail(payload?.userId);
      const events = await Event.findByIds(
        [...me.invitedEventsIds, ...me.myEventsIds],
        {
          relations: [
            "relatedInterests",
            "creator",
            "wannago",
            "invited",
            "wannago.user",
          ],
          order: { time: "ASC" },
        }
      );
      return { ok: true, nodes: events };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "myevent server", message: e.message }],
      };
    }
  }

  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async groupEvents(
    @Arg("groupId", () => Int) groupId: number
  ): Promise<EventsApiResponse> {
    try {
      return {
        ok: true,
        nodes: await Event.find({
          where: {
            group: {
              id: groupId,
            },
          },
          relations: [
            "relatedInterests",
            "creator",
            "wannago",
            "wannago.user",
            "invited",
            "group",
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
      // create cn for every invited user
      let cns: ChatNotification[] = [];
      const users = await User.findByIds([
        payload!.userId,
        ...options.invitedIds,
      ]);
      for (var user of users) {
        cns = cns.concat(
          await ChatNotification.create({
            user: user,
            lastAccessed: new Date(),
          }).save()
        );
      }
      const forum = await Forum.create({
        userNotifications: cns,
        chats: [],
        chatDisabled: options.chatDisabled ?? false,
        moderators: [{ id: payload!.userId } as any],
      }).save();
      const relatedInterests = options.relatedInterestsIds.map((id) => ({
        id: id,
      }));
      const invited = options.invitedIds.map((id) => ({
        id: id,
      }));

      let group: Group | undefined = undefined;
      if (options.privacy == Privacy.GROUP) {
        group = await Group.findOneOrFail({ id: options.groupId });
      }

      const event = await Event.create({
        time: options.time,
        location: options.location,
        coordinates: options.coordinates,
        pictureUrl: options.pictureUrl,
        title: options.title,
        description: options.description,
        filterMinAge: options.filterMinAge,
        filterMaxAge: options.filterMaxAge,
        filterGender: options.filterGender,
        filterRadius: options.filterRadius,
        privacy: options.privacy,
        creator: users.filter((u) => u.id == options.creatorId)[0],
        forum: forum,
        wannago: [],
        group,
        invited,
        screened: options.screened,
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
      const themap = new Object({
        ...options,
      });

      var finalmap: { [k: string]: any } = {};

      let key: keyof typeof themap;
      for (key in themap) {
        if (themap[key] != null && key.toString() != "id") {
          finalmap[key] = themap[key];
        }
      }
      const event = await Event.update({ id: options.id }, { ...finalmap });
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
      if (event.invited.some((u) => u.id == userId)) {
        return {
          ok: false,
          errors: [{ field: "invite", message: "user already invited" }],
        };
      }
      event.invited = [...event.invited, user];
      await event.save();
      await ChatNotification.create({
        user: { id: userId as any },
        lastAccessed: new Date(),
        forum: event.forum,
      }).save();
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
        .select()
        .where("Wannago__user.id = :userId", { userId })
        .andWhere("Wannago__event.id = :eventId", {
          eventId,
        })
        .getOne();
      if (wannago) {
        wannago.declined = true;
        await wannago.save();
      }
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
      const event = await Event.findOneOrFail(eventId, {
        relations: [
          "creator",
          "relatedInterests",
          "wannago",
          "wannago.user",
          "invited",
        ],
      });
      if (event.wannago.some((w, _, __) => w.user.id == userId)) {
        return {
          ok: false,
          errors: [
            {
              field: "wannago",
              message: "wannago already exists for the event",
            },
          ],
        };
      }
      const newWannago = await Wannago.create({
        declined: false,
        user: { id: userId },
        event: { id: eventId },
      }).save();
      event.wannago = [newWannago, ...event.wannago];
      await event.save();
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
    return wannagoLoader.loadMany(event.wannago.map((w) => w.id));
  }

  @FieldResolver()
  async invited(@Root() event: Event) {
    return User.createQueryBuilder()
      .relation(Event, "invited")
      .of(event)
      .loadMany();
  }

  @FieldResolver()
  async relatedInterests(@Root() event: Event) {
    return Interest.createQueryBuilder()
      .relation(Event, "relatedInterests")
      .of(event)
      .loadMany();
  }
}
