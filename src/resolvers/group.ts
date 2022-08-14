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

@Resolver(() => Group)
export class GroupResolver {
  @Mutation(() => GroupApiResponse)
  @UseMiddleware(isAuth)
  async updateGroup(
    @Arg("options") options: GroupFilterInput,
    @Ctx() { payload }: MyContext
  ): Promise<GroupApiResponse> {
    try {
      const group = await Group.findOneOrFail(options.id, {
        relations: ["users", "requested"],
      });
      if (!group.users.map((u) => u.id).includes(+payload!.userId)) {
        return {
          ok: false,
          errors: [
            {
              field: "updating group",
              message: `no access to group`,
            },
          ],
        };
      }
      if (options.userIds) {
        const users = await User.findByIds(options.userIds);
        group.users = users;

        const newUsers = users.filter((u) => group.requested.includes(u));
        group.requested = group.requested.filter((u) => !users.includes(u));
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
        for (var user of newUsers) {
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
      if (options.owner && +payload!.userId == options.owner) {
        group.owner = options.owner;
      }
      if (options.groupIconId) {
        group.icon = {id: options.groupIconId} as any;
      }
      if (options.location) {
        group.location = options.location;
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
      group.requested = [...group.requested, {id: +payload!.userId} as any];
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
      const group = await Group.create({
        owner: options.owner,
        name: options.name,
        screened: options.screened,
        location: options.location,
        icon: { id: options.groupIconId } as any,
        users,
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
  async searchGroups(
    @Arg("partial", () => String) partial: String
  ): Promise<GroupsApiResponse> {
    //TODO implement pagination
    try {
      const groups = await Group.find({
        where: { name: ILike(`%${partial}%`) },
        relations: ["icon"],
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
        relations: ["groups", "groups.users", "groups.icon"],
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
  async icon(@Root() icon: GroupIcon, @Ctx() { groupIconLoader }: MyContext) {
    return groupIconLoader.load(icon.id);
  }
}
