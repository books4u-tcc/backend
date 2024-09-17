import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookRecomendationTable1726584022493 implements MigrationInterface {
    name = 'CreateBookRecomendationTable1726584022493'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`bookRecomendation\` (\`id\` varchar(36) NOT NULL, \`name\` text NOT NULL, \`author\` text NOT NULL, \`imageUrl\` text NULL, \`externalLink\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`bookRecomendation\``);
    }

}
