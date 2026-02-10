# Hybrid Event Strategy & Implementation Log

## 1. The Strategy: "Seed & Claim"

To solve the "Cold Start" problem (empty app) while preserving the business model (ticket commissions), we implemented a **Hybrid Aggregation Architecture**.

### Core Pillars

1. **Seed (API Aggregation):** automated "bots" fetch events from public APIs (e.g., Ticketmaster) to ensure the app always has content. These are marked as "Sourced from Web."
2. **Claim (Conversion):** Real organizers can view these sourced events and click **"Claim this Event."** This verifies them, transfers ownership, and allows them to sell tickets directly through T-Plat.
3. **Manual (Organic):** Organizers can still post events from scratch, which are immediately marked as "Verified/Official."

---

## 2. Backend Implementation (`/backend`)

### A. Database Schema Changes

We modified the `Event` entity to track the origin of data.

- **File:** `src/modules/events/entities/event.entity.ts`
- **Changes:**
  - Added `EventSource` enum: `INTERNAL`, `TICKETMASTER`, `EVENTBRITE`.
  - Added column `source`: Tracks where the event came from.
  - Added column `external_id`: Stores the ID from the 3rd party API (prevents duplicates).
  - Added column `is_claimed`: Boolean flag to mark if a real user owns it.
  - Added index `['externalId', 'source']` to optimize deduplication checks.

### B. Ingestion Service (The Bot)

We created a scheduled task to fetch data automatically.

- **File:** `src/modules/events/services/event-ingestion.service.ts` **(NEW)**
- **Functionality:**
  - Uses `@nestjs/schedule` to run a Cron job every midnight.
  - Fetches events from Ticketmaster API.
  - **Deduplication Logic:** Checks if `externalId` exists before saving.
  - **Normalization:** Maps external JSON to our internal `Event` entity.
  - **Ownership:** Assigns all fetched events to a "System Bot" user initially.

### C. Business Logic

We added the logic to transfer ownership safely.

- **File:** `src/modules/events/events.service.ts`
- **New Method:** `claimEvent(eventId, organizerId)`
  - Verifies the event is currently unclaimed.
  - Verifies the event is *not* manual (internal).
  - Updates `organizerId` to the real user.
  - Sets `isClaimed = true`.

### D. API Endpoints

- **File:** `src/modules/events/events.controller.ts`
- **New Endpoint:** `POST /events/:id/claim`
  - Protected by `JwtAuthGuard`.
  - Restricted to users with an `organizerProfile`.

---

## 3. Mobile Implementation (`/mobile`)

### A. Type Definitions

- **File:** `src/types/index.ts`
- **Changes:** Updated `Event` interface to include `isClaimed`, `source`, and `externalUrl`.

### B. Service Layer

- **File:** `src/services/eventsService.ts`
- **Changes:** Added `claimEvent()` function to call the new backend endpoint.

### C. UI/UX: Home Screen (Discovery)

Users need to differentiate between "Official" (Ticketable) events and "Info-only" events.

- **File:** `src/screens/home/HomeScreen.tsx`
- **Visual Changes:**
  - **Green Check Badge:** Displayed for `isClaimed=true` or `source='internal'`.
  - **Globe Icon:** Displayed for 3rd party events.
  - **Source Label:** "via Ticketmaster" text added to the card footer for transparency.

### D. UI/UX: Event Detail Screen (Conversion)

This is where the "Claiming" action happens.

- **File:** `src/screens/events/EventDetailScreen.tsx`
- **Visual Changes:**
  - **Verified Badge:** Prominent "Official Event" shield in the hero section.
  - **Organizer Banner:** "Are you the organizer?" section appears *only* if:
    1. User is an Organizer.
    2. Event is Unclaimed.
    3. Event is external.
  - **Call to Action:**
    - *If Official:* "Select Tickets" button.
    - *If Unclaimed:* "Visit Website" button (links to external source).

### E. UI/UX: Organizer Dashboard

- **File:** `src/screens/profile/PlatProEventsScreen.tsx`
- **Changes:** Added icons and labels to the list view so organizers can see which of their events were imported vs. created manually.

---

## 4. Infrastructure & Data

### A. SQL Scripts

- **Bot User Creation:** Script to create the "T-Plat Discovery" system user (UUID: `0000...`) that owns unclaimed events.

### B. Environment Variables

- **Backend** `.env`**:**
  - `TICKETMASTER_API_KEY`: For the ingestion service.
  - `SYSTEM_ORGANIZER_ID`: The UUID of the bot user.

---

## 5. How It Works (End-to-End Flow)

1. **Ingestion:** Every night at 00:00, the `EventIngestionService` wakes up.
2. **Fetching:** It asks Ticketmaster for events in "Nairobi."
3. **Saving:** It saves 50 new events to the DB, assigned to the "T-Plat Bot."
4. **Discovery:** A user opens the app and sees these events with a "Globe" icon. They can click "Visit Website" to buy tickets externally.
5. **The Hook:** A local club promoter downloads T-Plat. They see their own event listed!
6. **Claiming:** They open the event, see the "Are you the organizer?" banner, and click **Claim**.
7. **Conversion:** The event is instantly transferred to their profile. The "Globe" turns into a "Green Check."
8. **Monetization:** The promoter now edits the event to add *T-Plat Tickets*. Next time a user sees it, the button says "Select Tickets" (Commission for you).

