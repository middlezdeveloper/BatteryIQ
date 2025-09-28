# Supabase Setup Guide for BatteryIQ

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the details:
   - **Project Name**: BatteryIQ
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to Australia (ap-southeast-1 Singapore)
4. Click "Create new project"

## 2. Get Your Environment Variables

Once your project is created:

1. Go to **Settings** > **API**
2. Copy the following values:

### Project URL
- Copy the "Project URL"
- Add to `.env` as: `NEXT_PUBLIC_SUPABASE_URL="your-url-here"`

### API Keys
- Copy the "anon public" key
- Add to `.env` as: `NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key-here"`

### Database URL
1. Go to **Settings** > **Database**
2. Copy the "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your actual database password
4. Add to `.env` as: `DATABASE_URL="your-connection-string-here"`

## 3. Run Database Migration

After updating your `.env` file:

```bash
# Generate Prisma client
npx prisma generate

# Run database migration to create tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your data
npx prisma studio
```

## 4. Seed Initial Data

We'll create seed scripts to populate:
- Australian postcodes and solar zones
- Federal and state rebate programs
- Popular battery models
- Energy retailer plans

## 5. Test Connection

Run the development server:
```bash
npm run dev
```

The application should connect to your Supabase database successfully!

## Supabase Features We'll Use

- **Database**: PostgreSQL with our Prisma schema
- **Auth**: User authentication for saving calculations
- **Real-time**: Live rebate updates and grid data
- **Storage**: For uploaded energy bills and documents
- **Edge Functions**: For complex calculations and API integrations

## Security Notes

- Never commit your `.env` file
- Use Row Level Security (RLS) for data protection
- The anon key is safe for frontend use
- Service role key (if needed) should be server-side only