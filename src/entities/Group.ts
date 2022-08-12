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
  Index,
  ManyToOne,
} from "typeorm";
import { Authorized, Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Event } from "./Event";
import { GroupPhone } from "./GroupPhone";
import { Point } from "geojson";
import { PointScalar } from "../graphql_types/graphql_types";
import { GroupIcon } from "./GroupIcon";

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

  @Field()
  @Column({ default: true })
  screened: boolean;

  @Field(() => PointScalar, { nullable: true })
  @Index({ spatial: true })
  @Column({
    type: "geometry",
    spatialFeatureType: "point",
    srid: 4326,
  })
  location: Point;

  @Field(() => GroupIcon)
  @ManyToOne(() => GroupIcon)
  icon: GroupIcon;

  @Authorized("Member")
  @Field(() => [GroupPhone])
  @OneToMany(() => GroupPhone, (g) => g.group, {
    cascade: ["insert", "update"],
  })
  invitedNumbers: GroupPhone[];

  @Authorized("Member")
  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.groups, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  requested: User[];

  @Authorized("Member")
  @Field(() => [User])
  @ManyToMany(() => User, (user) => user.groups, {
    cascade: ["insert", "update"],
  })
  @JoinTable()
  users: User[];

  @Authorized("Member")
  @Field(() => [Event])
  @OneToMany(() => Event, (event) => event.group, {
    cascade: ["update", "insert"],
  })
  @JoinTable()
  events: Event[];

  @Authorized("Member")
  @Field(() => [Int])
  @RelationId((group: Group) => group.users)
  userIds: number[];
}
