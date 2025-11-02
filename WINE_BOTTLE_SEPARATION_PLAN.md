# Wine/Bottle Separation & Agent-Based Architecture Plan

## Current Problems

### 1. **Mixed Responsibilities**
- `scan-label` route does BOTH label extraction AND wine database search
- Uses old OpenAI Responses API directly instead of new agent system
- Wine creation happens in `createBottle` action, not during scan
- No separation between Wine (product) and Bottle (user's instance)

### 2. **Inefficient AI Usage**
- Always runs label scan agent, even if wine exists
- No wine enrichment when creating new wines
- AI-generated data stored in wrong places (bottles vs wines)

### 3. **Database Structure Issues**
- Schema correctly separates Wine and Bottle entities
- BUT: Current flow doesn't leverage this properly
- Wine enrichment data (tastingNotes, description, etc) should be on Wine, not Bottle

---

## New Architecture: Agent-Based Flow

### Core Principle
**Wines are products. Bottles are user inventory.**
- Wine = immutable product data (name, producer, region, tasting notes)
- Bottle = user's specific instance (purchase price, date, storage location)

### The New Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER SCANS LABEL                                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. LABEL SCAN AGENT (V2)                                    │
│    - Extract: name, producer, vintage, region, grape, etc   │
│    - Returns: basic wine facts                              │
│    - Fast: ~2-3 seconds                                      │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. WINE LOOKUP                                               │
│    - Search database for existing Wine record               │
│    - Match by: producer + name + vintage                    │
│    - Use similarity scoring (already implemented)            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
                    ┌────┴────┐
                    │         │
            Wine Exists    Wine NOT Found
                    │         │
                    ▼         ▼
        ┌───────────────┐  ┌──────────────────────────────┐
        │ 3a. USE       │  │ 3b. CREATE WINE              │
        │ EXISTING WINE │  │  - Run WINE ENRICHMENT AGENT │
        │               │  │  - Generate full profile:    │
        │ - Load Wine   │  │    • Summary                 │
        │   record      │  │    • Terroir                 │
        │ - Skip AI     │  │    • Winemaking              │
        │               │  │    • Tasting notes           │
        │               │  │    • Food pairings           │
        │               │  │    • Serving guide           │
        │               │  │  - Insert into wines table   │
        │               │  │  - Slow: ~10-12 seconds      │
        └───────────────┘  └──────────────────────────────┘
                    │         │
                    └────┬────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SHOW BOTTLE FORM                                          │
│    - Pre-fill: Wine data (read-only or minimal edit)        │
│    - User fills: Bottle-specific data                       │
│      • Purchase price                                        │
│      • Purchase date                                         │
│      • Purchase location                                     │
│      • Storage location                                      │
│      • Quantity                                              │
│      • Personal notes                                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CREATE BOTTLE RECORD                                      │
│    - Link to Wine via wineId                                 │
│    - Store user-specific data only                           │
│    - No AI calls needed                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Update API Routes ✓ (Partially Done)

**Files to modify:**
- `app/api/scan-label/route.ts` - Update to use label-scan agent V2
- `app/api/enrich-wine/route.ts` - Already created ✓
- `app/api/wines/create/route.ts` - NEW: Create wine with enrichment

**Changes:**
1. **scan-label route:**
   ```typescript
   // OLD: Direct OpenAI call
   // NEW: Use labelScanAgent.execute()
   const result = await labelScanAgent.execute({
     imageBase64: base64Image,
     mimeType: image.type
   });

   // Search for existing wine
   const existingWine = await findWineInDatabase(result.data);

   // Return: { extracted, existingWine }
   ```

2. **Create new route: wines/create:**
   ```typescript
   // 1. Validate wine doesn't exist
   // 2. Run wine enrichment agent
   // 3. Create wine record with enriched data
   // 4. Return wine ID
   ```

### Phase 2: Update Database Schema

**Current Wine table has these AI fields:**
- `description` - Short description
- `tasting_notes` - Tasting notes
- `ai_generated_summary` - AI summary

**Need to add Wine Enrichment fields:**
```sql
ALTER TABLE wines ADD COLUMN enrichment_summary TEXT;
ALTER TABLE wines ADD COLUMN enrichment_overview TEXT;
ALTER TABLE wines ADD COLUMN enrichment_terroir TEXT;
ALTER TABLE wines ADD COLUMN enrichment_winemaking TEXT;
ALTER TABLE wines ADD COLUMN enrichment_tasting_notes JSONB; -- {nose, palate, finish}
ALTER TABLE wines ADD COLUMN enrichment_serving TEXT;
ALTER TABLE wines ADD COLUMN enrichment_food_pairings JSONB; -- array of strings
ALTER TABLE wines ADD COLUMN enrichment_signature_traits TEXT;
ALTER TABLE wines ADD COLUMN enrichment_generated_at TIMESTAMP;
```

**OR simpler approach:**
```sql
ALTER TABLE wines ADD COLUMN enrichment_data JSONB;
-- Store entire WineEnrichmentOutput as JSON
```

### Phase 3: Update Frontend Components

**Files to modify:**
1. `components/bottles/label-scanner.tsx`
   - After scan, check if wine exists
   - If NOT exists: Show loading state + call wine enrichment
   - Pass wine data to form (not extracted data)

2. `components/bottles/scanned-bottle-form.tsx`
   - Receive `wine` object instead of `extractedData`
   - Wine fields become read-only or minimal edit
   - Focus form on bottle-specific fields
   - Remove wine creation logic

3. `app/actions/bottle.ts`
   - Remove wine creation from createBottle
   - Simplify to only handle bottle records
   - Wine must exist before creating bottle

### Phase 4: Update Wine Display

**Files to modify:**
1. `components/bottles/bottle-detail.tsx`
   - Show wine enrichment data if available
   - Collapsible sections for each enrichment field
   - Fallback to old description/tasting_notes if no enrichment

2. New component: `components/wines/wine-profile.tsx`
   - Display full wine profile
   - All 8 enrichment sections
   - Reusable across app

---

## Benefits of New Architecture

### 1. **Performance**
- ✅ Scan same wine 100 times = 1 AI enrichment call (not 100)
- ✅ Label scan: ~2-3s (fast, cheap)
- ✅ Wine enrichment: ~10-12s (slow, expensive, but ONLY when needed)

### 2. **Data Quality**
- ✅ Wine data shared across all bottles of same wine
- ✅ Consistent enrichment data
- ✅ User corrections benefit everyone (future: crowdsourcing)

### 3. **Cost Efficiency**
- ✅ Label scan: ~$0.001 per scan (gpt-4o vision)
- ✅ Wine enrichment: ~$0.005 per wine (gpt-4o-mini, 800 tokens)
- ✅ Total: ~$0.006 for NEW wine, ~$0.001 for existing wine

### 4. **User Experience**
- ✅ Fast path for known wines (2-3s total)
- ✅ Slow path for new wines (12-15s, but worth it)
- ✅ Clear loading states for each phase
- ✅ Bottle form focuses on user's data, not wine data

---

## Migration Strategy

### Option A: Big Bang (Risky)
- Update everything at once
- High risk, harder to debug
- Not recommended

### Option B: Gradual Migration (Recommended)
1. **Week 1:** Add enrichment fields to database
2. **Week 2:** Update API routes to use agents
3. **Week 3:** Update frontend to new flow
4. **Week 4:** Backfill existing wines with enrichment

### Backward Compatibility
- Keep old scan-label flow working during transition
- Add feature flag: `USE_AGENT_FLOW`
- Gradually migrate users
- Remove old code after validation

---

## Next Steps (Immediate)

1. ✅ Wine Enrichment Agent V2 created
2. ✅ Wine Enrichment API route created
3. ⏳ Add enrichment fields to Wine schema
4. ⏳ Update scan-label to use labelScanAgent V2
5. ⏳ Create wines/create API route
6. ⏳ Update label-scanner component
7. ⏳ Update scanned-bottle-form component
8. ⏳ Simplify createBottle action

---

## Questions to Resolve

1. **Should wine enrichment be automatic or opt-in?**
   - Auto: Better UX, higher cost
   - Opt-in: Lower cost, requires user action
   - **Recommendation:** Auto for scan flow, opt-in for manual entry

2. **How to handle enrichment failures?**
   - Fall back to basic wine creation
   - Retry later in background job
   - **Recommendation:** Fall back + show "Enrich now" button

3. **Store enrichment as JSONB or separate columns?**
   - JSONB: Flexible, easier schema updates
   - Columns: Better queries, type safety
   - **Recommendation:** JSONB for MVP, migrate to columns if needed

4. **Update existing wines retroactively?**
   - Background job to enrich all wines
   - Enrich on-demand when viewed
   - **Recommendation:** On-demand first, background job later
