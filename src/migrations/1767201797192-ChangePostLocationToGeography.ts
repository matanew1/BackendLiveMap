import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePostLocationToGeography1767201797192 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing column
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "location"`);
    // Add new geography column
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "location" geography(Point,4326)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop geography column
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "location"`);
    // Add back varchar column
    await queryRunner.query(`ALTER TABLE "posts" ADD "location" varchar`);
  }
}
