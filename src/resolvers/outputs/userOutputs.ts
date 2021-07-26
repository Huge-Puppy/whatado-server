import { User } from "../../entities/User";
import { Field, ObjectType } from "type-graphql";
import { ApiResponse } from "./general";

@ObjectType()
export class UserApiResponse extends ApiResponse(User) {
  @Field(() => User, { nullable: true })
  data?: User;
}