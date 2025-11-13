# Release Strategy - Web vs App Releases

**Living Document** - Uppdateras vid varje release och när nya release-patterns upptäcks.

**Senast uppdaterad:** 2025-11-11
**Version:** 0.1.0

---

## Innehållsförteckning

1. [Översikt](#översikt)
2. [Webb-Release (Vercel)](#webb-release-vercel)
3. [App-Release (iOS/Android)](#app-release-iosandroid)
4. [Hybrid Releases](#hybrid-releases)
5. [Versionshantering](#versionshantering)
6. [Bakåtkompatibilitet](#bakåtkompatibilitet)
7. [Release Checklist](#release-checklist)
8. [Rollback Strategies](#rollback-strategies)

---

## Översikt

Wine Cellar har **två separata release-flöden**:

| Release-typ | Timeline | Godkännande | Användare får uppdatering |
|-------------|----------|-------------|---------------------------|
| **Webb** | ~5 minuter | Automatisk | Omedelbart (vid nästa sidladdning) |
| **App** | 1-3 dagar | Apple/Google review | När de uppdaterar appen |

**Kritisk insikt:** När du deployer till webben får alla användare ändringen direkt. När du deployer en app-uppdatering måste användare **aktivt uppdatera appen** i App Store/Play Store.

Detta betyder att **gamla app-versioner fortsätter köra** tills användaren uppdaterar. Din kod måste därför vara **bakåtkompatibel** med minst 2-3 tidigare app-versioner.

---

## Webb-Release (Vercel)

### Vad Kräver ENDAST Webb-Release?

**UI-ändringar:**
- ✅ Ändringar i `src/components/` (React komponenter)
- ✅ Styling i Tailwind CSS
- ✅ Nya sidor i `src/app/`
- ✅ Layout-ändringar

**Backend-ändringar:**
- ✅ API routes i `src/app/api/`
- ✅ Serverless functions
- ✅ Database queries (via Supabase)
- ✅ AI agent prompts och logic

**Data-ändringar:**
- ✅ Nya fält i API responses (om backwards compatible)
- ✅ Nya API endpoints
- ✅ Database schema updates (via migrations)

**Innehåll:**
- ✅ Text-ändringar
- ✅ Bilder och assets
- ✅ Översättningar

### Webb-Release Workflow

```bash
# 1. Gör ändringar i src/
git add src/
git commit -m "feat: add new wine filter UI"

# 2. Push till GitHub
git push origin main

# 3. Vercel auto-deploys (ingen manuell action krävs)
# ⏱️  ~5 minuter senare: Live i produktion

# 4. Användare får ändringen vid nästa sidladdning
```

### Environment Variables

**Uppdatera env vars i Vercel:**
```bash
# Via Vercel Dashboard eller CLI
vercel env add NEXT_PUBLIC_NEW_FEATURE

# Pull till lokalt för dev
vercel env pull .env.local
```

**OBS:** Env var-ändringar kräver **redeploy** men ingen app-release.

---

## App-Release (iOS/Android)

### Vad Kräver App-Release?

**Native Permissions:**
- ❌ Ny kamera-access (första gången)
- ❌ Push notifications (första gången)
- ❌ Geolocation
- ❌ Contacts, Calendar, Photos
- ❌ Face ID / Fingerprint
- ❌ Background fetch

→ **Varför:** Kräver uppdatering av `Info.plist` (iOS) eller `AndroidManifest.xml`

**Nya Capacitor Plugins:**
- ❌ Installation av ny `@capacitor/*` plugin
- ❌ Uppdatering av native dependencies

→ **Varför:** Native kod måste kompileras in i appen

**Native UI/UX:**
- ❌ Ändringar i `ios/` eller `android/` native kod
- ❌ App ikoner eller splash screens
- ❌ Status bar styling (första setup)
- ❌ Safe area konfiguration (första setup)

**App Store Metadata:**
- ❌ App-namn
- ❌ App-beskrivning
- ❌ Screenshots
- ❌ Privacy policy changes

**Breaking Changes:**
- ❌ API changes som bryter gamla app-versioner
- ❌ Borttagning av endpoints som gamla appar använder

### App-Release Workflow (iOS)

```bash
# 1. Gör ändringar i capacitor/ eller ios/
git add capacitor/ ios/
git commit -m "feat: add push notifications support"
git push origin main

# 2. Bump version
npm version patch  # 1.0.0 → 1.0.1
# eller
npm version minor  # 1.0.1 → 1.1.0

# 3. Sync Capacitor
npx cap sync ios

# 4. Build i Xcode
npx cap open ios
# I Xcode:
# - Product > Archive
# - Distribute App > App Store Connect
# - Upload

# 5. Submit for Review i App Store Connect
# - Fyll i "What's New" text
# - Submit för review

# ⏱️  1-3 dagar senare: Godkänt och live

# 6. Användare måste AKTIVT uppdatera appen
```

### App-Release Workflow (Android)

```bash
# 1-3. Samma som iOS

# 4. Build i Android Studio
npx cap open android
# I Android Studio:
# - Build > Generate Signed Bundle/APK
# - Upload till Play Console

# 5. Submit for Review i Google Play Console
# ⏱️  Oftast snabbare än iOS (timmar-dagar)
```

---

## Hybrid Releases

### Scenario 1: Feature Bakom Feature Flag

**Situation:** Ny feature som kräver native plugin, men du vill testa i webb först.

```typescript
// shared/features.ts
export const Features = {
  PUSH_NOTIFICATIONS: Platform.isNative &&
    process.env.NEXT_PUBLIC_FEATURE_PUSH === 'true',
};

// Användning
{Features.PUSH_NOTIFICATIONS && <NotificationPrompt />}
```

**Release Plan:**
1. **Webb-release:** Deploy feature flag (disabled) → Inga användare ser den
2. **App-release:** Submit app med plugin → 1-3 dagar review
3. **Webb-release:** Enable feature flag → App-användare ser featuren, webb inte
4. **Webb-release (framtid):** Bygg webb-equivalent → Enable för alla

### Scenario 2: API Change med Backward Compatibility

**Situation:** API endpoint behöver nytt fält, men gamla appar får inte brytas.

**❌ FEL (Breaking Change):**
```typescript
// API v1 (gamla appar använder detta)
{ id, name, producer }

// API v2 (BRYTER gamla appar)
{ id, fullName, producerName }  // Renamed fields!
```

**✅ RÄTT (Additive Change):**
```typescript
// API v1
{ id, name, producer }

// API v2 (backwards compatible)
{
  id,
  name,           // Behålls för gamla appar
  producer,       // Behålls för gamla appar
  fullName,       // Nytt fält (optional)
  producerName    // Nytt fält (optional)
}
```

**Release Plan:**
1. **Webb-release:** Deploy API v2 (med gamla fält kvar)
2. **Webb-release:** Uppdatera webb-klient att använda nya fält
3. **App-release:** Submit app som använder nya fält
4. **Webb-release (efter 6 månader):** Ta bort gamla fält när <5% använder gamla appar

### Scenario 3: Emergency Bug Fix

**Webb-bug:**
```bash
git checkout main
git pull
# Fix bug i src/
git commit -m "fix: critical bug in wine search"
git push
# ⏱️  Live på ~5 minuter
```

**App-bug (kritisk):**
```bash
# Fix bug i capacitor/
git commit -m "fix: critical crash on launch"
npm version patch
npx cap sync ios
npx cap open ios
# Build & upload
# Request "Expedited Review" i App Store Connect
# ⏱️  12-24 timmar (om godkänt som expedited)
```

**App-bug (icke-kritisk):**
- Om det går att workaround:a via API/backend → Gör det istället
- Spara app-release till nästa planerad release

---

## Versionshantering

### Semantic Versioning

Wine Cellar använder **SemVer** (`MAJOR.MINOR.PATCH`):

```
1.2.3
│ │ │
│ │ └─ PATCH: Bug fixes, små ändringar (backward compatible)
│ └─── MINOR: Nya features (backward compatible)
└───── MAJOR: Breaking changes
```

**Exempel:**
- `1.0.0` → `1.0.1`: Bug fix i label scanning
- `1.0.1` → `1.1.0`: Ny batch scanning feature
- `1.1.0` → `2.0.0`: API v2 (bryter gamla appar)

### Version Bumping

```bash
# Patch (1.0.0 → 1.0.1)
npm version patch

# Minor (1.0.1 → 1.1.0)
npm version minor

# Major (1.1.0 → 2.0.0)
npm version major
```

### Version Tracking

**Tre olika versioner att hålla koll på:**

1. **npm package version** (`package.json`)
   - Uppdateras med `npm version`
   - Tracked i git

2. **iOS version** (`ios/App/App/Info.plist`)
   - `CFBundleShortVersionString`: User-facing (1.2.3)
   - `CFBundleVersion`: Build number (auto-increment)

3. **Android version** (`android/app/build.gradle`)
   - `versionName`: User-facing (1.2.3)
   - `versionCode`: Integer (increment för varje build)

**Sync versions:**
```bash
# Efter npm version bump
npx cap sync ios android

# Manuell check
cat ios/App/App/Info.plist | grep -A1 CFBundleShortVersionString
cat android/app/build.gradle | grep versionName
```

---

## Bakåtkompatibilitet

### Support Policy

**Minimum Supported Versions:**
- Stödj **sista 3 minor versions** av appen
- Exempel: Om senaste är `1.5.0`, stöd `1.4.x`, `1.3.x`, `1.2.x`
- Efter 6 månader: Force update för äldre versioner

### API Versioning Strategies

**Strategy 1: Additive Changes (Preferred)**

Lägg till nya fält, ta ALDRIG bort gamla.

```typescript
// ✅ GOOD: Additive
interface WineResponse {
  id: string;
  name: string;
  producer: string;
  fullName?: string;      // NEW (optional)
  enrichment?: object;    // NEW (optional)
}
```

**Strategy 2: API Versioning via Path**

```typescript
// OLD endpoint (deprecated, but maintained)
GET /api/wines         → Returns old format

// NEW endpoint
GET /api/v2/wines      → Returns new format
```

**Strategy 3: API Versioning via Header**

```typescript
// Server checks header
const apiVersion = req.headers['x-api-version'] || '1';

if (apiVersion === '2') {
  return newFormat(data);
}
return oldFormat(data);
```

### Client-Side Compatibility

**Pattern: Progressive Enhancement**

```typescript
// capacitor/utils/api-client.ts
const API_VERSION = '2';  // App version 1.5.0 uses API v2

export async function fetchWines() {
  const response = await fetch('/api/wines', {
    headers: { 'X-API-Version': API_VERSION }
  });

  const data = await response.json();

  // Handle both old and new format
  if ('fullName' in data) {
    return data.fullName;  // New format
  }
  return `${data.name} ${data.producer}`;  // Old format fallback
}
```

### Deprecation Process

1. **Announce:** Add deprecation notice i API response
   ```json
   {
     "data": {...},
     "deprecated": {
       "field": "producer",
       "message": "Use producerName instead",
       "sunsetDate": "2025-06-01"
     }
   }
   ```

2. **Sunset Date:** 6 månader framåt
3. **Monitor Usage:** Track hur många requests använder gamla fält
4. **Force Update:** När <5% användare på gamla versioner
5. **Remove:** Ta bort deprecated fields efter sunset date

---

## Release Checklist

### Webb-Release Checklist

**Pre-Deploy:**
- [ ] Kod-review genomförd
- [ ] Tester passerar (`npm test`)
- [ ] Build lyckas (`npm run build`)
- [ ] Lint errors fixade (`npm run lint`)
- [ ] Environment variables konfigurerade i Vercel

**Post-Deploy:**
- [ ] Verifiera deploy i Vercel dashboard
- [ ] Smoke test på production URL
- [ ] Check error monitoring (Sentry/LogRocket om ni har)
- [ ] Verifiera i minst 2 browsers (Chrome, Safari)

**Om något går fel:**
- [ ] Rollback via Vercel dashboard (instant)
- [ ] Eller: `git revert` + push

### App-Release Checklist (iOS)

**Pre-Submit:**
- [ ] Version bumped (`npm version`)
- [ ] `npx cap sync ios` körts
- [ ] Build lyckas i Xcode (Product > Build)
- [ ] Archive lyckas (Product > Archive)
- [ ] Testat på fysisk iPhone-enhet
- [ ] Testat på minst 2 iOS-versioner (senaste + senaste-1)
- [ ] Screenshots tagna (alla device sizes)
- [ ] "What's New" text skriven (svenska + engelska)
- [ ] Privacy policy uppdaterad (om relevanta ändringar)

**Submit:**
- [ ] Upload till App Store Connect
- [ ] Fyll i metadata
- [ ] Submit för review
- [ ] Välj "Manual Release" (inte auto-publish)

**Post-Approval:**
- [ ] Smoke test på TestFlight
- [ ] Beta testers feedback
- [ ] Release manuellt när redo

**Om rejected:**
- [ ] Läs rejection reason
- [ ] Fixa issues
- [ ] Submit igen (kan ta ytterligare 1-3 dagar)

### App-Release Checklist (Android)

**Pre-Submit:**
- [ ] Version bumped
- [ ] `npx cap sync android` körts
- [ ] Build lyckas i Android Studio
- [ ] Signed APK/Bundle genererat
- [ ] Testat på minst 2 Android-versioner
- [ ] Screenshots tagna

**Submit:**
- [ ] Upload till Google Play Console
- [ ] Release notes ifyllda
- [ ] Submit för review

**Post-Approval:**
- [ ] Ofta godkänt inom timmar-dagar
- [ ] Monitor crash reports

---

## Rollback Strategies

### Webb Rollback (Vercel)

**Method 1: Vercel Dashboard**
1. Gå till Deployments
2. Hitta tidigare deployment
3. Klicka "Promote to Production"
4. ⏱️ Instant rollback

**Method 2: Git Revert**
```bash
git revert HEAD
git push origin main
# ⏱️  ~5 minuter
```

### App Rollback

**iOS:**
- **INGEN instant rollback möjlig**
- Kan inte "unpublish" en app-version
- Måste submit ny version (1-3 dagar)

**Workarounds:**
1. **Kill Switch (Remote Config):**
   ```typescript
   // Backend
   GET /api/config
   { "minAppVersion": "1.4.0" }  // Force update om < 1.4.0

   // App checks vid startup
   if (currentVersion < minAppVersion) {
     showForceUpdateDialog();
   }
   ```

2. **Feature Flags:**
   ```typescript
   // Disable buggy feature via backend
   GET /api/features
   { "batchScanning": false }  // Instant disable
   ```

3. **Expedited Review:**
   - Submit fix ASAP
   - Request "Expedited Review" i App Store Connect
   - Kan reducera till 12-24 timmar (om Apple godkänner)

**Android:**
- Liknande som iOS
- Något snabbare review (timmar-dagar)
- Kan också göra "staged rollout" (release till 10% → 50% → 100%)

---

## Release History

### Version 1.0.0 - Initial Release (TBD)

**Webb:**
- Initial Next.js app deployed

**App:**
- iOS app submitted
- Android app submitted

*(Uppdateras vid varje release)*

---

**Dokumentet uppdateras vid:**
- Nya releases (lägg till i Release History)
- Nya release-patterns upptäckta
- Breaking changes eller API versioning
- Force update triggers
- Rollback events (dokumentera vad som gick fel)
