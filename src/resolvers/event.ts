import { Event } from "../entities/Event";
import { Arg, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { EventInput } from "./inputs/eventInputs";
import { EventApiResponse, EventsApiResponse } from "./outputs/eventOutput";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";

@Resolver()
export class EventResolver {
  @Query(() => EventsApiResponse)
  @UseMiddleware(isAuth)
  async events(): Promise<EventsApiResponse> {
    const events = await Event.find();
    return { nodes: events };
  }

  @Query(() => Event, { nullable: true })
  @UseMiddleware(isAuth)
  async event(@Arg("id") id: number): Promise<EventApiResponse> {
    return { nodes: await Event.findOne(id) };
  }

  @Mutation(() => EventApiResponse)
  @UseMiddleware(isAuth)
  async createEvent(
    @Arg("title") options: EventInput
  ): Promise<EventApiResponse> {
    try {
      const event = await Event.create({ ...options }).save();
      return { nodes: event };
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
      await Event.update({ id: options.id }, { ...options });
      return { nodes: true };
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
      return { nodes: false };
    }
    return { nodes: true };
  }
}
