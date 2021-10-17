import {MigrationInterface, QueryRunner} from "typeorm";

export class removeChannelStats1590326246281 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE "channel_stats"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
