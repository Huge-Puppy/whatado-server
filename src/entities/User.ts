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
  name!: string;

  @Field()
  @Column({ unique: true })
  phone!: string;

  @Column()
  password!: string;

  @Field(() => Int)
  @Column({ default: 0 })
  refreshCount!: number;

  @Field()
  @Column()
  birthday!: Date;

  @Field()
  @Column({default: ''})
  deviceId!: string;

  @Field()
  @Column({ default: '[]' })
  photoUrls!: string;

  @Field(() => Int)
  @Column({ default: 0 })
  flags!: number;

  @Field()
  @Column({ default: "" })
  bio!: string;

  @Field()
  @Column({ default: false })
  verified!: boolean;

  @Field(() => [Interest])
  @ManyToMany(() => Interest, (interest) => interest.peopleInterested, {
    onDelete: "CASCADE",
    cascade: ["insert", "update"],
  })
  @JoinTable()
  interests: Interest[];

  @Field(() => [User])
  @ManyToMany(() => User, {
    onDelete: "CASCADE",
    cascade: ["insert", "update"],
  })
  @JoinTable()
  blockedUsers: User[];

  @Field(() => [Event])
  @OneToMany(() => Event, (event) => event.creator, {
    onDelete: "CASCADE",
    cascade: ["insert", "update"],
  })
  myEvents: Event[];

  @Field(() => [ChatNotification])
  @OneToMany(() => ChatNotification, (n) => n.user, {
    onDelete: "CASCADE",
    cascade: ["update", "insert"],
  })
  chatNotifications: ChatNotification[];
}
