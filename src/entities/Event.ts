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
  OneToMany,
} from "typeorm";
import { Field, Float, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Interest } from "./Interest";
import { Gender } from "../types";
import { Forum } from "./Forum";
import { Wannago } from "./Wannago";

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

  @Field({ nullable: true })
  @Column({ nullable: true })
  pictureUrl?: string;

  @Field()
  @Column({ default: "" })
  title!: string;

  @Field()
  @Column({ default: "" })
  description!: string;

  @Field(() => Int)
  @Column({ default: 0 })
  flags!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.myEvents, { onDelete: "CASCADE"  ,cascade: true })
  creator: User;
  @RelationId((event: Event) => event.creator)
  creatorId: number;

  @Field(() => [Wannago])
  @OneToMany(() => Wannago, (wannago) => wannago.event, {
    cascade: ["update", "insert"],
  })
  wannago: Wannago[];

  @Field(() => [User])
  @ManyToMany(() => User, {
    onDelete: "CASCADE",
    cascade: ["update", "insert"],
  })
  @JoinTable()
  invited: User[];

  @Field(() => [Interest])
  @ManyToMany(() => Interest, (interest) => interest.relatedEvents, {
    cascade: ["update", "insert"],
    onDelete: "CASCADE",
  })
  @JoinTable()
  relatedInterests: Interest[];

  @Field(() => Forum)
  @OneToOne(() => Forum, (forum) => forum.event, {
    onDelete: "CASCADE",
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
