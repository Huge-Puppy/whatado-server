import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  Index,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Group } from "./Group";

@ObjectType()
@Entity()
export class GroupPhone extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ default: "" })
  phone: String;

  @Index()
  @Field(() => Group)
  @ManyToOne(() => Group, (g) => g.invitedNumbers, {
    cascade: true,
    onDelete: "CASCADE",
  })
  group: Group;
}
