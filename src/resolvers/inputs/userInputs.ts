import { User } from "../../entities/User";
import { Field, InputType, Int } from "type-graphql";
import { Gender } from "../../types";
import { PointScalar } from "../../graphql_types/graphql_types";
import { Point } from "geojson";

@InputType()
export class UserInput {
  @Field({ nullable: true })
  phone?: string;
  @Field()
  password: string;
  @Field({ nullable: true })
  name?: string;
  @Field({ nullable: true })
  birthday?: Date;
  @Field(() => Gender, { nullable: true })
  gender?: Gender;
  @Field(() => PointScalar, { nullable: true })
  location?: Point;
}

@InputType()
export class UserFilterInput implements Partial<User> {
  @Field(() => Int, { nullable: true })
  id?: number;
  @Field({ nullable: true })
  phone?: string;
  @Field({ nullable: true })
  password?: string;
  @Field({ nullable: true })
  name?: string;
  @Field({ nullable: true })
  birthday?: Date;
  @Field({ nullable: true })
  deviceId?: string;
  @Field({ nullable: true })
  photoUrls?: string;
  @Field({ nullable: true })
  bio?: string;
  @Field({ nullable: true })
  verified?: boolean;
  @Field(() => Gender, { nullable: true })
  gender?: Gender;
  @Field(() => PointScalar, { nullable: true })
  location?: Point;
}
