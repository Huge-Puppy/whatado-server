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
import {
  StringsApiResponse,
  UserApiResponse,
  UsersApiResponse,
} from "./outputs/modelOutputs";
import { UserFilterInput, UserInput } from "./inputs/userInputs";
import { BoolApiResponse } from "./outputs/general";
import { createAccessToken, createRefreshToken } from "../auth";
import { Interest } from "../entities/Interest";
import { ILike, In, MoreThan, Not } from "typeorm";
import * as admin from "firebase-admin";
import { Group } from "../entities/Group";
import { Referral } from "../entities/Referral";
import { __prod__ } from "../constants";

if (__prod__) {
  console.log = function () {};
}
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
      user.friends = await User.findByIds(user.friendsIds);
      user.inverseFriends = await User.findByIds(user.inverseFriendsIds);
      user.requestedFriends = await User.findByIds(user.requestedFriendsIds);
      user.friendRequests = await User.findByIds(user.friendRequestsIds);
      user.groups = await Group.findByIds(user.groupsIds, {
        relations: ["icon", "requested"],
      });
      user.requestedGroups = await Group.createQueryBuilder("Group")
        .leftJoinAndSelect("Group.requested", "Group__requested")
        .relation("requested")
        .select()
        .where("Group__requested.id = :userId", { userId: user.id })
        .getMany();
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

  @Query(() => StringsApiResponse)
  @UseMiddleware(isAuth)
  async numbersNotUsers(
    @Arg("numbers", () => [String]) numbers: string[]
  ): Promise<StringsApiResponse> {
    try {
      const users = await User.find({ where: { phone: In(numbers) } });
      const usernumbers = users.map((u) => u.phone);
      const returnval = numbers.filter((n) => !usernumbers.includes(n));
      return {
        nodes: returnval,
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
  async usersFromContacts(
    @Arg("numbers", () => [String]) numbers: String[],
    @Ctx() { payload }: MyContext
  ): Promise<UsersApiResponse> {
    try {
      const users = await User.find({
        where: { phone: In(numbers), id: Not(payload?.userId) },
      });
      return {
        nodes: users,
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
  async checkValidationLogin(
    @Arg("code") code: String,
    @Arg("phone") phone: String
  ): Promise<BoolApiResponse> {
    try {
      const user = await User.findOneOrFail({ where: { phone } });
      if (user.otp == code) {
        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);
        return { ok: true, nodes: true, jwt: { accessToken, refreshToken } };
      } else {
        return {
          nodes: false,
          ok: false,
        };
      }
    } catch (e) {
      return {
        ok: false,
        nodes: false,
        errors: [{ field: "phone", message: e.message }],
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

  @Query(() => UsersApiResponse)
  @UseMiddleware(isAuth)
  async suggestedUsers(): Promise<UsersApiResponse> {
    try {
      const users = await User.find({
        take: 50,
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
  async searchUsers(
    @Arg("partial", () => String) partial: String
  ): Promise<UsersApiResponse> {
    try {
      const users = await User.find({
        where: { name: ILike(`%${partial}%`) },
        take: 50,
      });
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

  @Query(() => UsersApiResponse)
  @UseMiddleware(isAuth)
  async friendsById(@Arg("id", () => Int) id: number) {
    try {
      const me = await User.findOneOrFail(id, {
        relations: ["friends", "inverseFriends"],
      });
      return {
        ok: true,
        nodes: [...me.friends, ...me.inverseFriends],
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Friends", message: e.message }],
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
        gender: options.gender,
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

    // check if user's phone has an entry in the Referral table. if exists, update to show they signed up. delete duplicates
    var referrals = await Referral.find({
      where: { phone: user.phone },
      order: { createdAt: "ASC" },
    });
    for (var i = 0; i < referrals.length; i++) {
      if (i == 0) {
        referrals[i].signedUp = true;
        await referrals[i].save();
        continue;
      }
      await referrals[i].remove();
    }

    // create access tokens
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
        relations: ["blockedUsers"],
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
  async inviteReferral(
    @Arg("number", () => String) number: string,
    @Ctx() { payload }: MyContext
  ): Promise<BoolApiResponse> {
    try {
      var user = await User.findOneOrFail(payload?.userId);
      await Referral.create({
        phone: number,
        user,
        signedUp: false,
      }).save();
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "referral", message: e.message }],
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
        relations: ["blockedUsers"],
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

  @Mutation(() => BoolApiResponse)
  async login(@Arg("options") options: UserInput): Promise<BoolApiResponse> {
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
      return { ok: true, nodes: true, jwt: { accessToken, refreshToken } };
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

  // TODO allow admin to update and delete users
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
        if (themap[key] != null && key.toString() != "id") {
          finalmap[key] = themap[key];
        }
      }

      const user = await User.update(payload.userId, { ...finalmap });

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

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async requestFriend(
    @Ctx() { payload }: MyContext,
    @Arg("id", () => Int) id: number
  ) {
    try {
      const me = await User.findOneOrFail(payload!.userId, {
        relations: ["requestedFriends"],
      });
      const other = await User.findOneOrFail(id);
      me.requestedFriends = [...me.requestedFriends, other];
      await me.save();
      const message = {
        data: { type: "friend", userId: `${me.id}` },
        notification: {
          title: "New Friend Request",
          body: `${me.name} sent you a friend request`,
        },
      };
      const options = {
        contentAvailable: true,
        priority: "high",
      };
      await admin
        .messaging()
        .sendToDevice(other.deviceId, message, options)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Friend", message: e.message }],
      };
    }
  }
  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async unrequestFriend(
    @Ctx() { payload }: MyContext,
    @Arg("id", () => Int) id: number
  ) {
    try {
      const me = await User.findOneOrFail(payload!.userId, {
        relations: ["requestedFriends"],
      });
      me.requestedFriends = me.requestedFriends.filter(
        (user, _, __) => user.id != id
      );
      await me.save();
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Friend", message: e.message }],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async acceptFriend(
    @Ctx() { payload }: MyContext,
    @Arg("id", () => Int) id: number
  ) {
    try {
      const me = await User.findOneOrFail(payload!.userId, {
        relations: ["friendRequests", "friends"],
      });
      const other = await User.findOneOrFail(id);
      if (!me.friendRequests.some((u) => u.id == other.id)) {
        return {
          ok: false,
          errors: [
            {
              field: "accept friend",
              message:
                "user must request to be friends before accepting as friend",
            },
          ],
        };
      }
      me.friendRequests = me.friendRequests.filter((user) => user.id != id);
      me.friends = [...me.friends, other];
      await me.save();

      const message = {
        data: { type: "friend", userId: `${me.id}` },
        notification: {
          title: "New Friend",
          body: `${me.name} is now your friend!`,
        },
      };
      const options = {
        contentAvailable: true,
        priority: "high",
      };
      await admin
        .messaging()
        .sendToDevice(other.deviceId, message, options)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });

      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Friend", message: e.message }],
      };
    }
  }
  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async unfriend(
    @Ctx() { payload }: MyContext,
    @Arg("id", () => Int) id: number
  ) {
    try {
      const me = await User.findOneOrFail(payload!.userId, {
        relations: ["friends", "inverseFriends"],
      });
      me.friends = me.friends.filter((user, _, __) => user.id != id);
      me.inverseFriends = me.inverseFriends.filter(
        (user, _, __) => user.id != id
      );
      await me.save();
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [{ field: "Friend", message: e.message }],
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
  async groups(@Root() user: User, @Ctx() { groupLoader }: MyContext) {
    return groupLoader.loadMany(user.groupsIds);
  }

  @FieldResolver()
  async requestedGroups(@Root() user: User, @Ctx() { groupLoader }: MyContext) {
    return groupLoader.loadMany(user.requestedGroups.map((g) => g.id));
  }

  @FieldResolver()
  blockedUsers(@Root() user: User, @Ctx() { userLoader }: MyContext) {
    if (!user.blockedUsers) return [];
    return userLoader.loadMany(user.blockedUsers.map((user) => user.id));
  }

  @FieldResolver()
  friends(@Root() user: User, @Ctx() { userLoader }: MyContext) {
    if (!user.friends) return [];
    return userLoader.loadMany(user.friends.map((user) => user.id));
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
    if (!user.myEvents) return [];
    return eventLoader.loadMany(user.myEvents.map((event) => event.id));
  }
}
