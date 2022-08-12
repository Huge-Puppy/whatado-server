import { Event } from "../entities/Event";
import { Group } from "../entities/Group";
import { MyContext } from "../types";
import { AuthChecker } from "type-graphql/dist/interfaces";

export const customAuthChecker: AuthChecker<MyContext> = async (
  { root, context },
  roles
) => {
  var admit = true;
  if (roles.includes("OWNER") && !admit)
    admit = context.payload?.userId === root.id;
  if (roles.includes("MEMBER")) {
    if (root instanceof Event) {
      try {
        console.log('root.invited', root.invited);
        if (!context.payload?.userId) {
          admit = false;
        } else {
          admit = root.invited
            .map((u) => u.id)
            .includes(+context.payload.userId);
        }
      } catch (e) {
        admit = false;
      }
    } else if (root instanceof Group) {
      try {
        console.log('root.userIds', root.userIds);
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
  return admit;
};
