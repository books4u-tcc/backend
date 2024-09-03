import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountTable1725226683486 implements MigrationInterface {
  name = 'CreateAccountTable1725226683486';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`account\` (
        \`id\` varchar(36) NOT NULL,
        \`displayName\` text NOT NULL,
        \`email\` varchar(255) NOT NULL,  -- Corrigido para varchar(255)
        \`passwordHash\` text NOT NULL,
        \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_4c8f96ccf523e9a3faefd5bdd4\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_4c8f96ccf523e9a3faefd5bdd4\` ON \`account\``);
    await queryRunner.query(`DROP TABLE \`account\``);
  }
}
