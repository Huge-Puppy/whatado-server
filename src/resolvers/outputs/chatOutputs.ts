import { ObjectType } from "type-graphql";
import { ApiListResponse, ApiResponse } from "./general";
import { Chat } from "../../entities/Chat";

@ObjectType()
export class ChatApiResponse extends ApiResponse(Chat) {}

@ObjectType()
export class ChatsApiResponse extends ApiListResponse(Chat) {}
