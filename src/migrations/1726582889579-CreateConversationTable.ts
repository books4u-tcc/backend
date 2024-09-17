import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateConversationTable1726582889579 implements MigrationInterface {
    name = 'CreateConversationTable1726582889579'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`conversation\` (\`id\` varchar(36) NOT NULL, \`title\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`createdById\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`conversation\` ADD CONSTRAINT \`FK_c681529d2e6afa4aed28ef53b08\` FOREIGN KEY (\`createdById\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`conversation\` DROP FOREIGN KEY \`FK_c681529d2e6afa4aed28ef53b08\``);
        await queryRunner.query(`DROP TABLE \`conversation\``);
    }

}
