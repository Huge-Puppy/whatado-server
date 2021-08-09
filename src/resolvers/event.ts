import { Event } from "../entities/Event";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { EventFilterInput, EventInput } from "./inputs/eventInputs";
import { EventApiResponse, EventsApiResponse } from "./outputs/eventOutput";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";
import { User } from "../entities/User";
import { Interest } from "../entities/Interest";
import { Forum } from "../entities/Forum";

@Resolver()
export class EventResolver {
  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async events(): Promise<EventsApiResponse> {
    try {
      const events = await Event.find();
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
      const creator = await User.findOneOrFail({id: options.creatorId});
      const relatedInterests = await Interest.findByIds(options.relatedInterestsIds ?? []);
      const forum = await Forum.create({
        chats: [],
      }).save();
      const event = await Event.create({ 
        ...options,
        creator: creator,
        wannago: [],
        relatedInterests: relatedInterests,
        forum: forum,
        filterLocation: options.filterLocation,
        filterRadius: options.filterRadius,
        filterGender: options.filterGender,
        filterAge: options.filterAge,
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
    @Arg("options") options: EventFilterInput
  ): Promise<BoolApiResponse> {
    try {
      await Event.update({ id: options.id }, { ...options });
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
}
