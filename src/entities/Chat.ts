import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Forum } from "./Forum";
import { Survey } from "./Survey";

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
  @Column({ default: "" })
  text: string;

  @Field(() => Int)
  @Column({ default: 0 })
  flags: number;

  @Field(() => User)
  @ManyToOne(() => User, { cascade: true, onDelete: "CASCADE" })
  author: User;

  @Field(() => Forum)
  @ManyToOne(() => Forum, (forum) => forum.chats, {
    cascade: true,
    onDelete: "CASCADE",
  })
  forum: Forum;

  @Field(() => Survey, {nullable: true})
  @OneToOne(() => Survey, (survey) => survey.chat, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    cascade: ["insert", "update"],
  })
  survey: Survey;
}
