import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Forum } from "./Forum";

@ObjectType()
@Entity()
export class Chat extends BaseEntity {
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
  @Column({default: ""})
  text: string;

  @Field(() => Int)
  @Column({default: 0})
  flags: number;

  @Field(() => User)
  @ManyToOne(() => User, {onDelete: "CASCADE"})
  author: User;

  @Field(() => Forum)
  @ManyToOne(() => Forum, forum => forum.chats, {onDelete: "CASCADE"})
  forum: Forum;
}
