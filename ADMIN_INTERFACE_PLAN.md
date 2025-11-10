# Admin Interface Implementation Plan

**Last Updated:** 2025-11-10
**Status:** Planning

---

## Overview
Build two separate admin pages for wine cellar management:
1. **Analytics Dashboard** (`/admin/analytics`) - System-wide statistics and insights
2. **Wine Catalog Management** (`/admin/wines`) - Edit, manage, and enrich wine data

---

## User Requirements (Confirmed)

### Priority Features
✅ Vin-katalog översikt (se alla viner, editera, ta bort)
✅ Vinkvalitetskontroll (re-generera enrichment)
✅ Vilka användare har vilket vin + antal flaskor
✅ Totalt värde per användare
✅ Mest populära viner (flest användare)
✅ Datakvalitet metrics (label scans, enrichment)

### Technical Decisions
- **Structure:** Two separate pages (`/admin/analytics` + `/admin/wines`)
- **Authorization:** Database role field (`is_admin` boolean in users table)
- **Audit:** Track all wine edits with user ID and timestamp

---

## Current State Analysis

### Authentication & Authorization
- ✅ Supabase Auth implemented (email/password)
- ❌ **Missing:** No role-based access control
- ❌ **Missing:** No `is_admin` field in users table
- ⚠️ **Security Issue:** Existing `/app/api/admin/*` routes have no admin checks

### Database Schema
- **Users:** 4 rows (no role field)
- **Wines:** 57 rows (global catalog, no user_id)
- **Bottles:** 30 rows (user-owned, links to wines)
- **Label Scans:** 27 rows (audit trail)
- **Consumption Logs:** 2 rows

### Existing Admin Features
- `/app/api/admin/enrich-wine/route.ts` - Re-run enrichment (⚠️ unprotected)
- `/app/api/admin/cleanup-duplicates/route.ts` - One-off script (⚠️ unprotected)

### User Dashboard (Non-Admin)
- Basic stats: total bottles, value, type/region distribution
- Recent additions (last 6 bottles)
- **Scope:** User's own data only

---

## Implementation Plan

### Phase 1: Foundation (Database & Authorization)

#### 1.1 Database Migration
**File:** `supabase_migration_add_admin_role_and_audit.sql`

```sql
-- Add admin role to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Track who last modified wines
ALTER TABLE wines ADD COLUMN updated_by TEXT REFERENCES users(id);

-- Audit log for wine edits
CREATE TABLE wine_edit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wine_id TEXT NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- 'update', 'delete', 'enrich'
  changes JSONB, -- Store old/new values
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wine_edit_logs_wine_id ON wine_edit_logs(wine_id);
CREATE INDEX idx_wine_edit_logs_user_id ON wine_edit_logs(user_id);
```

**Actions:**
- [ ] Create migration file
- [ ] Apply migration to database
- [ ] Manually set your user as admin: `UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com'`

#### 1.2 Authorization Middleware
**File:** `/lib/auth/admin.ts`

```typescript
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: Not logged in');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return data?.is_admin ?? false;
}
```

**Actions:**
- [ ] Create `/lib/auth/admin.ts`
- [ ] Update existing admin routes to use `requireAdmin()`
- [ ] Test authorization with admin and non-admin users

#### 1.3 Route Protection
**File:** `/middleware.ts` (update existing)

```typescript
// Add to protected paths
const protectedPaths = [
  '/dashboard',
  '/cellar',
  '/bottle',
  '/admin', // NEW: Protect all admin routes
];
```

**File:** `/app/admin/layout.tsx` (new)

```typescript
import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/dashboard'); // Redirect non-admins
  }

  return (
    <div className="admin-layout">
      {/* Admin navigation, header, etc. */}
      {children}
    </div>
  );
}
```

**Actions:**
- [ ] Update middleware to protect `/admin/*`
- [ ] Create admin layout with navigation
- [ ] Add admin link to user menu (conditionally shown)

---

### Phase 2: Analytics Dashboard (`/admin/analytics`)

#### 2.1 API Endpoint
**File:** `/app/api/admin/analytics/route.ts`

**Endpoints:**
- `GET /api/admin/analytics` - System-wide statistics

