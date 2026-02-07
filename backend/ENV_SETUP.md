# Environment Files Setup

## 🚀 Quick Setup

Since `.env` files are protected, run this command to create them automatically:

```bash
npm run create:env
```

This will:
- ✅ Create `.env.example` file (for reference)
- ✅ Create `.env` file with **generated JWT secrets**
- ✅ Set up all required environment variables

## 📝 Manual Setup

If you prefer to create them manually:

### Step 1: Create `.env.example`

```bash
# The template is already created as env.example
# Just rename it:
mv env.example .env.example
```

### Step 2: Create `.env`

```bash
# Copy from example
cp .env.example .env
```

### Step 3: Generate JWT Secrets

```bash
# Generate secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

Copy the generated secrets to your `.env` file.

### Step 4: Update Database Credentials

Edit `.env` and update:
```env
DB_PASSWORD=your_postgres_password
DB_DATABASE=t_plat
```

## ✅ Generated JWT Secrets

I've generated these secrets for you:
- **JWT_SECRET**: `cUFfwGaMv4YierO02TAtsiiFm3x/OJsTT1oFIdFL50U=`
- **JWT_REFRESH_SECRET**: `NbjTg5mh2P40DNjwCYvtlaQmgC7mklfna5lOaOrSwi0=`

Add these to your `.env` file when you create it.

## 📋 Required Updates in `.env`

After creating `.env`, update these with your actual credentials:

1. **Database**:
   - `DB_PASSWORD` - Your PostgreSQL password
   - `DB_DATABASE` - Database name (default: `t_plat`)

2. **API Keys** (for full functionality):
   - `STRIPE_SECRET_KEY` - From Stripe Dashboard
   - `MPESA_CONSUMER_KEY` & `MPESA_CONSUMER_SECRET` - From Safaricom
   - `CLOUDINARY_*` - From Cloudinary
   - `FIREBASE_*` - From Firebase Console
   - `GOOGLE_MAPS_API_KEY` - From Google Cloud Console

## 🔐 Security Note

- ✅ `.env` is in `.gitignore` (never committed)
- ✅ `.env.example` is safe to commit (no real secrets)
- ✅ JWT secrets are randomly generated
- ⚠️ **Never commit your `.env` file!**

---

**Quick Start**: Just run `npm run create:env` and you're done! 🚀
