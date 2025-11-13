# Capacitor Architecture - Wine Cellar iOS/Android App

**Living Document** - Uppdateras löpande vid varje större feature eller arkitekturell ändring.

**Senast uppdaterad:** 2025-11-11
**Version:** 0.1.0 (Initial setup)

---

## Innehållsförteckning

1. [Översikt](#översikt)
2. [Arkitekturprinciper](#arkitekturprinciper)
3. [Mappstruktur](#mappstruktur)
4. [Platform Detection](#platform-detection)
5. [Dependency Injection](#dependency-injection)
6. [Feature Flags](#feature-flags)
7. [Import Rules](#import-rules)
8. [Komponent Registry](#komponent-registry)
9. [Plugin Inventory](#plugin-inventory)
10. [Changelog](#changelog)

---

## Översikt

Wine Cellar använder **Capacitor** för att skapa native iOS och Android appar från den befintliga Next.js webbapplikationen. Detta ger oss:

- **95%+ koddelning** mellan webb, iOS och Android
- **En kodbas** att underhålla
- **Snabb utveckling** - bygger på befintlig infrastruktur
- **Native UX** genom Capacitor plugins (kamera, push notifications, haptics)

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 + React 18 + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Native Bridge** | Capacitor 6 |
| **iOS** | Swift + SwiftUI (auto-generated) |
| **Android** | Kotlin (auto-generated) |
| **Backend** | Next.js API Routes (unchanged) |
| **Database** | Supabase PostgreSQL (unchanged) |

### Deployment Model

```
┌─────────────────────────────────────────────────────┐
│                  GIT REPOSITORY                     │
│                                                     │
│  src/ (webb)  +  capacitor/ (app)  +  shared/      │
└─────────────────┬───────────────────┬───────────────┘
                  │                   │
        ┌─────────▼─────────┐  ┌──────▼──────────┐
        │   VERCEL DEPLOY   │  │  NATIVE BUILD   │
        │   (Web Only)      │  │  (iOS/Android)  │
        │   ~5 min          │  │  ~1-3 days      │
        └───────────────────┘  └─────────────────┘
             Auto-deploy         App Store Review
```

---

## Arkitekturprinciper

### 1. Tydlig Separation av Concerns

**Tre separata lager:**

- **`src/`** - Webb-specifik kod (Next.js komponenter, webb-specifika services)
- **`capacitor/`** - App-specifik kod (native plugins, app-komponenter, native services)
- **`shared/`** - Delad kod (types, utilities, interfaces, business logic)

**Gyllene regel:** Om du inte kan avgöra var en fil hör hemma, den hör hemma i `shared/`.

### 2. Små, Fokuserade Filer (AI-Vänligt)

**File Size Guidelines:**

- **Ideal:** 50-100 lines per fil
- **Max:** 150 lines per fil
- **Vid 150+ lines:** Split i flera filer (component, hook, service, types)

**Varför:**
- AI-agenter kan förstå hela filen i ett context window
- Enklare code review
- Tydligare ansvar per fil
- Lättare att testa och debugga

### 3. Platform-Agnostic Components

**Pattern:** Komponenter i `src/components/` ska fungera på båda platforms genom **conditional rendering**.

```typescript
// src/components/bottles/LabelScanner.tsx
import { Platform } from '@/shared/platform';

export function LabelScanner() {
  if (Platform.isNative) {
    return <NativeCameraCapture />; // capacitor/components/
  }
  return <WebCameraCapture />;      // src/components/
}
```

### 4. Dependency Injection för Services

**Pattern:** Definiera interfaces i `shared/`, implementera i `src/` och `capacitor/`, använd factory för att skapa rätt implementation.

```typescript
// shared/services/types.ts
export interface CameraService {
  capture(): Promise<Blob>;
  hasPermission(): Promise<boolean>;
}

// capacitor/services/native-camera.ts
export class NativeCameraService implements CameraService { ... }

// src/services/web-camera.ts
export class WebCameraService implements CameraService { ... }

// shared/services/factory.ts
export function createCameraService(): CameraService {
  return Platform.isNative
    ? new NativeCameraService()
    : new WebCameraService();
}
```

### 5. Feature Flags för Gradvis Utrullning

**Pattern:** Använd feature flags för att aktivera/deaktivera features runtime utan app-release.

```typescript
// shared/features.ts
export const Features = {
  // Webb-features (kan toggles via env vars)
  BATCH_SCANNING: process.env.NEXT_PUBLIC_FEATURE_BATCH === 'true',

  // App-features (alltid aktiverade i native)
  PUSH_NOTIFICATIONS: Platform.isNative,
  FACE_ID: Platform.isIOS,
};

// Användning
{Features.PUSH_NOTIFICATIONS && <NotificationPrompt />}
```

---

## Mappstruktur

```
wine-cellar/
├── src/                              # 🌐 WEB ONLY - Vercel deploys
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes
│   │   ├── api/                      # API routes (shared by app)
│   │   ├── dashboard/                # Dashboard pages
│   │   └── cellar/                   # Cellar pages
│   ├── components/                   # Webb-komponenter
│   │   ├── bottles/                  # Bottle management
│   │   ├── wines/                    # Wine catalog
│   │   ├── dashboard/                # Dashboard widgets
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/                          # Webb-utilities
│   │   ├── ai/                       # AI agents
│   │   ├── auth/                     # Supabase auth helpers
│   │   └── utils/                    # General utilities
│   └── services/                     # Webb-specifika services
│       └── web-camera.ts             # WebRTC camera (60-80 lines)
│
├── capacitor/                        # 📱 APP LAYER - Kräver app-release
│   ├── plugins/                      # Native plugin wrappers
│   │   ├── camera.ts                 # @capacitor/camera wrapper (70 lines)
│   │   ├── notifications.ts          # @capacitor/push-notifications (90 lines)
│   │   ├── haptics.ts                # @capacitor/haptics wrapper (40 lines)
│   │   ├── statusbar.ts              # @capacitor/status-bar (50 lines)
│   │   ├── network.ts                # @capacitor/network (60 lines)
│   │   └── README.md                 # Plugin documentation
│   ├── components/                   # App-specifika komponenter
│   │   ├── CameraCapture.tsx         # Native camera UI (90 lines)
│   │   ├── NotificationPrompt.tsx    # Push permission prompt (80 lines)
│   │   └── SafeAreaView.tsx          # iOS safe area wrapper (40 lines)
│   ├── hooks/                        # App-specifika hooks
│   │   ├── useNativeCamera.ts        # Native camera hook (60 lines)
│   │   ├── usePushNotifications.ts   # Push notifications hook (70 lines)
│   │   ├── useHaptics.ts             # Haptic feedback hook (30 lines)
│   │   └── useNetworkStatus.ts       # Network monitoring (50 lines)
│   ├── services/                     # Native service implementations
│   │   ├── native-camera.ts          # NativeCameraService (60 lines)
│   │   ├── native-notifications.ts   # NotificationService impl (80 lines)
│   │   └── offline-manager.ts        # Offline sync manager (100 lines)
│   └── config/                       # App-specific config
│       └── environment.ts            # Environment switching (40 lines)
│
├── shared/                           # 🔄 SHARED - Webb + App
│   ├── types/                        # TypeScript definitions
│   │   ├── wine.types.ts             # Wine related types
│   │   ├── bottle.types.ts           # Bottle types
│   │   ├── platform.types.ts         # Platform types (30 lines)
│   │   └── notifications.types.ts    # Notification types (40 lines)
│   ├── services/                     # Service interfaces
│   │   ├── types.ts                  # Service interfaces (60 lines)
│   │   ├── factory.ts                # Service factory (40 lines)
│   │   └── sync-queue.ts             # Offline sync queue (120 lines)
│   ├── utils/                        # Pure functions
│   │   ├── format.ts                 # Formatting utilities (80 lines)
│   │   ├── validation.ts             # Validators (60 lines)
│   │   └── date.ts                   # Date helpers (50 lines)
│   ├── constants/                    # Constants
│   │   └── app.ts                    # App constants (30 lines)
│   ├── platform.ts                   # Platform detection (50 lines)
│   └── features.ts                   # Feature flags (40 lines)
│
├── ios/                              # 🍎 NATIVE iOS (auto-generated)
│   └── App/
│       ├── App/
│       │   ├── Info.plist            # iOS permissions & config
│       │   ├── Assets.xcassets       # App icons & images
│       │   └── ...
│       └── App.xcodeproj             # Xcode project
│
├── android/                          # 🤖 NATIVE ANDROID (auto-generated)
│   └── app/
│       ├── src/main/
│       │   ├── AndroidManifest.xml   # Android permissions
│       │   └── res/                  # Resources
│       └── build.gradle
│
├── docs/                             # 📚 LIVING DOCUMENTATION
│   ├── CAPACITOR_ARCHITECTURE.md     # Detta dokument
│   ├── RELEASE_STRATEGY.md           # Release workflow
│   ├── AGENTS.md                     # AI-agent guidelines
│   ├── XCODE_SETUP.md                # Xcode configuration guide
│   ├── TESTING_CHECKLIST.md          # QA checklist
│   ├── APP_STORE_SUBMISSION.md       # App Store submission
│   └── TROUBLESHOOTING.md            # Common issues
│
├── public/                           # Static assets
│   ├── manifest.json                 # PWA manifest
│   └── icons/                        # App icons (all sizes)
│
├── capacitor.config.ts               # Capacitor configuration
├── next.config.js                    # Next.js config (static export)
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript config (path aliases)
```

---

## Platform Detection

### Platform Detection Utility

**Fil:** `shared/platform.ts`

```typescript
import { Capacitor } from '@capacitor/core';

export const Platform = {
  isNative: Capacitor.isNativePlatform(),
  isWeb: !Capacitor.isNativePlatform(),
  isIOS: Capacitor.getPlatform() === 'ios',
  isAndroid: Capacitor.getPlatform() === 'android',
} as const;

export function requiresAppRelease(feature: string): boolean {
  const appFeatures = [
    'camera',
    'push-notifications',
    'haptics',
    'background-fetch',
    'face-id',
    'status-bar',
    'safe-area',
  ];
  return appFeatures.includes(feature);
}
```

### Användning i Komponenter

**Pattern 1: Conditional Rendering**

```typescript
import { Platform } from '@/shared/platform';

export function MyComponent() {
  if (Platform.isNative) {
    return <NativeImplementation />;
  }
  return <WebImplementation />;
}
```

**Pattern 2: Dynamic Import**

```typescript
import dynamic from 'next/dynamic';
import { Platform } from '@/shared/platform';

const Camera = Platform.isNative
  ? dynamic(() => import('@/capacitor/components/CameraCapture'))
  : dynamic(() => import('@/src/components/WebCamera'));
```

**Pattern 3: Conditional Features**

```typescript
{Platform.isIOS && <FaceIDButton />}
{Platform.isAndroid && <FingerprintButton />}
{Platform.isWeb && <PasswordButton />}
```

---

## Dependency Injection

### Service Interface Pattern

**Step 1: Definiera Interface** (`shared/services/types.ts`)

```typescript
export interface CameraService {
  capture(): Promise<Blob>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
}

export interface NotificationService {
  requestPermission(): Promise<boolean>;
  schedule(message: string, date: Date): Promise<void>;
  registerToken(token: string): Promise<void>;
}
```

**Step 2: Native Implementation** (`capacitor/services/native-camera.ts`)

```typescript
import { Camera, CameraResultType } from '@capacitor/camera';
import type { CameraService } from '@/shared/services/types';

export class NativeCameraService implements CameraService {
  async capture(): Promise<Blob> {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
    });

    const response = await fetch(photo.webPath!);
    return response.blob();
  }

  async hasPermission(): Promise<boolean> {
    const status = await Camera.checkPermissions();
    return status.camera === 'granted';
  }

  async requestPermission(): Promise<boolean> {
    const status = await Camera.requestPermissions();
    return status.camera === 'granted';
  }
}
```

**Step 3: Web Implementation** (`src/services/web-camera.ts`)

```typescript
import type { CameraService } from '@/shared/services/types';

export class WebCameraService implements CameraService {
  async capture(): Promise<Blob> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    // ... capture logic
  }

  async hasPermission(): Promise<boolean> {
    return 'mediaDevices' in navigator;
  }

  async requestPermission(): Promise<boolean> {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      return true;
    } catch {
      return false;
    }
  }
}
```

**Step 4: Factory** (`shared/services/factory.ts`)

```typescript
import { Platform } from '@/shared/platform';
import type { CameraService } from './types';

export function createCameraService(): CameraService {
  if (Platform.isNative) {
    const { NativeCameraService } = require('@/capacitor/services/native-camera');
    return new NativeCameraService();
  }

  const { WebCameraService } = require('@/src/services/web-camera');
  return new WebCameraService();
}
```

**Step 5: Användning**

```typescript
import { createCameraService } from '@/shared/services/factory';

export function LabelScanner() {
  const cameraService = createCameraService();

  const handleCapture = async () => {
    const blob = await cameraService.capture();
    // ... upload logic
  };

  return <button onClick={handleCapture}>Capture</button>;
}
```

---

## Feature Flags

### Feature Flag System

**Fil:** `shared/features.ts`

```typescript
import { Platform } from './platform';

export const Features = {
  // Webb-features (kan toggles via environment variables)
  BATCH_SCANNING: process.env.NEXT_PUBLIC_FEATURE_BATCH === 'true',
  AI_ENRICHMENT: process.env.NEXT_PUBLIC_FEATURE_AI === 'true',
  ADMIN_PANEL: process.env.NEXT_PUBLIC_FEATURE_ADMIN === 'true',

  // App-features (alltid aktiverade i native)
  PUSH_NOTIFICATIONS: Platform.isNative,
  HAPTIC_FEEDBACK: Platform.isNative,
  BACKGROUND_SYNC: Platform.isNative,

  // iOS-specifika features
  FACE_ID: Platform.isIOS,
  APPLE_PAY: Platform.isIOS, // Future

  // Android-specifika features
  FINGERPRINT: Platform.isAndroid,
  GOOGLE_PAY: Platform.isAndroid, // Future
} as const;

export type FeatureName = keyof typeof Features;

export function isFeatureEnabled(feature: FeatureName): boolean {
  return Features[feature];
}
```

### Användning

```typescript
import { Features } from '@/shared/features';

export function MyComponent() {
  return (
    <>
      {Features.PUSH_NOTIFICATIONS && <NotificationPrompt />}
      {Features.BATCH_SCANNING && <BatchScanButton />}
      {Features.FACE_ID && <FaceIDSetup />}
    </>
  );
}
```

---

## Import Rules

### Boundary Enforcement

**Gyllene regler:**

1. **`shared/` kan importera från:** Ingenstans (endast externa npm packages)
2. **`src/` kan importera från:** `shared/` + externa packages
3. **`capacitor/` kan importera från:** `shared/` + externa packages + Capacitor plugins
4. **`src/` får ALDRIG importera från:** `capacitor/` ❌
5. **`capacitor/` får ALDRIG importera från:** `src/` ❌

### Exempel

**✅ TILLÅTET:**

```typescript
// src/components/LabelScanner.tsx
import { Platform } from '@/shared/platform';
import { Wine } from '@/shared/types/wine';
import { formatPrice } from '@/shared/utils/format';

// capacitor/components/CameraCapture.tsx
import { Features } from '@/shared/features';
import type { CameraService } from '@/shared/services/types';

// shared/services/factory.ts
import { Platform } from '@/shared/platform'; // OK: samma layer
```

**❌ FÖRBJUDET:**

```typescript
// src/components/LabelScanner.tsx
import { NativeCamera } from '@/capacitor/components/CameraCapture'; // ❌ WEB → APP

// capacitor/hooks/useCamera.ts
import { WebCamera } from '@/src/components/WebCamera'; // ❌ APP → WEB

// shared/platform.ts
import { someUtil } from '@/src/lib/utils'; // ❌ SHARED → WEB/APP
```

### ESLint Rule (Optional)

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["**/capacitor/**"],
        "message": "Web code (src/) cannot import from app code (capacitor/)"
      }, {
        "group": ["**/src/**"],
        "message": "App code (capacitor/) cannot import from web code (src/)"
      }]
    }]
  }
}
```

---

## Komponent Registry

### App-Specifika Komponenter

| Komponent | Fil | Ansvar | Lines |
|-----------|-----|--------|-------|
| `CameraCapture` | `capacitor/components/CameraCapture.tsx` | Native camera UI | ~90 |
| `NotificationPrompt` | `capacitor/components/NotificationPrompt.tsx` | Push permission dialog | ~80 |
| `SafeAreaView` | `capacitor/components/SafeAreaView.tsx` | iOS safe areas | ~40 |

### Platform-Agnostic Komponenter

| Komponent | Fil | Webb Impl | App Impl |
|-----------|-----|-----------|----------|
| `LabelScanner` | `src/components/bottles/LabelScanner.tsx` | `WebCamera` | `CameraCapture` |

*(Uppdateras vid nya komponenter)*

---

## Plugin Inventory

### Installerade Plugins

| Plugin | Version | Ansvar | Fil |
|--------|---------|--------|-----|
| `@capacitor/core` | 6.x | Core Capacitor API | - |
| `@capacitor/camera` | 6.x | Native camera access | `capacitor/plugins/camera.ts` |
| `@capacitor/push-notifications` | 6.x | Push notifications | `capacitor/plugins/notifications.ts` |
| `@capacitor/haptics` | 6.x | Haptic feedback | `capacitor/plugins/haptics.ts` |
| `@capacitor/status-bar` | 6.x | Status bar styling | `capacitor/plugins/statusbar.ts` |
| `@capacitor/network` | 6.x | Network monitoring | `capacitor/plugins/network.ts` |

*(Uppdateras vid nya plugins)*

---

## Changelog

### 2025-11-11 - Initial Setup

**Skapade:**
- `docs/CAPACITOR_ARCHITECTURE.md` - Detta dokument
- `docs/RELEASE_STRATEGY.md` - Release workflow documentation
- `docs/AGENTS.md` - Updated with Capacitor guidelines
- `shared/platform.ts` - Platform detection utility
- `shared/features.ts` - Feature flags system
- `capacitor.config.ts` - Capacitor configuration

**Uppdaterade:**
- `next.config.js` - Added conditional static export for Capacitor builds
- `tsconfig.json` - Added path aliases for @/shared and @/capacitor
- `package.json` - Installed @capacitor/core, @capacitor/cli, @capacitor/ios

**Beslut:**
- Använd Capacitor för iOS/Android (inte React Native eller native Swift)
- Max 150 lines per fil för AI-vänlighet
- Tre-lagers arkitektur: `src/`, `capacitor/`, `shared/`
- Service interface pattern för platform-specifik kod

**Viktigt Discovery - API Routes:**

Next.js static export (required for Capacitor) **CANNOT export API routes**. Detta är en fundamental limitation.

**Lösning:**
- Native apps pratar DIREKT med Supabase (samma som webb)
- För features som kräver serverless logic: Call Vercel-deployade API routes via HTTPS
- API routes körs ENDAST på Vercel (webb-deployment)
- Native appen är en "thick client" som använder Supabase direkt

**Exempel:**

```typescript
// ✅ NATIVE APP: Direct Supabase access
const { data } = await supabase
  .from('bottles')
  .select('*, wines(*)')
  .eq('user_id', userId);

// ✅ NATIVE APP: Call Vercel API för complex operations
const response = await fetch('https://wine-cellar.vercel.app/api/scan-label', {
  method: 'POST',
  body: formData,
});

// ❌ CANNOT: Use Next.js API routes directly in native build
// These don't exist in static export!
```

**Implications:**
- AI agents, Supabase queries, and business logic work identically in native and web
- Native apps call Vercel-deployed APIs for heavy operations (label scanning, enrichment)
- No "local API" in Capacitor build - all serverless functions run on Vercel

**Nästa steg:**
- iOS-projekt skapas när vi implementerar första native feature (kamera)
- Tills dess: Webbappen fungerar som vanligt
- Capacitor-struktur och dokumentation är redo

---

**Dokumentet uppdateras vid:**
- Nya features implementerade
- Nya plugins installerade
- Arkitekturella beslut fattade
- Breaking changes
- Lessons learned från implementation