**Data to Return:**
```typescript
{
  overview: {
    totalUsers: number;
    totalWines: number;
    totalBottles: number;
    totalCellarValue: number;
    winesByStatus: { draft: number; active: number };
  },

  userWineMatrix: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalBottles: number;
    totalValue: number;
    wines: Array<{
      wineId: string;
      wineName: string;
      quantity: number;
      totalPrice: number;
    }>;
  }>,

  popularWines: Array<{
    wineId: string;
    wineName: string;
    producer: string;
    vintage: number;
    userCount: number; // How many different users have this wine
    totalBottles: number; // Sum of all quantities
  }>,

  dataQuality: {
    labelScans: {
      total: number;
      successful: number; // Scans that resulted in wine creation
      successRate: number;
    },
    enrichment: {
      winesWithEnrichment: number;
      winesWithoutEnrichment: number;
      coveragePercent: number;
      latestVersion: string;
    },
  },
}
```

**SQL Queries Needed:**

1. **User-Wine Matrix:**
```sql
SELECT
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  w.id as wine_id,
  w.full_name as wine_name,
  SUM(b.quantity) as quantity,
  SUM(b.purchase_price * b.quantity) as total_price
FROM users u
LEFT JOIN bottles b ON u.id = b.user_id
LEFT JOIN wines w ON b.wine_id = w.id
GROUP BY u.id, u.name, u.email, w.id, w.full_name
ORDER BY u.name, w.full_name;
```

2. **Popular Wines:**
```sql
SELECT
  w.id,
  w.full_name,
  w.producer_name,
  w.vintage,
  COUNT(DISTINCT b.user_id) as user_count,
  SUM(b.quantity) as total_bottles
FROM wines w
JOIN bottles b ON w.id = b.wine_id
GROUP BY w.id, w.full_name, w.producer_name, w.vintage
ORDER BY user_count DESC, total_bottles DESC
LIMIT 20;
```

3. **Label Scan Metrics:**
```sql
SELECT
  COUNT(*) as total_scans,
  COUNT(CASE WHEN wine_id IS NOT NULL THEN 1 END) as successful_scans
FROM label_scans;
```

**Actions:**
- [ ] Create API route with admin auth check
- [ ] Implement SQL queries (use Prisma or raw SQL)
- [ ] Test with existing data
- [ ] Add error handling and logging

#### 2.2 UI Components
**File:** `/app/admin/analytics/page.tsx`

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Overview Cards (4 metrics)                  │
├─────────────────────────────────────────────┤
│ User-Wine Matrix Table                      │
│ (sortable, searchable)                      │
├─────────────────────────────────────────────┤
│ Popular Wines Chart/Table                   │
├─────────────────────────────────────────────┤
│ Data Quality Section                        │
│ - Label Scan Success Rate                   │
│ - Enrichment Coverage                       │
└─────────────────────────────────────────────┘
```

**Components to Create:**
- `/components/admin/analytics-cards.tsx` - Metric cards
- `/components/admin/user-wine-matrix.tsx` - Table showing user-wine relationships
- `/components/admin/popular-wines-chart.tsx` - Chart/table of popular wines
- `/components/admin/data-quality-section.tsx` - Quality metrics

**Actions:**
- [ ] Create analytics page
- [ ] Implement metric cards with icons
- [ ] Build user-wine matrix table (shadcn/ui DataTable)
- [ ] Add sorting and searching
- [ ] Create popular wines visualization
- [ ] Display data quality metrics

---

### Phase 3: Wine Catalog Management (`/admin/wines`)

#### 3.1 API Endpoints

**File:** `/app/api/admin/wines/route.ts`
- `GET /api/admin/wines` - List/search wines with pagination

**File:** `/app/api/admin/wines/[id]/route.ts`
- `GET /api/admin/wines/[id]` - Get single wine with user/bottle stats
- `PATCH /api/admin/wines/[id]` - Update wine data (with audit log)
- `DELETE /api/admin/wines/[id]` - Delete wine (check dependencies first)

**Wine List Query (with filters):**
```typescript
{
  search?: string; // Name, producer, grape
  wineType?: string[];
  country?: string[];
  status?: 'draft' | 'active';
  verified?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'vintage' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}
