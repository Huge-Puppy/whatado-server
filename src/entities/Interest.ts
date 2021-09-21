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
  @Column({ unique: true })
  title!: string;

  @Field()
  @Column({ default: false })
  popular: boolean;

  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.interests, {
    cascade: true,
    onDelete: "SET NULL",
  })
  peopleInterested: User[];

  @Field(() => [Event])
  @ManyToMany(() => Event, (event) => event.relatedInterests, {
    cascade: true,
    onDelete: "CASCADE",
  })
  relatedEvents: Event[];
}
