import {
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { isAuth } from "../middleware/isAuth";
import { GroupIconsApiResponse } from "./outputs/modelOutputs";
import { GroupIcon } from "../entities/GroupIcon";

@Resolver(() => GroupIcon)
export class GroupIconResolver extends BaseEntity {
  @Query(() => GroupIconsApiResponse)
  @UseMiddleware(isAuth)
  async groupIcons(
  ): Promise<GroupIconsApiResponse> {
    try {
      const groupIcons = await GroupIcon.find();
      return { nodes: groupIcons, ok: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "GroupIcons",
            message: `error getting group icons: ${e.message}`,
          },
        ],
      };
    }
  }
}