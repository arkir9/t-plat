import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { EventType } from '../entities/event.entity';

@Injectable()
export class HustlesasaScraperService {
  private readonly logger = new Logger(HustlesasaScraperService.name);

  // Primary: Hustlesasa product-grid theme
  private readonly SELECTORS = {
    productCard: '.product-item',
    title: '.product-title',
    price: '.product-price',
    image: '.product-image img',
    link: '.product-image a',
    description: '.product-description',
  };

  // Fallback: Common e-commerce / alternate Hustlesasa themes
  private readonly SELECTORS_ALT = [
    {
      productCard: '.product-card',
      title: '.product-card__title, .product-title, h3',
      price: '.product-card__price, .price, .product-price',
      image: '.product-card__image img, .product-card img, img',
      link: 'a[href*="/products/"], a[href*="/product/"]',
    },
    {
      productCard: '[class*="product"]',
      title: 'h3, .title, [class*="title"]',
      price: '[class*="price"]',
      image: 'img',
      link: 'a[href*="/products/"], a[href*="/product/"]',
    },
  ];

  constructor(private readonly httpService: HttpService) {}

  /**
   * 🛡️ STRUCTURE GUARD
   * Checks if the website layout matches our expectations.
   * Returns FALSE if the site is broken/changed, saving us from crashing.
   */
  async validateStructure(storeUrl: string): Promise<boolean> {
    try {
      const { data } = await firstValueFrom(this.httpService.get(storeUrl));
      const $ = cheerio.load(data);

      const hasCards = $(this.SELECTORS.productCard).length > 0;

      // If no cards, it might just be an empty shop (Safe to pass, but log it)
      if (!hasCards) {
        return true;
      }

      // Critical Check: Do the cards contain titles?
      const testCard = $(this.SELECTORS.productCard).first();
      const hasTitle = testCard.find(this.SELECTORS.title).length > 0;

      if (!hasTitle) {
        this.logger.error(`[Guard] 🛑 Layout mismatch at ${storeUrl}. Titles not found.`);
        return false;
      }

      return true; // GREEN LIGHT
    } catch (error: any) {
      this.logger.warn(`[Guard] Could not reach ${storeUrl}: ${error.message}`);
      return false;
    }
  }

  /**
   * 🏗️ MAIN SCRAPER
   * Tries primary selectors, then fallbacks if 0 events.
   */
  async scrapeStore(storeUrl: string): Promise<any[]> {
    if (!(await this.validateStructure(storeUrl))) return [];

    try {
      const { data } = await firstValueFrom(this.httpService.get(storeUrl));
      const $ = cheerio.load(data);
      let events = this.extractWithSelectors($, storeUrl, this.SELECTORS);

      if (events.length === 0) {
        for (const alt of this.SELECTORS_ALT) {
          events = this.extractWithSelectors($, storeUrl, alt);
          if (events.length > 0) {
            this.logger.log(`[Scraper] Used fallback selectors for ${storeUrl}`);
            break;
          }
        }
      }

      if (events.length === 0) {
        const single = this.extractSinglePageEvent($, storeUrl);
        if (single) events.push(single);
      }

      return events;
    } catch (error: any) {
      this.logger.error(`Error scraping ${storeUrl}`, error.message);
      return [];
    }
  }

  private static readonly NON_EVENT_TITLES = [
    'contact',
    'home',
    'about',
    'cart',
    'checkout',
    'search',
    'login',
    'sign up',
  ];

  /** Fallback: Extract single event from page when no product grid exists (single-page stores). */
  private extractSinglePageEvent($: cheerio.CheerioAPI, storeUrl: string): any | null {
    const title =
      $('h1').first().text().trim() ||
      $('h2').first().text().trim() ||
      $('title')
        .text()
        .replace(/\s*[-|]\s*.*$/, '')
        .trim();
    if (!title || title.length < 3) return null;
    if (HustlesasaScraperService.NON_EVENT_TITLES.includes(title.toLowerCase())) return null;

    const mainText = $('main').text() || $('article').text() || $('body').text();
    const rawDescription = mainText.slice(0, 800).trim() || title;
    const bannerUrl = this.extractPosterImage($, storeUrl);
    const logoUrl = this.extractLogoImage($, storeUrl);
    const price = this.extractPriceFromText(mainText);
    const { start, end } = this.extractDateFromText(title + ' ' + rawDescription);
    const fallback = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30';

    return {
      title,
      externalUrl: storeUrl,
      bannerUrl: bannerUrl || fallback,
      logoUrl: logoUrl || bannerUrl || fallback,
      price,
      source: 'hustlesasa',
      description: this.formatDescription(
        rawDescription.slice(0, 600) || `Event at ${title}. Visit for details.`,
      ),
      eventType: this.guessEventType(title),
      startDate: start,
      endDate: end,
    };
  }

