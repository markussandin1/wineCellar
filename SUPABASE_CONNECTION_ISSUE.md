# Supabase Connection Pooler Issue - Technical Report

## Environment
- **Project**: Wine Cellar (Next.js 15 + Prisma 6.18.0)
- **Supabase Project ID**: `pktiwlfxgfkkqxzhtaxe`
- **Region**: eu-west-1
- **Database**: PostgreSQL 17.6.1.025
- **Deployment**: Vercel (serverless functions)
- **Database Status**: ACTIVE_HEALTHY

## Problem Statement
Unable to establish database connection from Vercel deployment to Supabase PostgreSQL database. Both direct connections and Supabase connection pooler attempts fail with authentication errors.

## Error Details

### Direct Connection Attempt
**Connection String Format:**
```
postgresql://postgres:56HCAOeJO8hC62fR@db.pktiwlfxgfkkqxzhtaxe.supabase.co:5432/postgres
```

**Error:**
```
Can't reach database server at `db.pktiwlfxgfkkqxzhtaxe.supabase.co:5432`
```

**Analysis:** Vercel cannot reach the database directly. This is expected as Supabase databases use IPv6 by default and are not directly accessible from IPv4-only networks. Vercel's infrastructure appears to be IPv4-only or has connectivity issues with this Supabase instance.

### Connection Pooler Attempts

All pooler connection attempts result in the same authentication error regardless of configuration.

**Error (all attempts):**
```
FATAL: Tenant or user not found
```

#### Attempt 1: Transaction Pooler with Project-Specific Username
**Connection String:**
```
postgresql://postgres.pktiwlfxgfkkqxzhtaxe:56HCAOeJO8hC62fR@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```
**Result:** `FATAL: Tenant or user not found`

#### Attempt 2: Session Pooler with Project-Specific Username
**Connection String:**
```
postgresql://postgres.pktiwlfxgfkkqxzhtaxe:56HCAOeJO8hC62fR@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```
**Result:** `FATAL: Tenant or user not found`

#### Attempt 3: Transaction Pooler with Standard Username
**Connection String:**
```
postgresql://postgres:56HCAOeJO8hC62fR@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```
**Result:** `FATAL: Tenant or user not found`

#### Attempt 4: Session Pooler with Standard Username
**Connection String:**
```
postgresql://postgres:56HCAOeJO8hC62fR@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```
**Result:** `FATAL: Tenant or user not found`

## Current Configuration

### Prisma Schema
```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../lib/generated/prisma"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Environment Variables (Vercel)
- `DATABASE_URL`: Currently set to pooler connection (various formats tested)
- `DIRECT_URL`: `postgresql://postgres:56HCAOeJO8hC62fR@db.pktiwlfxgfkkqxzhtaxe.supabase.co:5432/postgres`
- All other required environment variables are configured correctly

### Supabase Project Settings
- **Pool Size**: 15 (default for Nano compute)
- **Max Client Connections**: 200
- **SSL**: Not enforced
- **Network Restrictions**: None (open to all IP addresses)
- **Connection Pooling**: Shared Pooler enabled

## Verification Tests

### ✅ Working: Supabase MCP Connection
Successfully connected to database using Supabase MCP server:
```sql
SELECT 1 as test
-- Result: [{"test":1}]
```
This confirms:
- Database is operational
- Credentials are correct
- Network is reachable from some contexts

### ✅ Working: Prisma Binary Target
Prisma Client generates correctly with `rhel-openssl-3.0.x` binary target for Vercel's runtime.

### ✅ Working: Prisma Schema Configuration
Schema with `directUrl` is properly configured according to Prisma + Supabase best practices.

### ❌ Failing: Runtime Database Queries
All Prisma queries from Vercel runtime fail with pooler authentication errors.

## Username Format Investigation

According to Supabase documentation, connection pooler usernames should follow this pattern:
- **Transaction Mode (port 6543)**: `postgres.{project_ref}` OR `postgres`
- **Session Mode (port 5432)**: `postgres.{project_ref}` OR `postgres`

Both formats have been tested exhaustively without success.

## Questions for Supabase Expert

1. **Is there a project-specific configuration** required to enable Supabase connection pooler (Supavisor)?
   - Does the pooler need to be explicitly activated for this project?
   - Are there any project-level settings that could block pooler authentication?

2. **Is the connection pooler endpoint correct** for region `eu-west-1`?
   - Tested: `aws-0-eu-west-1.pooler.supabase.com`
   - Could the endpoint be different for this specific project?

3. **Could there be a project migration/upgrade issue?**
   - Project was created on 2025-10-25
   - Could it be running an older pooler configuration?

4. **Is the username format different** for this Postgres version (17.6)?
   - Testing both `postgres` and `postgres.pktiwlfxgfkkqxzhtaxe`
   - Neither works

5. **Are there any known issues** with Supabase pooler + Vercel + Prisma combination?
   - Is there a specific configuration we're missing?

6. **Could the "Tenant or user not found" error** indicate something other than authentication?
   - Database routing issue?
   - Pooler not properly initialized for this project?

7. **Is the password being interpreted correctly?**
   - Password: `56HCAOeJO8hC62fR` (no special characters)
   - Tested both URL-encoded and plain formats

## What We Need

Either:
1. **The correct connection string format** for this specific Supabase project to use with Supavisor pooler from Vercel
2. **Diagnosis of why pooler authentication is failing** despite correct credentials
3. **Confirmation that IPv4 add-on is required** for Vercel → Supabase connectivity
4. **Project-specific configuration steps** to enable/fix the connection pooler

## Workarounds Considered

1. **IPv4 Add-on** ($4/month) - Would bypass pooler entirely
2. **Move to IPv6-compatible hosting** (Railway, Fly.io)
3. **Use Supabase JS client** instead of Prisma (architectural change)
4. **Dedicated pooler** (requires paid plan)

## Additional Context

- GitHub Actions also cannot connect directly (same IPv6 issue)
- Local development can connect using direct connection
- All environment variables are correctly configured in Vercel
- Database password has been verified multiple times
- No network restrictions configured on Supabase project

## Request

Please provide:
1. The exact connection string format we should use
2. Any project-level configuration changes needed
3. Confirmation of whether IPv4 add-on is required for Vercel deployment
4. Steps to diagnose why "Tenant or user not found" occurs with correct credentials
