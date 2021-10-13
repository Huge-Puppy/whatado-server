import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToOne,
  OneToMany,
  // Column,
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

  @Field(() => Date)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field(() => [ChatNotification])
  @OneToMany(() => ChatNotification, (n) => n.forum, {
    onDelete: "SET NULL",
    cascade: ["update", "insert"],
  })
  userNotifications: ChatNotification[];

  @Field(() => [Chat])
  @OneToMany(() => Chat, (chat) => chat.forum, {
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

  // @Field(() => Int)
  // @Column({type: "int"})
  // eventId: number;
}
