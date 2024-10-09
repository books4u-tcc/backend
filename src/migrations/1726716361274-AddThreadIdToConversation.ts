import { MigrationInterface, QueryRunner } from "typeorm";

export class AddThreadIdToConversation1726716361274 implements MigrationInterface {
    name = 'AddThreadIdToConversation1726716361274'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conversation\` DROP COLUMN \`threadId\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conversation\` ADD \`threadId\` text NOT NULL`);
    }

}
