import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToOne,
  OneToMany,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Chat } from "./Chat";
import { Event } from "./Event";
import { ChatNotification } from "./ChatNotification";

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

  @Field(() => [ChatNotification])
  @OneToMany(() => ChatNotification, (n) => n.forum, {
    onDelete: "SET NULL",
    cascade: ["update", "insert"],
  })
  userNotifications: ChatNotification[];

  @Field(() => [Chat])
  @ManyToOne(() => Chat, (chat) => chat.forum, {
    cascade: ["insert"],
    onDelete: "SET NULL",
  })
  chats: Chat[];

  @Field(() => Event)
  @OneToOne(() => Event, (event) => event.forum, {
    onDelete: "SET NULL",
    cascade: ["update", "insert"],
  })
  event: Event;
}
