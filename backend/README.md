# T-Plat Backend API

NestJS backend API for the T-Plat nightlife and event ticketing platform.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - Database credentials
   - JWT secrets
   - API keys (Stripe, M-Pesa, Cloudinary, etc.)

4. Set up the database:

```bash
# Create database
createdb t_plat

# Run migrations (once migrations are created)
npm run migration:run
```

5. Start the development server (from the **backend** directory):

```bash
cd backend
npm run start:dev
```

**Note:** Use `npm run start:dev` only (do not run `nest start --watch` directly), so `tsconfig.json` is found. Do **not** use `npm run start:prod` unless you have run `npm run build` first.

The API will be available at `http://localhost:3000`
API Documentation (Swagger) at `http://localhost:3000/api/docs`

## 📁 Project Structure

```
backend/
├── src/
│   ├── common/           # Shared utilities, guards, interceptors
│   ├── config/           # Configuration files (TypeORM, etc.)
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── organizers/   # Organizer profiles
│   │   ├── events/       # Event management
│   │   ├── tickets/      # Ticket management
│   │   ├── payments/     # Payment processing (M-Pesa + Stripe)
│   │   ├── notifications/# Push notifications
│   │   ├── reviews/      # Reviews & ratings
│   │   └── safety/       # Safety features
│   ├── migrations/       # Database migrations
│   ├── app.module.ts     # Root module
│   └── main.ts           # Application entry point
├── test/                 # E2E tests
├── .env.example          # Environment variables template
└── package.json
```

## 🔧 Available Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run seed:events` - Seed dummy events (featured, sponsored, banner) for testing

## Seeding dummy events

From the backend directory, ensure the DB is running and (if you use migrations) run migrations, then:

```bash
npm run seed:events
```

This creates a test user (`seed-organizer@t-plat.test` / `SeedPass123!`), a seed organizer, and several dummy events including:

- **Featured events** – top of listings, highlighted
- **Sponsored events** – paid placements (e.g. sponsor name, optional banner)
- **Banner ads** – events with `bannerImageUrl` for ad display

Use `GET /api/v1/events/featured` and `GET /api/v1/events/sponsored` to list them. Payment for advertising campaigns is planned as a separate flow (see MVP plan).

## 📚 API Documentation

Swagger documentation is available at `/api/docs` when the server is running.

## 🔐 Authentication

The API uses JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## 🗄️ Database

PostgreSQL is used as the primary database. TypeORM is used for database operations and migrations.

## 📦 Key Dependencies

- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Stripe** - Payment processing (card payments)
- **M-Pesa** - Payment processing (mobile money - Kenya)
- **Firebase Admin** - Push notifications
- **Cloudinary** - Image storage and optimization
- **Swagger** - API documentation

## 🌍 Environment Variables

See `.env.example` for all required environment variables.

## 🐛 Troubleshooting

- **`Cannot find module '.../dist/main'`** – You ran `npm run start:prod` without building. For local dev use `npm run start:dev`. For production, run `npm run build` then `npm run start:prod`.
- **`EADDRINUSE: address already in use :::3000`** – Port 3000 is in use. Free it: `lsof -ti:3000 | xargs kill -9` (macOS/Linux), then start the server again.

## 📝 License

Private - T-Plat Team
