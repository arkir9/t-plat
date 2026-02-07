# Project Summary: T-Plat MVP

## 🎯 Core Focus
A **ticketing platform** where:
- **Event Organizers** can create and promote events, request venue bookings
- **Venue Organizers** can post their venue events and respond to booking requests
- **Users** can discover and purchase tickets for events

---

## 📋 Key Features (MVP)

### 1. Multi-Role User System
- Users can have a regular account + event organizer profile + venue organizer profile (like Booking.com)
- **Key Feature**: Users can have BOTH organizer profiles simultaneously
  - A user can be both an event organizer AND a venue organizer
  - Example: A venue owner can also organize events at other venues
- One login, multiple roles
- Manual verification for organizers (by platform admins)

### 2. Event Creation Flows

**A. Venue Organizers:**
- Directly post events/activities at their venue
- Manage venue calendar

**B. Event Organizers:**
- Create events at custom locations (their own events)
- Request to host events at venues:
  1. Browse/search venues
  2. Submit request: date, description, estimated capacity
  3. Venue responds with quote (accept/reject)
  4. Event organizer accepts quote → event created
  5. Event organizer owns the event

### 3. Ticketing System
- Multiple ticket types per event (customizable)
- Payment in KES or USD (Stripe)
- QR code generation for tickets
- Max tickets per user based on venue capacity
- 5% platform commission on all sales
- Venue fee (percentage or fixed) if hosted at venue

### 4. Refund System
- Users can request refunds
- Manual approval by event organizers (approve/deny)

### 5. Advertising
- **Free**: All event postings
- **Paid**: Featured placements, sponsored ads (from events or external companies)

### 6. Organizer Dashboards
- View events, analytics, revenue
- Manage booking requests (venue organizers)
- Approve/deny refunds (event organizers)
- Check-in attendees (QR scanner)

---

## 🌍 Market Focus
- **Primary**: Nairobi, Kenya
- **Expansion**: Other major African cities
- **Currency**: KES (primary), USD (secondary)
- **Language**: English (MVP)

---

## 🏗️ Technology Stack

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL + TypeORM
- **Payment**: Stripe (multi-currency: KES, USD)
- **File Storage**: Cloudinary
- **Email**: SendGrid/AWS SES

### Mobile (Priority)
- **Framework**: React Native (Expo)
- **Maps**: react-native-maps
- **Navigation**: React Navigation
- **State**: Zustand

### Web (Phase 2)
- Next.js for organizer dashboards

---

## 📊 Database Highlights

### Key Tables
1. **users** - Single account (no user_type, roles via profiles)
2. **organizer_profiles** - Multiple per user (event organizer + venue organizer)
3. **venue_booking_requests** - Request/response flow
4. **events** - Owned by event organizer, linked to venue if applicable
5. **ticket_types** - Customizable ticket options
6. **orders** - With commission breakdown (platform 5%, venue fee)
7. **tickets** - QR codes for check-in
8. **refund_requests** - Manual approval workflow

### Commission Structure
- **Platform**: 5% of ticket sales
- **Venue Fee**: Percentage or fixed amount (if hosted at venue)
- **Event Organizer**: Remaining amount after commissions

---

## 🔄 Key User Flows

### Event Organizer → Venue Booking Flow
1. Event organizer creates event organizer profile
2. Searches for venues
3. Submits booking request (date, description, capacity)
4. Venue organizer reviews request
5. Venue responds: Accept (with quote) or Reject
6. Event organizer accepts quote
7. Event is created and owned by event organizer
8. Event organizer sets ticket types and publishes

### User Ticket Purchase Flow
1. User browses events (location-based)
2. Views event details
3. Selects ticket type(s) and quantity
4. Completes payment (KES/USD)
5. Receives ticket with QR code (email/SMS)
6. Shows QR at event for check-in

---

## 📅 Development Timeline: 8-10 weeks

**Week 1-2**: Foundation (setup, auth, database)
**Week 3-4**: Event management & organizer profiles
**Week 5-6**: Ticketing & payments
**Week 7**: Check-in & refunds
**Week 8**: Advertising & dashboards
**Week 9-10**: Testing & launch prep

---

## 💰 Monetization

1. **5% commission** on ticket sales
2. **Advertising revenue** (featured events, sponsored ads)
3. Future: Premium features, merchandise commissions

---

## ✅ Next Steps

1. ✅ Requirements discussed and documented
2. ✅ Database schema designed
3. ✅ MVP plan created
4. ✅ Tech stack decided
5. ⏭️ Set up project structure
6. ⏭️ Begin development

---

Ready to start building! 🚀
