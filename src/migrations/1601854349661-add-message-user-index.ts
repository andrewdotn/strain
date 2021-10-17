import {MigrationInterface, QueryRunner} from "typeorm";

export class addMessageUserIndex1601854349661 implements MigrationInterface {
    name = 'addMessageUserIndex1601854349661'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_2db5c7cb7c151bdaca94c88b80" ON "message" ("userSlackId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_2db5c7cb7c151bdaca94c88b80"`);
    }

}
