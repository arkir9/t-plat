# T-Plat Database Setup Script (PowerShell)
# This script creates the database and runs migrations

Write-Host "🗄️  T-Plat Database Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env file
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please run 'npm run setup:env' first" -ForegroundColor Yellow
    exit 1
}

# Read .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

# Database connection details
$DB_HOST = if ($DB_HOST) { $DB_HOST } else { "localhost" }
$DB_PORT = if ($DB_PORT) { $DB_PORT } else { "5432" }
$DB_USERNAME = if ($DB_USERNAME) { $DB_USERNAME } else { "postgres" }
$DB_NAME = if ($DB_DATABASE) { $DB_DATABASE } else { "t_plat" }

Write-Host "📊 Database Configuration:" -ForegroundColor Yellow
Write-Host "   Host: $DB_HOST"
Write-Host "   Port: $DB_PORT"
Write-Host "   Username: $DB_USERNAME"
Write-Host "   Database: $DB_NAME"
Write-Host ""

# Check if psql is available
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: psql command not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools" -ForegroundColor Yellow
    exit 1
}

# Prompt for password if not in environment
if (-not $DB_PASSWORD) {
    $securePassword = Read-Host "Database Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DB_PASSWORD

# Check if database exists
Write-Host "🔍 Checking if database exists..." -ForegroundColor Yellow
$dbList = psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -lqt 2>&1
$dbExists = $dbList -match "\s+$DB_NAME\s+"

if (-not $dbExists) {
    Write-Host "📦 Creating database: $DB_NAME" -ForegroundColor Yellow
    $createDbCommand = "CREATE DATABASE $DB_NAME;"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -c $createDbCommand 2>&1 | Out-Null
    Write-Host "✅ Database created successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Database already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Running database schema..." -ForegroundColor Yellow
Write-Host ""

# Run the schema SQL file
$schemaFile = "../database-schema.sql"
if (-not (Test-Path $schemaFile)) {
    $schemaFile = "database-schema.sql"
}

if (Test-Path $schemaFile) {
    Write-Host "Executing schema from $schemaFile..." -ForegroundColor Yellow
    psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -f $schemaFile 2>&1 | Out-Null
    Write-Host "✅ Schema executed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: database-schema.sql file not found" -ForegroundColor Yellow
    Write-Host "Please ensure the schema file is in the project root" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "--------------"
Write-Host "1. Verify database connection:"
Write-Host "   npm run start:dev"
Write-Host ""
Write-Host "2. Check database tables:"
Write-Host "   psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -c '\dt'"
Write-Host ""
