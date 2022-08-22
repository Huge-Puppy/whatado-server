import { Field, InputType, Int } from "type-graphql";
import { Forum } from "../../entities/Forum";

@InputType()
export class ForumInput implements Partial<Forum> {
  @Field(() => Int, { nullable: true })
  id?: number;
  @Field(() => [Int])
  moderatorsIds: number[];
  @Field()
  chatDisabled: boolean;
}

@InputType()
export class ForumFilterInput implements Partial<Forum> {
  @Field(() => Int, { nullable: true })
  id?: number;
  @Field(() => [Int], { nullable: true })
  moderatorsIds?: number[];
  @Field({ nullable: true })
  chatDisabled?: boolean;
}
