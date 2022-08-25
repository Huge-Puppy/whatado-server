import { Event } from "../entities/Event";
import { Group } from "../entities/Group";
import { MyContext } from "../types";
import { AuthChecker } from "type-graphql/dist/interfaces";
import { User } from "../entities/User";
import { Admin } from "../entities/Admin";

export const customAuthChecker: AuthChecker<MyContext> = async (
  { root, context },
  roles
) => {
  var admit = false;
  if (roles.includes("OWNER")) {
    if (root instanceof User) {
      admit = context.payload?.userId == `${root.id}`;
    } else if (root instanceof Event) {
      admit = context.payload?.userId == `${root.creator.id}`;
    }
  }
  if (roles.includes("MEMBER") && !admit) {
    if (root instanceof Event) {
      try {
        if (!context.payload?.userId) {
          admit = false;
        } else {
          admit =
            root.invited.map((u) => u.id).includes(+context.payload.userId) ||
            root.creator.id == +context.payload.userId;
        }
      } catch (e) {
        admit = false;
      }
    } else if (root instanceof Group) {
      try {
        if (!context.payload?.userId) {
          admit = false;
        } else {
          admit = root.userIds.includes(+context.payload?.userId);
        }
      } catch (e) {
        admit = false;
      }
    }
  }
  if (roles.includes("ADMIN") && !admit) {
    if (context.payload?.userId == null) {
      admit = false;
    } else {
      const admin = await Admin.findOne({
        where: { user: { id: +context.payload!.userId } },
      });
      if (admin) {
        admit = true;
      }
    }
  }
  return admit;
};
