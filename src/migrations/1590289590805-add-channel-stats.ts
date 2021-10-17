import {MigrationInterface, QueryRunner} from "typeorm";

export class addChannelStats1590289590805 implements MigrationInterface {
    name = 'addChannelStats1590289590805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "channel_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "channelId" varchar NOT NULL, "latestMessage" integer NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "channel_stats"`);
    }

}
