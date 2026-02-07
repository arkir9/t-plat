# MVP Plan: Ticketing Platform & Event Advertising

## 🎯 MVP Focus
**Core Value Proposition**: A platform where event organizers and venue organizers can advertise their events/activities, and users can discover and purchase tickets.

---

## ✅ MVP Features

### 1. **User Management**
- User registration/login (email, phone, OAuth)
- **Multi-role support**: Same account can have:
  - Regular user role (default - browse events, purchase tickets)
  - **Event organizer profile** (create events, request venue bookings)
  - **Venue organizer profile** (manage venue, post venue events, respond to booking requests)
  - **Can have BOTH organizer profiles simultaneously** (e.g., a user can be both an event organizer AND a venue organizer)
- Roles are managed via separate `organizer_profiles` (one user can have multiple profiles)
- Example: A user can post their own events at their venue AND also request to host events at other venues

### 2. **Event Management (Organizers)**
- **Venue Organizers**: Direct event creation (post their own venue events/activities)
- **Event Organizers**: 
  - Create events at custom locations (own events)
  - Request to host events at venues (venue booking request flow)
  - Provide: date, description, estimated capacity
  - Venue responds with quote (accept/deny)
  - Once accepted, event is created and owned by event organizer
- Event details:
  - Title, description, images
  - Date/time, location (venue or custom location)
  - Ticket types and pricing
  - Capacity limits (max tickets per user based on venue capacity)
  - Age restrictions, dress code
  - Organizer/venue profile link
- Event status (draft, published, cancelled, completed)
- Basic analytics dashboard for both organizer types (views, ticket sales, revenue)

### 3. **Event Discovery (Users)**
- Browse events (list/grid view)
- **Map view with nearby events (PRIORITY)** - Like Uber:
  - Real-time location tracking
  - Clustering of nearby events (recommended: cluster after 15-20 markers per view)
  - Event markers on map with custom icons
  - Tap marker to see event preview card
  - Filter events on map (date, type, price)
  - Distance-based sorting
  - Custom avatars/bitmoji on map (TBD - custom build or service integration)
- Search by location, date, keyword
- Filters: date range, price range, event type
- Event detail page with full information
- **Favorites/Wishlist**: Save events for later, get price drop notifications
- **Low-data mode optimization**: Compressed images, minimal data usage
- Social sharing across platforms (priority: Instagram, Snapchat, Locket):
  - Share event links to Instagram, Snapchat, Locket, WhatsApp, Facebook, Twitter
  - Custom share cards with event image
  - Track referral sources
  - Deep linking for shared event URLs

### 4. **Ticketing System**
- Multiple ticket types per event (customizable by organizer)
- Ticket pricing and capacity per type
- Max tickets per user based on venue capacity (if applicable)
- Purchase flow:
  - Select ticket type and quantity
  - **Payment processing** (full payment):
    - **M-Pesa** (primary for Nairobi - via Safaricom API or payment aggregator)
    - Stripe (KES or USD - card payments)
  - QR code generation
  - Email/SMS ticket delivery
  - **Offline ticket viewing**: Download tickets for offline access
- **Ticket Transfer/Gift**:
  - Transfer ticket to another user (email/phone)
  - Gift tickets with message
  - Secure transfer (prevents fraud)
- **Waitlist for Sold-Out Events**:
  - Join waitlist for sold-out events
  - Auto-notify when tickets become available
  - Organizers can see demand for future events
- QR code check-in system (for organizers)
- Ticket management (view purchased tickets, request cancellation)
- **Refunds**: Manual approval by organizers (approve/deny refund requests)
- **Commission**: 
  - 5% platform commission on ticket sales
  - Venue fee (percentage/fixed) paid to venue (if event hosted at venue)

### 5. **Organizer Profiles & Dashboards**
- **Event Organizer Profile**: 
  - Company/personal info
  - Bio, logo, social links
  - List of their events
  - Pending/accepted venue requests
