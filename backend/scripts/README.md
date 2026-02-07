# Setup Scripts

This directory contains helper scripts for setting up the T-Plat backend.

## 📜 Available Scripts

### Environment Setup

#### `setup-env.sh` (macOS/Linux)
Interactive script to create and configure `.env` file.

**Usage:**
```bash
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh
```

**Or via npm:**
```bash
npm run setup:env
```

**What it does:**
- Copies `.env.example` to `.env`
- Prompts for database configuration
- Generates random JWT secrets
- Updates `.env` file with values

---

#### `setup-env.ps1` (Windows PowerShell)
Windows version of the environment setup script.

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1
```

**Or via npm:**
```bash
npm run setup:env:win
```

---

### Database Setup

#### `setup-db.sh` (macOS/Linux)
Creates PostgreSQL database and runs schema.

**Usage:**
```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

**Or via npm:**
```bash
npm run db:setup
```

**What it does:**
- Checks if database exists
- Creates database if it doesn't exist
- Runs `database-schema.sql` file
- Verifies setup

**Prerequisites:**
- `.env` file must exist (run `setup-env.sh` first)
- PostgreSQL must be installed and running
- `psql` command must be available in PATH

---

#### `setup-db.ps1` (Windows PowerShell)
Windows version of the database setup script.

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-db.ps1
```

**Or via npm:**
```bash
npm run db:setup:win
```

---

### Environment Check

#### `check-env.sh` (macOS/Linux)
Verifies all required environment variables are set.

**Usage:**
```bash
chmod +x scripts/check-env.sh
./scripts/check-env.sh
```

**Or via npm:**
```bash
npm run check:env
```

**What it does:**
- Checks if `.env` file exists
- Verifies all required variables are set
- Lists optional variables status
- Exits with error code if variables are missing

---

## 🔧 Manual Database Commands

If you prefer to run commands manually:

### Create Database
```bash
psql -U postgres -c "CREATE DATABASE t_plat;"
```

### Run Schema
```bash
psql -U postgres -d t_plat -f ../database-schema.sql
```

### Drop Database (if needed)
```bash
psql -U postgres -c "DROP DATABASE IF EXISTS t_plat;"
```

### Check Tables
```bash
psql -U postgres -d t_plat -c "\dt"
```

## 📝 Notes

- All scripts require appropriate permissions (chmod +x for bash scripts)
- Windows scripts require PowerShell execution policy to allow scripts
- Database scripts require PostgreSQL to be installed and accessible
- Environment variables are read from `.env` file

## 🐛 Troubleshooting

### Permission Denied (macOS/Linux)
```bash
chmod +x scripts/*.sh
```

### PowerShell Execution Policy (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### psql Not Found
- Ensure PostgreSQL client tools are installed
- Add PostgreSQL bin directory to PATH
- Or use full path to psql executable
