import { MigrationInterface, QueryRunner } from "typeorm";

export class addUserGender1639850811939 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE public.user_gender_enum AS ENUM ('female', 'male', 'both');"
    );
    await queryRunner.query(
      'ALTER TABLE "user" ADD COLUMN "gender" user_gender_enum;'
    );
    await queryRunner.query(
      `UPDATE "user" SET "gender" = 'both'::user_gender_enum;`
    );
    await queryRunner.query(
      'ALTER TABLE "user" ALTER COLUMN "gender" SET NOT NULL;'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "gender";');
  }
}
