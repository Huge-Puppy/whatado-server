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
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
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

  @Field()
  @Column({ unique: true })
  phone!: string;

  @Column()
  password!: string;

  @Column({ default: "" })
  otp!: string;

  @Field(() => Int)
  @Column({ default: 0 })
  refreshCount!: number;

  @Field(() => Gender)
  @Column({ type: "enum", enum: Gender })
  gender!: Gender;

  @Field()
  @Column()
  birthday!: Date;

  @Field()
  @Column({ default: "" })
  deviceId!: string;

  @Field()
  @Column({ default: "[]" })
  photoUrls!: string;

  @Field(() => Int)
  @Column({ default: 0 })
  flags!: number;

  @Field()
  @Column({ default: "" })
  bio!: string;

  @Field()
  @Column({ default: false })
  verified!: boolean;

  @Field(() => [Interest])
  @ManyToMany(() => Interest, (interest) => interest.peopleInterested, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  interests: Interest[];

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

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.friends, {
    cascade: ["insert", "update"],
  })
  inverseFriends: User[];

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.friendRequests, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  requestedFriends: User[];

  @Field(() => [User])
  @ManyToMany(() => User, (u) => u.requestedFriends, {
    cascade: ["insert", "update"],
  })
  friendRequests: User[];

  @Field(() => [Event])
  @OneToMany(() => Event, (event) => event.creator, {
    cascade: ["insert", "update"],
  })
  myEvents: Event[];

  @Field(() => [ChatNotification])
  @OneToMany(() => ChatNotification, (n) => n.user, {
    cascade: ["insert", "update"],
  })
  chatNotifications: ChatNotification[];
}
