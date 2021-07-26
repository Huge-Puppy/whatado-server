import "dotenv/config";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { sign } from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail";
import { isAuth } from "../middleware/isAuth";
import { UserApiResponse } from "./outputs/userOutputs";
import { UserInput } from "./inputs/userInputs";

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users(): Promise<User[]> {
    return User.find();
  }
  @Mutation(() => UserApiResponse)
  async register(@Arg("options") options: UserInput): Promise<UserApiResponse> {
    if (!options.email?.includes("@")) {
      return {
        errors: [{ field: "email", message: "invalid email address" }],
      };
    }
    if (options.password.length < 6) {
      return {
        errors: [
          { field: "password", message: "length must be greater than 6" },
        ],
      };
    }
    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      user = await User.create({
        password: hashedPassword,
        email: options.email,
        username: options.username,
        birthday: options.birthday,
      }).save();
    } catch (e) {
      if (e.code === "23505" || e.detail.includes("already exists")) {
        return {
          errors: [{ message: "email already in use", field: "user" }],
        };
      }
    }
    const accessToken = sign(
      { userId: user?.id },
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: "15min",
      }
    );
    const refreshToken = sign(
      { userId: user?.id, count: user?.refreshCount },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );
    return { data: user, jwt: { accessToken, refreshToken } };
  }

  @Mutation(() => UserApiResponse)
  async login(@Arg("options") options: UserInput): Promise<UserApiResponse> {
    const user = await User.findOne({
      where:
        options.username == null
          ? { email: options.email!.toLowerCase() }
          : { username: options.username!.toLowerCase() },
    });
    if (!user) {
      return {
        errors: [{ field: "email", message: "email not in use" }],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [{ field: "password", message: "incorrect password" }],
      };
    }
    const accessToken = sign(
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15min" }
    );
    const refreshToken = sign(
      { userId: user.id, count: user.refreshCount },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );
    return { data: user, jwt: { accessToken, refreshToken } };
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
      return false;
    }
    // '<a href="http://localhost:3000/change-password/<specialjwt>"
    await sendEmail(
      user.email,
      "your temporary password is sdlf234ksd!&dk OR click link to reset"
    );
    return true;
  }
}
