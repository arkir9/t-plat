# T-Plat Mobile App

React Native mobile application for the T-Plat nightlife and event ticketing platform.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

5. Run on Web:
```bash
npm run web
```

### Could not connect to development server

- **Physical phone:** `npm start` now sets the packager to your Mac's LAN IP so the phone can reach Metro. In Expo Go, tap "Enter URL manually" and use `exp://YOUR_MAC_IP:8081` (the terminal shows the IP when you run `npm start`).
- **Still failing:** Run `npm run start:tunnel` and use the tunnel URL in Expo Go (works across networks).
- **iOS Simulator:** Use `exp://127.0.0.1:8081` in Expo Go, or run `npm run ios` after `npm start`.

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── home/         # Home screen
│   │   ├── map/          # Map view screen
│   │   ├── tickets/      # Tickets screen
│   │   └── profile/      # Profile screen
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API services
│   ├── store/            # State management (Zustand)
│   ├── contexts/         # React contexts
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, etc.
├── App.tsx               # Root component
├── app.json              # Expo configuration
└── package.json
```

## 🔧 Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 📱 Features

### Implemented (Basic Structure)
- ✅ Navigation setup (Stack + Tab navigators)
- ✅ Authentication state management
- ✅ API service with token refresh
- ✅ Basic screen placeholders
- ✅ Map integration (React Native Maps)

### To Be Implemented
- [ ] Event discovery (list view)
- [ ] Map view with nearby events
- [ ] Event details screen
- [ ] Ticket purchase flow
- [ ] QR code scanning
- [ ] Push notifications
- [ ] Social sharing
- [ ] Offline ticket storage
- [ ] Favorites/Wishlist
- [ ] Reviews & ratings
- [ ] Safety features

## 🔐 Authentication

The app uses JWT authentication with refresh tokens. Tokens are stored securely using AsyncStorage with Zustand persistence.

## 🗺️ Map Features

- React Native Maps integration
- Location services (Expo Location)
- Map clustering for events
- Custom markers
- Nearby events display

## 📦 Key Dependencies

- **Expo** - Development platform
- **React Navigation** - Navigation library
- **Zustand** - State management
- **Axios** - HTTP client
- **React Native Maps** - Map component
- **React Native Share** - Social sharing
- **Expo Notifications** - Push notifications
- **Expo Camera** - QR code scanning

## 🌍 Environment Configuration

Update API base URL in `src/services/api.ts`:
- Development: `http://localhost:3000/api`
- Production: `https://api.tplat.com/api`

## 📝 License

Private - T-Plat Team
