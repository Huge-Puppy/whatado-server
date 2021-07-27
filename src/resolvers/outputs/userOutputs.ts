import { User } from "../../entities/User";
import { ObjectType } from "type-graphql";
import { ApiListResponse, ApiResponse } from "./general";

@ObjectType()
export class UserApiResponse extends ApiResponse(User) {}

@ObjectType()
export class UsersApiResponse extends ApiListResponse(User) {}
