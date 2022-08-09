import { Chat } from "../../entities/Chat";
import { ObjectType } from "type-graphql";
import { ApiListResponse, ApiResponse } from "./general";
import { Forum } from "../../entities/Forum";
import { User } from "../../entities/User";
import { Interest } from "../../entities/Interest";
import { Event } from "../../entities/Event";
import { ChatNotification } from "../../entities/ChatNotification";
import { Wannago } from "../../entities/Wannago";
import { Group } from "../../entities/Group";
import { Referral } from "../../entities/Referral";

@ObjectType()
export class ChatApiResponse extends ApiResponse(Chat) {}

@ObjectType()
export class ChatsApiResponse extends ApiListResponse(Chat) {}

@ObjectType()
export class EventApiResponse extends ApiResponse(Event) {}

@ObjectType()
export class GroupApiResponse extends ApiResponse(Group) {}

@ObjectType()
export class GroupsApiResponse extends ApiListResponse(Group) {}

@ObjectType()
export class EventsApiResponse extends ApiListResponse(Event) {}

@ObjectType()
export class ForumApiResponse extends ApiResponse(Forum) {}

@ObjectType()
export class ForumsApiResponse extends ApiListResponse(Forum) {}

@ObjectType()
export class UserApiResponse extends ApiResponse(User) {}

@ObjectType()
export class UsersApiResponse extends ApiListResponse(User) {}

@ObjectType()
export class InterestApiResponse extends ApiResponse(Interest) {}

@ObjectType()
export class InterestsApiResponse extends ApiListResponse(Interest) {}
@ObjectType()
export class ReferralsApiResponse extends ApiListResponse(Referral) {}

@ObjectType()
export class ReferralApiResponse extends ApiResponse(Referral) {}

@ObjectType()
export class ChatNotificationsApiResponse extends ApiListResponse(
  ChatNotification
) {}

@ObjectType()
export class ChatNotificationApiResponse extends ApiResponse(
  ChatNotification
) {}

@ObjectType()
export class WannagoApiResponse extends ApiListResponse(Wannago) {}

@ObjectType()
export class WannagosApiResponse extends ApiResponse(Wannago) {}

@ObjectType()
export class StringsApiResponse extends ApiListResponse(String) {}

@ObjectType()
export class StringApiResponse extends ApiResponse(String) {}

@ObjectType()
export class IntApiResponse extends ApiResponse(Number) {}

@ObjectType()
export class IntsApiResponse extends ApiListResponse(Number) {}
