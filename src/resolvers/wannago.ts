import { Wannago } from "../entities/Wannago";
import { FieldResolver, Resolver, Root } from "type-graphql";
import { User } from "../entities/User";

@Resolver()
export class WannagoResolver {
  @FieldResolver()
  async user(@Root() wannago: Wannago) {
    return User.createQueryBuilder()
      .relation("user")
      .of(wannago)
      .loadOne();
  }
}
