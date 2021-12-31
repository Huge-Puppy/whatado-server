import { MyContext } from "src/types";
import { AuthChecker } from "type-graphql/dist/interfaces";

export const customAuthChecker: AuthChecker<MyContext> = (
  { root, context },
  roles
) => {
  if (roles.includes("OWNER")) return context.payload?.userId === root.id;
  else return true;
};
