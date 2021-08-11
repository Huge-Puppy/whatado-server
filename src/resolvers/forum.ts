import { Forum } from "../entities/Forum";
import { Arg, Int, Query, Resolver, UseMiddleware } from "type-graphql";
import { BaseEntity } from "typeorm";
import { ForumApiResponse, ForumsApiResponse } from "./outputs/modelOutputs";
import { isAuth } from "../middleware/isAuth";

@Resolver()
export class ForumResolver extends BaseEntity {
  @Query(() => ForumApiResponse)
  @UseMiddleware(isAuth)
  async forum(@Arg("id") id: number): Promise<ForumApiResponse> {
    try {
      const forum = await Forum.findOneOrFail(id);
      return { nodes: forum };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "forum", message: `error finding forum: ${e.message}` },
        ],
      };
    }
  }

  @Query(() => ForumsApiResponse)
  @UseMiddleware(isAuth)
  async getForumsByEventId(
    @Arg("ids", () => Int) ids: number[]
  ): Promise<ForumsApiResponse> {
    try {
      const forums = await Forum.findByIds(ids, {relations: ["userNotifications"]});
      return { nodes: forums };
    } catch (e) {
      return {
        ok: false,
        errors: [
          { field: "forum", message: `error retrieving forums: ${e.message}` },
        ],
      };
    }
  }
}
