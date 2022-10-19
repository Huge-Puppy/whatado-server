import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
@Unique(["requested", "requester"])
export class FriendRequest extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field()
  @Column({ default: false })
  declined!: boolean;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.receivedFriendRequests, {
    cascade: true,
    onDelete: "CASCADE",
  })
  requested!: User;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.sentFriendRequests, {
    cascade: true,
    onDelete: "CASCADE",
  })
  requester!: User;
}
