import { ObjectType } from "type-graphql";
import { Event } from "../../entities/Event";
import { ApiListResponse, ApiResponse } from "./general";


@ObjectType()
export class EventApiResponse extends ApiResponse(Event) {}

@ObjectType()
export class EventsApiResponse extends ApiListResponse(Event) {}
