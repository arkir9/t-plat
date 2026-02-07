# UI/UX Wireframes - Visual Descriptions

## Design System Overview

### Brand Identity
- **Logo**: "plat" in stylized handwritten/script font, white on black background (also add an animated floating ticket in the loading screen // like the way uber has the text then the animated boxes)
- **Style**: Modern, clean, minimal
- **Color Palette**: 
  - Primary: Black (#000000) - for logo and key CTAs
  - Accent: Purple (#8B5CF6) - default, changes with theme (e.g., orange #FF6B35 for Halloween)
  - Background: Light gray/white (#F5F5F5 or #FFFFFF)
  - Text: Dark gray (#1A1A1A) for primary text, medium gray (#666666) for secondary
  - Success: Green (#10B981) for positive actions
  - Error: Red (#EF4444) for errors/warnings
- **Typography**: Modern sans-serif (e.g., Inter, SF Pro, or similar)
- **Spacing**: Generous whitespace, 16px base unit

---

## 📱 USER APP WIREFRAMES

### 0. Loading/Splash Screen

#### Screen 0.1: Splash Screen
- **Layout**: Full-screen, black background
- **Animation Sequence** (like Uber's animated boxes):
  1. **Initial State** (0-500ms):
     - "plat" logo appears (white, centered, ~100px height)
     - Fade in animation
  2. **Ticket Animation** (500-2000ms):
     - Animated ticket icon appears below logo
     - Ticket floats upward with gentle bounce
     - Multiple tickets appear and float (3-5 tickets)
     - Tickets rotate slightly as they float
     - Opacity fade in/out effect
  3. **Loading State** (2000ms+):
     - Logo and tickets remain visible
     - Subtle loading indicator (spinner or progress bar, bottom)
     - "Loading..." text (optional, small, white, centered at bottom)
- **Technical Notes**:
  - Smooth animations (60fps)
  - Tickets use purple accent color (#8B5CF6) or theme color
  - Animation loops if loading takes longer than 2 seconds
  - Transition to onboarding or home screen when ready

---

### 1. Onboarding Flow (First Launch)

#### Screen 1.1: Welcome Screen
- **Layout**: Full-screen, centered content
- **Top**: "plat" logo (white on black background, centered, ~80px height)
- **Middle**: 
  - Large hero text: "Discover Events Near You"
  - Subtitle: "Find and book tickets to the best events in Nairobi"
- **Bottom**: 
  - Primary CTA button: "Get Started" (black background, white text, full-width with 16px margins, rounded corners)
  - Secondary link: "Already have an account? Sign In" (centered, below button)
- **Background**: Clean white or subtle gradient

#### Screen 1.2: Location Permission
- **Layout**: Centered content with illustration/icon
- **Icon**: Location pin icon (large, ~120px, centered)
- **Title**: "Enable Location Services"
- **Description**: "We'll show you events happening near you. You can change this anytime in settings."
- **Buttons**:
  - "Allow Location Access" (primary, black)
  - "Skip for Now" (secondary, text link)
- **Note**: iOS/Android native permission dialog will appear after tapping "Allow"

#### Screen 1.3: Notification Permission
- **Layout**: Similar to location screen
- **Icon**: Bell notification icon
- **Title**: "Stay Updated"
- **Description**: "Get notified about nearby events, price drops, and event reminders"
- **Buttons**:
  - "Enable Notifications" (primary)
  - "Maybe Later" (secondary)

#### Screen 1.4: Quick Signup
- **Layout**: Form screen
- **Top**: "plat" logo (smaller, ~40px, left-aligned or centered)
- **Title**: "Create Your Account"
- **Form Fields** (stacked vertically, 16px spacing):
  - First Name (text input)
  - Last Name (text input)
  - Email (text input, email keyboard)
  - Phone Number (text input, phone keyboard, country code selector)
  - Password (text input, secure, show/hide toggle)
- **Checkbox**: "I agree to Terms & Conditions" (with link)
- **Button**: "Sign Up" (full-width, black, disabled until form valid)
- **Social Login Options** (above signup button):
  - "Continue with Google" (button, white background, Google logo)
  - "Continue with Apple" (button, black background, Apple logo)
- **Footer**: "Already have an account? Sign In" (centered link)

#### Screen 1.5: Sign In Screen
- **Layout**: Form screen
- **Top**: "plat" logo (smaller, ~40px, centered)
- **Title**: "Welcome Back"
- **Form Fields** (stacked vertically, 16px spacing):
  - Email (text input, email keyboard)
  - Password (text input, secure, show/hide toggle)
  - "Forgot Password?" link (right-aligned, below password field)
- **Social Login Options** (above sign in button):
  - "Continue with Google" (button, white background, Google logo)
  - "Continue with Apple" (button, black background, Apple logo)
- **Button**: "Sign In" (full-width, black)
- **Footer**: "Don't have an account? Sign Up" (centered link)

#### Screen 1.6: Forgot Password
- **Header**: Back arrow + "Reset Password"
- **Content** (centered):
  - Lock icon (large, ~80px)
  - Title: "Forgot Password?"
  - Description: "Enter your email and we'll send you a link to reset your password"
  - Email input field
  - "Send Reset Link" button (black, full-width)
- **Footer**: "Remember your password? Sign In" (centered link)

---

### 2. Main Navigation (Bottom Tab Bar)

**Tab Bar Structure** (5 tabs, always visible):
1. **Home** (house icon) - Active state: black icon, inactive: gray
2. **Map** (map pin icon)
3. **Tickets** (ticket icon) - Badge indicator if tickets exist
4. **Favorites** (heart icon)
5. **Profile** (user icon)

**Tab Bar Design**:
- Height: 60px
- Background: White with subtle top border/shadow
- Icons: 24px, centered
- Labels: Small text below icons (10-12px)
- Active tab: Black icon + label, inactive: Gray (#999999)

---

### 3. Home/Discover Screen

#### Screen 3.1: Home Screen (List View)
- **Header**:
  - "plat" logo (left, ~32px height)
  - Search icon (right, 24px)
  - Location indicator (center, e.g., "Nairobi, Kenya" with small location icon)
- **Search Bar** (below header, full-width with 16px margins):
  - Rounded search input (height: 48px)
  - Placeholder: "Search events, venues, organizers..."
  - Search icon inside (left)
  - Filter icon (right)
- **Quick Filters** (horizontal scrollable chips, below search):
  - Chips: "Today", "This Weekend", "This Month", "Free Events", "Music", "Sports", etc.
  - Active chip: Black background, white text
  - Inactive chip: Light gray background (#E5E5E5), dark text
  - Padding: 8px vertical, 16px horizontal
- **Toggle View Button** (top right, above event list):
  - Icon toggle: List icon / Map icon
  - Text: "Map View" (when in list mode)
- **Event List** (scrollable, below filters):
  - **Event Card** (each card):
    - **Left**: Event image (aspect ratio 16:9, rounded corners, ~120px width)
    - **Right**: 
      - Event title (bold, 16px, 2 lines max)
      - Date & Time (small, gray, icon + text)
      - Location (small, gray, icon + text, 1 line)
      - Price (bold, black, "From KES 500" or "Free")
      - Organizer name (small, gray, below price)
    - **Bottom border**: Subtle divider
    - **Card height**: ~140px
    - **Padding**: 16px
- **Empty State** (if no events):
  - Centered icon
  - "No events found"
  - "Try adjusting your filters"

#### Screen 3.3: Search Results Screen
- **Header**:
  - Back arrow (left)
  - Search icon (right)
  - Search query display (center, e.g., "Results for 'music'")
- **Active Filters Bar** (below header, if filters applied):
  - Active filter chips (e.g., "Today", "KES 0-1000")
  - "Clear All" button (right, text link)
- **Results Count** (below filters): "24 events found"
- **View Toggle** (top right): List/Map toggle button
- **Event List** (same card design as Home screen)
- **Sort Options** (dropdown or button, top right):
  - "Sort by: Relevance" (default)
  - Options: "Date", "Price", "Distance", "Popularity"
- **Empty State**:
  - Search icon (large)
  - "No events found"
  - "Try different search terms or filters"
  - "Clear Filters" button

#### Screen 3.4: Filter Modal
- **Layout**: Full-screen modal or bottom sheet (slide up)
- **Header**:
  - "Filters" (bold, 24px, left)
  - "Clear All" (text link, right)
  - Close button (X, top right)
- **Filter Sections** (scrollable, each in expandable card):
  1. **Date Range**:
     - Toggle: "Any Date" / "Select Range"
     - Date picker (calendar view)
     - Quick options: "Today", "This Weekend", "This Week", "This Month"
  2. **Price Range**:
     - Slider (dual-handle): KES 0 - KES 10,000+
     - Min/Max inputs (text fields)
     - Quick options: "Free", "Under KES 500", "KES 500-2000", "KES 2000+"
  3. **Event Type**:
     - Checkboxes: Music, Sports, Comedy, Food & Drink, Nightlife, Arts, etc.
     - "Select All" / "Clear All" buttons
  4. **Location**:
     - "Current Location" toggle
     - Distance slider: "Within 5km" (default)
     - City selector (if multiple cities)
  5. **Other Filters**:
     - "Free Events Only" (toggle)
     - "Featured Events" (toggle)
     - Age restriction (picker)
- **Apply Button** (sticky bottom, black, full-width):
  - Shows count: "Apply (5 filters)"
- **Reset Button** (below apply, text link, gray)

---

#### Screen 3.2: Home Screen (Map View)
- **Header**: Same as list view
- **Map Container** (full screen, below header):
  - Google Maps/Mapbox full-screen view
  - User location marker (blue dot with pulsing animation)
  - Event markers (custom icons, clustered when >15-20 visible)
  - Clusters: Circular badge with count (e.g., "15" in black circle)
- **Map Controls** (overlay, bottom right):
  - Location button (center on user location)
  - Zoom controls (if needed)
- **Filter Bar** (overlay, top, below header):
  - Horizontal scrollable filter chips (same as list view)
  - Background: White with 80% opacity
  - Rounded corners
- **Event Preview Bottom Sheet** (slides up from bottom when marker tapped):
  - **Sheet height**: ~40% of screen
  - **Handle bar** (top center, drag indicator)
  - **Content**:
    - Event image (banner, ~120px height)
    - Event title (bold, 18px)
    - Date, time, location (stacked, small text)
    - Price (bold, large)
    - "View Details" button (black, full-width with margins)
  - **Swipe down** to dismiss
- **Toggle View Button** (floating, top right):
  - "List View" button (white background, black text, shadow)

---

### 4. Event Detail Screen

#### Screen 4.1: Event Details
- **Header**:
  - Back arrow (left)
  - Share icon (right)
  - "plat" logo (center, small)
- **Hero Image** (top, full-width):
  - Event image (aspect ratio 16:9, ~250px height)
  - Favorite icon (floating, top right, white circle with heart icon)
  - Image overlay gradient (bottom, for text readability)
- **Event Info Section** (scrollable, below image):
  - **Title** (bold, 24px, black)
  - **Organizer** (clickable, gray text, "by [Organizer Name]" with arrow)
  - **Key Details** (icon + text rows, 16px spacing):
    - 📅 Date & Time (bold date, time below)
    - 📍 Location (address, clickable to open maps)
    - 💰 Price Range ("From KES 500" or "Free")
    - 👥 Capacity ("Limited tickets available" if applicable)
  - **Description** (expandable):
    - "About this event" (section header)
    - Description text (readable, 14px line height)
    - "Read more" link if text is long
  - **Additional Info** (if applicable):
    - Age restriction badge
    - Dress code badge
    - Safety info icon
  - **Ticket Types Section**:
    - Section header: "Select Tickets"
    - **Ticket Type Card** (each type):
      - Ticket name (bold, e.g., "General Admission")
      - Description (small, gray)
      - Price (large, bold, "KES 1,500")
      - Quantity selector (stepper: - | 0 | +)
      - Available count ("15 left" in small text)
    - **Total** (sticky bottom bar):
      - "Total: KES 3,000" (large, bold)
      - "Buy Tickets" button (black, full-width, 56px height)
  - **Reviews Section** (if reviews exist):
    - Section header: "Reviews" with average rating
    - Review cards (truncated, "Read all reviews" link)
  - **Safety Features** (if nightlife event):
    - "Safety" section with:
      - Emergency contacts button
      - Safety check-in button
      - Share location button
- **Sticky Bottom Bar** (if no tickets selected):
  - "Select Tickets" button (black, full-width)

#### Screen 4.2: Social Share Modal
- **Layout**: Bottom sheet (slides up from bottom, ~60% screen height)
- **Header**:
  - "Share Event" (bold, 20px, centered)
  - Close button (X, top right)
- **Share Preview Card** (top section):
  - Event image (thumbnail, ~120px width)
  - Event title (truncated)
  - Date & location (small text)
  - "plat" logo watermark (small, bottom right)
- **Platform Grid** (scrollable, 2 columns):
  - **Instagram** (icon + "Instagram Stories")
  - **Instagram** (icon + "Instagram Feed")
  - **Snapchat** (icon + "Snapchat")
  - **Locket** (icon + "Locket")
  - **WhatsApp** (icon + "WhatsApp")
  - **Facebook** (icon + "Facebook")
  - **Twitter** (icon + "Twitter")
  - **Copy Link** (icon + "Copy Link")
  - **More** (icon + "More Options" - native share sheet)
- **Platform Cards**:
  - Icon (large, ~48px, platform color)
  - Platform name (below icon)
  - Tap to share
- **Customization** (if applicable):
  - "Add Message" text input (optional, above platform grid)
  - "Track Referrals" toggle (on by default)
- **Note**: Deep link opens app if installed, web fallback if not

#### Screen 4.3: Organizer Profile View
- **Header**: Back arrow + "Organizer"
- **Profile Header** (top section):
  - Organizer logo (circular, ~100px, centered)
  - Organizer name (bold, 24px, centered)
  - Verification badge (if verified, checkmark icon)
  - Bio/description (centered, gray text, 2-3 lines)
  - Social links (icons, horizontal, centered)
- **Stats** (below header, horizontal cards):
  - "X Events" (card)
  - "X Followers" (card, if social features added)
  - Average rating (if reviews exist)
- **Tabs** (below stats):
  - "Events" (active, black underline)
  - "Reviews" (inactive, gray)
- **Events List** (scrollable):
  - Event cards (same design as Home screen)
  - Filter: "Upcoming" / "Past" (toggle)
- **Reviews Tab** (if selected):
  - Average rating (large, centered)
  - Review cards (same as event reviews)
- **Follow/Contact Button** (sticky bottom, if applicable):
  - "Follow" or "Contact Organizer" button

---

### 5. Ticket Purchase Flow

#### Screen 5.1: Ticket Selection (from Event Detail)
- Same as Event Detail, but with:
  - Selected ticket types highlighted
  - Quantity selectors active
  - "Continue to Payment" button (replaces "Buy Tickets")

#### Screen 5.2: Guest Checkout Option
- **Header**: Back arrow + "Checkout"
- **Guest Checkout Banner** (top, if user not signed in):
  - "Continue as Guest" option
  - "Or Sign In to save your tickets" (link to sign in)
- **Order Summary** (card):
  - Event name
  - Ticket breakdown (type x quantity = price)
  - Subtotal
  - Service fee (if applicable)
  - **Total** (large, bold)
- **Contact Information** (required for guest checkout):
  - Email (text input, required)
  - Phone Number (text input, required, country code selector)
  - "I agree to receive ticket confirmation via email/SMS" (checkbox)
- **Button**: "Continue to Payment" (black, full-width, bottom)

#### Screen 5.3: Payment Method Selection
- **Header**: Back arrow + "Payment"
- **Order Summary** (top section, card):
  - Event name
  - Ticket breakdown (type x quantity = price)
  - Subtotal
  - Service fee (if applicable)
  - **Total** (large, bold)
- **Payment Methods** (list, below summary):
  - **M-Pesa** (primary, top):
    - M-Pesa logo/icon
    - "Pay with M-Pesa"
    - Description: "Enter your M-Pesa PIN on your phone"
    - Radio button (selected by default)
  - **Card Payment**:
    - Card icon
    - "Pay with Card (KES or USD)"
    - Radio button
  - **Saved Payment Methods** (if user is signed in):
    - "Saved Methods" section header
    - Saved M-Pesa number (if saved)
    - Saved cards (if any)
- **Button**: "Continue" (black, full-width, bottom)

#### Screen 5.4: M-Pesa Phone Number Input
- **Header**: Back arrow + "M-Pesa Payment"
- **Content** (centered):
  - M-Pesa logo (large, ~80px)
  - Title: "Enter Your M-Pesa Number"
  - Phone number input (text field, phone keyboard, country code +254)
  - "Save for future payments" (checkbox, if user is signed in)
  - Amount: "KES 3,000" (display, below input)
- **Button**: "Continue" (black, full-width, bottom)

#### Screen 5.5: M-Pesa Payment Processing
- **Header**: Back arrow + "M-Pesa Payment"
- **Content** (centered):
  - M-Pesa logo (large, ~80px)
  - Phone number display: "+254 7XX XXX XXX" (gray, small)
  - Amount: "KES 3,000" (large, bold)
  - Instructions:
    - "1. Enter your M-Pesa PIN on your phone"
    - "2. Confirm the payment"
    - "3. Wait for confirmation"
  - **Loading indicator** (spinner, below instructions, purple accent)
  - **Status message**: "Waiting for payment confirmation..."
  - **Progress indicator**: "Processing..." (animated)
- **Cancel button** (bottom, text link, gray)
- **Timeout handling**: After 2 minutes, show "Payment taking longer than expected" with "Retry" option

#### Screen 5.6: Card Payment
- **Header**: Back arrow + "Card Payment"
- **Form** (scrollable):
  - Card number input (16 digits, formatted)
  - Expiry date & CVV (side by side)
  - Cardholder name
  - Currency selector (KES / USD)
  - Billing address (if required)
- **Button**: "Pay KES 3,000" (black, full-width, bottom)

#### Screen 5.7: Payment Success
- **Content** (centered, full screen):
  - Success icon (checkmark, large, green, ~100px)
  - "Payment Successful!" (bold, 24px)
  - "Your tickets have been sent to your email"
  - **QR Code** (large, centered, ~200x200px)
  - Ticket details (small text below QR):
    - Event name
    - Date & time
    - Ticket type & quantity
  - **Buttons**:
    - "View My Tickets" (primary, black, full-width)
    - "Download Ticket" (secondary, outlined, full-width)
    - "Share Ticket" (secondary, text link)

---

### 6. My Tickets Screen

#### Screen 6.1: Tickets List
- **Header**: "My Tickets" (bold, 24px)
- **Tabs** (below header, horizontal):
  - "Upcoming" (active, black underline)
  - "Past" (inactive, gray)
- **Ticket Cards** (scrollable list):
  - **Ticket Card**:
    - **Left**: Event image (square, ~100px)
    - **Right**:
      - Event title (bold, 16px)
      - Date & time (small, gray)
      - Location (small, gray)
      - Ticket type & quantity (small, "2x General Admission")
      - Status badge ("Active" in green, or "Used" in gray)
    - **Bottom border**: Divider
    - **Tap** to view ticket details
- **Empty State** (if no tickets):
  - Icon
  - "No tickets yet"
  - "Browse events to get started"

#### Screen 6.2: Ticket Detail (with QR Code)
- **Header**: Back arrow + "Ticket"
- **Event Image** (banner, top)
- **QR Code** (large, centered, ~250x250px)
- **Ticket Info** (below QR):
  - Event name (bold, 20px)
  - Date & time
  - Location
  - Ticket type
  - Order number (small, gray)
- **Actions** (buttons, below info):
  - "Download Ticket" (primary, black)
  - "Transfer Ticket" (secondary, outlined)
  - "Request Refund" (text link, gray, if eligible)
- **Note**: "This ticket is valid for entry. Show QR code at event."

#### Screen 6.3: Ticket Transfer Flow
- **Header**: Back arrow + "Transfer Ticket"
- **Ticket Info** (top section, card):
  - Event image (thumbnail)
  - Event name
  - Ticket type
  - Transfer instructions: "Transfer this ticket to another user"
- **Recipient Selection** (form):
  - **Option 1: Transfer to User**:
    - Search user (search input with user icon)
    - User results (if found, show name, email, profile pic)
    - "Select User" button
  - **Option 2: Transfer by Contact**:
    - Email input (text field)
    - OR Phone number input (text field)
    - "Send Transfer Request" button
- **Transfer Details** (if recipient selected):
  - Recipient name/email/phone (display)
  - Optional message (text area): "Add a personal message (optional)"
  - Transfer fee (if applicable, display)
- **Confirmation** (before finalizing):
  - "Confirm Transfer" section
  - Recipient details
  - Ticket details
  - Warning: "This action cannot be undone"
- **Button**: "Transfer Ticket" (purple accent, full-width, bottom)
- **Success Screen** (after transfer):
  - Success icon (checkmark, green)
  - "Ticket transferred successfully!"
  - Recipient notified message
  - "Back to My Tickets" button

#### Screen 6.4: Ticket Gift Flow
- **Header**: Back arrow + "Gift Ticket"
- **Similar to Transfer Flow**, but with:
  - "Gift Message" (required, text area, larger)
  - "Gift Wrapper" option (optional, themed designs)
  - "Schedule Gift" option (send on specific date)
  - "Anonymous Gift" toggle
- **Preview**: Show how gift will appear to recipient
- **Button**: "Send Gift" (purple accent, full-width)

#### Screen 6.5: Refund Request
- **Header**: Back arrow + "Request Refund"
- **Ticket Info** (card):
  - Event name, date, ticket type
  - Purchase amount
  - Refund policy (if applicable, display)
- **Refund Reason** (form):
  - Reason selector (dropdown or radio buttons):
    - "Can't attend"
    - "Event cancelled"
    - "Duplicate purchase"
    - "Other" (with text input)
  - Additional notes (text area, optional)
- **Refund Details**:
  - Refund amount (display, may be less than purchase if fees apply)
  - Processing time estimate: "5-7 business days"
  - Refund method: "Original payment method"
- **Button**: "Submit Refund Request" (purple accent, full-width)
- **Confirmation**:
  - "Refund request submitted"
  - Status: "Pending organizer approval"
  - "Track Status" link

---

### 7. Favorites Screen

- **Header**: "Favorites" (bold, 24px)
- **Event List** (same card design as Home screen)
- **Empty State**:
  - Heart icon (outline, large)
  - "No favorites yet"
  - "Tap the heart icon on events to save them"

#### Screen 7.1: Waitlist Screen
- **Header**: "My Waitlist"
- **Tabs** (below header):
  - "Active" (active, black underline)
  - "Available" (inactive, gray - shows events with available tickets)
  - "Expired" (inactive, gray)
- **Waitlist Cards** (scrollable list):
  - **Waitlist Card**:
    - Event image (left, ~100px)
    - Event title (bold, 16px)
    - Date & time (small, gray)
    - Location (small, gray)
    - **Position in queue**: "You're #12 in line" (purple accent, bold)
    - **Status badge**: "Waiting" (gray) or "Tickets Available!" (green, if notified)
    - **Action button**: 
      - "Get Tickets" (if available, purple accent)
      - "Remove from Waitlist" (if active, text link)
- **Empty State**:
  - Clock icon (large)
  - "No waitlisted events"
  - "Join waitlists for sold-out events to get notified when tickets become available"

---

### 8. Profile Screen

- **Header**: "Profile" (bold, 24px)
- **Profile Section** (top):
  - Profile image (circular, ~80px, centered)
  - Name (bold, 20px, centered)
  - Email (small, gray, centered)
- **Menu Items** (list, below profile):
  - "My Tickets" (icon + text, arrow)
  - "Favorites" (icon + text, arrow)
  - "Waitlist" (icon + text, arrow, badge if active)
  - "Emergency Contacts" (icon + text, arrow, if nightlife user)
  - "Settings" (icon + text, arrow)
  - "Payment Methods" (icon + text, arrow)
  - "Help & Support" (icon + text, arrow)
  - "About" (icon + text, arrow)
  - "Sign Out" (text, red, bottom of list)

#### Screen 8.1: Settings Screen
- **Header**: Back arrow + "Settings"
- **Account Section**:
  - "Edit Profile" (arrow)
  - "Change Password" (arrow)
  - "Email Preferences" (arrow)
- **Notifications Section**:
  - "Push Notifications" (toggle, on/off)
  - "Nearby Events" (toggle, sub-setting)
  - "Price Drops" (toggle, sub-setting)
  - "Event Reminders" (toggle, sub-setting)
  - "Sold Out Alerts" (toggle, sub-setting)
  - "Waitlist Notifications" (toggle, sub-setting)
  - "Quiet Hours" (time picker, if enabled)
- **Privacy Section**:
  - "Location Services" (toggle + status)
  - "Share Location with Events" (toggle)
  - "Data Usage" (arrow, shows low-data mode toggle)
- **App Settings**:
  - "Low-Data Mode" (toggle)
  - "Language" (picker, English for MVP)
  - "Currency" (picker, KES/USD)
- **Support Section**:
  - "Help Center" (arrow)
  - "Contact Support" (arrow)
  - "Report a Problem" (arrow)
- **About Section**:
  - "Terms & Conditions" (arrow)
  - "Privacy Policy" (arrow)
  - "App Version" (display, e.g., "1.0.0")
- **Danger Zone** (bottom, red text):
  - "Delete Account" (arrow, with confirmation)

#### Screen 8.2: Emergency Contacts
- **Header**: Back arrow + "Emergency Contacts"
- **Info Banner** (top, purple accent background):
  - "Add trusted contacts who will be notified in case of emergency"
- **Contacts List** (scrollable):
  - **Contact Card**:
    - Name (bold)
    - Phone number (gray)
    - Relationship (small, gray, e.g., "Family", "Friend")
    - Edit/Delete buttons (right)
- **Add Contact Button** (floating, bottom right, purple accent, circular with + icon)
- **Add/Edit Contact Modal**:
  - Name input
  - Phone number input
  - Relationship selector (dropdown)
  - "Save" button
- **Empty State**:
  - Shield icon (large)
  - "No emergency contacts"
  - "Add contacts to keep you safe at events"

#### Screen 8.3: Safety Check-in
- **Header**: "Safety Check-in"
- **Event Info** (card, top):
  - Event name
  - Current time
  - Event end time
- **Check-in Options**:
  - **"I'm Safe" Button** (large, green, full-width):
    - Tap to confirm safety
    - Sends notification to emergency contacts
  - **"I Need Help" Button** (large, red, full-width):
    - Opens emergency options
    - Call emergency services
    - Notify emergency contacts
- **Auto Check-in** (toggle):
  - "Remind me to check in after event ends"
  - Time picker (default: event end time + 1 hour)
- **Emergency Contacts** (quick access, below):
  - Quick dial buttons for emergency contacts
  - "Call Emergency Services" button (red, prominent)

#### Screen 8.4: Safety Report
- **Header**: Back arrow + "Report Safety Concern"
- **Form**:
  - Event name (pre-filled, if reporting from event)
  - Report type (selector):
    - "Harassment"
    - "Unsafe conditions"
    - "Medical emergency"
    - "Other"
  - Description (text area, required)
  - Photo upload (optional, multiple)
  - Anonymous report (toggle)
- **Contact Options**:
  - "I want to be contacted" (toggle)
  - Email/Phone (if toggle on)
- **Button**: "Submit Report" (purple accent, full-width)
- **Confirmation**:
  - "Report submitted"
  - "We take safety seriously. Your report will be reviewed."

---

## ⚠️ ERROR STATES & LOADING SCREENS

### Error States

#### Network Error Screen
- **Layout**: Full-screen, centered content
- **Icon**: WiFi/connection icon (large, ~100px, gray)
- **Title**: "Connection Error" (bold, 24px)
- **Message**: "Unable to connect to the internet. Please check your connection and try again."
- **Button**: "Retry" (black, full-width, with 16px margins)
- **Alternative**: "Go Offline" (text link, below retry button)

#### Payment Error Screen
- **Layout**: Full-screen, centered content
- **Icon**: Alert/error icon (large, ~100px, red)
- **Title**: "Payment Failed" (bold, 24px)
- **Message**: "Your payment could not be processed. Please try again or use a different payment method."
- **Error Details** (if available, small text, gray):
  - Error code or reason
- **Buttons**:
  - "Try Again" (primary, black, full-width)
  - "Contact Support" (secondary, text link)
  - "Cancel" (text link, gray)

#### Event Not Found (404)
- **Layout**: Full-screen, centered content
- **Icon**: Search/not found icon (large, ~100px, gray)
- **Title**: "Event Not Found" (bold, 24px)
- **Message**: "This event may have been removed or the link is invalid."
- **Button**: "Browse Events" (black, full-width)

#### Permission Denied
- **Layout**: Full-screen, centered content
- **Icon**: Lock/permission icon (large, ~100px, gray)
- **Title**: "Permission Required" (bold, 24px)
- **Message**: "We need [permission type] to [purpose]. Please enable it in your device settings."
- **Button**: "Open Settings" (black, full-width)

### Loading States

#### Skeleton Loaders
- **Event List Skeleton**:
  - Placeholder cards with shimmer animation
  - Gray rectangles matching event card layout
  - Animated gradient (left to right, repeating)
  - Same dimensions as actual event cards
- **Event Detail Skeleton**:
  - Image placeholder (gray rectangle, 16:9 aspect ratio)
  - Text placeholders (multiple gray lines, varying widths)
  - Button placeholders (rounded rectangles)
- **Ticket List Skeleton**:
  - Similar to event list, but ticket card dimensions
- **Profile Skeleton**:
  - Circular placeholder for profile image
  - Text line placeholders

#### Loading Indicators
- **Spinner**: Circular spinner (purple accent color)
- **Progress Bar**: Linear progress bar (for uploads, payments)
- **Pull-to-Refresh**: Native pull-to-refresh with spinner

---

## 🏢 ORGANIZER APP WIREFRAMES

### 1. Onboarding Flow (Organizer App)

#### Screen 1.1: Welcome Screen
- **Layout**: Similar to user app
- **Logo**: "plat" logo (white on black)
- **Title**: "Manage Your Events"
- **Subtitle**: "Create events, manage bookings, and track sales"
- **Buttons**:
  - "Sign In" (primary, black)
  - "Create Account" (secondary, outlined)

#### Screen 1.2: Role Selection
- **Title**: "What type of organizer are you?"
- **Options** (two large cards, side by side or stacked):
  - **Event Organizer Card**:
    - Icon (event/calendar)
    - "Event Organizer"
    - Description: "Create and manage your own events"
    - Radio button
  - **Venue Organizer Card**:
    - Icon (venue/building)
    - "Venue Organizer"
    - Description: "Manage your venue and host events"
    - Radio button
  - **Note**: "You can add both roles later"
- **Button**: "Continue" (black, full-width)

#### Screen 1.3: Profile Setup
- **Form**:
  - Profile type (pre-selected, can change)
  - Name/Company Name
  - Bio/Description
  - Logo upload (image picker)
  - Website (optional)
  - Social links (optional)
  - For venues: Address, capacity, amenities
- **Button**: "Submit for Verification" (black, full-width)
- **Note**: "Your profile will be reviewed and verified"

---

### 2. Main Navigation (Organizer App)

**Tab Bar** (4 tabs):
1. **Dashboard** (chart/analytics icon)
2. **Events** (calendar icon)
3. **Bookings** (envelope/requests icon) - Badge if pending requests
4. **Profile** (user icon)

---

### 3. Dashboard Screen

- **Header**: "Dashboard" (bold, 24px)
- **Stats Cards** (top, horizontal scroll or grid):
  - **Total Events** (card with number, icon)
  - **Total Sales** (card with amount, icon)
  - **Upcoming Events** (card with count)
  - **Pending Requests** (card with badge, if applicable)
- **Quick Actions** (buttons, below stats):
  - "Create Event" (primary, black, large)
  - "View Analytics" (secondary, outlined)
- **Recent Activity** (list, below):
  - Recent ticket sales
  - Recent booking requests
  - Recent reviews

---

### 4. Events Management Screen

- **Header**: "My Events" + "Create Event" button (right)
- **Tabs**: "Published", "Drafts", "Past"
- **Event List** (cards):
  - Event image (thumbnail)
  - Event title
  - Date & status badge
  - Sales stats ("50 tickets sold")
  - Actions: "Edit", "View", "Analytics"
- **Empty State**: "No events yet. Create your first event!"

---

### 5. Create/Edit Event Screen

- **Header**: Back arrow + "Create Event" / "Edit Event"
- **Form** (scrollable):
  - **Basic Info**:
    - Event title
    - Description (rich text editor)
    - Category/Type (picker)
    - Images (upload, multiple)
  - **Date & Time**:
    - Start date & time (picker)
    - End date & time (picker)
  - **Location**:
    - Location type toggle: "Venue" / "Custom Location"
    - If venue: Venue selector (search)
    - If custom: Address input + map picker
  - **Ticket Types**:
    - Add ticket type button
    - For each type: Name, price, quantity, description
  - **Additional**:
    - Age restriction
    - Dress code
    - Capacity limit
  - **Publish Toggle**: "Publish immediately" (switch)
- **Button**: "Save Event" / "Publish Event" (black, full-width, bottom)

---

### 6. Booking Requests Screen (Venue Organizers)

- **Header**: "Booking Requests" + Badge count
- **Tabs**: "Pending", "Accepted", "Rejected"
- **Request Cards**:
  - Event organizer name & profile
  - Requested date & time
  - Estimated capacity
  - Description
  - **Actions**:
    - "View Details" (button)
    - "Accept" (primary, green)
    - "Reject" (secondary, red)
- **Empty State**: "No booking requests"

#### Screen 6.1: Booking Request Detail
- **Header**: Back arrow + "Booking Request"
- **Content**:
  - Organizer profile (name, bio, logo)
  - Requested date & time
  - Estimated capacity
  - Description
  - **Quote Section**:
    - Quote amount input (KES)
    - Notes/terms (text area)
  - **Actions**:
    - "Send Quote" (primary, black)
    - "Reject Request" (secondary, red)

---

### 7. Analytics Screen

- **Header**: "Analytics" + Event selector (if multiple events)
- **Charts** (scrollable):
  - Revenue chart (line or bar)
  - Ticket sales over time
  - Ticket type breakdown (pie chart)
  - Views/impressions
- **Stats**:
  - Total revenue
  - Total tickets sold
  - Average ticket price
  - Conversion rate

---

### 8. Check-in Screen (QR Scanner)

- **Header**: "Check In" + Event name
- **QR Scanner** (full screen, camera view):
  - Camera preview (centered)
  - Scanning frame/overlay (square, centered)
  - Instructions: "Point camera at ticket QR code"
- **Manual Entry** (button, bottom): "Enter ticket number manually"
- **Checked-in List** (toggle view, bottom sheet):
  - List of checked-in attendees
  - Search/filter
  - Export button

---

### 9. Refund Requests Screen

- **Header**: "Refund Requests" + Badge count
- **Tabs**: "Pending", "Approved", "Rejected"
- **Request Cards**:
  - User name
  - Event name
  - Ticket details
  - Refund amount
  - Reason
  - **Actions**:
    - "Approve" (primary, green)
    - "Reject" (secondary, red)
    - "View Details" (link)
- **Empty State**: "No refund requests"

#### Screen 9.1: Refund Request Detail
- **Header**: Back arrow + "Refund Request"
- **User Info** (card, top):
  - User name
  - Email/Phone
  - Purchase date
- **Ticket Details** (card):
  - Event name, date, location
  - Ticket type & quantity
  - Original purchase amount
- **Refund Request** (card):
  - Reason (display)
  - Additional notes (if provided)
  - Request date
- **Refund Amount** (highlighted):
  - Refund amount (large, bold)
  - Processing fee (if applicable, small text)
  - Net refund amount
- **Actions**:
  - "Approve Refund" (primary, green, full-width)
  - "Reject Refund" (secondary, red, full-width)
  - "Add Response" (text area, for rejection reason)

---

### 10. Venue Booking Request Creation (Event Organizers)

#### Screen 10.1: Create Booking Request
- **Header**: Back arrow + "Request Venue Booking"
- **Venue Selection** (top section):
  - Search venues (search input)
  - Venue list (cards with name, location, capacity)
  - Selected venue (highlighted, if selected)
- **Request Details** (form):
  - Event name (text input)
  - Event description (text area)
  - Requested date (date picker)
  - Requested time (time picker)
  - Estimated capacity (number input)
  - Event type (selector)
  - Additional requirements (text area, optional)
- **Contact Info** (pre-filled from profile):
  - Organizer name
  - Email
  - Phone
- **Button**: "Submit Request" (purple accent, full-width)
- **Confirmation**:
  - "Request submitted"
  - "Venue will respond within 48 hours"
  - "View Request Status" button

#### Screen 10.2: Booking Request Status
- **Header**: Back arrow + "Booking Requests"
- **Tabs**: "Pending", "Accepted", "Rejected", "Expired"
- **Request Cards**:
  - Venue name & logo
  - Event name
  - Requested date
  - Status badge (color-coded)
  - Quote amount (if accepted, display)
  - **Actions**:
    - "View Details" (if pending)
    - "Accept Quote" (if accepted, purple accent)
    - "View Event" (if event created)

#### Screen 10.3: Accept Quote & Create Event
- **Header**: Back arrow + "Accept Quote"
- **Quote Summary** (card, top):
  - Venue name
  - Event date & time
  - Venue quote: "KES X,XXX" (large, bold)
  - Quote terms/notes (if provided)
- **Event Details** (pre-filled from request, editable):
  - Event name
  - Description
  - Ticket types & pricing
  - Additional event info
- **Confirmation**:
  - "By accepting this quote, you agree to pay the venue fee upon ticket sales"
- **Button**: "Accept Quote & Create Event" (purple accent, full-width)
- **Success**:
  - "Event created successfully!"
  - "Set up tickets and publish your event"
  - "Go to Event" button

---

### 11. Organizer Profile Management

#### Screen 11.1: Edit Event Organizer Profile
- **Header**: Back arrow + "Edit Profile"
- **Form**:
  - Profile image upload (circular, ~100px, with edit icon)
  - Name/Company name (text input)
  - Bio/Description (text area)
  - Website (text input, URL)
  - Social links (multiple inputs):
    - Instagram
    - Facebook
    - Twitter
    - Other (custom)
  - Verification status (display only, if pending/verified)
- **Button**: "Save Changes" (purple accent, full-width)

#### Screen 11.2: Edit Venue Profile
- **Header**: Back arrow + "Edit Venue"
- **Form**:
  - Venue logo upload
  - Venue name (text input)
  - Address (text input + map picker)
  - City (selector or text input)
  - Description (text area)
  - Capacity (number input)
  - Amenities (multi-select or tags):
    - Parking
    - WiFi
    - Bar
    - Stage
    - Sound system
    - etc.
  - Venue images (multiple upload)
  - Social links
- **Button**: "Save Changes" (purple accent, full-width)

---

### 12. Attendee Management

#### Screen 12.1: Attendee List
- **Header**: Event name + "Attendees"
- **Stats Bar** (top):
  - Total tickets sold
  - Checked in count
  - Remaining capacity
- **Search/Filter** (below stats):
  - Search input (search by name, email, ticket number)
  - Filter: "All" / "Checked In" / "Not Checked In"
- **Attendee List** (scrollable):
  - **Attendee Card**:
    - Name (bold)
    - Email/Phone (small, gray)
    - Ticket type & quantity
    - Check-in status (badge: "Checked In" green / "Not Checked In" gray)
    - Check-in time (if checked in, small text)
    - QR code icon (tap to view ticket QR)
- **Export Button** (top right): "Export List" (CSV/Excel)
- **Empty State**: "No attendees yet"

---

### 13. Organizer Settings

#### Screen 13.1: Organizer Settings
- **Header**: Back arrow + "Settings"
- **Account Section**:
  - "Edit Profile" (arrow)
  - "Change Password" (arrow)
  - "Payment Preferences" (arrow)
- **Notifications Section**:
  - "Booking Requests" (toggle)
  - "Ticket Sales" (toggle)
  - "Refund Requests" (toggle)
  - "Event Reminders" (toggle)
- **Business Section**:
  - "Tax Information" (arrow)
  - "Bank Account" (arrow, for payouts)
  - "Payout Schedule" (arrow)
- **Support Section**:
  - "Help Center" (arrow)
  - "Contact Support" (arrow)
- **About Section**:
  - "Terms & Conditions" (arrow)
  - "Privacy Policy" (arrow)
  - "App Version" (display)

---

## 🎨 Design Principles

1. **Modern & Clean**: Minimal design, generous whitespace
2. **Black & White Focus**: Logo-inspired color scheme with strategic accent colors
3. **Mobile-First**: Touch-friendly targets (min 44x44px)
4. **Accessibility**: High contrast, readable fonts (min 14px)
5. **Performance**: Optimized images, lazy loading
6. **Low-Data Mode**: Compressed images, minimal API calls
7. **Social Integration**: Prominent share buttons for Instagram, Snapchat, Locket

---

## 📐 Component Specifications

### Buttons
- **Primary**: 
  - Background: Black (#000000) or Purple accent (#8B5CF6) for theme-based actions
  - Text: White
  - Height: 56px
  - Border Radius: 8px
  - Full-width with 16px horizontal margins
  - Font: Bold, 16px
  - Touch feedback: Slight scale (0.98) on press
- **Secondary**: 
  - Background: White
  - Border: 1px solid #E5E5E5
  - Text: Black
  - Same dimensions as primary
- **Text Link**: 
  - Text: Black or Purple accent
  - Underlined on hover/press
  - Font: Regular, 14px or 16px
- **Icon Button**: 
  - Circular or square, 44x44px minimum
  - Icon: 24px
  - Background: Transparent or light gray on press

### Cards
- **Background**: White (#FFFFFF)
- **Border**: Subtle shadow (0 2px 8px rgba(0,0,0,0.1)) OR 1px border (#E5E5E5)
- **Border Radius**: 12px
- **Padding**: 16px
- **Spacing**: 12px margin between cards
- **Press State**: Slight elevation increase (shadow)

### Input Fields
- **Height**: 48px
- **Border**: 1px solid #E5E5E5
- **Border Radius**: 8px
- **Padding**: 16px horizontal
- **Background**: White
- **Text**: 16px, regular
- **Placeholder**: Gray (#999999)
- **Focus State**: 
  - Border: 2px solid Purple accent (#8B5CF6) or Black
  - Shadow: Subtle glow
- **Error State**: 
  - Border: 2px solid Red (#EF4444)
  - Error message below field (red, 12px)

### Typography
- **H1 (Page Titles)**: 
  - Font: Bold
  - Size: 24px
  - Color: Black (#1A1A1A)
  - Line Height: 32px
- **H2 (Section Titles)**: 
  - Font: Bold
  - Size: 20px
  - Color: Black (#1A1A1A)
  - Line Height: 28px
- **H3 (Subsection Titles)**: 
  - Font: Semi-bold
  - Size: 18px
  - Color: Black (#1A1A1A)
  - Line Height: 24px
- **Body (Primary)**: 
  - Font: Regular
  - Size: 16px
  - Color: Dark gray (#1A1A1A)
  - Line Height: 24px
- **Body (Secondary)**: 
  - Font: Regular
  - Size: 14px
  - Color: Medium gray (#666666)
  - Line Height: 20px
- **Caption/Small**: 
  - Font: Regular
  - Size: 12px
  - Color: Gray (#999999)
  - Line Height: 16px

### Event Cards
- **Layout**: Horizontal (image left, content right)
- **Image**: 
  - Width: 120px
  - Height: 140px (aspect ratio ~16:9)
  - Border Radius: 8px (left side only)
- **Content**: 
  - Padding: 16px
  - Title: Bold, 16px, 2 lines max (ellipsis)
  - Meta info: 14px, gray, icon + text
  - Price: Bold, 16px, black
- **Spacing**: 12px margin bottom

### Badges
- **Status Badge**: 
  - Background: Color-coded (green for active, gray for inactive, red for error)
  - Text: White
  - Padding: 4px 8px
  - Border Radius: 12px
  - Font: Semi-bold, 12px
- **Category Badge**: 
  - Background: Light gray (#F5F5F5)
  - Text: Black
  - Same dimensions as status badge

### Bottom Sheets
- **Height**: 40-60% of screen (adjustable)
- **Background**: White
- **Border Radius**: 20px (top corners only)
- **Handle Bar**: 
  - Width: 40px
  - Height: 4px
  - Background: Gray (#CCCCCC)
  - Border Radius: 2px
  - Centered, 8px from top
- **Content**: Scrollable, 16px padding

### Modals
- **Background Overlay**: Black, 50% opacity
- **Modal Container**: 
  - Background: White
  - Border Radius: 16px
  - Padding: 24px
  - Max width: 90% of screen
  - Centered on screen

### Tabs
- **Tab Bar**: 
  - Height: 44px
  - Background: White or transparent
  - Border bottom: 1px solid #E5E5E5 (optional)
- **Tab Item**: 
  - Padding: 12px 16px
  - Font: Semi-bold, 14px
  - Active: Black text, underline (2px, purple accent)
  - Inactive: Gray text (#999999)

### Search Bar
- **Height**: 48px
- **Background**: Light gray (#F5F5F5)
- **Border Radius**: 24px (fully rounded)
- **Padding**: 12px 16px
- **Icon**: 20px, gray, left side
- **Placeholder**: 14px, gray
- **Focus State**: Background white, border 1px solid purple accent

### Filter Chips
- **Height**: 32px
- **Padding**: 8px 16px
- **Border Radius**: 16px (fully rounded)
- **Font**: Regular, 14px
- **Active**: 
  - Background: Black or Purple accent
  - Text: White
- **Inactive**: 
  - Background: Light gray (#E5E5E5)
  - Text: Black

### Loading Indicators
- **Spinner**: 
  - Size: 40px
  - Color: Purple accent (#8B5CF6)
  - Animation: Rotate 360deg, 1s linear, infinite
- **Skeleton Loader**: 
  - Background: Light gray (#F5F5F5)
  - Shimmer: Gradient animation (left to right)
  - Border Radius: Match target component

### QR Code Display
- **Size**: 200x200px (minimum), up to 250x250px
- **Background**: White
- **Border**: 1px solid #E5E5E5
- **Padding**: 16px
- **Border Radius**: 8px
- **Centered** on screen or card

### Map Components
- **Event Marker**: 
  - Custom icon (ticket or event icon)
  - Size: 32x32px
  - Color: Purple accent or theme color
- **Cluster Marker**: 
  - Circular badge
  - Background: Black or Purple accent
  - Text: White, bold, 14px
  - Size: 40x40px (adjusts with count)
- **User Location Marker**: 
  - Blue dot with pulsing animation
  - Size: 12px

### Theme Support
- **Default Accent**: Purple (#8B5CF6)
- **Theme Override**: 
  - Halloween: Orange (#FF6B35)
  - Christmas: Red/Green
  - Custom: Defined per event/organizer
- **Implementation**: CSS variables or theme context

---

## 🔄 User Flow Diagrams

### Primary User Flow: Discover & Purchase

```
Splash Screen
    ↓
Onboarding (First Launch)
    ├─ Welcome Screen
    ├─ Location Permission
    ├─ Notification Permission
    └─ Sign Up / Sign In
        ↓
Home Screen (List View)
    ├─ Browse Events
    ├─ Search Events → Search Results
    ├─ Filter Events → Filter Modal
    └─ Toggle to Map View
        ↓
Event Detail Screen
    ├─ View Event Info
    ├─ Select Tickets
    ├─ Share Event → Social Share Modal
    └─ View Organizer Profile → Organizer Profile View
        ↓
Ticket Purchase Flow
    ├─ Guest Checkout (if not signed in)
    ├─ Payment Method Selection
    │   ├─ M-Pesa → Phone Input → Payment Processing
    │   └─ Card → Card Payment Form
    └─ Payment Success → QR Ticket
        ↓
My Tickets Screen
    ├─ View Ticket (QR Code)
    ├─ Download Ticket
    ├─ Transfer Ticket → Transfer Flow
    ├─ Gift Ticket → Gift Flow
    └─ Request Refund → Refund Request
```

### Map Discovery Flow

```
Home Screen
    ↓
Toggle to Map View
    ↓
Map Screen
    ├─ View Events on Map (Clustered)
    ├─ Tap Event Marker → Preview Bottom Sheet
    ├─ Filter Events (overlay)
    └─ "View Details" → Event Detail → Purchase Flow
```

### Guest Checkout Flow

```
Event Detail → Select Tickets
    ↓
Checkout Screen
    ├─ "Continue as Guest" (no account)
    │   └─ Enter Email/Phone → Payment
    └─ "Sign In" → Sign In Screen → Payment
```

### Waitlist Flow

```
Event Detail (Sold Out)
    ↓
"Join Waitlist" Button
    ↓
Waitlist Confirmation
    ↓
Waitlist Screen
    ├─ View Position in Queue
    ├─ Receive Notification (when tickets available)
    └─ "Get Tickets" → Purchase Flow
```

### Ticket Transfer Flow

```
My Tickets → Select Ticket
    ↓
Ticket Detail → "Transfer Ticket"
    ↓
Transfer Screen
    ├─ Search User OR
    └─ Enter Email/Phone
        ↓
Add Optional Message
    ↓
Confirm Transfer
    ↓
Transfer Success → Recipient Notified
```

### Safety Features Flow (Nightlife Events)

```
Event Detail (Nightlife)
    ↓
Safety Section
    ├─ Add Emergency Contacts → Emergency Contacts Screen
    ├─ Safety Check-in → Safety Check-in Screen
    └─ Report Issue → Safety Report Screen
```

### Organizer Flow: Create Event

```
Organizer Dashboard
    ↓
"Create Event" Button
    ↓
Create Event Form
    ├─ Basic Info (title, description, images)
    ├─ Date & Time
    ├─ Location (Venue OR Custom)
    │   ├─ Venue: Select from list OR
    │   └─ Custom: Enter address + map picker
    ├─ Ticket Types & Pricing
    └─ Additional Info
        ↓
Save Event (Draft) OR Publish
    ↓
Events List → View Event → Analytics
```

### Venue Booking Flow

```
Event Organizer Dashboard
    ↓
"Create Event" → "Host at Venue"
    ↓
Venue Selection
    ↓
Create Booking Request
    ├─ Event Details
    ├─ Requested Date/Time
    └─ Estimated Capacity
        ↓
Submit Request
    ↓
Booking Request Status (Pending)
    ↓
[Venue Organizer Side]
    ↓
Venue Dashboard → Booking Requests
    ↓
View Request → Send Quote
    ↓
[Event Organizer Side]
    ↓
Receive Quote → Accept Quote
    ↓
Event Created → Set Up Tickets → Publish
```

### Refund Flow

```
My Tickets → Select Ticket
    ↓
Ticket Detail → "Request Refund"
    ↓
Refund Request Form
    ├─ Select Reason
    ├─ Add Notes
    └─ Submit Request
        ↓
[Organizer Side]
    ↓
Refund Requests → View Request
    ├─ Approve → Refund Processed
    └─ Reject → Add Response
        ↓
[User Side]
    ↓
Refund Status Updated
```

### Social Sharing Flow

```
Event Detail
    ↓
Share Button
    ↓
Social Share Modal
    ├─ Select Platform (Instagram, Snapchat, Locket, etc.)
    ├─ Add Message (optional)
    └─ Share
        ↓
Deep Link Opens App (if installed)
OR
Web Fallback (if app not installed)
```

### Search & Filter Flow

```
Home Screen
    ↓
Search Bar → Enter Query
    ↓
Search Results Screen
    ├─ View Results
    ├─ Apply Filters → Filter Modal
    │   ├─ Date Range
    │   ├─ Price Range
    │   ├─ Event Type
    │   └─ Location
    └─ Sort Results
        ↓
Filtered Results → Event Detail
```

### Organizer Analytics Flow

```
Organizer Dashboard
    ↓
View Analytics (Quick Stats)
    ↓
Analytics Screen
    ├─ Select Event (if multiple)
    ├─ View Charts (Revenue, Sales, Views)
    └─ Export Data
```

### Check-in Flow (Organizer)

```
Organizer Dashboard → Select Event
    ↓
Check-in Screen
    ├─ QR Scanner (camera view)
    │   └─ Scan Ticket QR → Check In
    └─ Manual Entry → Enter Ticket Number
        ↓
Checked-in List
    ├─ View Attendees
    ├─ Search/Filter
    └─ Export List
```

---

## 📱 Responsive Considerations

- **Mobile**: Primary platform (React Native)
- **Tablet**: Scaled layouts, larger cards, side-by-side views where appropriate
- **Future Web**: Desktop-optimized layouts (Phase 2)

---

## 🎯 Key Interactions

1. **Map Clustering**: Automatic when >15-20 markers visible
2. **Bottom Sheets**: Swipeable, dismissible
3. **Pull to Refresh**: On list screens
4. **Infinite Scroll**: Event lists
5. **Swipe Actions**: On tickets (e.g., swipe to transfer)
6. **Haptic Feedback**: On button presses, successful actions

---

## 📋 Wireframe Summary

### User App Screens (Total: 30+ screens)
1. ✅ Loading/Splash Screen (with animated ticket)
2. ✅ Onboarding Flow (4 screens)
3. ✅ Sign In & Forgot Password
4. ✅ Home/Discover (List & Map views)
5. ✅ Search Results
6. ✅ Filter Modal
7. ✅ Event Detail
8. ✅ Social Share Modal
9. ✅ Organizer Profile View
10. ✅ Ticket Purchase Flow (6 screens including guest checkout)
11. ✅ My Tickets (3 screens)
12. ✅ Ticket Transfer & Gift
13. ✅ Refund Request
14. ✅ Favorites
15. ✅ Waitlist
16. ✅ Profile
17. ✅ Settings
18. ✅ Emergency Contacts
19. ✅ Safety Check-in
20. ✅ Safety Report
21. ✅ Error States (4 types)
22. ✅ Loading States (Skeleton loaders)

### Organizer App Screens (Total: 20+ screens)
1. ✅ Onboarding Flow (3 screens)
2. ✅ Dashboard
3. ✅ Events Management
4. ✅ Create/Edit Event
5. ✅ Booking Requests (Venue side)
6. ✅ Create Booking Request (Event Organizer side)
7. ✅ Accept Quote & Create Event
8. ✅ Analytics
9. ✅ Check-in (QR Scanner)
10. ✅ Refund Requests
11. ✅ Profile Management (Event & Venue)
12. ✅ Attendee Management
13. ✅ Settings

### Key Features Documented
- ✅ Map view with clustering (15-20 markers)
- ✅ Social sharing (Instagram, Snapchat, Locket priority)
- ✅ M-Pesa & Stripe payment flows
- ✅ Guest checkout option
- ✅ Ticket transfer & gifting
- ✅ Waitlist system
- ✅ Safety features (nightlife events)
- ✅ Venue booking workflow
- ✅ Theme support (purple default, orange for Halloween)
- ✅ Low-data mode considerations
- ✅ Error handling & loading states

---

## 🚀 Next Steps

1. **Create High-Fidelity Mockups** (Figma/Sketch)
   - Convert wireframes to pixel-perfect designs
   - Add final colors, typography, spacing
   - Create interactive prototypes

2. **Design System Documentation**
   - Component library in Figma
   - Style guide with all colors, fonts, spacing
   - Icon library
   - Animation guidelines

3. **Component Library Setup**
   - React Native component structure
   - Reusable components (Button, Card, Input, etc.)
   - Theme provider setup (purple default, theme overrides)

4. **User Testing**
   - Test wireframes with target users
   - Validate user flows
   - Gather feedback on key screens

5. **Developer Handoff**
   - Export design specs
   - Create component documentation
   - Provide interaction notes
   - Share asset library

6. **Prototype Development**
   - Build clickable prototype (Figma/InVision)
   - Test navigation flows
   - Validate interactions

---

## 📝 Notes for Development

### Priority Implementation Order
1. **Phase 1 (MVP Core)**:
   - Splash screen with animation
   - Onboarding & authentication
   - Home screen (list view)
   - Event detail
   - Basic ticket purchase (M-Pesa only)
   - My tickets

2. **Phase 2 (Discovery)**:
   - Map view with clustering
   - Search & filters
   - Social sharing

3. **Phase 3 (Advanced Features)**:
   - Guest checkout
   - Ticket transfer/gift
   - Waitlist
   - Safety features

4. **Phase 4 (Organizer App)**:
   - Organizer onboarding
   - Event management
   - Analytics
   - Check-in system

### Technical Considerations
- **Animations**: Use React Native Reanimated for smooth animations (splash screen, transitions)
- **Maps**: react-native-maps with clustering library (supercluster)
- **QR Codes**: react-native-qrcode-scanner for check-in
- **Social Sharing**: expo-sharing + platform-specific SDKs
- **Theme System**: Context API or Zustand for theme management
- **Offline Support**: AsyncStorage for tickets, SQLite for event cache

### Accessibility Checklist
- [ ] All touch targets ≥ 44x44px
- [ ] Text contrast ratios meet WCAG AA
- [ ] Screen reader labels for all interactive elements
- [ ] Keyboard navigation support (if applicable)
- [ ] Error messages are clear and actionable
- [ ] Loading states provide feedback

---

## 🎨 Design Assets Needed

1. **Logo**: "plat" in handwritten/script font (white on black)
2. **Icons**: 
   - Tab bar icons (Home, Map, Tickets, Favorites, Profile)
   - Feature icons (Share, Filter, Search, etc.)
   - Event category icons
   - Payment method icons (M-Pesa, Stripe)
3. **Illustrations**: 
   - Empty states
   - Error states
   - Onboarding illustrations
4. **Animations**:
   - Splash screen ticket animation
   - Loading spinners
   - Success animations
5. **Map Markers**: Custom event markers (ticket icon style)

---

## ✅ Completion Status

- [x] User app wireframes (all screens)
- [x] Organizer app wireframes (all screens)
- [x] Error states & loading screens
- [x] User flow diagrams
- [x] Component specifications
- [x] Design system overview
- [ ] High-fidelity mockups (Next step)
- [ ] Interactive prototype (Next step)
- [ ] User testing (Next step)

---

## 💡 RECOMMENDATIONS & ENHANCEMENTS

### 1. **Missing Critical Screens**

#### User App:
- **Search Results Screen**: Dedicated screen after search with filters applied
- **Filter Modal**: Full-screen filter options (date range picker, price slider, event types, distance)
- **Organizer/Venue Profile View**: Public profile page when tapping organizer name
- **Waitlist Screen**: Show waitlisted events with position in queue
- **Ticket Transfer Flow**: Step-by-step transfer process with recipient selection
- **Safety Features Screens**:
  - Emergency Contacts Management
  - Safety Check-in Screen (with timer/reminder)
  - Safety Report Submission
- **Social Share Modal**: Custom share sheet with platform-specific options (Instagram Stories, Snapchat, etc.)
- **Offline Tickets View**: Downloaded tickets accessible offline
- **Settings Screen**: Notification preferences, privacy, account management
- **Loading/Splash Screen**: With animated ticket (as noted in brand identity)

#### Organizer App:
- **Venue Booking Request Creation**: Flow for event organizers to request venue bookings
- **Quote Acceptance Screen**: Event organizer accepting venue quote
- **Event Analytics Detail**: Expanded analytics with charts and insights
- **Attendee List**: View all attendees for an event
- **Profile Management**: Edit organizer/venue profile details
- **Settings**: Account, notifications, payment preferences

### 2. **UX Improvements**

#### Navigation:
- **Consider**: Make Map a separate tab (as planned) OR keep as toggle on Home
  - **Recommendation**: Keep as toggle for MVP (simpler), can separate later if needed
- **Add**: Pull-to-refresh on all list screens
- **Add**: Skeleton loaders instead of blank screens during data fetch

#### Event Discovery:
- **Add**: "Nearby Events" section on Home (even in list view) - shows distance
- **Add**: "Trending Events" or "Popular This Week" section
- **Add**: "Events Ending Soon" (tickets selling fast) urgency indicator
- **Map View Enhancement**: 
  - Add "List View" button that shows events in bottom sheet while map is visible
  - Add distance indicator on event preview cards
  - Add "Directions" button on event preview (opens Maps app)

#### Ticket Purchase:
- **Add**: "Maximum tickets per user" warning before selection
- **Add**: "Almost sold out" indicator on ticket types
- **Add**: Guest checkout option (for users who don't want to create account)
- **M-Pesa Flow**: 
  - Add "Enter Phone Number" step before payment (pre-fill if available)
  - Show M-Pesa STK push notification status
  - Add timeout handling (what if user doesn't complete payment?)
- **Add**: Save payment methods for faster checkout (after first purchase)

#### Ticket Management:
- **Add**: "Add to Calendar" button on ticket detail
- **Add**: "Get Directions" button (opens Maps)
- **Add**: "Event Reminder" toggle (24h, 2h before)
- **Add**: Ticket sharing (share QR code image)

### 3. **Safety Features Integration**

#### Nightlife Events:
- **Event Detail Enhancement**: 
  - Safety badge/indicator for nightlife events
  - "Safety Info" expandable section
  - Quick access to emergency contacts
- **Pre-Event Safety Screen**: 
  - Show before nightlife events
  - Safety tips checklist
  - Emergency contact quick dial
  - "Share My Location" button
- **Post-Event Check-in**: 
  - Reminder notification after event end time
  - "I'm Safe" check-in button
  - Auto-alert to emergency contacts if not checked in after X hours

### 4. **Social Sharing Enhancements**

- **Share Modal Design**:
  - Platform icons in grid (Instagram, Snapchat, Locket, WhatsApp, etc.)
  - Custom share card preview
  - "Copy Link" option
  - "Share to Story" vs "Share to Feed" options (for Instagram)
- **Deep Linking**: 
  - Custom URL scheme (e.g., `plat://event/123`)
  - Fallback to web if app not installed
  - Track referral sources for analytics

### 5. **Payment & Checkout Improvements**

- **Payment Method Selection**:
  - Show saved payment methods first
  - "Add New Payment Method" option
  - M-Pesa phone number saved (if user allows)
- **Order Confirmation**:
  - Email/SMS confirmation screen
  - "Resend Ticket" option
  - "View Receipt" option
- **Refund Flow** (User Side):
  - "Request Refund" screen with reason selection
  - Status tracking ("Pending", "Approved", "Rejected")
  - Refund timeline estimate

### 6. **Accessibility Considerations**

- **Text Sizes**: Ensure minimum 14px for body text (already noted)
- **Touch Targets**: Minimum 44x44px (already noted)
- **Color Contrast**: Ensure WCAG AA compliance (black on white is good)
- **Screen Reader Support**: 
  - Proper labels for all interactive elements
  - Alt text for images
  - Semantic HTML structure
- **Dark Mode**: Consider adding (future enhancement, but plan for it)

### 7. **Performance & Low-Data Mode**

- **Image Optimization**:
  - Lazy loading for event images
  - Progressive image loading (blur-up)
  - Low-res thumbnails in list, high-res on detail
  - WebP format support
- **Low-Data Mode Toggle**:
  - Settings option to enable
  - Disable auto-loading images
  - Text-only event cards option
  - Compressed map tiles
- **Offline Capabilities**:
  - Cache event details for offline viewing
  - Offline ticket storage (already noted)
  - Offline map tiles (limited area)

### 8. **Error States & Edge Cases**

- **Empty States**: Already covered, but ensure all screens have them
- **Error Screens**:
  - Network error (retry button)
  - Payment failure (retry payment, contact support)
  - Event not found (404)
  - Permission denied (location, camera for QR)
- **Loading States**:
  - Skeleton screens for better perceived performance
  - Progress indicators for long operations (payment, image upload)

### 9. **Onboarding Refinements**

- **Skip Options**: Allow skipping non-critical permissions (notifications)
- **Progressive Disclosure**: Don't ask for everything at once
- **Value Proposition**: Show benefits before asking for permissions
- **Social Login**: Add "Sign in with Google/Apple" options (faster signup)

### 10. **Organizer App Specific**

- **Dashboard Enhancements**:
  - Quick stats cards (tap to see details)
  - Revenue trends (sparklines)
  - Upcoming events countdown
- **Event Creation**:
  - Template system (save common event types)
  - Duplicate event option
  - Bulk ticket type creation
- **Booking Requests**:
  - Calendar view of requests
  - Auto-decline expired requests
  - Quote templates for common event types

### 11. **Notifications & Alerts**

- **In-App Notifications**:
  - Notification center/bell icon
  - Unread badge
  - Grouped notifications (e.g., "3 new events near you")
- **Push Notification Preferences**:
  - Granular controls (nearby events, price drops, reminders, etc.)
  - Quiet hours setting
  - Frequency controls

### 12. **Reviews & Ratings**

- **Review Flow** (Post-Event):
  - Prompt after event end time
  - Star rating (1-5)
  - Written review (optional)
  - Photo upload (optional)
  - Separate ratings for: Event, Venue, Organizer
- **Review Display**:
  - Filter by rating
  - Sort by recent/helpful
  - Organizer responses visible

### 13. **Visual Design Refinements**

- **Accent Color**: 
  - Suggest vibrant color for CTAs (e.g., electric blue, purple, or brand-specific)
  - Use sparingly for emphasis (notifications, urgent actions)
- **Micro-interactions**:
  - Button press animations
  - Card tap feedback
  - Swipe gestures (tickets, events)
  - Pull-to-refresh animation
- **Animations**:
  - Smooth transitions between screens
  - Loading animations (skeleton screens)
  - Success animations (checkmark, confetti for ticket purchase)

### 14. **Technical Considerations**

- **Deep Linking**: Plan URL structure early
- **Analytics**: Track key user actions (event views, ticket purchases, map usage)
- **A/B Testing**: Plan for testing different UI variations
- **Internationalization**: Plan for multi-language support (even if English-only for MVP)

### 15. **Missing User Flows**

- **Sign In Flow**: Separate from signup
- **Password Reset**: Forgot password flow
- **Profile Editing**: Edit user profile details
- **Delete Account**: Account deletion flow
- **Report Event**: Report inappropriate events
- **Contact Support**: Help/contact screen

---

## ✅ Priority Recommendations (Must-Have for MVP)

1. **Loading/Splash Screen** with animated ticket (as you noted)
2. **Search Results Screen** (dedicated screen)
3. **Filter Modal** (comprehensive filtering)
4. **Safety Features Screens** (emergency contacts, check-in)
5. **Social Share Modal** (platform-specific sharing)
6. **M-Pesa Phone Number Input** (before payment)
7. **Error States** (network, payment failures)
8. **Skeleton Loaders** (better perceived performance)
9. **Sign In Flow** (separate from signup)
10. **Organizer Profile View** (public profile pages)

---

## 🎯 Questions to Resolve - ANSWERED

1. **Map Tab vs Toggle**: ✅ **Toggle on Home** (confirmed)
2. **Guest Checkout**: ✅ **Yes, allow purchases without account** (require email/phone)
3. **Social Login**: ✅ **Include Google/Apple sign-in**
4. **Dark Mode**: ❌ Not in MVP (Phase 2)
5. **Event Categories**: Predefined list or free-form tags? (Need to decide)
6. **Currency Display**: Always show KES, or auto-detect? (Recommendation: KES primary, USD option)
7. **Accent Color**: ✅ **Purple by default, changes with theme** (e.g., orange for Halloween)
