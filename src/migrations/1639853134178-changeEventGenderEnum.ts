import { MigrationInterface, QueryRunner } from "typeorm";

export class changeEventGenderEnum1639853134178 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE event_filtergender_enum RENAME VALUE 'girls' TO 'female';`
    );
    await queryRunner.query(
      `ALTER TYPE event_filtergender_enum RENAME VALUE 'boys' TO 'male';`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE event_filtergender_enum RENAME VALUE 'female' TO 'girls';`
    );
    await queryRunner.query(
      `ALTER TYPE event_filtergender_enum RENAME VALUE 'male' TO 'boys';`
    );
  }
}
