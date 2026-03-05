import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventContentHashColumns1731000000000 implements MigrationInterface {
  name = 'AddEventContentHashColumns1731000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "content_hash" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "last_scraped_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "last_scraped_at"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "content_hash"`);
  }
}