- **Venue Organizer Profile**:
  - Venue name, address, description
  - Venue images, amenities
  - List of events at venue (their own + hosted events)
  - Venue capacity, facilities
  - Pending booking requests
- **Dashboards**: 
  - Event Organizers: Manage events, view booking requests, analytics, refund approvals
  - Venue Organizers: Manage venue events, respond to booking requests, view hosted events, analytics

### 6. **Advertising System**
- **Free**: All event postings are free
- **Paid Advertising** (optional):
  - Featured events (top of listings, highlighted)
  - Sponsored placements (from relevant apps/companies)
  - Banner ads
- Payment for advertising campaigns

### 7. **Push Notifications**
- **Nearby Events**: "3 events happening near you this weekend"
- **Price Drops**: Notifications for wishlisted/favorite events when prices drop
- **Event Reminders**: For purchased events (24h, 2h before event)
- **Sold Out Alerts**: "Event you viewed is almost sold out"
- **Waitlist Notifications**: "Tickets available for waitlisted event"
- User preference settings (what notifications they want)

### 8. **Reviews & Ratings (Post-Event)**
- Rate event (1-5 stars) after attending
- Write review about event experience
- Rate venue separately (if hosted at venue)
- Rate organizer performance
- Help future event discovery
- Organizers can respond to reviews

### 9. **Safety Features (Nightlife)**
- **Emergency Contacts**: Add emergency contacts, share event details
- **Event Check-in**: Safety check-in at event start/end
- **Report Issues**: Report safety concerns or issues at events
- **Venue Safety Info**: Safety information about venues
- **Share Location**: Share event location with trusted contacts
- **Safety Tips**: Pre-event safety tips for nightlife events

---

## 🚫 Out of MVP Scope (Future Phases)
- Social features (follows, chat, discussion boards)
- Gamification (streaks, badges, custom bitmoji avatars)
- Voting/rating system
- Merchandise shop
- Installment payments (full payment only for MVP)
- Advanced analytics dashboard
- **Note**: Custom bitmoji on map and social sharing marked as "nice to have" - can be added to MVP if time permits

---

## 📊 MVP Database Schema

### Core Tables

#### 1. **users**
- id, email, password_hash, phone
- first_name, last_name, profile_image
- **No user_type field** - roles managed via organizer_profiles
- email_verified, phone_verified
- created_at, updated_at

**Note**: Users can have 0, 1, or 2 organizer profiles:
- 0 profiles = regular user only
- 1 profile = either event_organizer OR venue_organizer
- 2 profiles = BOTH event_organizer AND venue_organizer simultaneously

#### 2. **organizer_profiles**
- id, user_id (FK)
- profile_type: 'event_organizer' | 'venue_organizer'
- name, bio, logo_url
- website, social_links (JSON)
- verification_status: 'pending' | 'verified' | 'rejected' (manual verification)
- For venues: address, capacity, amenities (JSON), city (for Nairobi/Africa focus)
- created_at, updated_at

**Important**: 
- One user can have **multiple organizer_profiles**
- A user can have **BOTH** an event_organizer profile AND a venue_organizer profile simultaneously
- Example: A user with both profiles can:
  - Create events at their own venue (using venue profile)
  - Create events at other venues (using event organizer profile)
  - Receive booking requests for their venue (using venue profile)
  - Submit booking requests to other venues (using event organizer profile)
- Unique constraint: (user_id, profile_type) - prevents duplicate profile types per user

#### 3. **venue_booking_requests** (NEW)
- id, event_organizer_id (FK)
- venue_id (FK)
- requested_date, description, estimated_capacity
- status: 'pending' | 'accepted' | 'rejected' | 'expired'
- venue_quote (decimal) - quote from venue
- venue_response_notes (text)
- expires_at (timestamp)
- created_at, updated_at

