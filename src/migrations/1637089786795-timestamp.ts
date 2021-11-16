//import {MigrationInterface, QueryRunner} from "typeorm";
//
//export class timestamp1637089786795 implements MigrationInterface {
//
//    public async up(queryRunner: QueryRunner): Promise<void> {
//	    await queryRunner.query("ALTER TABLE event ALTER time TYPE timestamptz USING time AT TIME ZONE 'UTC';");
//    }
//
//    public async down(queryRunner: QueryRunner): Promise<void> {
//	    await queryRunner.query("ALTER TABLE event ALTER time TYPE timestamp USING time;");
//    }
//
//}
