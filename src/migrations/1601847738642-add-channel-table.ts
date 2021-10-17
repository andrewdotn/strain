import {MigrationInterface, QueryRunner} from "typeorm";

export class addChannelTable1601847738642 implements MigrationInterface {
    name = 'addChannelTable1601847738642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "channel" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "slackId" varchar NOT NULL, "created" datetime NOT NULL, "unlinked" datetime, "name" varchar NOT NULL, "creatorSlackId" varchar NOT NULL, "topic" varchar NOT NULL, "purpose" varchar NOT NULL, "memberCount" integer NOT NULL, "raw" blob NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ef22ba7f8eab981a19835cc6ea" ON "channel" ("slackId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_ef22ba7f8eab981a19835cc6ea"`);
        await queryRunner.query(`DROP TABLE "channel"`);
    }

}