#### 4. **events**
- id, organizer_id (FK to organizer_profiles) - event organizer owns it
- venue_booking_request_id (FK, if created from booking request)
- venue_id (FK, if hosted at venue)
- title, description
- event_type, category
- start_date, end_date
- location_type: 'venue' | 'custom'
- custom_location (JSON: address, city, lat, lng)
- images (JSON array)
- age_restriction, dress_code
- venue_fee_percentage (decimal) - fee paid to venue
- venue_fee_amount (decimal) - fixed fee (alternative to percentage)
- status: 'draft' | 'published' | 'cancelled' | 'completed'
- is_featured (boolean)
- created_at, updated_at

#### 5. **ticket_types**
- id, event_id (FK)
- name (e.g., "General Admission", "VIP")
- price, currency
- quantity_available, quantity_sold
- sale_start_date, sale_end_date
- description
- created_at, updated_at

#### 6. **tickets**
- id, user_id (FK)
- event_id (FK)
- ticket_type_id (FK)
- order_id (FK to orders)
- qr_code, qr_code_hash
- status: 'active' | 'used' | 'cancelled' | 'refunded'
- checked_in_at, checked_in_by (organizer_id)
- created_at, updated_at

#### 7. **orders**
- id, user_id (FK)
- event_id (FK)
- total_amount, currency ('KES' or 'USD')
- platform_commission_amount (decimal) - 5% of total
- venue_fee_amount (decimal) - if hosted at venue
- net_amount (decimal) - amount to event organizer after commissions
- payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
- payment_method, payment_intent_id (Stripe/PayPal)
- created_at, updated_at

#### 8. **order_items**
- id, order_id (FK)
- ticket_type_id (FK)
- quantity, unit_price, total_price
- created_at

#### 9. **refund_requests** (NEW)
- id, ticket_id (FK)
- user_id (FK)
- reason, status: 'pending' | 'approved' | 'rejected'
- organizer_response (text)
- refund_amount (decimal)
- processed_at (timestamp)
- created_at, updated_at

#### 10. **advertising_campaigns**
- id, organizer_id (FK)
- event_id (FK)
- campaign_type: 'featured' | 'sponsored' | 'banner'
- start_date, end_date
- amount_paid, payment_status
- created_at, updated_at

---

## 🔌 MVP API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Events (Public)
- `GET /api/events` - List events (with filters)
- `GET /api/events/:id` - Get event details
- `GET /api/events/search` - Search events
- `GET /api/events/nearby` - Get nearby events (for map view)
  - Query params: lat, lng, radius, filters
- `GET /api/events/:id/share-link` - Generate shareable link with metadata

### Events (Organizer)
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/organizers/me/events` - Get my events
- `GET /api/organizers/me/events/:id/analytics` - Event analytics

### Organizer Profiles
- `GET /api/organizers/:id` - Get organizer profile
- `POST /api/organizers/profile` - Create/update profile
- `GET /api/organizers/:id/events` - Get organizer's events

### Venue Booking Requests
- `POST /api/venue-booking-requests` - Event organizer creates booking request
- `GET /api/organizers/me/booking-requests` - Get my requests (as event organizer)
- `GET /api/venues/me/booking-requests` - Get requests for my venue
- `PUT /api/venue-booking-requests/:id/respond` - Venue responds (accept/reject with quote)
- `POST /api/venue-booking-requests/:id/accept-quote` - Event organizer accepts quote and creates event

### Tickets
- `GET /api/events/:id/ticket-types` - Get ticket types for event
- `POST /api/orders` - Create order (purchase tickets) - M-Pesa or Stripe (KES/USD)
- `GET /api/users/me/tickets` - Get my tickets
- `GET /api/tickets/:id` - Get ticket details (with QR) - supports offline download
- `POST /api/tickets/:id/download` - Download ticket for offline viewing
- `POST /api/tickets/:id/transfer` - Transfer ticket to another user
- `POST /api/tickets/:id/gift` - Gift ticket with message
- `POST /api/ticket-transfers/:id/accept` - Accept ticket transfer
- `POST /api/tickets/:id/request-refund` - Request ticket refund
- `GET /api/organizers/me/refund-requests` - Get refund requests (organizer)
- `PUT /api/refund-requests/:id/approve` - Approve/deny refund (organizer)

### Waitlist
- `POST /api/events/:id/waitlist` - Join waitlist for event
- `GET /api/users/me/waitlist` - Get my waitlist items
- `DELETE /api/waitlist/:id` - Remove from waitlist
- `GET /api/organizers/me/events/:id/waitlist` - Get waitlist for event (organizer)

### Favorites
- `POST /api/events/:id/favorite` - Add event to favorites
- `DELETE /api/events/:id/favorite` - Remove from favorites
- `GET /api/users/me/favorites` - Get my favorite events

### Reviews & Ratings
- `POST /api/events/:id/reviews` - Submit review (after event)
- `GET /api/events/:id/reviews` - Get event reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/respond` - Organizer responds to review

