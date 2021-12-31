import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Event } from "./Event";
import { User } from "./User";

@ObjectType()
@Entity()
@Unique(["user", "event"])
export class Wannago extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field()
  @Column({ default: false })
  declined!: boolean;

  @Field(() => User)
  @ManyToOne(() => User, {
    cascade: true,
    onDelete: "CASCADE",
  })
  user!: User;

  @Field(() => Event)
  @ManyToOne(() => Event, (event) => event.wannago, {
    cascade: true,
    onDelete: "CASCADE",
  })
  event!: Event;
}
