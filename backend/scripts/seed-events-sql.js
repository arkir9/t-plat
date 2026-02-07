#!/usr/bin/env node
'use strict';
/**
 * Fast seed: plain Node + pg + bcrypt. No TypeORM, no ts-node.
 * Run: node scripts/seed-events-sql.js (from backend dir, after npm install)
 * Requires: .env with DB_* and migration 003 applied (event advertising columns).
 * Uses bcrypt rounds=6 for speed (dev seed only).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 6; // dev seed only; faster than 10

const SEED_EMAIL = 'seed-organizer@t-plat.test';
const SEED_PASSWORD = 'SeedPass123!';

const db = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: (process.env.DB_USERNAME || '').trim() || 'postgres',
  password: (process.env.DB_PASSWORD || '').trim() || 'postgres',
  database: (process.env.DB_DATABASE || '').trim() || 't_plat',
};

const EVENTS = [
  {
    title: 'Featured Night: Live Jazz & Cocktails',
    description: 'An evening of live jazz and premium cocktails.',
    category: 'music',
    event_type: 'concert',
    is_featured: true,
    is_sponsored: false,
    sponsor_name: null,
    banner_image_url: null,
    age_restriction: '18+',
    tags: ['jazz', 'live music', 'cocktails'],
  },
  {
    title: 'Sponsored: Tech Meetup Nairobi',
    description: 'Network with developers and startups.',
    category: 'tech',
    event_type: 'meetup',
    is_featured: false,
    is_sponsored: true,
    sponsor_name: 'TechHub Kenya',
    banner_image_url: null,
    age_restriction: null,
    tags: ['tech', 'networking'],
  },
  {
    title: 'Banner Event: New Year Eve Gala',
    description: 'Premium New Year celebration.',
    category: 'nightlife',
    event_type: 'gala',
    is_featured: true,
    is_sponsored: true,
    sponsor_name: 'T-Plat Premium',
    banner_image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    age_restriction: '21+',
    tags: ['new year', 'gala', 'premium'],
  },
  {
    title: 'Weekend Brunch & Beats',
    description: 'Sunday brunch with DJ and outdoor seating.',
    category: 'food',
    event_type: 'brunch',
    is_featured: false,
    is_sponsored: false,
    sponsor_name: null,
    banner_image_url: null,
    age_restriction: null,
    tags: ['brunch', 'dj', 'outdoor'],
  },
  {
    title: 'Sponsored: Fitness Fest 2025',
    description: 'Full-day fitness workshops and demos.',
    category: 'sports',
    event_type: 'fitness',
    is_featured: false,
    is_sponsored: true,
    sponsor_name: 'FitLife Kenya',
    banner_image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    age_restriction: null,
    tags: ['fitness', 'workshop'],
  },
  {
    title: 'Art & Wine Evening',
    description: 'Local art showcase with wine tasting.',
    category: 'arts',
    event_type: 'exhibition',
    is_featured: true,
    is_sponsored: false,
    sponsor_name: null,
    banner_image_url: null,
    age_restriction: '18+',
    tags: ['art', 'wine'],
  },
];

const customLocation = {
  address: 'Kenyatta Avenue',
  city: 'Nairobi',
  country: 'Kenya',
  latitude: -1.2921,
  longitude: 36.8219,
};

async function run() {
  const client = new Client(db);
  await client.connect();

  try {
    await client.query('BEGIN');
    let userId, organizerId;

    const userRow = await client.query('SELECT id FROM users WHERE email = $1', [SEED_EMAIL]);
    if (userRow.rows.length > 0) {
      userId = userRow.rows[0].id;
      console.log('Using existing seed user:', SEED_EMAIL);
    } else {
      const hash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
      const idRow = await client.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, email_verified, is_active)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, true, true)
         RETURNING id`,
        [SEED_EMAIL, hash, 'Seed', 'Organizer'],
      );
      userId = idRow.rows[0].id;
      console.log('Created seed user:', SEED_EMAIL);
    }

    const orgRow = await client.query(
      "SELECT id FROM organizer_profiles WHERE user_id = $1 AND profile_type = 'event_organizer'",
      [userId],
    );
    if (orgRow.rows.length > 0) {
      organizerId = orgRow.rows[0].id;
      console.log('Using existing organizer');
    } else {
      const idRow = await client.query(
        `INSERT INTO organizer_profiles (id, user_id, profile_type, name, bio, verification_status)
         VALUES (gen_random_uuid(), $1, 'event_organizer', $2, $3, 'verified')
         RETURNING id`,
        [userId, 'T-Plat Test Events', 'Seed organizer for dummy events.'],
      );
      organizerId = idRow.rows[0].id;
      console.log('Created seed organizer');
    }

    const now = new Date();
    const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const inOneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const times = [inOneWeek, inTwoWeeks, inOneMonth, inOneWeek, inTwoWeeks, inOneMonth];
    const endOffsets = [4, 3, 6, 4, 8, 3];
    const locs = [
      customLocation,
      { ...customLocation, address: 'Kilimani' },
      customLocation,
      { ...customLocation, address: 'Westlands' },
      customLocation,
      customLocation,
    ];

    let created = 0;
    for (let i = 0; i < EVENTS.length; i++) {
      const ev = EVENTS[i];
      const start = times[i];
      const end = new Date(start.getTime() + endOffsets[i] * 60 * 60 * 1000);
      const exists = await client.query(
        'SELECT 1 FROM events WHERE organizer_id = $1 AND title = $2 AND start_date = $3',
        [organizerId, ev.title, start],
      );
      if (exists.rows.length > 0) continue;

      await client.query(
        `INSERT INTO events (
          id, organizer_id, title, description, category, event_type, start_date, end_date,
          timezone, location_type, custom_location, status, is_featured, is_sponsored,
          sponsor_name, banner_image_url, publish_date, tags, age_restriction, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'Africa/Nairobi', 'custom', $8::jsonb,
          'published', $9, $10, $11, $12, $13, $14::jsonb, $15, NOW(), NOW()
        )`,
        [
          organizerId,
          ev.title,
          ev.description,
          ev.category,
          ev.event_type,
          start,
          end,
          JSON.stringify(locs[i]),
          ev.is_featured,
          ev.is_sponsored,
          ev.sponsor_name,
          ev.banner_image_url,
          now,
          JSON.stringify(ev.tags || []),
          ev.age_restriction,
        ],
      );
      created++;
    }

    // Seed ticket types for all events by this organizer
    const eventsRows = await client.query(
      'SELECT id FROM events WHERE organizer_id = $1 ORDER BY created_at DESC',
      [organizerId],
    );
    for (const row of eventsRows.rows) {
      const eventId = row.id;
      const existing = await client.query(
        'SELECT 1 FROM ticket_types WHERE event_id = $1 LIMIT 1',
        [eventId],
      );
      if (existing.rows.length > 0) continue;
      const types = [
        { name: 'General Admission', price: 1500, qty: 100 },
        { name: 'VIP', price: 5000, qty: 20 },
        { name: 'Early Bird', price: 800, qty: 50 },
      ];
      for (const t of types) {
        await client.query(
          `INSERT INTO ticket_types (id, event_id, name, price, currency, quantity_available, quantity_sold, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, 'KES', $4, 0, true, NOW(), NOW())`,
          [eventId, t.name, t.price, t.qty],
        );
      }
    }
    console.log('Ticket types: ensured for', eventsRows.rows.length, 'events');

    await client.query('COMMIT');
    console.log('Dummy events: %d new, %d already existed', created, EVENTS.length - created);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
