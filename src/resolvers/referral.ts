import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { isAuth } from "../middleware/isAuth";
import { StringsApiResponse } from "./outputs/modelOutputs";
import { User } from "../entities/User";
import { Referral } from "../entities/Referral";
import { MyContext } from "../types";
import { BoolApiResponse } from "./outputs/general";

@Resolver(() => Referral)
export class ReferralResolver extends BaseEntity {
  @Query(() => StringsApiResponse)
  @UseMiddleware(isAuth)
  async myReferrals(
    @Ctx() { payload }: MyContext
  ): Promise<StringsApiResponse> {
    try {
      const user = await User.findOneOrFail(payload?.userId);
      const referrals = await Referral.find({ where: { user } });
      return { nodes: referrals.map((r) => r.phone), ok: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "referral",
            message: `error getting my referrals: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async createReferral(
    @Ctx() { payload }: MyContext,
    @Arg("phone", () => String) phone: string,
    @Arg("eventId", () => Int, {nullable: true}) eventId: number,
    @Arg("groupId", () => Int, {nullable: true}) groupId: number
  ): Promise<BoolApiResponse> {
    try {
      const user = await User.findOneOrFail(payload?.userId);
      await Referral.create({
        user,
        phone,
        groupId,
        eventId,
        signedUp: false,
      }).save();
      // send validation text
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require("twilio")(accountSid, authToken);
      client.messages.create({
        body: `${user.name} wants you to join them on Whatado! Download it through the appstore. https://whatado.web.app`,
        from: "+14352275927",
        to: phone,
      });
      return {
        ok: true,
        nodes: true,
      };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "referral",
            message: `error creating referral: ${e.message}`,
          },
        ],
      };
    }
  }
}
