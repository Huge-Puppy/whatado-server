import { Gender } from "../../types";
import { Event } from "../../entities/Event";
import { Field, Float, InputType, Int } from "type-graphql";

@InputType()
export class EventInput implements Partial<Event> {
  @Field()
  title: string;
  @Field()
  description: string;
  @Field()
  time: Date;
  @Field({ nullable: true })
  pictureUrl?: string;
  @Field()
  location: string;
  @Field(() => [Int] )
  relatedInterestsIds: number[];
  @Field()
  filterLocation: string;
  @Field(() => Float)
  filterRadius: number;
  @Field(() => Gender)
  filterGender: Gender;
  @Field()
  filterAge: string;
  @Field(() => [Int])
  creatorId: number;
}

@InputType()
export class EventFilterInput implements Partial<Event> {
  @Field(() => Int, { nullable: true })
  id?: number;
  @Field({ nullable: true })
  title?: string;
  @Field({ nullable: true })
  description?: string;
  @Field({ nullable: true })
  time?: Date;
  @Field({ nullable: true })
  pictureUrl?: string;
  @Field({ nullable: true })
  location?: string;
  @Field(() => [Int], { nullable: true })
  relatedInterestsIds?: number[];
  @Field({ nullable: true })
  filterLocation?: string;
  @Field(() => Float, { nullable: true })
  filterRadius?: number;
  @Field(() => Gender, { nullable: true })
  filterGender?: Gender;
  @Field({ nullable: true })
  filterAge?: string;
  @Field(() => [Int], { nullable: true })
  creatorId?: number;
}