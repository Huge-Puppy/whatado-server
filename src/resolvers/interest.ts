import {
  Arg,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { BaseEntity, In, Like } from "typeorm";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";
import { Interest } from "../entities/Interest";
import {
  InterestApiResponse,
  InterestsApiResponse,
  IntsApiResponse,
} from "./outputs/modelOutputs";
import { InterestFilterInput } from "./inputs/interestInputs";
import { User } from "../entities/User";

@Resolver(() => Interest)
export class InterestResolver extends BaseEntity {
  @Query(() => InterestApiResponse)
  @UseMiddleware(isAuth)
  async interest(
    @Arg("id", () => Int) id: number
  ): Promise<InterestApiResponse> {
    try {
      const interest = await Interest.findOneOrFail({ where: { id } });
      return { nodes: interest };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "interest",
            message: `error finding interest: ${e.message}`,
          },
        ],
      };
    }
  }

  @Query(() => InterestsApiResponse)
  @UseMiddleware(isAuth)
  async searchInterests(
    @Arg("partial") partial: String
  ): Promise<InterestsApiResponse> {
    try {
      const interests = await Interest.find({
        take: 5,
        where: {
          title: Like(`%${partial}%`),
        },
      });
      return { ok: true, nodes: interests };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "interest",
            message: `error retrieving interests: ${e.message}`,
          },
        ],
      };
    }
  }

  @Query(() => InterestsApiResponse)
  @UseMiddleware(isAuth)
  async popularInterests(): Promise<InterestsApiResponse> {
    try {
      const interests = await Interest.find({ where: { popular: true } });
      return { ok: true, nodes: interests };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "interest",
            message: `error retrieving interests: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => IntsApiResponse)
  @UseMiddleware(isAuth)
  async createInterest(
    @Arg("interestsText", () => [String]) interestsText: string[]
  ): Promise<IntsApiResponse> {
    try {
      console.log("interests ids ", interestsText);
      const oldInterests = await Interest.find({
        where: { title: In(interestsText) },
      });
      const newInterestTitles = interestsText.filter(
        (title) =>
          !oldInterests.map((interest) => interest.title).includes(title)
      );
      // create new interests
      const newInterests = await Interest.createQueryBuilder()
        .insert()
        .into(Interest)
        .values(
          newInterestTitles.map((title) => ({
            title,
          }))
        )
        .execute();
      console.log("returning ", [
        ...newInterests.identifiers.map((obj) => obj.id),
        ...oldInterests.map((obj) => obj.id),
      ]);

      return {
        ok: true,
        nodes: [
          ...newInterests.identifiers.map((obj) => Number(obj.id)),
          ...oldInterests.map((obj) => Number(obj.id)),
        ],
      };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "interest",
            message: `error creating interest: ${e.message}`,
          },
        ],
      };
    }
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async deleteInterest(
    @Arg("id", () => Int) id: number
  ): Promise<BoolApiResponse> {
    try {
      await Interest.delete({ id });
    } catch (e) {
      return { ok: false, errors: [{ message: e.message }] };
    }
    return { nodes: true };
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async updateInterest(
    @Arg("options") options: InterestFilterInput
  ): Promise<BoolApiResponse> {
    try {
      const peopleInterested =
        options.peopleInterestedIds != null
          ? options.peopleInterestedIds.map((id) => ({
              id: id,
            }))
          : undefined;
      const relatedEvents =
        options.relatedEventsIds != null
          ? options.relatedEventsIds.map((id) => ({
              id: id,
            }))
          : undefined;
      await Interest.update(
        { id: options.id },
        {
          title: options.title,
          peopleInterested,
          relatedEvents,
        }
      );
      return { nodes: true };
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            field: "interest",
            message: `error updating interest: ${e.message}`,
          },
        ],
      };
    }
  }

  @FieldResolver()
  async relatedEvents(@Root() interest: Interest) {
    return await User.find({
      where: { relatedInterests: { id: interest.id } },
    });
  }
}
