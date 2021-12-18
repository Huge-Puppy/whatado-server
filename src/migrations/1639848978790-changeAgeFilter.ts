import { MigrationInterface, QueryRunner } from "typeorm";

export class changeAgeFilter1639848978790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event" DROP COLUMN "filterAge", ADD COLUMN "filterMinAge" INT, ADD COLUMN "filterMaxAge" INT;'
    );
    await queryRunner.query('UPDATE "event" SET "filterMinAge" = 18;');
    await queryRunner.query('UPDATE "event" SET "filterMaxAge" = 70;');
    await queryRunner.query(
      'ALTER TABLE "event" ALTER COLUMN "filterMaxAge" SET NOT NULL, ALTER COLUMN "filterMinAge" SET NOT NULL;'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "event" DROP COLUMN "filterMinAge", DROP COLUMN "filterMaxAge", ADD COLUMN "filterAge" VARCHAR NOT NULL;'
    );
  }
}
