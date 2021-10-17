import {MigrationInterface, QueryRunner} from "typeorm";

export class addEmoji1634352889279 implements MigrationInterface {
    name = 'addEmoji1634352889279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "emoji" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "url" varchar NOT NULL, "localpath" varchar)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "emoji"`);
    }

}
