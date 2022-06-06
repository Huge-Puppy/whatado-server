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
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Group extends BaseEntity {
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
  name: String;

  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.groups, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  users: User[];

  @Field(() => [Int])
  @RelationId((group: Group) => group.users)
  userIds: number[];
}
