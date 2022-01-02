import { Field, InputType } from "type-graphql";

@InputType()
export class SurveyInput {
  @Field(() => [String])
  answers: String[];

  @Field(() => String)
  question: String;
}
