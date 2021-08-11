import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
  ManyToOne,
  RelationId,
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
  @ManyToOne(() => User, (user) => user.myEvents, { cascade: true })
  creator: User;
  @RelationId((event: Event) => event.creator)
  creatorId: number;

  @Field(() => [User])
  @ManyToMany(() => User, {
    onDelete: "SET NULL",
    cascade: ["update", "insert"],
  })
  @JoinTable()
  wannago: User[];

  @Field(() => [Interest])
  @ManyToMany(() => Interest, (interest) => interest.relatedEvents, {
    cascade: ["update", "insert"],
    onDelete: "SET NULL",
  })
  @JoinTable()
  relatedInterests: Interest[];

  @Field(() => Forum)
  @OneToOne(() => Forum, (forum) => forum.event, {
    onDelete: "SET NULL",
    cascade: ["insert", "update"],
  })
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
