import {MigrationInterface, QueryRunner} from "typeorm";

export class addMessageTable1601851527119 implements MigrationInterface {
    name = 'addMessageTable1601851527119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "message" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "channelSlackId" varchar NOT NULL, "messageTimestamp" integer NOT NULL, "threadTimestamp" integer NOT NULL, "isReply" boolean NOT NULL, "userSlackId" varchar NOT NULL, "text" varchar NOT NULL, "raw" blob NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "IDX_f6ecd9cf95fbc4541e5f911345" ON "message" ("channelSlackId", "threadTimestamp") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_f6ecd9cf95fbc4541e5f911345"`);
        await queryRunner.query(`DROP TABLE "message"`);
    }

}
