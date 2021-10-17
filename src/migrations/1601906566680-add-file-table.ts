import {MigrationInterface, QueryRunner} from "typeorm";

export class addFileTable1601906566680 implements MigrationInterface {
    name = 'addFileTable1601906566680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "file" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fileSlackId" varchar NOT NULL, "userSlackId" varchar NOT NULL, "messageTimestamp" integer NOT NULL, "fileTimestamp" integer NOT NULL, "filename" varchar NOT NULL, "filetype" varchar NOT NULL, "mimetype" varchar NOT NULL, "size" integer NOT NULL, "thumbFilename" varchar, "originalThumbExtension" varchar, "originalName" varchar NOT NULL, "originalTitle" varchar NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "file"`);
    }

}
