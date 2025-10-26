# Wine Cellar - Deployment Guide

This guide walks you through deploying the Wine Cellar application to production using Vercel and Supabase.

## Prerequisites

- GitHub repository set up
- Vercel account (free tier works)
- Supabase project created
- OpenAI API key

## Step 1: Set up Supabase Production Database

1. Go to [Supabase](https://supabase.com) and create a new project (or use existing)
2. Wait for the database to be provisioned
3. Go to **Project Settings > Database**
4. Copy your **Connection String** (in "URI" format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
5. Go to **Project Settings > API**
6. Copy these values:
   - **Project URL** (e.g., `https://[PROJECT-REF].supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### Set up Storage Bucket

1. In Supabase, go to **Storage**
2. Create a new bucket named `wine-labels`
3. Make it **Public** (or configure RLS policies as needed)
4. The bucket is now ready for label image uploads

## Step 2: Deploy to Vercel

### Initial Setup

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **Add New... > Project**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (leave default)

### Environment Variables in Vercel

Add these environment variables in Vercel:

```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-vercel-domain.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI
OPENAI_API_KEY=sk-your-openai-key-here

# Google OAuth (optional, for future)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

4. Click **Deploy**
5. Wait for initial deployment to complete

### Get Vercel Credentials for GitHub Actions

1. In Vercel, go to **Settings > Tokens**
2. Create a new token with name `GitHub Actions` - copy this token
3. Go to your project **Settings > General**
4. Copy **Project ID** and **Team/Org ID**

## Step 3: Configure GitHub Secrets

Go to your GitHub repository **Settings > Secrets and variables > Actions** and add these secrets:

### Required Secrets

| Secret Name | Description | Where to get it |
|-------------|-------------|----------------|
| `DATABASE_URL` | Production database connection string | Supabase Project Settings > Database |
| `NEXTAUTH_SECRET` | NextAuth secret key | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL | Your Vercel deployment URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Project Settings > API |
| `OPENAI_API_KEY` | OpenAI API key | OpenAI dashboard |
| `VERCEL_TOKEN` | Vercel deployment token | Vercel Settings > Tokens |
| `VERCEL_ORG_ID` | Your Vercel org/team ID | Vercel Project Settings > General |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Vercel Project Settings > General |

### Steps to Add Secrets

1. Click **New repository secret**
2. Add name and value
3. Click **Add secret**
4. Repeat for all secrets above

## Step 4: Run Database Migrations

The GitHub Actions workflow will automatically run migrations when you push to `main`. However, for the first deployment:

### Option A: Run migrations locally against production

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Option B: Run migrations from Vercel

1. Go to your Vercel project
2. Go to **Settings > General > Build & Development Settings**
3. Under **Build Command**, add:
   ```bash
   npx prisma migrate deploy && npx prisma generate && npm run build
   ```
4. Redeploy

### Option C: Let GitHub Actions handle it

Just push to `main` branch and the workflow will run migrations automatically.

## Step 5: Verify Deployment

1. Push to `main` branch
2. Go to **Actions** tab in GitHub
3. Watch the workflow run:
   - ✅ Build and Test
   - ✅ Run Database Migrations
   - ✅ Deploy to Vercel
4. Once complete, visit your Vercel URL
5. Test key features:
   - User registration
   - Login
   - Add bottle (manual entry)
   - Add bottle (label scan)
   - View cellar
   - View dashboard

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs automatically on:

- **Pull Requests**: Runs build and tests (no deployment)
- **Push to main**: Runs full pipeline:
  1. Build and type check
  2. Run Prisma migrations against production DB
  3. Deploy to Vercel production

### Workflow Jobs

1. **build-and-test**
   - Installs dependencies
   - Generates Prisma client
   - Runs TypeScript type checking
   - Runs production build

2. **migrate-database** (main branch only)
   - Runs Prisma migrations against production
   - Ensures database schema is up to date

3. **deploy** (main branch only)
   - Deploys to Vercel using Vercel CLI
   - Uses prebuilt artifacts for faster deployment

## Troubleshooting

### Build Fails on Vercel

1. Check environment variables are set correctly
2. Look at build logs in Vercel dashboard
3. Verify `DATABASE_URL` is accessible from Vercel

### Database Connection Issues

1. Verify `DATABASE_URL` format is correct
2. Check Supabase project is not paused
3. Verify password and connection string match

### Prisma Migration Fails

1. Check `DATABASE_URL` secret is set correctly in GitHub
2. Manually run migrations from local machine
3. Check Supabase logs for connection issues

### Images Not Uploading

1. Verify `wine-labels` bucket exists in Supabase Storage
2. Check bucket is public or RLS policies are configured
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### OpenAI API Errors

1. Verify `OPENAI_API_KEY` is valid
2. Check you have credits in OpenAI account
3. Verify API key has correct permissions

## Local Development

To run locally against production database (not recommended):

```bash
# Copy .env.example to .env
cp .env.example .env

# Add your production credentials to .env
# Then run:
npm run dev
```

**Better approach**: Use local Supabase or separate development database.

## Monitoring

### Vercel Logs
- Go to **Deployments** in Vercel
- Click on a deployment to see logs
- Check **Functions** tab for runtime logs

### Supabase Logs
- Go to **Logs** in Supabase dashboard
- Filter by service (Postgres, Storage, etc.)
- Look for errors or slow queries

### GitHub Actions
- Go to **Actions** tab in GitHub repo
- View workflow runs
- Download logs for debugging

## Security Checklist

- [ ] All secrets are stored in GitHub Secrets (not in code)
- [ ] `NEXTAUTH_SECRET` is randomly generated
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret
- [ ] Database has proper indexes (check Prisma schema)
- [ ] Supabase Storage bucket has appropriate access policies
- [ ] Production URL uses HTTPS
- [ ] Environment variables are set in Vercel
- [ ] `.env` is in `.gitignore`

## Cost Optimization

### Vercel (Free Tier Limits)
- 100 GB bandwidth/month
- 100 hours serverless function execution
- 6000 serverless function minutes

### Supabase (Free Tier Limits)
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth

### OpenAI (Pay as you go)
- GPT-4o Vision: ~$0.01 per label scan
- GPT-4o-mini: ~$0.0001 per knowledge query
- Monitor usage in OpenAI dashboard

## Next Steps

1. Set up custom domain in Vercel (optional)
2. Configure Google OAuth (optional)
3. Set up monitoring/alerts
4. Configure database backups in Supabase
5. Add performance monitoring (Vercel Analytics)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check GitHub Actions workflow logs
3. Check Supabase dashboard for database/storage issues
4. Review this guide for common troubleshooting steps