### Safety Features
- `POST /api/emergency-contacts` - Add emergency contact
- `GET /api/users/me/emergency-contacts` - Get emergency contacts
- `PUT /api/emergency-contacts/:id` - Update emergency contact
- `DELETE /api/emergency-contacts/:id` - Delete emergency contact
- `POST /api/events/:id/check-in` - Safety check-in at event
- `POST /api/events/:id/safety-report` - Report safety concern
- `GET /api/users/me/safety-reports` - Get my safety reports

### Check-in (Organizer)
- `POST /api/events/:id/check-in` - Check in ticket (scan QR)
- `GET /api/events/:id/check-ins` - Get check-in list

### Advertising
- `POST /api/advertising/campaigns` - Create advertising campaign
- `GET /api/organizers/me/campaigns` - Get my campaigns

### Social Sharing
- `POST /api/events/:id/share` - Generate shareable link
- `GET /api/events/:id/share-preview` - Get share preview card data

### Push Notifications
- `GET /api/users/me/notification-preferences` - Get notification preferences
- `PUT /api/users/me/notification-preferences` - Update notification preferences
- `POST /api/notifications/test` - Send test notification (dev only)

---

## 🏗️ MVP Tech Stack

### Backend
- **Framework**: **NestJS** (Node.js + TypeScript) - Best for scalability and maintainability
  - Alternative: Express.js if team preference
- **Database**: PostgreSQL
- **ORM**: TypeORM or Prisma (type-safe database access)
- **Authentication**: JWT with refresh tokens
- **Payment**: 
  - **M-Pesa** (Primary for Nairobi - via Safaricom Daraja API or payment aggregator like Pesapal/Paystack)
  - **Stripe** (KES and USD, multi-currency for card payments)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **File Storage**: Cloudinary (for images with low-data mode optimization)
- **Email**: SendGrid / AWS SES
- **SMS**: Twilio / African SMS provider (for M-Pesa confirmations)
- **Maps**: Google Maps API (for Nairobi/African cities)
- **Social Sharing**: Deep linking, Open Graph tags for social previews

### Frontend (Mobile - Priority)
- **Framework**: React Native (Expo recommended for faster development)
- **Navigation**: React Navigation v6
- **State**: Zustand or Redux Toolkit
- **HTTP Client**: Axios
- **QR Code**: react-native-qrcode-scanner
- **Maps**: react-native-maps (Google Maps or Mapbox)
  - Location services: expo-location
  - Map clustering: react-native-map-clustering or supercluster
    - **Clustering threshold**: Cluster after 15-20 markers per view for optimal UX
  - Custom markers: Custom map markers for events
  - Location tracking: Background location (for nearby events)
- **Social Sharing**: 
  - expo-sharing (native share sheet)
  - react-native-share (custom social sharing - priority: Instagram, Snapchat, Locket)
  - Deep linking for shared event URLs
  - Instagram Stories sharing (Instagram API)
  - Snapchat sharing (Snapchat Kit SDK)
- **Push Notifications**: expo-notifications
- **Offline Storage**: expo-sqlite or AsyncStorage for offline tickets
- **Currency**: react-native-localize for KES/USD formatting
- **Avatars/Bitmoji**: Custom avatar generation or integration (future - nice to have)

