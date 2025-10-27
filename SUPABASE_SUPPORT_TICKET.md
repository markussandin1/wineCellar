# Supabase Support Ticket - Connection Pooler Not Working

## Subject
Connection Pooler returns "FATAL: Tenant or user not found" for project pktiwlfxgfkkqxzhtaxe

## Project Information
- **Project Reference**: `pktiwlfxgfkkqxzhtaxe`
- **Project Name**: wineCellar
- **Region**: eu-west-1
- **Database Status**: ACTIVE_HEALTHY
- **PostgreSQL Version**: 17.6.1.025
- **Account**: (your account email)

## Issue Description
Unable to connect to the database using the Supabase connection pooler from any environment (local machine, Vercel deployment). All connection attempts return:

```
FATAL: Tenant or user not found
```

## What We've Tested

### ✅ Working Connections
1. **Direct database connection from local machine** (when not using pooler)
2. **Supabase MCP API connection** - database responds correctly
3. **TCP connectivity to pooler** - `nc -zv aws-0-eu-west-1.pooler.supabase.com 6543` succeeds

### ❌ Failing Connections
All pooler attempts fail with "Tenant or user not found":

#### Test 1: Transaction Pooler (port 6543) with project-specific username
```
postgresql://postgres.pktiwlfxgfkkqxzhtaxe:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```
**Result**: `FATAL: Tenant or user not found`

#### Test 2: Transaction Pooler (port 6543) with standard username
```
postgresql://postgres:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```
**Result**: `FATAL: Tenant or user not found`

#### Test 3: Session Pooler (port 5432) with project-specific username
```
postgresql://postgres.pktiwlfxgfkkqxzhtaxe:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```
**Result**: `FATAL: Tenant or user not found`

#### Test 4: Session Pooler (port 5432) with standard username
```
postgresql://postgres:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```
**Result**: `FATAL: Tenant or user not found`

## Test Evidence
We created a Node.js test script using the `pg` library that confirmed:
- Pooler host is reachable (TCP connection succeeds)
- All username/password combinations fail with identical error
- Error occurs **before** authentication (suggests tenant lookup failure)
- Same error from both local machine AND Vercel deployment

## Our Analysis
The "Tenant or user not found" error suggests:
1. The pooler tenant mapping for project `pktiwlfxgfkkqxzhtaxe` may not be configured
2. The pooler may not be aware of this project
3. There may be a provisioning issue with the Shared Pooler for this project

## Questions for Support

1. **Is the connection pooler enabled/provisioned for project `pktiwlfxgfkkqxzhtaxe`?**
   - Can you verify the tenant mapping exists in Supavisor for this project?

2. **What is the exact connection string format we should use?**
   - We've tested all documented formats without success
   - Can you provide the exact username format required?

3. **Can you check pooler logs for our connection attempts?**
   - Test timestamp: 2025-10-27 ~06:40 UTC
   - Client username attempts: `postgres` and `postgres.pktiwlfxgfkkqxzhtaxe`
   - Would help understand where tenant lookup fails

4. **Does this project need manual pooler activation?**
   - Project was created on 2025-10-25
   - Connection pooling shows as enabled in dashboard (Pool Size: 15, Max Clients: 200)
   - But pooler authentication fails

## What We Need
Either:
- **The correct connection string** that works with the pooler for this project
- **Pooler re-provision/activation** if tenant mapping is missing
- **Confirmation** that we need the IPv4 add-on instead of using the pooler

## Impact
- Cannot deploy application to Vercel (IPv4-only, cannot reach direct IPv6 connection)
- Application is currently non-functional in production
- Local development works with direct connection but not suitable for production

## Urgency
**High** - Blocks production deployment

## Additional Information
We have detailed technical documentation and test scripts available if needed. We can provide:
- Full connection test logs with timestamps
- Prisma configuration
- Network connectivity test results
- Any additional diagnostics you require

Thank you for your help!
