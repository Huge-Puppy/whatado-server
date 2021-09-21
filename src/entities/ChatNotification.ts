import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Forum } from "./Forum";
import { User } from "./User";

@ObjectType()
@Entity()
export class ChatNotification extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  notifications!: number;

  @Field(() => Boolean)
  @Column({ default: false })
  muted!: boolean;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.chatNotifications, {
    cascade: true,
    onDelete: "CASCADE",
  })
  user!: User;

  @Field(() => Forum)
  @ManyToOne(() => Forum, (forum) => forum.userNotifications, {
    cascade: true,
    onDelete: "CASCADE",
  })
  forum!: Forum;
}
