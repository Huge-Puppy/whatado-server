import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToOne,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Forum } from "./Forum";
import { Chat } from "./Chat";

@ObjectType()
@Entity()
export class Survey extends BaseEntity {
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
  @Column({ default: "" })
  question: string;

  @Field(() => [String])
  @Column({ default: [] })
  answers: string[];

  @Field(() => [Int])
  @Column({ default: [] })
  votes: number[];

  @Field(() => Chat)
  @OneToOne(() => Chat, (chat) => chat.survey, {
    cascade: true,
    onDelete: "CASCADE",
  })
  chat: Chat;
}
