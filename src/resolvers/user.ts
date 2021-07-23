import { MyContext } from "../types";
import {
  Arg,
  ClassType,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { sign } from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail";
import { getConnection } from "typeorm";
import { isAuth } from "src/middleware/isAuth";

@InputType()
class EmailPasswordInput {
  @Field()
  email: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
class JwtResponse {
  @Field(() => String)
  accessToken: String;

  @Field(() => String)
  refreshToken: String;
}

function ApiResponse<T>(T: ClassType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class ApiResponseClass {
    @Field(() => T)
    data: T;

    @Field(() => JwtResponse, { nullable: true })
    jwt?: JwtResponse;
  }
  return ApiResponseClass;
}

@ObjectType()
class UserApiResponse extends ApiResponse(UserResponse) {
  @Field(() => UserResponse, { nullable: true })
  data: UserResponse;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserApiResponse)
  async register(
    @Arg("options") options: EmailPasswordInput
  ): Promise<UserApiResponse> {
    if (options.email.length <= 6) {
      return {
        data: {
          errors: [
            { field: "email", message: "length must be greater than 6" },
          ],
        },
      };
    }
    if (options.password.length <= 6) {
      return {
        data: {
          errors: [
            { field: "password", message: "length must be greater than 6" },
          ],
        },
      };
    }
    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      user = await User.create({
        password: hashedPassword,
        email: options.email,
      }).save();
    } catch (e) {
      if (e.code === "23505" || e.detail.includes("already exists")) {
        return {
          data: {
            errors: [{ message: "email already in use", field: "user" }],
          },
        };
      }
    }
    const accessToken = sign({ userId: user?.id }, "thisisasecret", {
      expiresIn: "15min",
    });
    const refreshToken = sign(
      { userId: user?.id, count: user?.count },
      "thisisasecret",
      { expiresIn: "7d" }
    );
    return { data: { user }, jwt: { accessToken, refreshToken } };
  }

  @Mutation(() => UserApiResponse)
  async login(
    @Arg("options") options: EmailPasswordInput
  ): Promise<UserApiResponse> {
    const user = await User.findOne({
      where: { email: options.email.toLowerCase() },
    });
    if (!user) {
      return {
        data: {
          errors: [{ field: "email", message: "email not in use" }],
        },
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        data: {
          errors: [{ field: "password", message: "incorrect password" }],
        },
      };
    }

    const accessToken = sign({ userId: user.id }, "thisisasecret", {
      expiresIn: "15min",
    });
    const refreshToken = sign(
      { userId: user.id, count: user.count },
      "thisisasecret",
      { expiresIn: "7d" }
    );

    return { data: { user }, jwt: { accessToken, refreshToken } };
  }

  @Query(() => User, { nullable: true })
  @UseMiddleware(isAuth)
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return true;
    }
    // '<a href="http://localhost:3000/change-password/<specialjwt>"
    await sendEmail(
      user.email,
      "your temporary password is sdlf234ksd!&dk OR click link to reset"
    );
    return true;
  }
}
