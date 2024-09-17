import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMessageTable1726583695320 implements MigrationInterface {
    name = 'CreateMessageTable1726583695320'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`message\` (\`id\` varchar(36) NOT NULL, \`role\` enum ('USER', 'BOT') NOT NULL DEFAULT 'USER', \`content\` text NOT NULL, \`suggestions\` text NOT NULL, \`canGenerateRecommendations\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`conversationId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`message\` ADD CONSTRAINT \`FK_7cf4a4df1f2627f72bf6231635f\` FOREIGN KEY (\`conversationId\`) REFERENCES \`conversation\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`message\` DROP FOREIGN KEY \`FK_7cf4a4df1f2627f72bf6231635f\``);
        await queryRunner.query(`DROP TABLE \`message\``);
    }

}
