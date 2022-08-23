import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Chat } from "./Chat";
import { Answer } from "./Answer";

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
  question: String;

  @Field(() => Chat)
  @OneToOne(() => Chat, (chat) => chat.survey, {
    cascade: true,
    onDelete: "CASCADE",
  })
  @JoinColumn()
  chat: Chat;

  @Field(() => [Answer])
  @OneToMany(() => Answer, (a) => a.survey, {
    cascade: ["insert", "update"],
    onDelete: "SET NULL",
    eager: true,
  })
  answers: Answer[]
}
