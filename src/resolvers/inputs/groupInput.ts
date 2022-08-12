import { Point } from "geojson";
import { PointScalar } from "../../graphql_types/graphql_types";
import { Field, InputType, Int } from "type-graphql";
import { Group } from "../../entities/Group";

@InputType()
export class GroupInput implements Partial<Group> {
  @Field(() => Int, { nullable: true })
  id?: number;
  @Field()
  name: string;
  @Field(() => Int)
  owner: number;
  @Field(() => [Int])
  userIds: number[];
  @Field(() => Int)
  groupIconId: number;
  @Field(() => PointScalar)
  location: Point;
  @Field()
  screened: boolean;
}

@InputType()
export class GroupFilterInput implements Partial<Group> {
  @Field(() => Int, { nullable: true })
  id?: number;
  @Field(() => String, { nullable: true })
  createdAt?: Date;
  @Field(() => String, { nullable: true })
  updatedAt?: Date;
  @Field({ nullable: true })
  name?: string;
  @Field(() => Int, { nullable: true })
  groupIconId?: number;
  @Field(() => Int, { nullable: true })
  owner?: number;
  @Field(() => [Int], { nullable: true })
  userIds?: number[];
  @Field(() => PointScalar, {nullable: true})
  location?: Point;
  @Field({ nullable: true })
  screened?: boolean;
}
