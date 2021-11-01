import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { isAuth } from "../middleware/isAuth";
import { UserApiResponse, UsersApiResponse } from "./outputs/modelOutputs";
import { UserFilterInput, UserInput } from "./inputs/userInputs";
import { BoolApiResponse } from "./outputs/general";
import { createAccessToken, createRefreshToken } from "../auth";
import { Interest } from "../entities/Interest";
import { In, MoreThan } from "typeorm";

@Resolver(() => User)
export class UserResolver {
  @Query(() => UserApiResponse)
  @UseMiddleware(isAuth)
  async me(@Ctx() { payload }: MyContext): Promise<UserApiResponse> {
    try {
      const user = await User.findOneOrFail(payload?.userId, {
        relations: [
          "interests",
          "chatNotifications",
          "myEvents",
          "blockedUsers",
        ],
      });
      console.log(user);
      return {
        nodes: user,
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "User", message: e.message }],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async removeAccount(@Ctx() { payload }: MyContext): Promise<BoolApiResponse> {
    try {
      await User.delete(payload!.userId);
      return {
        nodes: true,
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Remove Account", message: e.message }],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async checkValidation(
    @Arg("code") code: String,
    @Ctx() { payload }: MyContext
  ): Promise<BoolApiResponse> {
    try {
      const user = await User.findOneOrFail(payload!.userId);
      if (user.otp == code) {
        return {
          nodes: true,
          ok: true,
        };
      } else {
        return {
          nodes: false,
          ok: false,
        };
      }
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "phone", message: e.message }],
      };
    }
  }

