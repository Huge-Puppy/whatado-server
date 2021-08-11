import {
  Arg,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { BoolApiResponse } from "./outputs/general";
import { isAuth } from "../middleware/isAuth";
import { Interest } from "../entities/Interest";
import {
  InterestApiResponse,
  InterestsApiResponse,
} from "./outputs/modelOutputs";
import { InterestFilterInput, InterestInput } from "./inputs/interestInputs";
import { User } from "../entities/User";

@Resolver(() => Interest)
export class InterestResolver extends BaseEntity {
  @Query(() => InterestApiResponse)
  @UseMiddleware(isAuth)
  async interest(@Arg("id") id: number): Promise<InterestApiResponse> {
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
  async interests(
    @Arg("options") options: InterestFilterInput
  ): Promise<InterestsApiResponse> {
    let interests;
    try {
      interests = await Interest.find({ where: { ...options } });
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
    return { nodes: interests };
  }

  @Mutation(() => InterestApiResponse)
  @UseMiddleware(isAuth)
  async createInterest(
    @Arg("options") options: InterestInput
  ): Promise<InterestApiResponse> {
    let interest;
    const peopleInterested = options.peopleInterestedIds.map((id) => ({
      id: id,
    }));
    const relatedEvents = options.relatedEventsIds.map((id) => ({
      id: id,
    }));
    try {
      interest = await Interest.create({
        title: options.title,
        description: options.description,
        peopleInterested,
        relatedEvents,
      }).save();
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
    return { nodes: interest };
  }

  @Mutation(() => BoolApiResponse)
  @UseMiddleware(isAuth)
  async deleteInterest(@Arg("id") id: number): Promise<BoolApiResponse> {
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
          description: options.description,
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
