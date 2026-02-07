-- MVP Database Schema for Ticketing Platform
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url TEXT,
    -- Removed user_type: Users can have multiple roles via organizer_profiles
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================
-- ORGANIZER PROFILES
-- ============================================

CREATE TABLE organizer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_type VARCHAR(20) NOT NULL CHECK (profile_type IN ('event_organizer', 'venue_organizer')),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    logo_url TEXT,
    website VARCHAR(255),
    social_links JSONB, -- {facebook, instagram, twitter, etc.}
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Venue-specific fields (NULL for event organizers)
    venue_address TEXT,
    venue_city VARCHAR(100), -- For Nairobi/African cities focus
    venue_capacity INTEGER,
    venue_amenities JSONB, -- {parking, wifi, bar, etc.}
    venue_latitude DECIMAL(10, 8),
    venue_longitude DECIMAL(11, 8),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- One user can have BOTH event_organizer AND venue_organizer profiles
    -- But cannot have duplicate profile types (unique constraint on combination)
    UNIQUE(user_id, profile_type)
);

CREATE INDEX idx_organizer_profiles_user_id ON organizer_profiles(user_id);
CREATE INDEX idx_organizer_profiles_type ON organizer_profiles(profile_type);
CREATE INDEX idx_organizer_profiles_verification ON organizer_profiles(verification_status);
CREATE INDEX idx_organizer_profiles_city ON organizer_profiles(venue_city);

-- ============================================
-- VENUE BOOKING REQUESTS
-- ============================================

CREATE TABLE venue_booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
    requested_date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    estimated_capacity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
    venue_quote DECIMAL(10, 2), -- Quote from venue (can be percentage or fixed amount)
    venue_quote_type VARCHAR(20) CHECK (venue_quote_type IN ('percentage', 'fixed')), -- How the quote is structured
    venue_response_notes TEXT,
    expires_at TIMESTAMP, -- Request expiration date
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venue_booking_requests_event_organizer ON venue_booking_requests(event_organizer_id);
CREATE INDEX idx_venue_booking_requests_venue ON venue_booking_requests(venue_id);
CREATE INDEX idx_venue_booking_requests_status ON venue_booking_requests(status);

-- ============================================
-- EVENTS
-- ============================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE, -- Event organizer owns it
    venue_booking_request_id UUID REFERENCES venue_booking_requests(id), -- If created from booking request
    venue_id UUID REFERENCES organizer_profiles(id), -- If hosted at venue (from booking or direct venue event)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50), -- e.g., 'concert', 'club_night', 'festival'
    category VARCHAR(50), -- e.g., 'music', 'sports', 'comedy'
    
    -- Date & Time
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Africa/Nairobi', -- Default to Nairobi timezone
    
    -- Location
    location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('venue', 'custom')),
    custom_location JSONB, -- {address, city, country, latitude, longitude}
    
    -- Media
    images JSONB, -- Array of image URLs
    video_url TEXT,
    
    -- Event Details
    age_restriction VARCHAR(20), -- e.g., '18+', '21+', 'All Ages'
    dress_code VARCHAR(100),
    max_tickets_per_user INTEGER, -- Based on venue capacity
    
    -- Venue Fee (if hosted at venue)
    venue_fee_percentage DECIMAL(5, 2), -- Percentage of ticket sales to venue
    venue_fee_amount DECIMAL(10, 2), -- Fixed fee (alternative to percentage)
    venue_fee_type VARCHAR(20) CHECK (venue_fee_type IN ('percentage', 'fixed', 'none')),
    
    -- Status & Visibility
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    publish_date TIMESTAMP,
    
    -- Metadata
    tags JSONB,
    external_url TEXT,
    contact_info JSONB,
    requirements JSONB,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_featured ON events(is_featured);
CREATE INDEX idx_events_location ON events USING GIN(custom_location);

-- ============================================
-- TICKET TYPES
-- ============================================

CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., "General Admission", "VIP", "Early Bird"
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES' CHECK (currency IN ('KES', 'USD')), -- KES or USD
    quantity_available INTEGER NOT NULL,
    quantity_sold INTEGER DEFAULT 0,
    sale_start_date TIMESTAMP,
    sale_end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX idx_ticket_types_active ON ticket_types(is_active);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable order number
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES' CHECK (currency IN ('KES', 'USD')),
    
    -- Commission Breakdown
    platform_commission_percentage DECIMAL(5, 2) DEFAULT 5.00, -- 5% platform commission
    platform_commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    venue_fee_amount DECIMAL(10, 2) DEFAULT 0, -- If hosted at venue
    net_amount DECIMAL(10, 2) NOT NULL, -- Amount to event organizer after commissions
    
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50), -- 'mpesa', 'stripe', 'paypal', etc.
    payment_intent_id VARCHAR(255), -- External payment provider ID (M-Pesa transaction ID or Stripe intent ID)
    mpesa_transaction_code VARCHAR(50), -- M-Pesa transaction code if paid via M-Pesa
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_event_id ON orders(event_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- ============================================
-- ORDER ITEMS
-- ============================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_ticket_type_id ON order_items(ticket_type_id);

-- ============================================
-- TICKETS
-- ============================================

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    qr_code TEXT NOT NULL UNIQUE, -- QR code data
    qr_code_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed version for verification
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled', 'refunded', 'transferred')),
    is_transferred BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP,
    checked_in_by UUID REFERENCES organizer_profiles(id), -- Organizer who checked in
    offline_downloaded BOOLEAN DEFAULT FALSE,
    last_downloaded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_order_id ON tickets(order_id);
CREATE INDEX idx_tickets_qr_code_hash ON tickets(qr_code_hash);
CREATE INDEX idx_tickets_status ON tickets(status);

-- ============================================
-- REFUND REQUESTS
-- ============================================

CREATE TABLE refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    organizer_response TEXT, -- Response from event organizer
    refund_amount DECIMAL(10, 2) NOT NULL,
    processed_at TIMESTAMP, -- When refund was processed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX idx_refund_requests_event_id ON refund_requests(event_id);
CREATE INDEX idx_refund_requests_ticket_id ON refund_requests(ticket_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);

-- ============================================
-- ADVERTISING CAMPAIGNS
-- ============================================

CREATE TABLE advertising_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE, -- NULL if external company advertising
    campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('featured', 'sponsored', 'banner')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES' CHECK (currency IN ('KES', 'USD')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_intent_id VARCHAR(255),
    advertiser_name VARCHAR(255), -- For external company ads
    banner_image_url TEXT, -- For banner ads
    target_url TEXT, -- For external ads
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_advertising_campaigns_organizer_id ON advertising_campaigns(organizer_id);
CREATE INDEX idx_advertising_campaigns_event_id ON advertising_campaigns(event_id);
CREATE INDEX idx_advertising_campaigns_type ON advertising_campaigns(campaign_type);
CREATE INDEX idx_advertising_campaigns_dates ON advertising_campaigns(start_date, end_date);

-- ============================================
-- FAVORITES / WISHLIST
-- ============================================

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_event_id ON favorites(event_id);

-- ============================================
-- TICKET TRANSFERS
-- ============================================

CREATE TABLE ticket_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    original_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    new_user_id UUID REFERENCES users(id), -- NULL until accepted
    transfer_type VARCHAR(20) NOT NULL CHECK (transfer_type IN ('transfer', 'gift')),
    transfer_status VARCHAR(20) DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    message TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_transfers_ticket_id ON ticket_transfers(ticket_id);
CREATE INDEX idx_ticket_transfers_original_user ON ticket_transfers(original_user_id);
CREATE INDEX idx_ticket_transfers_new_user ON ticket_transfers(new_user_id);
CREATE INDEX idx_ticket_transfers_status ON ticket_transfers(transfer_status);

-- ============================================
-- WAITLIST
-- ============================================

CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id, ticket_type_id)
);

CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX idx_waitlist_event_id ON waitlist(event_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id), -- Verify user attended
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5), -- If hosted at venue
    organizer_rating INTEGER CHECK (organizer_rating >= 1 AND organizer_rating <= 5),
    organizer_response TEXT,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified purchase
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id) -- One review per user per event
);

CREATE INDEX idx_reviews_event_id ON reviews(event_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================
-- EMERGENCY CONTACTS (Safety)
-- ============================================

CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255),
    relationship VARCHAR(50), -- 'friend', 'family', 'partner', etc.
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- ============================================
-- EVENT CHECK-INS (Safety)
-- ============================================

CREATE TABLE event_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id),
    check_in_type VARCHAR(20) NOT NULL CHECK (check_in_type IN ('arrival', 'departure')),
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    shared_with_contacts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_check_ins_user_id ON event_check_ins(user_id);
CREATE INDEX idx_event_check_ins_event_id ON event_check_ins(event_id);
CREATE INDEX idx_event_check_ins_ticket_id ON event_check_ins(ticket_id);

-- ============================================
-- SAFETY REPORTS
-- ============================================

CREATE TABLE safety_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('safety_concern', 'incident', 'venue_issue', 'other')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safety_reports_user_id ON safety_reports(user_id);
CREATE INDEX idx_safety_reports_event_id ON safety_reports(event_id);
CREATE INDEX idx_safety_reports_status ON safety_reports(status);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nearby_events BOOLEAN DEFAULT TRUE,
    price_drops BOOLEAN DEFAULT TRUE,
    event_reminders BOOLEAN DEFAULT TRUE,
    sold_out_alerts BOOLEAN DEFAULT TRUE,
    waitlist_notifications BOOLEAN DEFAULT TRUE,
    push_token VARCHAR(500), -- FCM token
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ============================================
-- REFRESH TOKENS (for JWT)
-- ============================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizer_profiles_updated_at BEFORE UPDATE ON organizer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_types_updated_at BEFORE UPDATE ON ticket_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advertising_campaigns_updated_at BEFORE UPDATE ON advertising_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_booking_requests_updated_at BEFORE UPDATE ON venue_booking_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_transfers_updated_at BEFORE UPDATE ON ticket_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safety_reports_updated_at BEFORE UPDATE ON safety_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refund_requests_updated_at BEFORE UPDATE ON refund_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || 
           LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();
