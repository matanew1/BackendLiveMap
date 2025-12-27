import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastLocationToUsers1766855432818 implements MigrationInterface {
    name = 'AddLastLocationToUsers1766855432818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users_locations" DROP CONSTRAINT "users_locations_user_id_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."location_gist_idx"`);
        await queryRunner.query(`DROP INDEX "public"."users_email_idx"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_role_check"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLocation" geography(Point,4326)`);
        await queryRunner.query(`ALTER TABLE "users_locations" ALTER COLUMN "last_updated" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying(10) NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "users_locations" ALTER COLUMN "last_updated" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLocation"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[])))`);
        await queryRunner.query(`CREATE INDEX "users_email_idx" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "location_gist_idx" ON "users_locations" USING GiST ("location") `);
        await queryRunner.query(`ALTER TABLE "users_locations" ADD CONSTRAINT "users_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
