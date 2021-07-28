import { Chat } from "../../entities/Chat";
import { Field, InputType, Int } from "type-graphql";
import { Forum } from "../../entities/Forum";

@InputType()
export class ChatInput implements Partial<Chat> {
  @Field(() => Int, { nullable: true })
  id?: number;

  @Field(() => String, { nullable: true })
  createdAt?: Date;

  @Field(() => String, { nullable: true })
  updatedAt?: Date;

  @Field(() => Forum, { nullable: true })
  forum?: Forum;
}
