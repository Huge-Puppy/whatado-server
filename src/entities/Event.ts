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
  ManyToOne,
  RelationId,
  OneToMany,
  Index,
} from "typeorm";
import { Authorized, Field, Float, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Interest } from "./Interest";
import { Gender, Privacy } from "../types";
import { Forum } from "./Forum";
import { Wannago } from "./Wannago";
import { Group } from "./Group";
import { PointScalar } from "../graphql_types/graphql_types";
import { Point } from "geojson";

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
  @Column({ type: "timestamptz" })
  time: Date;

  @Authorized(["MEMBER", "ADMIN"])
  @Field()
  @Column({ default: "" })
  location!: string;

  @Field()
  @Column({ default: "" })
  displayLocation!: string;

  @Authorized(["MEMBER", "ADMIN"])
  @Field(() => PointScalar)
  @Index({ spatial: true })
  @Column({
    type: "geometry",
    spatialFeatureType: "point",
    srid: 4326,
  })
  coordinates: Point;


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

  @Field()
  @Column({ default: true })
  screened: boolean;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.myEvents, {
    onDelete: "CASCADE",
    cascade: true,
  })
  creator: User;
  @RelationId((event: Event) => event.creator)
  creatorId: number;

  @Field(() => [Wannago])
  @OneToMany(() => Wannago, (wannago) => wannago.event, {
    cascade: ["update", "insert"],
  })
  wannago: Wannago[];

  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.invitedEvents, {
    cascade: ["update", "insert"],
    onDelete: "CASCADE",
  })
  @JoinTable()
  invited: User[];

  @Field(() => [Interest])
  @ManyToMany(() => Interest, (interest) => interest.relatedEvents, {
    cascade: ["update", "insert"],
  })
  @JoinTable()
  relatedInterests: Interest[];

  @Field(() => Forum)
  @OneToOne(() => Forum, (forum) => forum.event, {
    onDelete: "CASCADE",
    cascade: ["insert", "update"],
  })
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

  @Field(() => Privacy)
  @Column({ type: "enum", enum: Privacy, default: Privacy.PUBLIC })
  privacy!: Privacy;

  @Field(() => Group, {nullable: true})
  @ManyToOne(() => Group, (g) => g.events, {
    nullable: true,
    cascade: true,
    onDelete: "SET NULL",
  })
  group?: Group;

  @Field(() => Int)
  @Column({ default: 18 })
  filterMinAge!: number;

  @Field(() => Int)
  @Column({ default: 40 })
  filterMaxAge!: number;
}
