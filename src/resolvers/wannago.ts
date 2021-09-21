import { Wannago } from "../entities/Wannago";
import { MyContext } from "../types";
import { Ctx, FieldResolver, Resolver, Root } from "type-graphql";

@Resolver()
export class WannagoResolver {
  @FieldResolver()
  async user(@Root() wannago: Wannago, @Ctx() { userLoader }: MyContext) {
    if (wannago.user == null) return null;
    return userLoader.load(wannago.id);
  }
}
