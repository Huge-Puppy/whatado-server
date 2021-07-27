import { ObjectType } from "type-graphql";
import { ApiListResponse, ApiResponse } from "./general";
import { Forum } from "../../entities/Forum";

@ObjectType()
export class ForumApiResponse extends ApiResponse(Forum) {}

@ObjectType()
export class ForumsApiResponse extends ApiListResponse(Forum) {}
