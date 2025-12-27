import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarUrlToUsers1766788093889 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN "avatarUrl" VARCHAR`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN "avatarUrl"`);
  }
}
