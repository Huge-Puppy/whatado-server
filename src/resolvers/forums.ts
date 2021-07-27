import { Forum } from "../entities/Forum";
import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { BaseEntity } from "typeorm";
import { ForumApiResponse, ForumsApiResponse } from "./outputs/forumOutputs";
import { ForumInput } from "./inputs/forumInputs";
import { BoolApiResponse } from "./outputs/general";

@Resolver()
export class ForumResolver extends BaseEntity {
  @Query(() => ForumApiResponse)
  async forum(@Arg("id") id: number): Promise<ForumApiResponse> {
    try {
      const forum = await Forum.findOneOrFail({ where: { id } });
      return { nodes: forum };
    } catch (e) {
      return {
        errors: [
          { field: "forum", message: `error finding forum: ${e.message}` },
        ],
      };
    }
  }

  @Query(() => ForumsApiResponse)
  async forums(
    @Arg("options") options: ForumInput
  ): Promise<ForumsApiResponse> {
    let forums;
    try {
      forums = await Forum.find({ where: { ...options } });
    } catch (e) {
      return {
        errors: [
          { field: "forum", message: `error retrieving forums: ${e.message}` },
        ],
      };
    }
    return { nodes: forums };
  }

  @Mutation(() => ForumApiResponse)
  async createForum(
    @Arg("options") options: ForumInput
  ): Promise<ForumApiResponse> {
    let forum;
    try {
      forum = await Forum.create({ ...options }).save();
    } catch (e) {
      return {
        errors: [
          { field: "forum", message: `error creating forum: ${e.message}` },
        ],
      };
    }
    return { nodes: forum };
  }

  @Mutation(() => BoolApiResponse)
  async deleteForum(@Arg("id") id: number): Promise<BoolApiResponse> {
    try {
      await Forum.delete({ id });
    } catch (e) {
      return { nodes: false, errors: [{ message: e.message }] };
    }
    return { nodes: true };
  }

  @Mutation(() => BoolApiResponse)
  async updateForum(
    @Arg("options") options: ForumInput
  ): Promise<BoolApiResponse> {
    try {
      await Forum.update({ id: options.id }, { ...options });
      return { nodes: true };
    } catch (e) {
      return {
        errors: [
          { field: "forum", message: `error updating forum: ${e.message}` },
        ],
      };
    }
  }
}
