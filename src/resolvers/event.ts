import { Event } from "../entities/Event";
import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { EventInput } from "./inputs/eventInputs";
import { EventApiResponse, EventsApiResponse } from "./outputs/modelOutputs";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";
import { Forum } from "../entities/Forum";
import { User } from "../entities/User";
import { MyContext } from "../types";
import { ChatNotification } from "../entities/ChatNotification";

@Resolver(() => Event)
export class EventResolver {
  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async events(): Promise<EventsApiResponse> {
    try {
      const events = await Event.find({
        relations: ["relatedInterests", "creator", "wannago", "invited"],
      });
      return { ok: true, nodes: events };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
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
        .getMany();
      return { ok: true, nodes: events };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "myevent server", message: e.message }],
      };
    }
  }

  @Query(() => Event, { nullable: true })
  @UseMiddleware(isAuth)
  async event(@Arg("id") id: number): Promise<EventApiResponse> {
    return { ok: true, nodes: await Event.findOne(id) };
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
    @Arg("options") options: EventInput
  ): Promise<EventApiResponse> {
    try {
      // should create new interests with client call before updating event
      const event = await Event.findOneOrFail(options.id, {
        relations: ["creator", "relatedInterests", "wannago", "invited"],
      });
      event.title = options.title;
      event.description = options.description;
      event.time = options.time;
      event.pictureUrl = options.pictureUrl;
      event.location = options.location;
      event.filterAge = options.filterAge;
      event.filterLocation = options.filterLocation;
      event.filterRadius = options.filterRadius;
      event.filterGender = options.filterGender;
      event.creator = options.creatorId as any;
      const relatedInterests = options.relatedInterestsIds.map(
        (id) => ({ id } as any)
      );
      event.relatedInterests = relatedInterests;
      const wannago = options.wannagoIds.map((id) => ({ id } as any));
      event.wannago = wannago;
      const invited = options.invitedIds.map((id) => ({ id } as any));
      event.invited = invited;
      const newEvent = await event.save();
      return { ok: true, nodes: newEvent };
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
  async deleteEvent(@Arg("id") id: number): Promise<BoolApiResponse> {
    try {
      await Event.delete(id);
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
    }
    return { ok: true };
  }

  @FieldResolver()
  async creator(
    @Root() event: Event,
    @Ctx() { userLoader }: MyContext
  ): Promise<User> {
    return userLoader.load(event.creatorId);
  }
  @FieldResolver()
  async wannago(@Root() event: Event, @Ctx() { userLoader }: MyContext) {
    if (event.wannago == null) return [];
    return userLoader.loadMany(event.wannago.map((user) => user.id));
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
