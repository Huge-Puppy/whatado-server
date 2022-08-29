import {MigrationInterface, QueryRunner} from "typeorm";

export class updateForum1661449775477 implements MigrationInterface {
    name = 'updateForum1661449775477'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "FK_7ce4314818075f5eca23ac8654b"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_04f01d3a8d2c9202c1051b4f360"`);
        await queryRunner.query(`CREATE TABLE "admin" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "REL_f8a889c4362d78f056960ca6da" UNIQUE ("userId"), CONSTRAINT "PK_e032310bcef831fb83101899b10" PRIMARY KEY ("id"))`);

	    // move the foreign relation column from chat (surveyId) and move it to survey (chatId)
        await queryRunner.query(`ALTER TABLE "survey" ADD "chatId" integer`);
	    await queryRunner.query(`UPDATE "survey" s SET "chatId" = c."id" FROM "chat" c WHERE s."id" = c."surveyId"`);
	    await queryRunner.query(`DELETE FROM "survey" WHERE "chatId" IS NULL`);


	    // move the foreign relation column from event (forumId) and move it to forum (eventId)
        await queryRunner.query(`ALTER TABLE "forum" ADD "eventId" integer`);
	    await queryRunner.query(`UPDATE "forum" f SET "eventId" = e."id" FROM "event" e WHERE f."id" = e."forumId"`);
	    await queryRunner.query(`DELETE FROM "forum" WHERE "eventId" IS NULL`);


        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "REL_7ce4314818075f5eca23ac8654"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "surveyId"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "REL_04f01d3a8d2c9202c1051b4f36"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "forumId"`);
        await queryRunner.query(`ALTER TABLE "survey" ADD CONSTRAINT "UQ_37d218f23d5d96b4d47c22f7935" UNIQUE ("chatId")`);
        await queryRunner.query(`ALTER TABLE "forum" ADD CONSTRAINT "UQ_b58f41ddeaa90ade30efea966de" UNIQUE ("eventId")`);
        await queryRunner.query(`ALTER TABLE "survey" ADD CONSTRAINT "FK_37d218f23d5d96b4d47c22f7935" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum" ADD CONSTRAINT "FK_b58f41ddeaa90ade30efea966de" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin" ADD CONSTRAINT "FK_f8a889c4362d78f056960ca6dad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin" DROP CONSTRAINT "FK_f8a889c4362d78f056960ca6dad"`);
        await queryRunner.query(`ALTER TABLE "forum" DROP CONSTRAINT "FK_b58f41ddeaa90ade30efea966de"`);
        await queryRunner.query(`ALTER TABLE "survey" DROP CONSTRAINT "FK_37d218f23d5d96b4d47c22f7935"`);
        await queryRunner.query(`ALTER TABLE "forum" DROP CONSTRAINT "UQ_b58f41ddeaa90ade30efea966de"`);
        await queryRunner.query(`ALTER TABLE "forum" DROP COLUMN "eventId"`);
        await queryRunner.query(`ALTER TABLE "survey" DROP CONSTRAINT "UQ_37d218f23d5d96b4d47c22f7935"`);
        await queryRunner.query(`ALTER TABLE "survey" DROP COLUMN "chatId"`);
        await queryRunner.query(`ALTER TABLE "event" ADD "forumId" integer`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "REL_04f01d3a8d2c9202c1051b4f36" UNIQUE ("forumId")`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "surveyId" integer`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "REL_7ce4314818075f5eca23ac8654" UNIQUE ("surveyId")`);
        await queryRunner.query(`DROP TABLE "admin"`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_04f01d3a8d2c9202c1051b4f360" FOREIGN KEY ("forumId") REFERENCES "forum"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "FK_7ce4314818075f5eca23ac8654b" FOREIGN KEY ("surveyId") REFERENCES "survey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
