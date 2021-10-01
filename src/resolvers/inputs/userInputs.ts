import { User } from "../../entities/User";
import { Field, InputType, Int } from "type-graphql";

@InputType()
export class UserInput {
  @Field({ nullable: true })
  email?: string;
  @Field()
  password: string;
  @Field({ nullable: true })
  username?: string;
  @Field({ nullable: true })
  birthday?: Date;
}

@InputType()
export class UserFilterInput implements Partial<User> {
  @Field(() => Int, { nullable: true })
  id?: number;
  @Field({ nullable: true })
  email?: string;
  @Field({ nullable: true })
  username?: string;
  @Field({ nullable: true })
  birthday?: Date;
  @Field({ nullable: true })
  profilePhotoUrl?: string;
  @Field({ nullable: true })
  deviceId?: string;
  @Field({ nullable: true })
  photoUrls?: string;
  @Field({ nullable: true })
  bio?: string;
  @Field({ nullable: true })
  verified?: boolean;
}
