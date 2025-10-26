# Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Supabase Setup
- [ ] Supabase project created
- [ ] Database is active (not paused)
- [ ] Connection string (DATABASE_URL) copied
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] Service role key copied (keep secret!)
- [ ] Storage bucket `wine-labels` created
- [ ] Storage bucket set to public

### Vercel Setup
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] All environment variables added in Vercel:
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_SECRET (generate with: `openssl rand -base64 32`)
  - [ ] NEXTAUTH_URL (your Vercel URL)
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] OPENAI_API_KEY
- [ ] Initial deployment successful
- [ ] Vercel deployment token created
- [ ] Vercel Project ID copied
- [ ] Vercel Org ID copied

### GitHub Setup
- [ ] Repository pushed to GitHub
- [ ] All GitHub Secrets added:
  - [ ] DATABASE_URL
  - [ ] NEXTAUTH_SECRET
  - [ ] NEXTAUTH_URL
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] OPENAI_API_KEY
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_PROJECT_ID

## Database Migration

Choose one method:

### Method A: Automatic (Recommended)
- [ ] Push to main branch
- [ ] GitHub Actions workflow runs successfully
- [ ] Migrations applied automatically

### Method B: Manual from Local
```bash
export DATABASE_URL="your-production-database-url"
npx prisma migrate deploy
npx prisma generate
```
- [ ] Migrations run successfully
- [ ] No errors in output

### Method C: Vercel Build Command
- [ ] Update Vercel build command to: `npx prisma migrate deploy && npx prisma generate && npm run build`
- [ ] Trigger redeploy

## First Deployment

- [ ] Push changes to main branch
- [ ] GitHub Actions workflow triggered
- [ ] Build and Test job passes
- [ ] Database Migration job passes
- [ ] Deploy job passes
- [ ] Vercel deployment successful

## Post-Deployment Testing

### Authentication
- [ ] Can access production URL
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Can logout

### Core Features
- [ ] Dashboard loads correctly
- [ ] Can navigate to Cellar view
- [ ] Can add bottle manually
  - [ ] Autocomplete works for producer
  - [ ] Autocomplete works for wine name
  - [ ] Auto-fill works when selecting existing wine
  - [ ] Can save bottle successfully
- [ ] Can add bottle via label scan
  - [ ] Can upload image
  - [ ] OpenAI extracts data
  - [ ] Can review/edit extracted data
  - [ ] Can save scanned bottle
- [ ] Can view bottle details
- [ ] Can edit bottle
- [ ] Can delete bottle
- [ ] Can mark bottle as consumed

### Image Upload
- [ ] Label images upload successfully
- [ ] Images display correctly in bottle list
- [ ] Images display correctly in bottle detail
- [ ] Primary wine images display as fallback

### Data Integrity
- [ ] Autocomplete finds existing wines
- [ ] No duplicate wines created
- [ ] Backend fallback matching works
- [ ] Database queries are fast

## Monitoring Setup

- [ ] Check Vercel deployment logs
- [ ] Check Vercel function logs
- [ ] Check Supabase database logs
- [ ] Check Supabase storage logs
- [ ] Monitor GitHub Actions runs

## Optional Enhancements

- [ ] Set up custom domain in Vercel
- [ ] Enable Vercel Analytics
- [ ] Set up error monitoring (Sentry)
- [ ] Configure database backups in Supabase
- [ ] Set up uptime monitoring
- [ ] Configure Google OAuth (future)

## Troubleshooting

If deployment fails, check:

1. **GitHub Actions Logs**
   - Go to Actions tab
   - Click on failed workflow
   - Review logs for each job

2. **Vercel Logs**
   - Go to Vercel dashboard
   - Click on deployment
   - Review build and runtime logs

3. **Supabase Status**
   - Check database is not paused
   - Verify connection string is correct
   - Check storage bucket exists

4. **Environment Variables**
   - Verify all secrets are set in GitHub
   - Verify all env vars are set in Vercel
   - Check for typos in variable names

## Rollback Plan

If production has issues:

1. **Revert Code**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Or Rollback in Vercel**
   - Go to Vercel dashboard
   - Go to Deployments
   - Find previous working deployment
   - Click "..." and select "Promote to Production"

3. **Database Rollback**
   - If needed, restore from Supabase backup
   - Or run migration rollback locally

## Success Criteria

✅ All checklist items completed
✅ No errors in logs
✅ All core features working
✅ Images uploading and displaying
✅ Database queries performing well
✅ No duplicate wines being created
✅ Users can register and login

## Support Resources

- **Deployment Guide**: See `DEPLOYMENT.md`
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **GitHub Actions Docs**: https://docs.github.com/en/actions
