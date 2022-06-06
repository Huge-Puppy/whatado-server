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
import { GroupInput } from "./inputs/groupInput";
import { User } from "../entities/User";

@Resolver(() => Group)
export class GroupResolver {
  @Mutation(() => GroupApiResponse)
  @UseMiddleware(isAuth)
  async createGroup(@Arg("options") options: GroupInput): Promise<GroupApiResponse> {
    try {
      const users = options.userIds.map((id) => ({
        id: id,
      }));
      const group = await Group.create({
        name: options.name,
        users
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
  async myGroups(
    @Ctx() { payload }: MyContext
  ): Promise<GroupsApiResponse> {
    try {
      const me = await User.findOneOrFail(payload?.userId, {relations: ["groups", "groups.users"]});
      return { ok: true, nodes: me.groups};
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
    return userLoader.loadMany(
      group.userIds
    );
  }
}
