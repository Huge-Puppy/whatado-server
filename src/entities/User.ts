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
} from "typeorm";
import { Authorized, Field, Int, ObjectType } from "type-graphql";
import { Event } from "./Event";
import { Interest } from "./Interest";
import { ChatNotification } from "./ChatNotification";
import { Gender } from "../types";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field()
  @Column()
  name!: string;

  @Authorized("OWNER")
  @Field()
  @Column({ unique: true })
  phone!: string;

  @Column()
  password!: string;

  @Column({ default: "" })
  otp!: string;

  @Authorized("OWNER")
  @Field(() => Int)
  @Column({ default: 0 })
  refreshCount!: number;

  @Field(() => Gender)
  @Column({ type: "enum", enum: Gender })
  gender!: Gender;

  @Field()
  @Column()
  birthday!: Date;

  @Authorized("OWNER")
  @Field()
  @Column({ default: "" })
  deviceId!: string;

  @Field()
  @Column({ default: "[]" })
  photoUrls!: string;

  @Authorized("OWNER")
  @Field(() => Int)
  @Column({ default: 0 })
  flags!: number;

  @Field()
  @Column({ default: "" })
  bio!: string;

  @Authorized("OWNER")
  @Field()
  @Column({ default: false })
  verified!: boolean;

  @Authorized("OWNER")
  @Field(() => [Interest])
  @ManyToMany(() => Interest, (interest) => interest.peopleInterested, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  interests: Interest[];

  @Authorized("OWNER")
  @Field(() => [User])
  @ManyToMany(() => User, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  blockedUsers: User[];

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.inverseFriends, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  friends: User[];

  @Field(() => [Int])
  @RelationId((user: User) => user.friends)
  friendsIds: number[];

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.friends, {
    cascade: ["insert", "update"],
  })
  inverseFriends: User[];

  @Field(() => [Int])
  @RelationId((user: User) => user.inverseFriends)
  inverseFriendsIds: number[];

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.friendRequests, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  requestedFriends: User[];

  @Field(() => [Int])
  @RelationId((user: User) => user.requestedFriends)
  requestedFriendsIds: number[];

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.requestedFriends, {
    cascade: ["insert", "update"],
  })
  friendRequests: User[];

  @Field(() => [Int])
  @RelationId((user: User) => user.friendRequests)
  friendRequestsIds: number[];

  @Field(() => [Event])
  @OneToMany(() => Event, (event) => event.creator, {
    cascade: ["insert", "update"],
  })
  myEvents: Event[];

  @Authorized("OWNER")
  @Field(() => [ChatNotification])
  @OneToMany(() => ChatNotification, (n) => n.user, {
    cascade: ["insert", "update"],
  })
  chatNotifications: ChatNotification[];
}
