import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToMany,
  JoinTable,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Field, Float, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Interest } from "./Interest";
import { Gender } from "../types";
import { Forum } from "./Forum";

@ObjectType()
@Entity()
export class Event extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt = new Date();

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt = new Date();

  @Field()
  @Column()
  time: Date;

  @Field()
  @Column({ default: "" })
  location!: string;

  @Field()
  @Column({ nullable: true })
  pictureUrl?: string;

  @Field()
  @Column({ default: "" })
  title!: string;

  @Field()
  @Column({ default: "" })
  description!: string;

  @Field(() => User)
  @OneToMany(() => User, (user) => user.myEvents)
  creator: User;

  @Field(() => [User])
  @ManyToMany(() => User)
  @JoinTable()
  wannago: User[];


  @Field(() => [Interest])
  @ManyToMany(() => Interest, interest => interest.relatedEvents, { eager: true, cascade: ["update"] })
  @JoinTable()
  relatedInterests: Interest[];

  @Field(() => Forum)
  @OneToOne(() => Forum, (forum) => forum.event)
  @JoinColumn()
  forum: Forum;

  @Field()
  @Column({ default: "" })
  filterLocation!: string;

  @Field(() => Float)
  @Column({ type: "float" })
  filterRadius!: number;

  @Field(() => Gender)
  @Column({ type: "enum", enum: Gender, default: Gender.BOTH })
  filterGender!: Gender;

  @Field()
  @Column({ default: "" })
  filterAge!: string;
}
