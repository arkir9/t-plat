import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// ─── Schema ────────────────────────────────────────────────────────────────

const EventItemSchema = z.object({
  title: z.string(),
  cleanDescription: z.string(),
  priceKES: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  eventType: z.enum([
    'concert',
    'nightlife',
    'festival',
    'arts_culture',
    'sports',
    'business',
    'community',
    'other',
  ]),
  imageUrl: z.string(),
});

const ExtractionResultSchema = z.object({
  isEventStore: z.boolean(),
  events: z.array(EventItemSchema),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type ExtractedEvent = z.infer<typeof EventItemSchema>;

// ─── Prompts ───────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an event data extraction bot specialising in Kenyan ticketing platforms.

You will receive:
1. The raw visible text from a webpage.
2. A list of image URLs found on that page.

Your job:
- Determine if this page is an EVENT STORE (selling event tickets) or a RETAIL STORE (selling physical products like clothes, electronics, food, etc.).
  Set "isEventStore" to true ONLY if the page is selling event tickets. If it is a retail shop, set it to false and return an empty events array.
- For each event you find, extract:
  * title: The event name, cleaned up (remove "Buy Tickets", store names, etc.)
  * cleanDescription: A nicely formatted 1-2 paragraph description. If the raw text is messy, rewrite it clearly while preserving the key details (lineup, venue, date, what to expect).
  * priceKES: The ticket price in Kenyan Shillings as a number. Use the cheapest listed price. If free, use 0. If no price is visible, use 0.
  * startDate: ISO 8601 datetime string. Infer the year if not given (use the next upcoming occurrence). If only a date is given, default to 18:00 EAT (15:00 UTC).
  * endDate: ISO 8601 datetime string. If not given, assume 5 hours after startDate.
  * eventType: One of: concert, nightlife, festival, arts_culture, sports, business, community, other. Pick the best match based on the event content.
  * imageUrl: The most relevant high-resolution poster/flyer URL from the provided image list. If none match, use an empty string.

Rules:
- Only extract REAL events with identifiable titles. Do not fabricate events.
- If no events are found on an event store page, return isEventStore: true with an empty events array.
- Dates must be valid ISO 8601 strings.
- Prices must be numbers (no currency symbols).

Respond ONLY with a valid JSON object matching this exact structure — no markdown, no explanation:
{
  "isEventStore": boolean,
  "events": [
    {
      "title": string,
      "cleanDescription": string,
      "priceKES": number,
      "startDate": string,
      "endDate": string,
      "eventType": string,
      "imageUrl": string
    }
  ]
}`;

// ─── Service ───────────────────────────────────────────────────────────────

@Injectable()
export class AiExtractorService {
  private readonly logger = new Logger(AiExtractorService.name);
  private client: Anthropic | null = null;

  /** Model to use — claude-sonnet-4-5 is the default; override via CLAUDE_MODEL env var */
  private readonly model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log('Anthropic Claude client initialised for AI extraction');
    } else {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — AI extraction disabled. ' +
          'Set ANTHROPIC_API_KEY in your .env to enable scraping.',
      );
    }

    this.model =
      this.configService.get<string>('CLAUDE_MODEL') ?? 'claude-haiku-4-5-20251001';
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Extract structured event data from raw page text and image URLs.
   *
   * Falls back to `{ isEventStore: false, events: [] }` on any error so that
   * callers never have to handle exceptions from this service.
   */
  async extractEvents(
    rawText: string,
    imageLinks: string[],
  ): Promise<ExtractionResult> {
    if (!this.client) {
      return { isEventStore: false, events: [] };
    }

    const truncatedText = rawText.slice(0, 12_000);
    const truncatedImages = imageLinks.slice(0, 30);

    const userMessage = [
      '=== PAGE TEXT ===',
      truncatedText,
      '',
      '=== IMAGE URLS ===',
      truncatedImages.join('\n'),
    ].join('\n');

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });

      // Extract text content from the response
      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        this.logger.warn('Claude returned no text content');
        return { isEventStore: false, events: [] };
      }

      return this.parseResponse(textContent.text);
    } catch (error: any) {
      this.logger.error(
        `Claude AI extraction failed: ${error?.message ?? String(error)}`,
      );
      return { isEventStore: false, events: [] };
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Safely parse the model's JSON response and validate it against the schema.
   * Returns a safe fallback on any parse/validation failure.
   */
  private parseResponse(raw: string): ExtractionResult {
    // Strip potential markdown code fences that the model might add
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      this.logger.warn(`Failed to parse Claude response as JSON: ${cleaned.slice(0, 200)}`);
      return { isEventStore: false, events: [] };
    }

    const result = ExtractionResultSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.warn(
        `Claude response failed schema validation: ${result.error.message}`,
      );
      // Attempt a lenient fallback: honour isEventStore but drop malformed events
      const obj = parsed as Record<string, unknown>;
      return {
        isEventStore: obj?.isEventStore === true,
        events: [],
      };
    }

    return result.data;
  }
}