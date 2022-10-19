import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToMany,
  JoinTable,
  OneToMany,
  RelationId,
  Index,
} from "typeorm";
import { Point } from "geojson";
import { Authorized, Field, Int, ObjectType } from "type-graphql";
import { Event } from "./Event";
import { Interest } from "./Interest";
import { ChatNotification } from "./ChatNotification";
import { Gender } from "../types";
import { Group } from "./Group";
import { PointScalar } from "../graphql_types/graphql_types";
import { FriendRequest } from "./FriendRequest";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => PointScalar, { nullable: true })
  @Index({ spatial: true })
  @Column({
    type: "geometry",
    spatialFeatureType: "point",
    srid: 4326,
    nullable: true,
  })
  location?: Point;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field()
  @Column()
  name!: string;

  @Authorized(["OWNER", "ADMIN"])
  @Field()
  @Column({ unique: true })
  phone!: string;

  @Column()
  password!: string;

  @Column({ default: "" })
  otp!: string;

  @Authorized(["OWNER", "ADMIN"])
  @Field(() => Int)
  @Column({ default: 0 })
  refreshCount!: number;

  @Field(() => Gender)
  @Column({ type: "enum", enum: Gender })
  gender!: Gender;

  @Field()
  @Column()
  birthday!: Date;

  @Authorized(["OWNER", "ADMIN"])
  @Field()
  @Column({ default: "" })
  deviceId!: string;

  @Field()
  @Column({ default: "[]" })
  photoUrls!: string;

  @Authorized(["OWNER", "ADMIN"])
  @Field(() => Int)
  @Column({ default: 0 })
  flags!: number;

  @Field()
  @Column({ default: "" })
  bio!: string;

  @Authorized(["OWNER", "ADMIN"])
  @Field()
  @Column({ default: false })
  verified!: boolean;

  @Authorized(["OWNER", "ADMIN"])
  @Field(() => [Interest])
  @ManyToMany(() => Interest, (interest) => interest.peopleInterested, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  interests: Interest[];

  @Authorized(["OWNER", "ADMIN"])
  @Field(() => [User])
  @ManyToMany(() => User, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  blockedUsers: User[];

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.inverseFriends, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  @JoinTable()
  friends: User[];

  @Field(() => [Int])
  @RelationId((user: User) => user.friends)
  friendsIds: number[];

  @Field(() => [Group])
  @ManyToMany(() => Group, (g) => g.users, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  groups: Group[];

  @Field(() => [Int])
  @RelationId((user: User) => user.groups)
  groupsIds: number[];

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.friends, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  inverseFriends: User[];

  @Field(() => [Int])
  @RelationId((user: User) => user.inverseFriends)
  inverseFriendsIds: number[];

  @Field(() => [Group])
  @ManyToMany(() => Group, (g) => g.requested, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  requestedGroups: Group[];

  @Field(() => [FriendRequest])
  @OneToMany(() => FriendRequest, (fr) => fr.requester, {
    cascade: ["update", "insert"],
  })
  sentFriendRequests: FriendRequest[];

  @Field(() => [FriendRequest])
  @OneToMany(() => FriendRequest, (fr) => fr.requested, {
    cascade: ["update", "insert"],
  })
  receivedFriendRequests: FriendRequest[];

  @Field(() => [Event])
  @OneToMany(() => Event, (event) => event.creator, {
    cascade: ["insert", "update"],
  })
  myEvents: Event[];

  @Field(() => [Int])
  @RelationId((user: User) => user.myEvents)
  myEventsIds: number[];

  @Field(() => [Event])
  @ManyToMany(() => Event, (event) => event.invited, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
  })
  invitedEvents: Event[];

  @Field(() => [Int])
  @RelationId((user: User) => user.invitedEvents)
  invitedEventsIds: number[];

  @Authorized(["OWNER", "ADMIN"])
  @Field(() => [ChatNotification])
  @OneToMany(() => ChatNotification, (n) => n.user, {
    cascade: ["insert", "update"],
  })
  chatNotifications: ChatNotification[];
}
