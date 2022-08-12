import {MigrationInterface, QueryRunner} from "typeorm";

export class AddedLocation1660279602244 implements MigrationInterface {
    name = 'AddedLocation1660279602244'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "group_phone" ("id" SERIAL NOT NULL, "phone" character varying NOT NULL DEFAULT '', "groupId" integer, CONSTRAINT "PK_47109110f5a070b49e20398c912" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c86568279a6ffe2ede218d4ecc" ON "group_phone" ("groupId") `);
        await queryRunner.query(`CREATE TABLE "group_icon" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, CONSTRAINT "PK_af3fee5e2d4c1c79c33f93fedfa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group" ("id" SERIAL NOT NULL, "owner" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL DEFAULT '', "screened" boolean NOT NULL DEFAULT true, "location" geometry(point,4326) NOT NULL, "iconId" integer, CONSTRAINT "PK_256aa0fda9b1de1a73ee0b7106b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e4fb79a43dfe24c39243cba15f" ON "group" USING GiST ("location") `);
        await queryRunner.query(`CREATE TABLE "referral" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "phone" character varying NOT NULL, "signedUp" boolean NOT NULL, "userId" integer, CONSTRAINT "REL_1fbffba89b7ed9ca14a5b75024" UNIQUE ("userId"), CONSTRAINT "PK_a2d3e935a6591168066defec5ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_requested_user" ("groupId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_e08b296f702e4945c8e5d926034" PRIMARY KEY ("groupId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_30e5bdbb5a515ce4c955aa7f80" ON "group_requested_user" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_136bde33213a11eea4af63a292" ON "group_requested_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "group_users_user" ("groupId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_e075467711f75a7f49fb79c79ef" PRIMARY KEY ("groupId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fe6cce7d479552c17823e267af" ON "group_users_user" ("groupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_55edea38fece215a3b66443a49" ON "group_users_user" ("userId") `);
        await queryRunner.query(`ALTER TABLE "event" ADD "coordinates" geometry(point,4326)`);
        await queryRunner.query(`UPDATE "event" SET "coordinates" = '0101000020E6100000D3933E1CC0FA5BC05BCDB962A6604440' WHERE TRUE`);
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "coordinates" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event" ADD "screened" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "event" ADD "groupId" integer`);
        await queryRunner.query(`ALTER TABLE "user" ADD "location" geometry(point,4326)`);
        await queryRunner.query(`CREATE INDEX "IDX_cc5097b4f5b7a0e5f2b544b5aa" ON "event" USING GiST ("coordinates") `);
        await queryRunner.query(`CREATE INDEX "IDX_af7cabf8e064aa7bad09c731ba" ON "user" USING GiST ("location") `);
        await queryRunner.query(`ALTER TABLE "group_phone" ADD CONSTRAINT "FK_c86568279a6ffe2ede218d4ecc9" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group" ADD CONSTRAINT "FK_112a3217442d5600de273eea765" FOREIGN KEY ("iconId") REFERENCES "group_icon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_0a28dcf5832d1068df34fc59e46" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "referral" ADD CONSTRAINT "FK_1fbffba89b7ed9ca14a5b750240" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_requested_user" ADD CONSTRAINT "FK_30e5bdbb5a515ce4c955aa7f80a" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "group_requested_user" ADD CONSTRAINT "FK_136bde33213a11eea4af63a2921" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_users_user" ADD CONSTRAINT "FK_fe6cce7d479552c17823e267aff" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "group_users_user" ADD CONSTRAINT "FK_55edea38fece215a3b66443a498" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "group_users_user" DROP CONSTRAINT "FK_55edea38fece215a3b66443a498"`);
        await queryRunner.query(`ALTER TABLE "group_users_user" DROP CONSTRAINT "FK_fe6cce7d479552c17823e267aff"`);
        await queryRunner.query(`ALTER TABLE "group_requested_user" DROP CONSTRAINT "FK_136bde33213a11eea4af63a2921"`);
        await queryRunner.query(`ALTER TABLE "group_requested_user" DROP CONSTRAINT "FK_30e5bdbb5a515ce4c955aa7f80a"`);
        await queryRunner.query(`ALTER TABLE "referral" DROP CONSTRAINT "FK_1fbffba89b7ed9ca14a5b750240"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_0a28dcf5832d1068df34fc59e46"`);
        await queryRunner.query(`ALTER TABLE "group" DROP CONSTRAINT "FK_112a3217442d5600de273eea765"`);
        await queryRunner.query(`ALTER TABLE "group_phone" DROP CONSTRAINT "FK_c86568279a6ffe2ede218d4ecc9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af7cabf8e064aa7bad09c731ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cc5097b4f5b7a0e5f2b544b5aa"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "groupId"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "screened"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "coordinates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_55edea38fece215a3b66443a49"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe6cce7d479552c17823e267af"`);
        await queryRunner.query(`DROP TABLE "group_users_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_136bde33213a11eea4af63a292"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_30e5bdbb5a515ce4c955aa7f80"`);
        await queryRunner.query(`DROP TABLE "group_requested_user"`);
        await queryRunner.query(`DROP TABLE "referral"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e4fb79a43dfe24c39243cba15f"`);
        await queryRunner.query(`DROP TABLE "group"`);
        await queryRunner.query(`DROP TABLE "group_icon"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c86568279a6ffe2ede218d4ecc"`);
        await queryRunner.query(`DROP TABLE "group_phone"`);
    }

}