  @Query(() => UsersApiResponse)
  @UseMiddleware(isAuth)
  async flaggedUsers(): Promise<UsersApiResponse> {
    try {
      const users = await User.find({
        where: {
          flags: MoreThan(0),
        },
        order: {
          flags: "DESC",
        },
      });
      return { ok: true, nodes: users };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Users", message: e.message }],
      };
    }
  }

  @Query(() => UsersApiResponse)
  @UseMiddleware(isAuth)
  async users(): Promise<UsersApiResponse> {
    try {
      const users = await User.find();
      return { ok: true, nodes: users };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Users", message: e.message }],
      };
    }
  }

  @Query(() => UserApiResponse)
  @UseMiddleware(isAuth)
  async user(@Arg("id", () => Int) id: number): Promise<UserApiResponse> {
    try {
      const user = await User.findOneOrFail({ id });
      return { ok: true, nodes: user };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "User", message: e.message }],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async addInterests(
    @Arg("interestsText", () => [String]) interestsText: string[],
    @Ctx() { payload }: MyContext
  ): Promise<BoolApiResponse> {
    try {
      const oldInterests = await Interest.find({
        where: { title: In(interestsText) },
      });
      const newInterestTitles = interestsText.filter(
        (title) =>
          !oldInterests.map((interest) => interest.title).includes(title)
      );
      // create new interests
      const newInterests = await Interest.createQueryBuilder()
        .insert()
        .into(Interest)
        .values(
          newInterestTitles.map((title) => ({
            title,
          }))
        )
        .execute();

      const user = await User.findOneOrFail(payload!.userId);
      user.interests = [
        ...oldInterests,
        ...(newInterests.generatedMaps as Interest[]),
      ];
      await user.save();

      return {
        nodes: true,
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "add interests",
            message: e.message,
          },
        ],
      };
    }
  }

  @Query(() => UsersApiResponse)
  @UseMiddleware(isAuth)
  async usersById(
    @Arg("ids", () => [Int]) ids: number[]
  ): Promise<UsersApiResponse> {
    try {
      const users = await User.findByIds(ids);
      return { ok: true, nodes: users };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Users", message: e.message }],
      };
    }
  }

  @Mutation(() => UserApiResponse)
  async register(@Arg("options") options: UserInput): Promise<UserApiResponse> {
    const hashedPassword = await argon2.hash(options.password);
    let user;

    const otpGenerator = require("otp-generator");

    const otp = otpGenerator.generate(5, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });
    try {
      user = await User.create({
        password: hashedPassword,
        phone: options.phone,
        name: options.name,
        birthday: options.birthday,
        otp,
      }).save();
    } catch (e) {
      if (e.code === "23505" || e.detail.includes("already exists"))
        return {
          ok: false,
          errors: [{ message: "phone number already in use", field: "phone" }],
        };
      return {
        ok: false,
        errors: [
          { message: "unexpected error, try again later", field: "phone" },
        ],
      };
    }
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // send validation text
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require("twilio")(accountSid, authToken);
    client.messages.create({
      body: `Your code is ${otp}`,
      from: "+14352275927",
      to: `${user.phone}`,
    });

    return { ok: true, nodes: user, jwt: { accessToken, refreshToken } };
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async sendCode(@Ctx() { payload }: MyContext) {
    try {
      const otpGenerator = require("otp-generator");

      const otp = otpGenerator.generate(5, {
        digits: true,
        alphabets: false,
        upperCase: false,
        specialChars: false,
      });

      const user = await User.findOneOrFail(payload?.userId);
      user.otp = otp;
      await user.save();
      // send validation text
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require("twilio")(accountSid, authToken);
      client.messages.create({
        body: `Your code is ${otp}`,
        from: "+14352275927",
        to: `${user.phone}`,
      });
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        errors: [{ field: "text", message: e.message }],
      };
    }
  }

   @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async unblockUser(
    @Arg("userId", () => Int) userId: number,
    @Ctx() { payload }: MyContext
  ): Promise<BoolApiResponse> {
    try {
      var user = await User.findOneOrFail(payload?.userId, {
        relations: [
          "interests",
          "chatNotifications",
          "myEvents",
          "blockedUsers",
        ],
      });
      user.blockedUsers = user.blockedUsers.filter((u) => u.id != userId);
      await user.save();
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "flag user", message: e.message }],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async blockUser(
    @Arg("userId", () => Int) userId: number,
    @Ctx() { payload }: MyContext
  ): Promise<BoolApiResponse> {
    try {
      var userToBlock = await User.findOneOrFail(userId);
      var user = await User.findOneOrFail(payload?.userId, {
        relations: [
          "interests",
          "chatNotifications",
          "myEvents",
          "blockedUsers",
        ],
      });
      user.blockedUsers = [...user.blockedUsers, userToBlock];
      await user.save();
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "flag user", message: e.message }],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  async flagUser(
    @Arg("userId", () => Int) userId: number
  ): Promise<BoolApiResponse> {
    try {
      var user = await User.findOneOrFail(userId);
      user.flags = user.flags + 1;
      await user.save();
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "flag user", message: e.message }],
      };
    }
  }

  @Mutation(() => UserApiResponse)
  async login(@Arg("options") options: UserInput): Promise<UserApiResponse> {
    try {
      const user = await User.findOne({
        where:
          options.name == null
            ? { phone: options.phone!.toLowerCase() }
            : { name: options.name!.toLowerCase() },
      });
      if (!user) {
        return {
          ok: false,
          errors: [{ field: "phone", message: "phone number not in use" }],
        };
      }
      const valid = await argon2.verify(user.password, options.password);
      if (!valid) {
        return {
          ok: false,
          errors: [{ field: "login", message: "incorrect password" }],
        };
      }
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      return { ok: true, nodes: user, jwt: { accessToken, refreshToken } };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "login",
            message: "something went wrong. please try again later",
          },
        ],
      };
    }
  }

  @Mutation(() => UserApiResponse)
  @UseMiddleware(isAuth)
  async updateUser(
    @Ctx() { payload }: MyContext,
    @Arg("options") options: UserFilterInput
  ): Promise<UserApiResponse> {
    if (!payload) {
      return {
        ok: false,
        errors: [{ message: "uh oh" }],
      };
    }
    try {
      if (options["password"] != null) {
        const hashedPassword = await argon2.hash(options.password);
        options["password"] = hashedPassword;
      }
      const themap = new Object({
        ...options,
      });

      var finalmap: { [k: string]: any } = {};

      let key: keyof typeof themap;
      for (key in themap) {
        if (themap[key] != null) {
          finalmap[key] = themap[key];
        }
      }

      const user = await User.update(
        { id: payload.userId as any },
        { ...finalmap }
      );

      return {
        ok: true,
        nodes: user.raw[0],
      };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "user",
            message: e.message,
          },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async updatePhotos(
    @Ctx() { payload }: MyContext,
    @Arg("urls", () => [String]) urls: string[]
  ): Promise<BoolApiResponse> {
    if (!payload) {
      return {
        ok: false,
        errors: [{ message: "uh oh" }],
      };
    }
    const user = await User.findOneOrFail(payload.userId);
    user.photoUrls = JSON.stringify(urls);
    user.save();

    return {
      ok: true,
      nodes: true,
    };
  }

  @Mutation(() => BoolApiResponse)
  async forgotPassword(@Arg("phone") phone: string): Promise<BoolApiResponse> {
    try {
      const user = await User.findOneOrFail({ where: { phone: phone } });
      if (!user) {
        return {
          ok: false,
          errors: [{ field: "phone", message: "phone not in use" }],
        };
      }
      const otpGenerator = require("otp-generator");

      const otp = otpGenerator.generate(5, {
        digits: true,
        alphabets: false,
        upperCase: false,
        specialChars: false,
      });
      user.otp = otp;
      await user.save();
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require("twilio")(accountSid, authToken);
      client.messages.create({
        body: `Your code is ${otp}`,
        from: "+14352275927",
        to: `${user.phone}`,
      });

      return { ok: true, nodes: true };
    } catch (e) {
      console.log(e);
      return {
        errors: [
          {
            field: "phone",
            message: "something went wrong. try again later.",
          },
        ],
      };
    }
  }
  @FieldResolver()
  interests(@Root() user: User, @Ctx() { interestLoader }: MyContext) {
    return interestLoader.loadMany(
      user.interests.map((interest) => interest.id)
    );
  }
  @FieldResolver()
  blockedUsers(@Root() user: User, @Ctx() { userLoader }: MyContext) {
    return userLoader.loadMany(user.blockedUsers.map((user) => user.id));
  }
  @FieldResolver()
  chatNotifications(
    @Root() user: User,
    @Ctx() { chatNotificationLoader }: MyContext
  ) {
    return chatNotificationLoader.loadMany(
      user.chatNotifications.map((cn) => cn.id)
    );
  }
  @FieldResolver()
  myEvents(@Root() user: User, @Ctx() { eventLoader }: MyContext) {
    return eventLoader.loadMany(user.myEvents.map((event) => event.id));
  }
}
