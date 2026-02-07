# Dual Role User Examples

## Overview
Users can have **BOTH** event organizer AND venue organizer profiles simultaneously. This provides maximum flexibility for users who want to:
- Own a venue AND organize events elsewhere
- Organize events AND also rent out their space
- Build a business portfolio with multiple revenue streams

---

## Real-World Use Cases

### 1. **Nightclub Owner Who Also Promotes Events**
**Profile Setup:**
- Venue Organizer Profile: "Nairobi Nightclub" (their own venue)
- Event Organizer Profile: "Premium Events Co." (event organizing business)

**Activities:**
- **As Venue Organizer:**
  - Post regular club nights at their venue
  - Set capacity, pricing, amenities
  - Receive booking requests from other promoters
  - Accept/reject requests and set venue fees

- **As Event Organizer:**
  - Create music festivals at outdoor venues
  - Request bookings at larger venues for special events
  - Manage ticketing and promotion for events elsewhere
  - Build brand recognition beyond their own venue

---

### 2. **Event Promoter Who Buys a Venue**
**Profile Setup:**
- Event Organizer Profile: "Urban Events" (existing business)
- Venue Organizer Profile: "The Warehouse" (newly acquired venue)

**Activities:**
- **As Event Organizer:**
  - Continue organizing events at various venues (existing business)
  - Maintain client relationships and event portfolio

- **As Venue Organizer:**
  - List new venue on platform
  - Post events happening at their venue
  - Accept booking requests from other promoters
  - Cross-promote events between venue and organizing business

---

### 3. **Multi-Venue Operator Who Organizes Events**
**Profile Setup:**
- Venue Organizer Profile: "Event Spaces Nairobi" (multiple venues)
- Event Organizer Profile: "Full Service Events" (event management)

**Activities:**
- **As Venue Organizer:**
  - List multiple venues under one profile
  - Post events at their venues
  - Manage bookings and availability

- **As Event Organizer:**
  - Organize corporate events, weddings, conferences
  - Book venues (including competitors if needed)
  - Offer full-service event management

---

## App Experience for Dual Role Users

### Dashboard Navigation
Users with both profiles will see:
- **"My Venue"** tab (venue organizer features)
- **"My Events"** tab (event organizer features)
- **"Unified View"** (optional - see all activities)

### Profile Switching
- Easy toggle between profiles
- Clear indication of current active profile
- Separate analytics for each profile type
- Unified user account (same login, same tickets, same favorites)

### Event Creation Flow
- **When creating event:**
  - Choose to create at "My Venue" (uses venue profile)
  - OR create at "Other Location" (uses event organizer profile)
  - Clear distinction between profile types

### Booking Requests
- **As Event Organizer:** Can request bookings at any venue (including their own if they want to use venue profile)
- **As Venue Organizer:** Can receive requests and book their own venue to their event organizer profile

---

## Business Benefits

### For Users
- ✅ Diversify revenue streams
- ✅ Build brand in multiple ways
- ✅ Maximize venue utilization
- ✅ Expand business opportunities
- ✅ Cross-promote between roles

### For Platform
- ✅ Higher user engagement
- ✅ More events and venues on platform
- ✅ Network effects (users booking from themselves creates activity)
- ✅ Increased revenue (more transactions)
- ✅ Better user retention (users invested in multiple ways)

---

## Technical Implementation

### Database
- One `users` table (single account)
- Multiple `organizer_profiles` per user
- Unique constraint: `(user_id, profile_type)` ensures max 1 of each type
- Example: User can have both `event_organizer` AND `venue_organizer` profiles

### API Endpoints
- `GET /api/users/me/profiles` - Get all organizer profiles for user
- `POST /api/organizers/profile` - Create profile (specify type)
- `GET /api/organizers/me` - Get active profile or list all
- `PUT /api/organizers/me/switch-profile` - Switch active profile context

### Frontend
- Profile selector/toggle in navigation
- Conditional features based on active profile
- Dashboard tabs for each profile type
- Unified notifications across both profiles

---

This dual-role capability is a key differentiator and aligns with how real businesses operate in the nightlife and event industry!
