//import {MigrationInterface, QueryRunner} from "typeorm";
//
//export class GroupRequests1660637247560 implements MigrationInterface {
//    name = 'GroupRequests1660637247560'
//
//    public async up(queryRunner: QueryRunner): Promise<void> {
//        await queryRunner.query(`CREATE TABLE "forum_moderators_user" ("forumId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_03b09cbe4f0acea8dacf2008deb" PRIMARY KEY ("forumId", "userId"))`);
//        await queryRunner.query(`CREATE INDEX "IDX_ce07eb0a75d2b42ea1e5ca6d93" ON "forum_moderators_user" ("forumId") `);
//        await queryRunner.query(`CREATE INDEX "IDX_6ad2a09fc989a3db533e5fea0b" ON "forum_moderators_user" ("userId") `);
//        await queryRunner.query(`ALTER TABLE "forum" ADD "chatDisabled" boolean`);
//        await queryRunner.query(`UPDATE "forum" SET "chatDisabled" = false WHERE TRUE`);
//        await queryRunner.query(`ALTER TABLE "forum" ALTER COLUMN "chatDisabled" SET NOT NULL`);
//        await queryRunner.query(`ALTER TABLE "referral" ADD "eventId" integer`);
//        await queryRunner.query(`ALTER TABLE "referral" ADD "groupId" integer`);
//        await queryRunner.query(`ALTER TABLE "referral" DROP CONSTRAINT "FK_1fbffba89b7ed9ca14a5b750240"`);
//        await queryRunner.query(`ALTER TABLE "referral" DROP CONSTRAINT "REL_1fbffba89b7ed9ca14a5b75024"`);
//        await queryRunner.query(`ALTER TABLE "referral" ADD CONSTRAINT "FK_1fbffba89b7ed9ca14a5b750240" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
//        await queryRunner.query(`ALTER TABLE "forum_moderators_user" ADD CONSTRAINT "FK_ce07eb0a75d2b42ea1e5ca6d93f" FOREIGN KEY ("forumId") REFERENCES "forum"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
//        await queryRunner.query(`ALTER TABLE "forum_moderators_user" ADD CONSTRAINT "FK_6ad2a09fc989a3db533e5fea0b4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
//    }
//
//    public async down(queryRunner: QueryRunner): Promise<void> {
//        await queryRunner.query(`ALTER TABLE "forum_moderators_user" DROP CONSTRAINT "FK_6ad2a09fc989a3db533e5fea0b4"`);
//        await queryRunner.query(`ALTER TABLE "forum_moderators_user" DROP CONSTRAINT "FK_ce07eb0a75d2b42ea1e5ca6d93f"`);
//        await queryRunner.query(`ALTER TABLE "referral" DROP CONSTRAINT "FK_1fbffba89b7ed9ca14a5b750240"`);
//        await queryRunner.query(`ALTER TABLE "referral" ADD CONSTRAINT "REL_1fbffba89b7ed9ca14a5b75024" UNIQUE ("userId")`);
//        await queryRunner.query(`ALTER TABLE "referral" ADD CONSTRAINT "FK_1fbffba89b7ed9ca14a5b750240" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
//        await queryRunner.query(`ALTER TABLE "referral" DROP COLUMN "groupId"`);
//        await queryRunner.query(`ALTER TABLE "referral" DROP COLUMN "eventId"`);
//        await queryRunner.query(`ALTER TABLE "forum" DROP COLUMN "chatDisabled"`);
//        await queryRunner.query(`DROP INDEX "public"."IDX_6ad2a09fc989a3db533e5fea0b"`);
//        await queryRunner.query(`DROP INDEX "public"."IDX_ce07eb0a75d2b42ea1e5ca6d93"`);
//        await queryRunner.query(`DROP TABLE "forum_moderators_user"`);
//    }
//
//}
