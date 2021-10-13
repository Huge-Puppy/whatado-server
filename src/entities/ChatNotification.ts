import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Forum } from "./Forum";
import { User } from "./User";

@ObjectType()
@Entity()
export class ChatNotification extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field(() => Date)
  @Column()
  lastAccessed!: Date

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
