import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Survey } from "./Survey";
import { User } from "./User";

@ObjectType()
@Entity()
export class Answer extends BaseEntity {
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
  text: String;

  @Field(() => [User])
  @ManyToMany(() => User)
  @JoinTable()
  votes: User[];

  @Field(() => Survey)
  @ManyToOne(() => Survey, (s) => s.answers, {
    cascade: true,
    onDelete: "CASCADE",
  })
  survey: Survey;
}