  /** Extract logo (store/event logo) for card preview. */
  private extractLogoImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
    const html = $.html();
    // 1. Hustlesasa embedded JSON: "logo":"https://..."
    const logoMatch = html.match(/"logo":\s*"([^"]+)"/);
    if (logoMatch && logoMatch[1]) {
      const url = logoMatch[1].replace(/\\u0026/g, '&');
      if (url.startsWith('http') && !url.startsWith('data:')) return url;
    }
    // 2. img alt="Store logo" or "Shop logo"
    const logoImg = $(
      'img[alt*="Store logo"], img[alt*="Shop logo"], img[alt*="store logo"], img[alt*="shop logo"]',
    ).first();
    const logoSrc = logoImg.attr('src') || logoImg.attr('data-src');
    if (logoSrc && !logoSrc.startsWith('data:')) {
      const url = this.resolveImageUrl(logoSrc, baseUrl);
      if (url) return url;
    }
    // 3. Small square img in nav/header (usually logo)
    const navImg = $('nav img[src^="http"], header img[src^="http"]').first();
    const navSrc = navImg.attr('src') || navImg.attr('data-src');
    if (navSrc && !navSrc.startsWith('data:')) {
      const url = this.resolveImageUrl(navSrc, baseUrl);
      if (url) return url;
    }
    return null;
  }

  /** Extract banner/hero image for detail screen. */
  private extractPosterImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
    // 1. og:image / twitter:image – most reliable for poster
    const ogImg =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content');
    if (ogImg) {
      const url = this.resolveImageUrl(ogImg, baseUrl);
      if (url && !url.startsWith('data:')) return url;
    }
    // 2. Hustlesasa embedded JSON: "banner":[{"url":"https://..."}]
    const html = $.html();
    const bannerMatch = html.match(/"banner":\s*\[\s*\{\s*"url":\s*"([^"]+)"/);
    if (bannerMatch && bannerMatch[1]) {
      const url = bannerMatch[1].replace(/\\u0026/g, '&');
      if (url.startsWith('http')) return url;
    }
    // 3. link rel="preload" as="image"
    const preload = $('link[rel="preload"][as="image"]').first().attr('href');
    if (preload) {
      const url = this.resolveImageUrl(preload, baseUrl);
      if (url && !url.startsWith('data:')) return url;
    }
    // 4. Banner/hero img
    const bannerImg = $(
      'img[alt*="banner"], img[alt*="Banner"], img[alt*="hero"], img[alt*="Hustle store banner"]',
    ).first();
    const bannerSrc = bannerImg.attr('src') || bannerImg.attr('data-src');
    if (bannerSrc) {
      const url = this.resolveImageUrl(bannerSrc, baseUrl);
      if (url && !url.startsWith('data:')) return url;
    }
    // 5. First substantial img in main
    const mainImg = $(
      'main img[src^="http"], main img[src^="/"], main img[data-src^="http"]',
    ).first();
    const mainSrc = mainImg.attr('src') || mainImg.attr('data-src');
    if (mainSrc) {
      const url = this.resolveImageUrl(mainSrc, baseUrl);
      if (url && !url.startsWith('data:')) return url;
    }
    return null;
  }

  private resolveImageUrl(href: string, baseUrl: string): string {
    if (!href || href.startsWith('data:')) return href;
    if (href.startsWith('http://') || href.startsWith('https://'))
      return href.replace(/&amp;/g, '&');
    const base = new URL(baseUrl);
    if (href.startsWith('//')) return `https:${href}`.replace(/&amp;/g, '&');
    if (href.startsWith('/')) return `${base.origin}${href}`.replace(/&amp;/g, '&');
    return new URL(href, baseUrl).href.replace(/&amp;/g, '&');
  }

  /** Extract price from page text. Returns 0 for free, or parsed amount in KES. */
  private extractPriceFromText(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    const lower = text.toLowerCase();
    if (
      lower.includes('free') ||
      lower.includes('no charge') ||
      lower.includes('no charges')
    )
      return 0;
    const kesMatch = text.match(/(?:KES|KSh)\s*([0-9,]+(?:\.\d{2})?)/i);
    if (kesMatch) return parseFloat(kesMatch[1].replace(/,/g, '')) || 0;
    const numMatch = text.match(/\b([0-9]{2,5})\s*(?:KES|KSh|shillings?)/i);
    if (numMatch) return parseFloat(numMatch[1]) || 0;
    return 0;
  }

  /** Clean and format description for readability (paragraphs, fix typos). */
  private formatDescription(raw: string): string {
    return raw
      .replace(/\s+/g, ' ')
      .replace(/'{2,}/g, "'")
      .replace(/\btme\b/gi, 'time')
      .replace(/\s+([.,!?])/g, '$1')
      .trim();
  }

  private extractWithSelectors(
    $: cheerio.CheerioAPI,
    storeUrl: string,
    sel: { productCard: string; title: string; price?: string; image?: string; link: string },
  ): any[] {
    const events: any[] = [];
    const storeLogo = this.extractLogoImage($, storeUrl);
    $(sel.productCard).each((_, element) => {
      const $el = $(element);
      const title = $el.find(sel.title).first().text().trim();
      const linkEl = $el.find(sel.link).first();
      const linkPath = linkEl.attr('href') || ($el.is('a') ? $el.attr('href') : undefined);
      const relativeImg = sel.image
        ? $el.find(sel.image).first().attr('src') || $el.find(sel.image).first().attr('data-src')
        : undefined;
      const priceText = sel.price ? $el.find(sel.price).first().text().trim() : '';

      if (!title || !linkPath || linkPath === '#' || linkPath.startsWith('mailto:')) return;

      const fullLink = linkPath.startsWith('http')
        ? linkPath
        : `${storeUrl.replace(/\/$/, '')}${linkPath.startsWith('/') ? linkPath : '/' + linkPath}`;
      let imageUrl = relativeImg ? this.resolveImageUrl(relativeImg, storeUrl) : undefined;
      if (imageUrl?.startsWith('data:')) imageUrl = undefined;
      if (imageUrl?.includes('?')) imageUrl = imageUrl.split('?')[0];
      const price = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0;
      const description = $el.text();
      const { start, end } = this.extractDateFromText(title + ' ' + description);

      const banner = imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30';
      events.push({
        title,
        externalUrl: fullLink,
        bannerUrl: banner,
        logoUrl: storeLogo || banner,
        price,
        source: 'hustlesasa',
        description:
          this.formatDescription($el.text().slice(0, 400)) || 'Tickets available on Hustlesasa.',
        eventType: this.guessEventType(title),
        startDate: start,
        endDate: end,
      });
    });
    return events;
  }

  /**
   * 🧠 AI LOGIC: Category Guesser
   */
  private guessEventType(title: string): EventType {
    const t = title.toLowerCase();
    if (t.includes('fest') || t.includes('street food')) return EventType.FESTIVAL;
    if (t.includes('concert') || t.includes('live') || t.includes('band') || t.includes('sound'))
      return EventType.CONCERT;
    if (
      t.includes('comedy') ||
      t.includes('laugh') ||
      t.includes('sketch') ||
      t.includes('art') ||
      t.includes('design')
    )
      return EventType.ARTS_CULTURE;
    if (t.includes('sport') || t.includes('cup') || t.includes('match') || t.includes('rugby') || t.includes('polo'))
      return EventType.SPORTS;
    if (t.includes('conference') || t.includes('expo') || t.includes('summit'))
      return EventType.BUSINESS;
    if (t.includes('karibu') || t.includes('singalong') || t.includes('community'))
      return EventType.COMMUNITY;
    return EventType.NIGHTLIFE;
  }

  /**
   * 📅 SMART DATE PARSER
   * Looks for patterns like "4th Nov", "Dec 25", "Saturday"
   */
  private extractDateFromText(text: string): { start: Date; end: Date } {
    const now = new Date();
    let targetDate = new Date();
    targetDate.setDate(now.getDate() + 1); // Default to tomorrow

    // Regex for "4th Nov" or "4 Nov" or "Nov 4"
    const dateRegex =
      /([0-9]{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
    const match = text.match(dateRegex);

    if (match) {
      // We found a date! e.g. "4" and "Nov"
      const day = parseInt(match[1]);
      const monthStr = match[2];
      const currentYear = now.getFullYear();

      const monthIndex = new Date(`${monthStr} 1, 2000`).getMonth();

      targetDate = new Date(currentYear, monthIndex, day, 18, 0, 0); // Default to 6 PM

      // If date is in the past (e.g. detected "Jan 1" but it's "Dec"), assume next year
      if (targetDate < now) {
        targetDate.setFullYear(currentYear + 1);
      }
    }

    // End date = Start date + 5 hours (Typical for nightlife)
    const endDate = new Date(targetDate);
    endDate.setHours(targetDate.getHours() + 5);

    return { start: targetDate, end: endDate };
  }
}
