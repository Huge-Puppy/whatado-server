import { MigrationInterface, QueryRunner } from "typeorm";

export class addFriendRequests1639766813767 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "user_requested_friends_user" ("userId_1" integer NOT NULL, "userId_2" integer NOT NULL, CONSTRAINT "wannahockalugi" PRIMARY KEY ("userId_1", "userId_2"))'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "user_friends_user');
  }
}
