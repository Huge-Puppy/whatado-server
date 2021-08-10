import { ObjectType } from "type-graphql";
import { ApiListResponse, ApiResponse } from "./general";
import { Interest } from "../../entities/Interest";

@ObjectType()
export class InterestApiResponse extends ApiResponse(Interest) {}

@ObjectType()
export class InterestsApiResponse extends ApiListResponse(Interest) {}
