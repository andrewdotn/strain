import {MigrationInterface, QueryRunner} from "typeorm";

export class addApiResult1590286409362 implements MigrationInterface {
    name = 'addApiResult1590286409362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "api_result" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "method" varchar NOT NULL, "params" varchar NOT NULL, "timestamp" integer NOT NULL, "data" blob NOT NULL)`);
        await queryRunner.query(`CREATE INDEX "IDX_c5403bb5fb6b3c345a899bcb4f" ON "api_result" ("method", "params", "timestamp") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_c5403bb5fb6b3c345a899bcb4f"`);
        await queryRunner.query(`DROP TABLE "api_result"`);
    }

}
