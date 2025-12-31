import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveLastLocationFromUsers1767201539088 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLocation"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLocation" geography(Point,4326)`);
    }

}
