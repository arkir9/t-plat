# plat - UI/UX Mockups

This directory contains HTML/CSS mockups for all key screens of the plat ticketing platform.

## 📱 User App Mockups

### Onboarding & Authentication
- **00-splash-screen.html** - Loading screen with animated ticket (Uber-style)
- **01-welcome-screen.html** - Welcome screen with "Get Started" CTA
- **02-signup-screen.html** - Sign up form with social login options

### Discovery & Browsing
- **03-home-list-view.html** - Home screen with event list and filters
- **04-map-view.html** - Map view with event markers and clustering
- **11-filter-modal.html** - Comprehensive filter modal (date, price, type, location)

### Event Details
- **05-event-detail.html** - Event detail page with ticket selection
- **10-social-share-modal.html** - Social share modal with platform options

### Purchase Flow
- **06-payment-method.html** - Payment method selection (M-Pesa/Card)
- **07-mpesa-payment.html** - M-Pesa payment processing screen
- **08-payment-success.html** - Payment success with QR code ticket

### Ticket Management
- **09-my-tickets.html** - My tickets list (upcoming/past)
- **13-ticket-detail-qr.html** - Ticket detail with QR code and actions

### Profile & Settings
- **12-profile-screen.html** - User profile with menu items

## 🏢 Organizer App Mockups

### Dashboard & Management
- **14-organizer-dashboard.html** - Organizer dashboard with stats and quick actions
- **15-create-event.html** - Create/Edit event form with dark theme
- **16-booking-requests.html** - Venue booking requests management
- **17-check-in-scanner.html** - QR code scanner for check-in
- **18-analytics-detail.html** - Detailed analytics with charts

## 🎨 Design System

### Colors
- **Theme**: Dark mode by default (black background #000000)
- **Light Mode**: Available via toggle (white background #FFFFFF)
- **Primary**: Black (#000000) / White (#FFFFFF) depending on theme
- **Accent**: Purple (#8B5CF6) - default, changes with theme (e.g., orange for Halloween)
- **Background**: Black (#000000) default / White (#FFFFFF) light mode
- **Text**: White (#FFFFFF) default / Dark Gray (#1A1A1A) light mode
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)

### Typography
- **Font**: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif
- **H1**: 24px, Bold
- **H2**: 20px, Bold
- **Body**: 16px, Regular
- **Small**: 14px, Regular

### Components
- **Buttons**: 56px height, 8px border radius
- **Cards**: 12px border radius, white background, subtle shadow
- **Inputs**: 48px height, 8px border radius
- **Tab Bar**: 60px height, fixed bottom

## 🚀 Viewing the Mockups

1. **Local Server**: http://localhost:8000 (if server is running)
2. Open `index.html` in a web browser to see all mockups
3. Use browser developer tools to simulate mobile view (375px width recommended)
4. All mockups are responsive and mobile-first
5. **Theme Toggle**: Click the moon/sun icon (top right) to switch between dark and light mode

## 📝 Notes

- These are static HTML/CSS mockups for visual reference
- Interactive elements (buttons, inputs) are styled but not functional
- Colors and spacing match the design system specifications
- All screens follow the modern, minimal design aesthetic

## 📊 Mockup Statistics

- **Total Mockups**: 19 screens
- **User App**: 14 screens
- **Organizer App**: 5 screens
- **Coverage**: All critical user flows documented
- **Theme**: Dark mode by default (black background) with light mode toggle

## 🎯 Key Features Demonstrated

✅ Animated splash screen (Uber-style ticket animation)  
✅ Complete onboarding flow  
✅ Event discovery (list & map views)  
✅ Comprehensive filtering system  
✅ Event detail with ticket selection  
✅ Payment flow (M-Pesa & Card)  
✅ Ticket management  
✅ Social sharing (Instagram, Snapchat, Locket, etc.)  
✅ User profile & settings  
✅ Organizer dashboard  

## 🔄 Next Steps

1. **Add More Organizer Screens**:
   - Event creation form
   - Booking requests management
   - Analytics detail screens
   - Check-in QR scanner

2. **Convert to React Native**:
   - Transform HTML/CSS to React Native components
   - Add animations and transitions
   - Implement actual functionality
   - Connect to backend API

3. **Add Real Assets**:
   - Replace placeholders with actual images
   - Add real event data
   - Implement actual QR codes

4. **Interactive Prototype**:
   - Add navigation between screens
   - Implement form interactions
   - Add state management
