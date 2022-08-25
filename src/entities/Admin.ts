import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Authorized, Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";

@ObjectType()
@Entity()
export class Admin extends BaseEntity {
  @Authorized("ADMIN")
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Authorized("ADMIN")
  @Field(() => Date)
  @CreateDateColumn()
  createdAt = new Date();

  @Authorized("ADMIN")
  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Authorized("ADMIN")
  @Field(() => User)
  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
