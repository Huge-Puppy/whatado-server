import { Gender, Privacy } from "../../types";
import { Event } from "../../entities/Event";
import { Field, Float, InputType, Int } from "type-graphql";
import { PointScalar } from "../../graphql_types/graphql_types";
import { Point } from "geojson";

@InputType()
export class EventInput implements Partial<Event> {
  @Field(() => Int, { nullable: true })
  id?: number;
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
  @Field()
  displayLocation: string;
  @Field(() => PointScalar)
  coordinates: Point;
  @Field(() => [Int])
  relatedInterestsIds: number[];
  @Field(() => [Int])
  invitedIds: number[];
  @Field(() => [Int])
  wannagoIds: number[];
  @Field()
  filterLocation: string;
  @Field(() => Int, { nullable: true })
  groupId?: number;
  @Field(() => Float)
  filterRadius: number;
  @Field(() => Gender)
  filterGender: Gender;
  @Field(() => Privacy)
  privacy: Privacy;
  @Field(() => Int)
  filterMinAge: number;
  @Field(() => Int)
  filterMaxAge: number;
  @Field(() => Int)
  creatorId: number;
  @Field()
  screened: boolean;
  @Field()
  chatDisabled: boolean;
}

@InputType()
export class EventFilterInput implements Partial<Event> {
  @Field(() => Int, { nullable: true })
  id?: number;
  @Field(() => String, { nullable: true })
  createdAt?: Date;
  @Field(() => String, { nullable: true })
  updatedAt?: Date;
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
  @Field({nullable: true})
  displayLocation?: string;
  @Field(() => PointScalar, { nullable: true })
  coordinates?: Point;
  @Field({ nullable: true })
  filterLocation?: string;
  @Field(() => Float, { nullable: true })
  filterRadius?: number;
  @Field(() => Gender, { nullable: true })
  filterGender?: Gender;
  @Field(() => Privacy, { nullable: true })
  privacy?: Privacy;
  @Field({ nullable: true })
  filterMinAge?: number;
  @Field({ nullable: true })
  filterMaxAge?: number;
  @Field(() => Int, { nullable: true })
  creatorId?: number;
  @Field(() => [Int], { nullable: true })
  wannagoIds?: number[];
  @Field(() => [Int], { nullable: true })
  invitedIds?: number[];
  @Field(() => Int, { nullable: true })
  forumId?: number;
  @Field(() => [Int], { nullable: true })
  relatedInterestsIds?: number[];
  @Field(() => Int, { nullable: true })
  groupId?: number;
  @Field({ nullable: true })
  screened?: boolean;
}
