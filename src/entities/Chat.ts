import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
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
  text!: string;

  @Field(() => User)
  @ManyToOne(() => User)
  author: User;

  @Field(() => Forum)
  @OneToMany(() => Forum, forum => forum.chats)
  forum: Forum;
}