```

**Wine Detail Response:**
```typescript
{
  wine: Wine; // Full wine object
  stats: {
    userCount: number; // How many users have this wine
    bottleCount: number; // Total bottles in system
    users: Array<{
      userId: string;
      userName: string;
      quantity: number;
      totalValue: number;
    }>;
  },
  editHistory: Array<{
    id: string;
    action: string;
    userName: string;
    changes: object;
    createdAt: string;
  }>;
}
```

**Update Wine (with audit logging):**
```typescript
async function updateWine(wineId: string, updates: Partial<Wine>, userId: string) {
  const supabase = await createClient();

  // Get old values for audit log
  const { data: oldWine } = await supabase
    .from('wines')
    .select('*')
    .eq('id', wineId)
    .single();

  // Update wine
  const { data: updatedWine } = await supabase
    .from('wines')
    .update({ ...updates, updated_by: userId })
    .eq('id', wineId)
    .select()
    .single();

  // Create audit log
  await supabase.from('wine_edit_logs').insert({
    wine_id: wineId,
    user_id: userId,
    action: 'update',
    changes: {
      old: oldWine,
      new: updates,
    },
  });

  return updatedWine;
}
```

**Actions:**
- [ ] Create wine list API with filters/pagination
- [ ] Create wine detail API with stats
- [ ] Implement update endpoint with audit logging
- [ ] Implement delete endpoint with dependency check
- [ ] Test all CRUD operations

#### 3.2 Wine List UI
**File:** `/app/admin/wines/page.tsx`

**Features:**
- shadcn/ui DataTable with columns:
  - Image (thumbnail)
  - Wine Name
  - Producer
  - Vintage
  - Type (Red/White/etc.)
  - Country/Region
  - Users (count)
  - Bottles (sum)
  - Status (draft/active)
  - Actions (Edit, Delete, Re-enrich)
- Search bar (name, producer, grape)
- Filter dropdowns (type, country, status)
- Sort controls
- Pagination (20-50 per page)

**Component Structure:**
```tsx
/app/admin/wines/page.tsx
  ├── WineSearchBar
  ├── WineFilters (type, country, status)
  ├── WineDataTable
  │   ├── WineRow (with actions)
  │   └── Pagination
  └── Modals
      ├── WineEditModal
      ├── WineDeleteConfirmDialog
      └── WineEnrichmentModal
```

**Actions:**
- [ ] Create wine catalog page
- [ ] Implement search/filter UI
- [ ] Build DataTable with all columns
- [ ] Add action buttons (Edit, Delete, Re-enrich)
- [ ] Test with 57 existing wines

#### 3.3 Wine Edit Modal
**File:** `/components/admin/wine-edit-modal.tsx`

**Sections:**

1. **Basic Info** (editable)
   - Name, Producer, Vintage
   - Wine Type, Primary Grape
   - Alcohol %

2. **Location** (editable)
   - Country, Region, Sub-region, Appellation

3. **Characteristics** (editable)
   - Sweetness Level, Body, Tannin, Acidity
   - Peak Drinking Window (start/end year)
   - Serving Temp (min/max), Decant Time

4. **Enrichment Data** (read-only with re-generate option)
   - Summary
   - Overview
   - Terroir
   - Winemaking
   - Tasting Notes (Nose, Palate, Finish)
   - Food Pairings
   - Serving Suggestions
   - Signature Traits
   - **Action Button:** "Re-generate Enrichment"

5. **Metadata** (read-only)
   - Created At, Updated At, Updated By
   - Enrichment Version, Generated At
   - Status, Verified

**Form Behavior:**
- Save button updates only changed fields
- Cancel discards changes
- Shows loading state during save
- Success toast with "View Edit History" link

**Actions:**
- [ ] Create edit modal component
- [ ] Build form with all fields
- [ ] Implement save with optimistic updates
- [ ] Add validation (Zod schema)
- [ ] Test editing various wine fields

#### 3.4 Wine Enrichment Tools
**File:** `/components/admin/wine-enrichment-modal.tsx`

**Features:**
- Reuse existing `/app/api/admin/enrich-wine/route.ts` (with updated auth)
- Optional context field: "Additional information about this wine"
- Shows loading state during enrichment
- Preview enrichment before saving
- Compare old vs. new enrichment (diff view)
- Save or discard

**Flow:**
1. Click "Re-generate Enrichment" on wine
2. Modal opens with context textarea (optional)
3. User clicks "Generate"
4. API calls OpenAI with wine data + context
5. Preview shows new enrichment
6. User reviews and clicks "Save" or "Cancel"
7. If saved: Update wine + create audit log

**Actions:**
- [ ] Create enrichment modal
- [ ] Connect to existing enrich-wine API
- [ ] Add context field (pass as tastingProfileHints)
- [ ] Implement preview with diff view
- [ ] Test with existing wines

#### 3.5 Wine Actions

**Delete Wine:**
- Check if any users have bottles of this wine
- Show confirmation dialog with impact:
  - "This wine is owned by 3 users with 8 total bottles"
  - "Are you sure you want to delete? This will also delete all bottles."
- Cascade delete bottles if confirmed
- Create audit log entry

**Mark as Verified:**
- Toggle `verified` flag
- Used for data quality control
- Shows checkmark badge on verified wines

**View Edit History:**
- Modal showing all changes from `wine_edit_logs`
- Timeline format: date, user, action, changes
- Filter by action type (update, enrich, delete)

**Actions:**
- [ ] Implement delete with safety checks
- [ ] Add verified toggle
- [ ] Create edit history modal
- [ ] Test all actions

---

### Phase 4: Admin Navigation & Layout

#### 4.1 Admin Layout
**File:** `/app/admin/layout.tsx`

**Features:**
- Sidebar or top navigation with links:
  - Analytics Dashboard
  - Wine Catalog
  - (Future: Users, Logs)
- Breadcrumb trail
- "Back to App" link
- Admin badge/indicator
- Responsive mobile layout

**Actions:**
- [ ] Create admin layout component
- [ ] Add navigation between admin pages
- [ ] Style with consistent admin theme
- [ ] Test responsive behavior

#### 4.2 Access from Main App
**File:** `/components/layout/user-menu.tsx` (or wherever user dropdown is)

**Changes:**
- Add conditional admin link (only shown if `isAdmin === true`)
- Icon + "Admin Panel" menu item
- Links to `/admin/analytics`

**Actions:**
- [ ] Add admin link to user menu
- [ ] Fetch `is_admin` status in layout
- [ ] Test visibility for admin vs. non-admin users

---

## File Structure (Complete)

```
/app/admin/
├── layout.tsx                    # Admin-only layout with nav
├── analytics/
│   └── page.tsx                  # Analytics dashboard
└── wines/
    └── page.tsx                  # Wine catalog table + modals

