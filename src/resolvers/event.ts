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

@Resolver(() => Event)
export class EventResolver {
  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async events(): Promise<EventsApiResponse> {
    try {
      const events = await Event.find({
        relations: ["relatedInterests", "creator"],
      });
      return { ok: true, nodes: events };
    } catch (e) {
      return { ok: false, errors: [{ field: "server", message: e.message }] };
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
    @Arg("options") options: EventInput
  ): Promise<EventApiResponse> {
    try {
      const forum = await Forum.create({
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

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async updateEvent(
    @Arg("options") options: EventInput
  ): Promise<BoolApiResponse> {
    try {
      // should create new interests with client call before updating event
      const event = await Event.findOneOrFail(options.id, {
        relations: ["creator", "relatedInterests"],
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
      await event.save();
      return { ok: true, nodes: true };
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
  relatedInterests(@Root() event: Event, @Ctx() { interestLoader }: MyContext) {
    return interestLoader.loadMany(
      event.relatedInterests.map((interest) => interest.id)
    );
  }
}
