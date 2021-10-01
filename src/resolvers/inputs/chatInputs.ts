import { Chat } from "../../entities/Chat";
import { Field, InputType, Int } from "type-graphql";

@InputType()
export class ChatInput implements Partial<Chat> {
  
  @Field()
  text: string;

  @Field(() => Int)
  authorId: number;

  @Field(() => Int)
  forumId: number;

  @Field(() => Int)
  eventId: number;
}

@InputType()
export class ChatFilterInput implements Partial<Chat> {
  @Field(() => Int, { nullable: true })
  id?: number;

  @Field(() => String, { nullable: true })
  createdAt?: Date;

  @Field(() => String, { nullable: true })
  updatedAt?: Date;

  @Field({nullable: true})
  text?: string;

  @Field(() => Int, {nullable: true})
  authorId?: number;

  @Field(() => Int, { nullable: true })
  forumId?: number;
}