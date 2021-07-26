import { Field, InputType } from "type-graphql";

@InputType()
export class UserInput {
  @Field({nullable: true})
  email?: string;
  @Field()
  password: string;
  @Field({nullable: true})
  username?: string;
  @Field({nullable: true})
  birthday?: Date;
}

