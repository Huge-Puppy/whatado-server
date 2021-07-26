import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Event } from "./Event";
import { Interest } from "./Interest";

@ObjectType()
@Entity()
export class User extends BaseEntity {
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
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Field(() => Int)
  @Column({ default: 0 })
  refreshCount!: number;

  @Field()
  @Column()
  birthday!: Date;

  @Field()
  @Column({ default: "" })
  profilePhotoUrl!: string;

  @Field()
  @Column({ default: false })
  verified!: boolean;

  @Field(() => [Interest])
  @ManyToMany(() => Interest, interest => interest.peopleInterested)
  @JoinTable()
  interests: Interest[]

  @Field(() => [Event])
  @ManyToOne(() => Event, event => event.creator)
  myEvents: Event[];
}
