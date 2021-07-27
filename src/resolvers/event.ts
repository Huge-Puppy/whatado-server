import { Event } from "../entities/Event";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { EventInput } from "./inputs/eventInputs";
import { EventApiResponse, EventsApiResponse } from "./outputs/eventOutput";
import { BoolApiResponse } from "./outputs/general";

@Resolver()
export class EventResolver {
  @Query(() => EventsApiResponse)
  async events(): Promise<EventsApiResponse> {
    const events = await Event.find();
    return { nodes: events };
  }

  @Query(() => Event, { nullable: true })
  async event(@Arg("id") id: number): Promise<EventApiResponse> {
    return { nodes: await Event.findOne(id) };
  }

  @Mutation(() => EventApiResponse)
  async createEvent(
    @Arg("title") options: EventInput
  ): Promise<EventApiResponse> {
    try {
      const event = await Event.create({ ...options }).save();
      return { nodes: event };
    } catch (e) {
      return { errors: [{ message: e.message }] };
    }
  }

  @Mutation(() => BoolApiResponse)
  async updateEvent(
    @Arg("options") options: EventInput
  ): Promise<BoolApiResponse> {
    let event;
    try {
      event = await Event.update({ id: options.id }, { ...options });
      return { nodes: true };
    } catch (e) {
      return {
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
  async deleteEvent(@Arg("id") id: number): Promise<BoolApiResponse> {
    try {
      await Event.delete(id);
    } catch (e) {
      return { nodes: false };
    }
    return { nodes: true };
  }
}
