# Final MVP Feature Summary

## ✅ Confirmed Features for MVP

### 🔥 Core Features (Priority)

1. **Multi-Role User System**
   - Same account can be user + event organizer + venue organizer
   - **Can have BOTH organizer profiles simultaneously** (e.g., user is both event organizer AND venue organizer)
   - Example use case: A venue owner can post events at their venue AND also organize events at other venues
   - Manual verification for organizers

2. **Event Management**
   - Venue organizers: Direct event posting
   - Event organizers: Custom locations or venue booking requests
   - Venue booking request flow with quotes

3. **Map View with Nearby Events** ⭐ **PRIORITY**
   - Real-time location tracking
   - Event clustering (15-20 markers per view)
   - Custom markers with preview cards
   - Distance-based sorting
   - Filter events on map

4. **Ticketing System**
   - Multiple ticket types per event
   - **M-Pesa** integration (primary for Nairobi)
   - Stripe (KES/USD card payments)
   - QR code generation
   - **Offline ticket viewing/download**
   - **Ticket transfer/gift** feature
   - **Waitlist** for sold-out events

5. **Push Notifications** 🔔
   - Nearby events alerts
   - Price drops on favorite/wishlisted events
   - Event reminders for purchased events
   - Sold out alerts
   - Waitlist notifications

6. **Favorites/Wishlist**
   - Save events for later
   - Price drop notifications

7. **Reviews & Ratings (Post-Event)**
   - Rate events (1-5 stars)
   - Write reviews
   - Rate venue and organizer separately
   - Organizer responses

8. **Safety Features** 🛡️
   - Emergency contacts
   - Event safety check-in (arrival/departure)
   - Safety reporting system
   - Share location with contacts

9. **Social Sharing** 📱
   - **Priority platforms**: Instagram, Snapchat, Locket
   - Also: WhatsApp, Facebook, Twitter
   - Deep linking for shared URLs
   - Custom share cards

10. **Low-Data Mode Optimization**
    - Compressed images
    - Minimal data usage
    - Optimized for slow connections

11. **Advertising System**
    - Free event postings
    - Paid featured placements

---

## 📊 Database Tables

### Core Tables
- `users` - Multi-role user accounts
- `organizer_profiles` - Event & venue organizer profiles
- `venue_booking_requests` - Request/quote flow
- `events` - Event listings
- `ticket_types` - Ticket pricing
- `tickets` - Individual tickets
- `orders` - Purchase orders (M-Pesa & Stripe)

### New Tables Added
- `favorites` - Wishlist/saved events
- `ticket_transfers` - Ticket transfer/gift system
- `waitlist` - Sold-out event waitlist
- `reviews` - Post-event reviews & ratings
- `emergency_contacts` - Safety contacts
- `event_check_ins` - Safety check-ins
- `safety_reports` - Safety incident reporting
- `notification_preferences` - Push notification settings
- `refund_requests` - Refund management

---

## 🏗️ Technology Stack

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL + TypeORM
- **Payment**: 
  - **M-Pesa** (Safaricom Daraja API or Pesapal/Paystack)
  - **Stripe** (KES/USD cards)
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Maps**: Google Maps API

### Mobile
- **Framework**: React Native (Expo)
- **Maps**: react-native-maps with clustering
- **Social Sharing**: expo-sharing, react-native-share
- **Offline Storage**: AsyncStorage/expo-sqlite

---

## 📅 Updated Timeline: 11-12 weeks

**Week 1-2**: Foundation (setup, auth, database)
**Week 3-4**: Event management & organizer profiles
**Week 5-6**: Ticketing & payments (M-Pesa + Stripe)
**Week 7**: Check-in, transfers, waitlist, offline tickets
**Week 8**: Push notifications & social sharing
**Week 9**: Safety features & reviews
**Week 10**: Advertising, analytics, M-Pesa testing
**Week 11-12**: Testing & launch prep

---

## 🎯 MVP Success Metrics

1. **Organizers**: Number registered, events created
2. **Users**: Registrations, ticket purchases
3. **Engagement**: Map usage, favorites saved
4. **Revenue**: Ticket sales, commission earned
5. **Safety**: Check-ins, reports
6. **Social**: Share counts, referral sources

---

## 🔜 Future Phases (Post-MVP)

- Social features (follows, chat)
- Gamification (streaks, badges)
- Custom bitmoji avatars (TBD)
- Voting system (artist performance)
- Merchandise shop
- Installment payments
- Advanced analytics
- Calendar integration
- Referral system

---

**Status**: ✅ Plan Complete - Ready to Start Development!
