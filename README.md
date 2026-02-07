# T-Plat - Nightlife & Event Ticketing Platform

A comprehensive platform for discovering, attending, and engaging with nightlife events globally, featuring ticketing, social features, and event advertising.

## 🎯 Project Overview

T-Plat is a mobile-first ticketing platform that connects event organizers, venue organizers, and event-goers. Built with a focus on the Nairobi/African market, featuring M-Pesa integration and location-based event discovery.

## 📁 Project Structure

```
t-plat/
├── backend/              # NestJS API backend
│   ├── src/              # Source code
│   └── scripts/          # DB/setup scripts
├── mobile/                # React Native app (Expo)
│   └── src/              # App source code
├── database/             # Database schema
├── docs/                  # Planning & docs (MVP, Docker, etc.)
├── mockups/               # UI/UX HTML mockups
├── start-backend.sh       # Start backend via Docker
├── start-backend-dev.sh   # Start Nest in dev mode (from root)
└── README.md
```

## 🚀 Quick Start

### Option A: Docker (recommended)

```bash
./start-backend.sh          # Postgres + Redis + API
cd mobile && ./start-expo.sh   # Expo/Metro
```

See [docs/DOCKER.md](docs/DOCKER.md) for details and troubleshooting.

### Option B: Local backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env (DB, JWT, etc.). See backend/README.md and backend/SETUP.md
npm run start:dev
```

Backend: `http://localhost:3000` · API docs: `http://localhost:3000/api/docs`

### Mobile app

```bash
cd mobile
npm install
npm start
```

## 🏗️ Technology Stack

### Backend

- **NestJS** (Node.js + TypeScript)
- **PostgreSQL** + **TypeORM**
- **JWT** Authentication
- **Stripe** + **M-Pesa** (Payments)
- **Firebase Cloud Messaging** (Push notifications)
- **Cloudinary** (Image storage)

### Mobile

- **React Native** (Expo)
- **React Navigation**
- **Zustand** (State management)
- **React Native Maps**
- **React Native Share** (Social sharing)

## 📋 Key Features

### MVP Features

- ✅ Multi-role user system (User + Event Organizer + Venue Organizer)
- ✅ Event management (direct posting + venue booking requests)
- ✅ Map view with nearby events (priority)
- ✅ Ticketing system (M-Pesa + Stripe)
- ✅ Push notifications
- ✅ Favorites/Wishlist
- ✅ Ticket transfer/gift
- ✅ Waitlist system
- ✅ Offline ticket viewing
- ✅ Reviews & ratings
- ✅ Safety features
- ✅ Social sharing (Instagram, Snapchat, Locket priority)

## 📚 Documentation

- [docs/DOCKER.md](docs/DOCKER.md) – Running with Docker and troubleshooting
- [docs/MVP_PLAN.md](docs/MVP_PLAN.md) – MVP feature plan
- [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) – Development roadmap
- [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md) – Project overview
- [docs/FEATURE_SUMMARY.md](docs/FEATURE_SUMMARY.md) – Feature list
- [docs/UI_UX_WIREFRAMES.md](docs/UI_UX_WIREFRAMES.md) – Design mockups
- [backend/README.md](backend/README.md) – Backend setup
- [backend/SETUP.md](backend/SETUP.md) – Backend setup guide
- [mobile/README.md](mobile/README.md) – Mobile app

## 🔐 Environment Variables

### Backend

See `backend/.env.example` for all required environment variables.

### Mobile

Update API base URL in `mobile/src/services/api.ts`.

## 📅 Development Timeline

**11-12 weeks** for MVP:

- Week 1-2: Foundation
- Week 3-4: Event management
- Week 5-6: Ticketing & payments
- Week 7: Check-in & ticket management
- Week 8: Push notifications & social
- Week 9: Safety features & reviews
- Week 10: Advertising & analytics
- Week 11-12: Testing & launch prep

## 🤝 Contributing

This is a private project. Please follow the coding standards and commit conventions.

## 📝 License

Private - T-Plat Team

---

**Status**: 🚧 In Development
