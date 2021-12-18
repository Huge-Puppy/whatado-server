import { Field, InputType } from "type-graphql";

@InputType()
export class DateRangeInput {
  @Field(() => Date)
  startDate: Date;
  @Field(() => Date)
  endDate: Date;
}