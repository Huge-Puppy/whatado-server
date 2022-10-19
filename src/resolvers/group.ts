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
import { GroupApiResponse, GroupsApiResponse } from "./outputs/modelOutputs";
import { isAuth } from "../middleware/isAuth";
import { Group } from "../entities/Group";
import { GroupFilterInput, GroupInput } from "./inputs/groupInput";
import { User } from "../entities/User";
import { ILike } from "typeorm";
import { GroupIcon } from "../entities/GroupIcon";
import * as admin from "firebase-admin";
import { BoolApiResponse } from "./outputs/general";
import { Admin } from "../entities/Admin";
import { __prod__ } from "../constants";
import { Interest } from "../entities/Interest";

if (__prod__) {
  console.log = function () {};
}
@Resolver(() => Group)
export class GroupResolver {
  async isUserAdmin(id: number): Promise<boolean> {
    const admin = await Admin.find({ where: { user: { id } } });
    if (admin) {
      return true;
    }
    return false;
  }
  @Mutation(() => GroupApiResponse)
  @UseMiddleware(isAuth)
  async updateGroup(
    @Arg("options") options: GroupFilterInput,
    @Ctx() { payload }: MyContext
  ): Promise<GroupApiResponse> {
    try {
      const group = await Group.findOneOrFail(options.id, {
        relations: ["users", "requested", "relatedInterests", "icon"],
      });
      if (!group.users.map((u) => u.id).includes(+payload!.userId)) {
        return {
          ok: false,
          errors: [
            {
              field: "updating group",
              message: "no access to group",
            },
          ],
        };
      }
      if (options.relatedInterestIds) {
        group.relatedInterests = options.relatedInterestIds.map((r) => {
          return { id: r } as any;
        });
      }
      if (options.requestedIds) {
        if (
          options.requestedIds.some(
            (id) => !group.requested.map((u) => u.id).includes(id)
          )
        ) {
          return {
            ok: false,
            errors: [
              {
                field: "update group",
                message: "unable to add requests for other users",
              },
            ],
          };
        }
        group.requested = options.requestedIds.map((r) => {
          return { id: r } as any;
        });
      }
      if (options.userIds) {
        // TODO: prevent people from removing others from the group unless admin
        const users = await User.findByIds([...new Set(options.userIds)]);
        const acceptedUsers = users.filter((u) => group.requested.map((u) => u.id).includes(u.id));
        const otherUsers = users.filter((u) => !group.requested.map((u) => u.id).includes(u.id));
        // make sure that  everyone you add is one of your friends or in the requestedIds
        const me = await User.findOneOrFail(payload!.userId, {
          relations: ["friends", "inverseFriends"],
        });
        if (
          otherUsers.some(
            (u) =>
              !(me.id == u.id) &&
              !me.friends.map((_u) => _u.id).includes(u.id) &&
              !me.inverseFriends.map((_u) => _u.id).includes(u.id)
          )
        ) {
          return {
            ok: false,
            errors: [
              {
                field: "update group",
                message:
                  "unauthorized to add group members who aren't friends and haven't requested",
              },
            ],
          };
        }

        // add to group remove from requested
        group.requested = group.requested.filter(
          (u) => !users.map((user) => user.id).includes(u.id)
        );
        group.users = users;

        const message = {
          data: { type: "group", groupId: `${group.id}` },
          notification: {
            title: "New Group",
            body: `You've been added to the ${group.name} group!`,
          },
        };
        const option = {
          contentAvailable: true,
          priority: "high",
        };
        for (var user of acceptedUsers) {
          await admin
            .messaging()
            .sendToDevice(user.deviceId, message, option)
            .then((response) => {
              console.log("Successfully sent message:", response);
            })
            .catch((error) => {
              console.log("Error sending message:", error);
            });
        }
      }
      if (
        options.owner &&
        (+payload!.userId == options.owner ||
          (await this.isUserAdmin(+payload!.userId)))
      ) {
        group.owner = options.owner;
      }
      if (options.groupIconId) {
        group.icon = { id: options.groupIconId } as any;
      }
      if (options.location) {
        group.location = options.location;
      }
      if (options.displayLocation) {
        group.displayLocation = options.displayLocation;
      }
      if (options.screened) {
        group.screened = options.screened;
      }
      if (options.name) {
        group.name = options.name;
      }
      await group.save();
      return { ok: true, nodes: group };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "updating group",
            message: `error updating group: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async requestGroup(
    @Arg("id", () => Int) id: number,
    @Ctx() { payload }: MyContext
  ): Promise<BoolApiResponse> {
    try {
      const group = await Group.findOneOrFail(id, {
        relations: ["requested"],
      });
      group.requested = [...group.requested, { id: +payload!.userId } as any];
      await group.save();

      // send notification to group owner
      const owner = await User.findOne(group.owner);
      const me = await User.findOne(payload!.userId);
      if (!owner || !me) {
        return { ok: true, nodes: true };
      }
      const message = {
        data: { type: "group", groupId: `${group.id}` },
        notification: {
          title: "Group Request",
          body: `${me.name} wants to join your ${group.name} group!`,
        },
      };
      const option = {
        contentAvailable: true,
        priority: "high",
      };
      await admin
        .messaging()
        .sendToDevice(owner.deviceId, message, option)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });

      return { ok: true, nodes: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "requesting group",
            message: `error requesting group: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async leaveGroup(
    @Arg("id", () => Int) id: number,
    @Ctx() { payload }: MyContext
  ): Promise<BoolApiResponse> {
    try {
      const group = await Group.findOneOrFail(id, {
        relations: ["users"],
      });
      group.users = group.users.filter((u, _, __) => u.id != +payload!.userId);
      await group.save();

      return { ok: true, nodes: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "requesting group",
            message: `error requesting group: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => GroupApiResponse)
  @UseMiddleware(isAuth)
  async createGroup(
    @Arg("options") options: GroupInput
  ): Promise<GroupApiResponse> {
    try {
      const users = options.userIds.map((id) => ({
        id: id,
      }));
      const relatedInterests = options.relatedInterestIds.map((id) => ({
        id: id,
      }));
      const group = await Group.create({
        owner: options.owner,
        name: options.name,
        screened: options.screened,
        private: options.private,
        displayLocation: options.displayLocation,
        location: options.location,
        icon: { id: options.groupIconId } as any,
        users,
        relatedInterests,
      }).save();
      return { ok: true, nodes: group };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "group",
            message: `error creating group: ${e.message}`,
          },
        ],
      };
    }
  }

  @Query(() => GroupsApiResponse)
  @UseMiddleware(isAuth)
  async suggestedGroups(): Promise<GroupsApiResponse> {
    try {
      const groups = await Group.find({
        relations: ["icon", "relatedInterests"],
        take: 50,
      });
      return { ok: true, nodes: groups };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "group",
            message: `error finding groups: ${e.message}`,
          },
        ],
      };
    }
  }

  @Query(() => GroupsApiResponse)
  @UseMiddleware(isAuth)
  async searchGroups(
    @Arg("partial", () => String) partial: String
  ): Promise<GroupsApiResponse> {
    //TODO implement pagination
    try {
      const groups = await Group.find({
        where: [{ name: ILike(`%${partial}%`) }, { private: false }],
        relations: ["icon", "relatedInterests"],
        take: 50,
      });
      return { ok: true, nodes: groups };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "group",
            message: `error finding groups: ${e.message}`,
          },
        ],
      };
    }
  }

  @Query(() => GroupsApiResponse)
  @UseMiddleware(isAuth)
  async myGroups(@Ctx() { payload }: MyContext): Promise<GroupsApiResponse> {
    try {
      const me = await User.findOneOrFail(payload?.userId, {
        relations: [
          "groups",
          "groups.users",
          "groups.icon",
          "groups.relatedInterests",
        ],
      });
      return { ok: true, nodes: me.groups };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "group",
            message: `error getting groups: ${e.message}`,
          },
        ],
      };
    }
  }

  @FieldResolver()
  async users(@Root() group: Group, @Ctx() { userLoader }: MyContext) {
    return userLoader.loadMany(group.userIds);
  }

  @FieldResolver()
  async relatedInterests(@Root() group: Group) {
    return Interest.createQueryBuilder()
      .relation(Group, "relatedInterests")
      .of(group)
      .loadMany();
  }

  @FieldResolver()
  async requested(@Root() group: Group) {
    return User.createQueryBuilder()
      .relation(Group, "requested")
      .of(group)
      .loadMany();
  }

  @FieldResolver()
  async icon(@Root() group: Group) {
    return GroupIcon.createQueryBuilder()
      .relation(Group, "icon")
      .of(group)
      .loadOne();
  }
}
