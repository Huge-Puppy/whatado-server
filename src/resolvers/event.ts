import { Event } from "../entities/Event";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { EventInput } from "./inputs/eventInputs";

@Resolver()
export class EventResolver {
  @Query(() => [Event])
  events(): Promise<Event[]> {
    return Event.find();
  }

  @Query(() => Event, { nullable: true })
  event(@Arg("id") id: number): Promise<Event | undefined> {
    return Event.findOne(id);
  }

  @Mutation(() => Event)
  createEvent(@Arg("title") options: EventInput): Promise<Event> {
    return Event.create({ ...options  }).save();
  }

  @Mutation(() => Event)
  async updateEvent(
    @Arg("id") id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Event | null> {
    const event = await Event.findOne(id);
    if (!event) {
      return null;
    }
    if (typeof title !== undefined) {
      event.title = title;
      await Event.update({ id }, { title });
    }
    return event;
  }

  @Mutation(() => Boolean)
  async deleteEvent(@Arg("id") id: number): Promise<boolean> {
    try {
      await Event.delete(id);
    } catch (e) {
      return false;
    }
    return true;
  }
}