### Frontend (Web - Phase 2)
- **Framework**: Next.js 14+ (React)
- **UI Library**: Tailwind CSS + shadcn/ui or Ant Design
- For organizers to manage events (dashboard)
- Can be added after mobile MVP

### Location Focus
- **Primary**: Nairobi, Kenya
- **Secondary**: Other major African cities (Lagos, Cape Town, etc.)
- **Currency**: KES (primary), USD (secondary)
- **Language**: English (for MVP)

---

## 📅 MVP Development Timeline (8-10 weeks)

### Week 1-2: Foundation
- Project setup
- Database schema & migrations
- Authentication system
- Basic API structure

### Week 3-4: Event Management
- Organizer profiles
- Event CRUD operations
- Event listing & search
- Image upload

### Week 5-6: Ticketing System
- Ticket types management
- Order creation
- Payment integration
- QR code generation

### Week 7: Check-in, Ticket Management & Transfers
- QR code scanner
- Check-in system
- Ticket viewing/cancellation
- Email/SMS ticket delivery
- Offline ticket viewing/download
- Ticket transfer/gift system
- Waitlist system

### Week 8: Push Notifications & Social Features
- Firebase Cloud Messaging setup
- Push notification system
  - Nearby events alerts
  - Price drop notifications (favorites)
  - Event reminders (purchased events)
  - Sold out alerts
  - Waitlist notifications
- Social sharing (Instagram, Snapchat, Locket priority)
- Deep linking for shared URLs
- Low-data mode optimization

### Week 9: Safety Features & Reviews
- Emergency contacts system
- Event safety check-in
- Safety reporting system
- Reviews & ratings (post-event)
- Organizer review responses

### Week 10: Advertising, Analytics & Polish
- Advertising system
- Featured events
- Basic analytics dashboard
- M-Pesa integration testing
- Testing & bug fixes
- Performance optimization

### Week 11-12: Testing & Launch Prep
- Comprehensive testing (unit, integration, E2E)
- Security audit
- M-Pesa production testing
- App store preparation
- Beta testing with real users
- Final polish and bug fixes

---

## 🎨 MVP User Flows

### Event Organizer Flow
1. Register/login (same account as regular user)
2. Create event organizer profile (manual verification pending)
3. Option A - Create event at custom location:
   - Create event directly
   - Set ticket types and pricing
   - Publish event
4. Option B - Host event at venue:
   - Browse/search venues
   - Request booking: provide date, description, estimated capacity
   - Wait for venue response (quote)
   - Accept quote → event created
   - Set ticket types and pricing
   - Publish event
5. (Optional) Purchase advertising (featured placement)
6. View analytics dashboard
7. Manage refund requests (approve/deny)
8. Check in attendees at event (scan QR codes)

### Venue Organizer Flow
1. Register/login (same account as regular user)
2. Create venue organizer profile (manual verification with platform)
3. Set venue details (location, capacity, amenities)
4. Option A - Post venue events/activities directly
5. Option B - Receive booking requests from event organizers
   - View pending requests
   - Accept/reject with quote
6. View analytics dashboard (revenue from hosted events)
7. Manage venue calendar

### User Flow
1. Register/login
2. Browse events
3. Search/filter events
4. View event details
5. Select tickets
6. Complete payment
7. Receive ticket (QR code)
8. Attend event (show QR code)

---

## 🔐 MVP Security Checklist
- [ ] Password hashing (bcrypt)
- [ ] JWT token security
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] Payment data security (PCI-DSS basics)

---

## 📈 Success Metrics for MVP
- Number of organizers registered
- Number of events created
- Ticket sales volume
- User registrations
- Event discovery (search usage)
- Check-in success rate

---

## 🚀 Next Steps After MVP
1. Installment payments
2. Social features
3. Advanced analytics
4. Mobile app optimization
5. Web platform
6. Gamification features
