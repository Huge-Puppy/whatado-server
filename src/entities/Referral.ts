import { User } from "./User";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Referral extends BaseEntity {
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
  @Column()
  phone: string;

  @Field(() => Int, {nullable: true})
  @Column({nullable: true})
  eventId?: number;

  @Field(() => Int, {nullable: true})
  @Column({nullable: true})
  groupId?: number;

  @Field()
  @Column()
  signedUp: boolean;

  @Field(() => User)
  @ManyToOne(() => User, {
    cascade: true,
    onDelete: "CASCADE",
  })
  user: User;
}
