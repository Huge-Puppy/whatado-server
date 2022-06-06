import { Field, InputType, Int } from "type-graphql";
import { Group } from "../../entities/Group";

@InputType()
export class GroupInput implements Partial<Group>{
 @Field(() => Int, {nullable: true})
  id?: number;

  @Field()
  name: string;

  @Field(() => [Int])
  userIds: number[];

}

@InputType()
export class InterestFilterInput implements Partial<Group>{
 @Field(() => Int, {nullable: true})
  id?: number;

  @Field(() => String, {nullable: true})
  createdAt?:  Date;

  @Field(() => String, {nullable: true})
  updatedAt?: Date;

  @Field({nullable: true})
  name?: string;

  @Field(() => [Int], {nullable: true})
  userIds?: number[];

}