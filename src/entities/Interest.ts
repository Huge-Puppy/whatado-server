import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToMany,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Event } from "./Event";

@ObjectType()
@Entity()
export class Interest extends BaseEntity {
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
  @Column({ default: "" })
  title!: string;

  @Field()
  @Column({default: ""})
  description!: string;

  @Field(() => [User])
  @ManyToMany(() => User, user => user.interests)
  peopleInterested: User[];

  @Field(() => [Event])
  @ManyToMany(() => Event, event => event.relatedInterests, {cascade: ["update"]})
  relatedEvents: Event[];
}
