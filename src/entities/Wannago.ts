import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
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

  @Field()
  @Column({default: false})
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
