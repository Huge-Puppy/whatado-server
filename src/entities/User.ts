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
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Event } from "./Event";
import { Interest } from "./Interest";
import { ChatNotification } from "./ChatNotification";

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
  @Column()
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
  @Column({ default: "" })
  bio!: string;

  @Field()
  @Column({ default: false })
  verified!: boolean;

  @Field(() => [Interest])
  @ManyToMany(() => Interest, (interest) => interest.peopleInterested, {
    onDelete: "SET NULL",
    cascade: ["insert", "update"],
  })
  @JoinTable()
  interests: Interest[];

  @Field(() => [Event])
  @OneToMany(() => Event, (event) => event.creator, {
    onDelete: "SET NULL",
    cascade: ["insert", "update"],
  })
  myEvents: Event[];

  @Field(() => [ChatNotification])
  @OneToMany(() => ChatNotification, (n) => n.user, {
    onDelete: "SET NULL",
    cascade: ["update", "insert"],
  })
  chatNotifications: ChatNotification[];
}
