import { Event } from "../entities/Event";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { EventFilterInput, EventInput } from "./inputs/eventInputs";
import { EventApiResponse, EventsApiResponse } from "./outputs/eventOutput";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";
import { Forum } from "../entities/Forum";
import { Interest } from "../entities/Interest";
import { getRepository } from "typeorm";

@Resolver()
export class EventResolver {
  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async events(
    @Arg("options") options: EventFilterInput
  ): Promise<EventsApiResponse> {
    try {
      const events = await Event.find({ ...options });
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
      const relatedInterests = await Interest.findByIds(
        options.relatedInterestsIds
      );

      // EventInput doesn't implement Event... so I can spread the options argument.
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
    @Arg("options") options: EventFilterInput
  ): Promise<BoolApiResponse> {
    try {
      const relatedInterests =
        options.relatedInterestsIds != null
          ? options.relatedInterestsIds?.map((id) => ({ id }))
          : undefined;
      const event = await Event.findOne({ id: options.id });
      event!.title = options.title as any;
        event!.relatedInterests = relatedInterests as any;
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
