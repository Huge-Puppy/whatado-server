import { Forum } from "../../entities/Forum";
import { Event } from "../../entities/Event";
import { Field, InputType, Int } from "type-graphql";

@InputType()
export class ForumInput implements Partial<Forum> {
 @Field(() => Int, {nullable: true})
  id?: number;

  @Field(() => String, {nullable: true})
  createdAt?:  Date;

  @Field(() => String, {nullable: true})
  updatedAt?: Date;

  @Field(() => Event, {nullable: true})
  event?: Event
}
