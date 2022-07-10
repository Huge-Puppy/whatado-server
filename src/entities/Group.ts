import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToMany,
  JoinTable,
  RelationId,
  OneToMany,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Event } from "./Event";

@ObjectType()
@Entity()
export class Group extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int)
  @Column()
  owner: number;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field()
  @Column({ default: "" })
  name: String;

  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.groups, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  users: User[];

  @Field(() => [Event])
  @OneToMany(() => Event, (event) => event.group, {
    cascade: ["update", "insert"],
  })
  @JoinTable()
  events: Event[];

  @Field(() => [Int])
  @RelationId((group: Group) => group.users)
  userIds: number[];
}
