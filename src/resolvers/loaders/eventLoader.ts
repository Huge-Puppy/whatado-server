import DataLoader from "dataloader";
import { Event } from "../../entities/Event";

// keys is an array [1,2,3,4]
// [{id: 1, eventnam...}, {}]
export const createEventLoader = () =>
  new DataLoader<number, Event>(async (eventIds) => {
    const events = await Event.findByIds(eventIds as number[]);
    const eventIdToEvent: Record<number, Event> = {};
    events.forEach((id) => {
      eventIdToEvent[id.id] = id;
    });

    return eventIds.map((eventId) => eventIdToEvent[eventId]);
  });
