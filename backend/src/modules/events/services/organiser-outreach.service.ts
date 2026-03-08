import { Injectable, Logger } from '@nestjs/common';
import { Event } from '../entities/event.entity';

@Injectable()
export class OrganiserOutreachService {
  private readonly logger = new Logger(OrganiserOutreachService.name);

  /**
   * Called after a new scraped event is saved. Handles outreach to organisers
   * (e.g. notify about claimed events, match to existing organisers).
   */
  async handleNewScrapedEvent(savedEvent: Event, rawPayload: any): Promise<void> {
    this.logger.log(`[Outreach] New scraped event saved: ${savedEvent.id} - ${savedEvent.title}`);
    // TODO: Implement organiser matching, email/SMS outreach, etc.
  }
}
