# T-Plat Backend Setup Guide

This guide will help you set up the T-Plat backend development environment.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** package manager
- **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

#### macOS / Linux:

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (interactive script)
npm run setup:env

# 3. Set up database
npm run db:setup

# 4. Verify environment
npm run check:env

# 5. Start development server
npm run start:dev
```

#### Windows (PowerShell):

```powershell
# 1. Install dependencies
npm install

# 2. Set up environment variables
npm run setup:env:win

# 3. Set up database
npm run db:setup:win

# 4. Verify environment
npm run check:env

# 5. Start development server
npm run start:dev
```

### Option 2: Manual Setup

#### Step 1: Install Dependencies

```bash
npm install
```

#### Step 2: Create Environment File

```bash
# Copy the example file
cp .env.example .env
```

#### Step 3: Configure Environment Variables

Edit `.env` file and update the following:

**Database Configuration:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=t_plat
```

**Security (Generate new secrets):**
```env
JWT_SECRET=your_random_secret_key_here
JWT_REFRESH_SECRET=your_random_refresh_secret_here
```

You can generate random secrets using:
```bash
# Using openssl
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Optional API Keys:**
- `STRIPE_SECRET_KEY` - Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- `MPESA_CONSUMER_KEY` & `MPESA_CONSUMER_SECRET` - From Safaricom Daraja
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - From [Cloudinary](https://cloudinary.com/)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` - From [Firebase Console](https://console.firebase.google.com/)
- `GOOGLE_MAPS_API_KEY` - From [Google Cloud Console](https://console.cloud.google.com/)

#### Step 4: Create PostgreSQL Database

**Using psql command line:**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE t_plat;

# Exit psql
\q
```

**Or using npm script:**
```bash
npm run db:create
```

#### Step 5: Run Database Schema

**Option A: Using npm script (reads from .env):**
```bash
npm run db:schema
```

**Option B: Using psql directly:**
```bash
psql -h localhost -p 5432 -U postgres -d t_plat -f ../database-schema.sql
```

#### Step 6: Verify Setup

Check if all environment variables are set:
```bash
npm run check:env
```

#### Step 7: Start Development Server

```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## 🔍 Verify Installation

### Check Database Connection

```bash
# Using psql
psql -h localhost -p 5432 -U postgres -d t_plat -c "\dt"

# Should show all tables from the schema
```

### Check API Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

### Test API Endpoints

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## 🐛 Troubleshooting

### Database Connection Issues

**Error: `FATAL: password authentication failed`**
- Verify your PostgreSQL password in `.env`
- Check if PostgreSQL is running: `pg_isready`

**Error: `FATAL: database "t_plat" does not exist`**
- Create the database: `npm run db:create`
- Or manually: `createdb t_plat`

**Error: `permission denied for database`**
- Ensure your PostgreSQL user has necessary permissions
- Try: `psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE t_plat TO your_username;"`

### Port Already in Use

**Error: `EADDRINUSE: address already in use :::3000`**
- Change PORT in `.env` file
- Or kill the process using port 3000:
  ```bash
  # macOS/Linux
  lsof -ti:3000 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### Environment Variables Not Loading

- Ensure `.env` file is in the `backend/` directory
- Check file permissions: `ls -la .env`
- Verify no syntax errors in `.env` file

### Schema Execution Errors

**Error: `relation already exists`**
- This is normal if schema was already run
- To reset: `npm run db:drop` then `npm run db:schema`

**Error: `permission denied`**
- Ensure you have proper PostgreSQL permissions
- Try running as superuser or with proper grants

## 📝 Next Steps

After setup is complete:

1. **Explore API Documentation**: Visit http://localhost:3000/api/docs
2. **Run Tests**: `npm test`
3. **Check Database**: Verify tables were created correctly
4. **Start Development**: Begin implementing features!

## 🔐 Security Notes

- **Never commit `.env` file** to version control
- **Use strong JWT secrets** in production
- **Change default passwords** in production
- **Enable SSL** for database connections in production
- **Use environment-specific** `.env` files (`.env.production`, etc.)

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify all prerequisites are installed
3. Check logs for detailed error messages
4. Review the database schema file

---

**Happy Coding! 🚀**
