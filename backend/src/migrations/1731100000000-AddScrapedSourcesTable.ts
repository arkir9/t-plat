import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScrapedSourcesTable1731100000000 implements MigrationInterface {
  name = 'AddScrapedSourcesTable1731100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scraped_sources" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "url" text NOT NULL,
        "city" varchar(100),
        "is_active" boolean NOT NULL DEFAULT true,
        "is_event_store" boolean,
        "last_scraped_at" TIMESTAMP,
        "last_scrape_status" varchar(20),
        "last_scrape_error" text,
        "consecutive_failures" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_scraped_sources_url" UNIQUE ("url"),
        CONSTRAINT "PK_scraped_sources" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_scraped_sources_is_active" ON "scraped_sources" ("is_active")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "scraped_sources"`);
  }
}
