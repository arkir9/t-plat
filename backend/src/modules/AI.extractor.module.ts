import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiExtractorService } from './AI.extractor.service';

/**
 * AiExtractorModule provides the AiExtractorService which uses Anthropic Claude
 * to extract structured event data from raw web page text.
 *
 * Migration: This replaces the previous OpenAI-based extractor.
 * Required env var: ANTHROPIC_API_KEY
 * Optional env var: CLAUDE_MODEL (defaults to claude-haiku-4-5-20251001)
 */
@Module({
  imports: [ConfigModule],
  providers: [AiExtractorService],
  exports: [AiExtractorService],
})
export class AiExtractorModule {}
