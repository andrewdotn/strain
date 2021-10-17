import {MigrationInterface, QueryRunner} from "typeorm";

export class addUserTable1601846859305 implements MigrationInterface {
    name = 'addUserTable1601846859305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "slackId" varchar NOT NULL, "name" varchar NOT NULL, "realName" integer, "isAdmin" boolean NOT NULL, "isOwner" boolean NOT NULL, "isDeleted" boolean NOT NULL, "raw" blob NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_844098308ecb5168105cffa9ba" ON "user" ("slackId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_844098308ecb5168105cffa9ba"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
