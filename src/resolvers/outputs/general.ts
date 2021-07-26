import { ClassType, Field, ObjectType } from "type-graphql";

@ObjectType()
export class JwtResponse {
  @Field(() => String)
  accessToken: String;

  @Field(() => String)
  refreshToken: String;
}

@ObjectType()
export class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

export function ApiResponse<T>(T: ClassType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class ApiResponseClass {
    @Field(() => T, {nullable: true})
    data?: T;

    @Field(() => Boolean, {nullable: true})
    ok?: boolean;

    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

    @Field(() => JwtResponse, { nullable: true })
    jwt?: JwtResponse;
  }
  return ApiResponseClass;
}

