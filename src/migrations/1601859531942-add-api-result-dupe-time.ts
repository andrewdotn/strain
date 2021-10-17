import {MigrationInterface, QueryRunner} from "typeorm";

export class addApiResultDupeTime1601859531942 implements MigrationInterface {
    name = 'addApiResultDupeTime1601859531942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_c5403bb5fb6b3c345a899bcb4f"`);
        await queryRunner.query(`CREATE TABLE "temporary_api_result" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "method" varchar NOT NULL, "params" varchar NOT NULL, "timestamp" integer NOT NULL, "data" blob NOT NULL, "lastDupeTime" integer)`);
        await queryRunner.query(`INSERT INTO "temporary_api_result"("id", "method", "params", "timestamp", "data") SELECT "id", "method", "params", "timestamp", "data" FROM "api_result"`);
        await queryRunner.query(`DROP TABLE "api_result"`);
        await queryRunner.query(`ALTER TABLE "temporary_api_result" RENAME TO "api_result"`);
        await queryRunner.query(`CREATE INDEX "IDX_c5403bb5fb6b3c345a899bcb4f" ON "api_result" ("method", "params", "timestamp") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_c5403bb5fb6b3c345a899bcb4f"`);
        await queryRunner.query(`ALTER TABLE "api_result" RENAME TO "temporary_api_result"`);
        await queryRunner.query(`CREATE TABLE "api_result" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "method" varchar NOT NULL, "params" varchar NOT NULL, "timestamp" integer NOT NULL, "data" blob NOT NULL)`);
        await queryRunner.query(`INSERT INTO "api_result"("id", "method", "params", "timestamp", "data") SELECT "id", "method", "params", "timestamp", "data" FROM "temporary_api_result"`);
        await queryRunner.query(`DROP TABLE "temporary_api_result"`);
        await queryRunner.query(`CREATE INDEX "IDX_c5403bb5fb6b3c345a899bcb4f" ON "api_result" ("method", "params", "timestamp") `);
    }

}
