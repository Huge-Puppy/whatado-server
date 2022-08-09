import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  FieldResolver,
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

@Resolver(() => Group)
export class GroupResolver {
  @Mutation(() => GroupApiResponse)
  @UseMiddleware(isAuth)
  async updateGroup(
    @Arg("options") options: GroupFilterInput,
    @Ctx() { payload }: MyContext
  ): Promise<GroupApiResponse> {
    try {
      const group = await Group.findOneOrFail(options.id);
      if (options.userIds) {
        const users = await User.findByIds(options.userIds);
        group.users = users;
      }
      if (options.owner && +payload!.userId == options.owner) {
        group.owner = options.owner;
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
        relations: ["groups", "groups.users"],
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
}
