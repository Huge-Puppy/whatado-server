import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Chat } from "./Chat";
import { Event } from "./Event";

@ObjectType()
@Entity()
export class Forum extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field(() => [Chat])
  @ManyToOne(() => Chat, chat => chat.forum)
  chats: Chat[];

  @Field(() => [Chat])
  @OneToOne(() => Event, event => event.forum)
  event: Event;
}
