import { Interest } from "../../entities/Interest";
import { Field, InputType, Int } from "type-graphql";

@InputType()
export class InterestInput implements Partial<Interest>{
 @Field(() => Int, {nullable: true})
  id?: number;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => [Int])
  peopleInterestedIds: number[];

  @Field(() => [Int])
  relatedEventsIds: number[];
}

@InputType()
export class InterestFilterInput implements Partial<Interest>{
 @Field(() => Int, {nullable: true})
  id?: number;

  @Field(() => String, {nullable: true})
  createdAt?:  Date;

  @Field(() => String, {nullable: true})
  updatedAt?: Date;

  @Field({nullable: true})
  title?: string;

  @Field({nullable: true})
  description?: string;

  @Field(() => [Int], {nullable: true})
  peopleInterestedIds?: number[];

  @Field(() => [Int], {nullable: true})
  relatedEventsIds?: number[];

}