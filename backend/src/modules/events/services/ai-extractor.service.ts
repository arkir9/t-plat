import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

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
- Prices must be numbers (no currency symbols).`;

@Injectable()
export class AiExtractorService {
  private readonly logger = new Logger(AiExtractorService.name);
  private client: OpenAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  async extractEvents(
    rawText: string,
    imageLinks: string[],
  ): Promise<ExtractionResult> {
    if (!this.client) {
      this.logger.warn('OPENAI_API_KEY not configured — skipping AI extraction');
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
      const completion = await this.client.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        response_format: zodResponseFormat(ExtractionResultSchema, 'extraction'),
        temperature: 0.1,
      });

      const parsed = completion.choices[0]?.message?.parsed;
      if (!parsed) {
        this.logger.warn('LLM returned no parseable structured output');
        return { isEventStore: false, events: [] };
      }

      return parsed;
    } catch (error: any) {
      this.logger.error(
        `AI extraction failed: ${error?.message || error}`,
      );
      return { isEventStore: false, events: [] };
    }
  }
}
