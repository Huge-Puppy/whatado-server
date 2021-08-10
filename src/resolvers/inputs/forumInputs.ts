import { Forum } from "../../entities/Forum";
import { Event } from "../../entities/Event";
import { Field, InputType, Int } from "type-graphql";

@InputType()
export class ForumInput {
  @Field(() => Int)
  eventId: number
}

@InputType()
export class ForumFilterInput implements Partial<Forum> {
 @Field(() => Int, {nullable: true})
  id?: number;

  @Field(() => Event, {nullable: true})
  event?: Event
}