/app/api/admin/
├── analytics/
│   └── route.ts                  # System-wide stats (NEW)
├── wines/
│   ├── route.ts                  # List/search wines (NEW)
│   └── [id]/
│       └── route.ts              # Get/Update/Delete wine (NEW)
├── enrich-wine/
│   └── route.ts                  # Re-enrich wine (UPDATE AUTH)
└── cleanup-duplicates/
    └── route.ts                  # One-off script (UPDATE AUTH)

/lib/auth/
└── admin.ts                      # requireAdmin() helper (NEW)

/components/admin/
├── analytics-cards.tsx           # Metric cards for dashboard (NEW)
├── user-wine-matrix.tsx          # User-wine relationship table (NEW)
├── popular-wines-chart.tsx       # Popular wines visualization (NEW)
├── data-quality-section.tsx      # Quality metrics display (NEW)
├── wine-table.tsx                # DataTable for wine catalog (NEW)
├── wine-edit-modal.tsx           # Edit wine form (NEW)
├── wine-enrichment-modal.tsx     # Re-generate enrichment (NEW)
└── wine-delete-dialog.tsx        # Confirm delete with impact (NEW)

/supabase/migrations/
└── add_admin_role_and_audit.sql  # Migration for admin features (NEW)
```

---

## Testing Checklist

### Authorization
- [ ] Non-admin user cannot access `/admin/*` routes
- [ ] Non-admin user cannot call admin API endpoints
- [ ] Admin user can access all admin features
- [ ] Admin link only shows for admin users

### Analytics Dashboard
- [ ] Overview metrics display correctly
- [ ] User-wine matrix shows all relationships
- [ ] Popular wines ranked correctly
- [ ] Label scan success rate calculated accurately
- [ ] Enrichment coverage percentage correct
- [ ] Page loads quickly (no N+1 queries)

### Wine Catalog
- [ ] All 57 wines displayed
- [ ] Search works for name, producer, grape
- [ ] Filters work (type, country, status)
- [ ] Sorting works for all columns
- [ ] Pagination works correctly
- [ ] Wine row actions (Edit, Delete, Re-enrich) functional

### Wine Editing
- [ ] Edit modal loads wine data correctly
- [ ] All fields editable/read-only as specified
- [ ] Save updates database and creates audit log
- [ ] Updated_by field populated correctly
- [ ] Cancel discards changes
- [ ] Validation errors shown for invalid data

### Wine Enrichment
- [ ] Re-generate button triggers enrichment
- [ ] Context field passed to AI agent
- [ ] Enrichment preview shows all sections
- [ ] Save updates wine with new enrichment
- [ ] Audit log created for enrichment action
- [ ] Enrichment_version and generated_at updated

### Wine Deletion
- [ ] Confirmation dialog shows impact (users, bottles)
- [ ] Delete cascades to bottles
- [ ] Audit log created
- [ ] Wine removed from database
- [ ] Cannot delete if constraint violation

### Audit Logging
- [ ] All wine edits logged
- [ ] Edit history modal shows all changes
- [ ] Changes JSONB contains old/new values
- [ ] User name displayed in history
- [ ] Timestamps accurate

---

## Performance Considerations

### Database Queries
- [ ] Use indexes on foreign keys (wine_id, user_id)
- [ ] Limit results with pagination
- [ ] Aggregate queries for stats (avoid N+1)
- [ ] Cache expensive queries if needed

### UI Optimization
- [ ] Lazy load components/modals
- [ ] Virtual scrolling for large tables (if >1000 wines)
- [ ] Debounce search input
- [ ] Optimistic updates for better UX

---

## Security Considerations

### Authorization
- [ ] All admin API routes protected with `requireAdmin()`
- [ ] Middleware prevents access to `/admin/*` for non-admins
- [ ] No client-side admin checks only (always verify server-side)

### Input Validation
- [ ] Validate all wine updates with Zod schema
- [ ] Sanitize user input (especially context field)
- [ ] Prevent SQL injection (use Prisma/parameterized queries)

### Audit Trail
- [ ] Log all destructive actions (delete, update)
- [ ] Cannot delete or modify audit logs
- [ ] Track which admin performed action

---

## Future Enhancements (Post-MVP)

### Additional Admin Pages
- `/admin/users` - User management (view, suspend, delete)
- `/admin/logs` - Full audit log viewer (all tables)
- `/admin/label-scans` - Label scanning analytics and quality

### Bulk Operations
- Bulk re-enrichment (select multiple wines)
- Bulk delete/verify wines
- Export wine catalog to CSV/JSON

### Advanced Analytics
- User growth over time (chart)
- Wine additions over time
- Most consumed wines
- Average bottle prices by region/type

### Wine Moderation
- Add `moderation_status` to wines ('unreviewed' | 'approved' | 'rejected')
- Queue for reviewing user-submitted wines
- Approve/reject workflow

---

## Notes & Decisions

### Why Two Separate Pages?
- Clear separation between reading (analytics) and writing (editing)
- Analytics page is read-only, safe to browse
- Wine catalog page has destructive actions, requires more attention

### Why Database Role Field?
- More flexible than hardcoded emails
- Can easily add/remove admins via database update
- Scalable for future multi-role systems
- No code changes needed to change admins

### Why Audit Logging?
- Track who changed what and when
- Rollback capability (future enhancement)
- Compliance and accountability
- Debug data quality issues

### Existing Code to Update
- `/app/api/admin/enrich-wine/route.ts` - Add `requireAdmin()` check
- `/app/api/admin/cleanup-duplicates/route.ts` - Add `requireAdmin()` check
- `/middleware.ts` - Protect `/admin/*` paths
- User menu component - Add conditional admin link

---

## Implementation Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Database migration, auth middleware, route protection | 2-3 hours |
| Phase 2 | Analytics API + UI | 4-6 hours |
| Phase 3 | Wine catalog API + UI + modals | 6-8 hours |
| Phase 4 | Admin layout + navigation | 1-2 hours |
| Testing | Comprehensive testing | 2-3 hours |
| **Total** | | **15-22 hours** |

---

## Success Criteria

✅ Admin can view system-wide analytics (users, wines, bottles, value)
✅ Admin can see which users have which wines (user-wine matrix)
✅ Admin can see most popular wines (by user count)
✅ Admin can view data quality metrics (scan success, enrichment coverage)
✅ Admin can search/filter all wines in catalog
✅ Admin can edit wine metadata (name, producer, region, etc.)
✅ Admin can re-generate wine enrichment with AI agent
✅ Admin can delete wines (with safety checks)
✅ All wine changes logged in audit trail
✅ Non-admin users cannot access admin features
✅ Performance is acceptable (no slow queries)
✅ UI is responsive and mobile-friendly

---

**Plan Status:** Ready for implementation
**Awaiting:** User confirmation to proceed
