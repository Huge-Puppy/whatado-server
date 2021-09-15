import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  PubSub,
  PubSubEngine,
  Query,
  Resolver,
  Root,
  Subscription,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";
import { sendEmail } from "../utils/sendEmail";
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
        relations: ["interests", "chatNotifications", "myEvents"],
      });
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

  @Query(() => UsersApiResponse)
  @UseMiddleware(isAuth)
  async flaggedUsers(): Promise<UsersApiResponse> {
    try {
      const users = await User.find({
        where: {
          flags: MoreThan(0),
        },
        order: {
          flags: "DESC"
        }
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
            message: e.toString,
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
    if (!options.email?.includes("@")) {
      return {
        ok: false,
        errors: [{ field: "email", message: "invalid email address" }],
      };
    }
    if (options.password.length < 6) {
      return {
        ok: false,
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
      if (e.code === "23505" || e.detail.includes("already exists"))
        return {
          ok: false,
          errors: [{ message: "email already in use", field: "email" }],
        };
      return {
        ok: false,
        errors: [
          { message: "unexpected error, try again later", field: "name" },
        ],
      };
    }
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    return { ok: true, nodes: user, jwt: { accessToken, refreshToken } };
  }

  @Mutation(() => UserApiResponse)
  async login(@Arg("options") options: UserInput): Promise<UserApiResponse> {
    try {
      const user = await User.findOne({
        where:
          options.username == null
            ? { email: options.email!.toLowerCase() }
            : { username: options.username!.toLowerCase() },
      });
      if (!user) {
        return {
          ok: false,
          errors: [{ field: "email", message: "email not in use" }],
        };
      }
      const valid = await argon2.verify(user.password, options.password);
      if (!valid) {
        return {
          ok: false,
          errors: [{ field: "password", message: "incorrect password" }],
        };
      }
      const accessToken = createAccessToken(user);
      const refreshToken = createRefreshToken(user);
      return { ok: true, nodes: user, jwt: { accessToken, refreshToken } };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "email", message: "please try again later" }],
      };
    }
  }

  @Subscription(() => String, { topics: "HELLO" })
  me_sub(@Root() username: String): String {
    return username;
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async changeUsername(
    @Ctx() { payload }: MyContext,
    @Arg("username") username: string,
    @PubSub() pubSub: PubSubEngine
  ): Promise<BoolApiResponse> {
    if (!payload) {
      return {
        ok: false,
        errors: [{ message: "uh oh" }],
      };
    }
    const user = await User.findOneOrFail(payload.userId);
    user.username = username;
    user.save();
    await pubSub.publish("HELLO", username);

    return {
      ok: true,
      nodes: true,
    };
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
  async updateBio(
    @Ctx() { payload }: MyContext,
    @Arg("bio") bio: string
  ): Promise<BoolApiResponse> {
    if (!payload) {
      return {
        ok: false,
        errors: [{ message: "uh oh" }],
      };
    }
    const user = await User.findOneOrFail(payload.userId);
    user.bio = bio;
    user.save();

    return {
      ok: true,
      nodes: true,
    };
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
  @UseMiddleware(isAuth)
  async updateProfilePhoto(
    @Ctx() { payload }: MyContext,
    @Arg("url") url: string
  ): Promise<BoolApiResponse> {
    if (!payload) {
      return {
        ok: false,
        errors: [{ message: "uh oh" }],
      };
    }
    const user = await User.findOneOrFail(payload.userId);
    user.profilePhotoUrl = url;
    user.save();

    return {
      ok: true,
      nodes: true,
    };
  }

  @Mutation(() => BoolApiResponse)
  async forgotPassword(@Arg("email") email: string): Promise<BoolApiResponse> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return {
        ok: false,
        errors: [{ field: "email", message: "email not in use" }],
      };
    }
    try {
      const tempToken = createAccessToken(user);
      await sendEmail(
        user.email,
        `Hi ${user.username},\n\n
        Please use this link to reset your password: https://api.whatado.io/change-password/${tempToken}\n\n
        It's valid for the next 15 minutes.\n\nThanks,\nWhatado Support`,
        `<b>reset password</b>
        <a href="https://api.whatado.io/change-password/${tempToken}">
        https://api.whatado.io/change-password/${tempToken}
        </a>`
      );
      return { ok: true };
    } catch (e) {
      console.log(e);
      return {
        errors: [
          {
            field: "email",
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
