import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventAdvertisingColumns1730000000000 implements MigrationInterface {
  name = 'AddEventAdvertisingColumns1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "is_sponsored" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "sponsor_name" varchar(255),
      ADD COLUMN IF NOT EXISTS "banner_image_url" varchar
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_is_sponsored" ON "events" ("is_sponsored")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_is_sponsored"`);
    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN IF EXISTS "is_sponsored",
      DROP COLUMN IF EXISTS "sponsor_name",
      DROP COLUMN IF EXISTS "banner_image_url"
    `);
  }
}
