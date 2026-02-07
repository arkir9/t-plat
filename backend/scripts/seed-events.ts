/**
 * Seed script: creates a test user, organizer, and dummy events for testing.
 * Includes featured events, sponsored placements, and banner-style events per MVP advertising.
 *
 * Run from backend directory: npx ts-node -r tsconfig-paths/register scripts/seed-events.ts
 * Ensure backend/.env exists and DB is running.
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load backend .env (when run from backend dir)
config({ path: join(__dirname, '..', '.env') });

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/modules/users/entities/user.entity';
import { OrganizerProfile } from '../src/modules/organizers/entities/organizer-profile.entity';
import {
  Event,
  EventStatus,
  LocationType,
  VenueFeeType,
} from '../src/modules/events/entities/event.entity';

const SEED_EMAIL = 'seed-organizer@t-plat.test';
const SEED_PASSWORD = 'SeedPass123!';

async function run() {
  const username = (process.env.DB_USERNAME || '').trim() || 'postgres';
  const password = (process.env.DB_PASSWORD || '').trim() || 'postgres';
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username,
    password,
    database: process.env.DB_DATABASE || 't_plat',
    entities: [User, OrganizerProfile, Event],
    synchronize: false,
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const organizerRepo = dataSource.getRepository(OrganizerProfile);
  const eventRepo = dataSource.getRepository(Event);

  let user = await userRepo.findOne({ where: { email: SEED_EMAIL } });
  let organizer: OrganizerProfile | null = null;

  if (!user) {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    user = userRepo.create({
      email: SEED_EMAIL,
      passwordHash,
      firstName: 'Seed',
      lastName: 'Organizer',
      emailVerified: true,
      isActive: true,
    });
    user = await userRepo.save(user);
    console.log('Created seed user:', user.email);
  } else {
    console.log('Using existing seed user:', user.email);
  }

  organizer = await organizerRepo.findOne({
    where: { userId: user.id, profileType: 'event_organizer' },
  });
  if (!organizer) {
    organizer = organizerRepo.create({
      userId: user.id,
      profileType: 'event_organizer',
      name: 'T-Plat Test Events',
      bio: 'Seed organizer for dummy events.',
      verificationStatus: 'verified',
    });
    organizer = await organizerRepo.save(organizer);
    console.log('Created seed organizer:', organizer.name);
  } else {
    console.log('Using existing organizer:', organizer.name);
  }

  const now = new Date();
  const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const inOneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const nairobiLocation = {
    address: 'Kenyatta Avenue',
    city: 'Nairobi',
    country: 'Kenya',
    latitude: -1.2921,
    longitude: 36.8219,
  };

  const dummyEvents: Partial<Event>[] = [
    {
      organizerId: organizer.id,
      title: 'Featured Night: Live Jazz & Cocktails',
      description: 'Top of listings featured event. An evening of live jazz and premium cocktails.',
      category: 'music',
      eventType: 'concert',
      startDate: inOneWeek,
      endDate: new Date(inOneWeek.getTime() + 4 * 60 * 60 * 1000),
      timezone: 'Africa/Nairobi',
      locationType: LocationType.CUSTOM,
      customLocation: nairobiLocation,
      status: EventStatus.PUBLISHED,
      isFeatured: true,
      isSponsored: false,
      publishDate: now,
      tags: ['jazz', 'live music', 'cocktails'],
      ageRestriction: '18+',
    },
    {
      organizerId: organizer.id,
      title: 'Sponsored: Tech Meetup Nairobi',
      description: 'Sponsored placement from TechHub. Network with developers and startups.',
      category: 'tech',
      eventType: 'meetup',
      startDate: inTwoWeeks,
      endDate: new Date(inTwoWeeks.getTime() + 3 * 60 * 60 * 1000),
      timezone: 'Africa/Nairobi',
      locationType: LocationType.CUSTOM,
      customLocation: { ...nairobiLocation, address: 'Kilimani' },
      status: EventStatus.PUBLISHED,
      isFeatured: false,
      isSponsored: true,
      sponsorName: 'TechHub Kenya',
      publishDate: now,
      tags: ['tech', 'networking'],
    },
    {
      organizerId: organizer.id,
      title: 'Banner Event: New Year Eve Gala',
      description: 'Highlighted with banner ad. Premium New Year celebration.',
      category: 'nightlife',
      eventType: 'gala',
      startDate: inOneMonth,
      endDate: new Date(inOneMonth.getTime() + 6 * 60 * 60 * 1000),
      timezone: 'Africa/Nairobi',
      locationType: LocationType.CUSTOM,
      customLocation: nairobiLocation,
      status: EventStatus.PUBLISHED,
      isFeatured: true,
      isSponsored: true,
      sponsorName: 'T-Plat Premium',
      bannerImageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      publishDate: now,
      tags: ['new year', 'gala', 'premium'],
      ageRestriction: '21+',
    },
    {
      organizerId: organizer.id,
      title: 'Weekend Brunch & Beats',
      description: 'Sunday brunch with DJ and outdoor seating.',
      category: 'food',
      eventType: 'brunch',
      startDate: inOneWeek,
      endDate: new Date(inOneWeek.getTime() + 4 * 60 * 60 * 1000),
      timezone: 'Africa/Nairobi',
      locationType: LocationType.CUSTOM,
      customLocation: { ...nairobiLocation, address: 'Westlands' },
      status: EventStatus.PUBLISHED,
      isFeatured: false,
      isSponsored: false,
      publishDate: now,
      tags: ['brunch', 'dj', 'outdoor'],
    },
    {
      organizerId: organizer.id,
      title: 'Sponsored: Fitness Fest 2025',
      description: 'Sponsored by FitLife. Full-day fitness workshops and demos.',
      category: 'sports',
      eventType: 'fitness',
      startDate: inTwoWeeks,
      endDate: new Date(inTwoWeeks.getTime() + 8 * 60 * 60 * 1000),
      timezone: 'Africa/Nairobi',
      locationType: LocationType.CUSTOM,
      customLocation: nairobiLocation,
      status: EventStatus.PUBLISHED,
      isFeatured: false,
      isSponsored: true,
      sponsorName: 'FitLife Kenya',
      bannerImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      publishDate: now,
      tags: ['fitness', 'workshop'],
    },
    {
      organizerId: organizer.id,
      title: 'Art & Wine Evening',
      description: 'Local art showcase with wine tasting.',
      category: 'arts',
      eventType: 'exhibition',
      startDate: inOneMonth,
      endDate: new Date(inOneMonth.getTime() + 3 * 60 * 60 * 1000),
      timezone: 'Africa/Nairobi',
      locationType: LocationType.CUSTOM,
      customLocation: nairobiLocation,
      status: EventStatus.PUBLISHED,
      isFeatured: true,
      isSponsored: false,
      publishDate: now,
      tags: ['art', 'wine'],
      ageRestriction: '18+',
    },
  ];

  let created = 0;
  for (const ev of dummyEvents) {
    const existing = await eventRepo.findOne({
      where: {
        organizerId: organizer!.id,
        title: ev.title,
        startDate: ev.startDate,
      },
    });
    if (!existing) {
      await eventRepo.save(eventRepo.create(ev));
      created++;
    }
  }

  console.log('Dummy events: %d new, %d already existed', created, dummyEvents.length - created);
  await dataSource.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
