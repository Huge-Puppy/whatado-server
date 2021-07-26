import { Gender } from "../../types";
import { Event } from "../../entities/Event";
import { Field, Float, InputType, Int } from "type-graphql";

@InputType()
export class EventInput implements Partial<Event>{
  @Field()
  title: string;
  @Field()
  description: string;
  @Field()
  time: Date;
  @Field()
  pictureUrl: string;
  @Field()
  location: string;
  @Field(() => [Int])
  interestsRelated: number[];
  @Field()
  filterLocation: string;
  @Field(() => Float)
  filterRadius: number;
  @Field(() => Gender)
  filterGender: Gender;
  @Field()
  filterAge: string;
}