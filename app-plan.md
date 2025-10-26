 Current State

  - Next.js 15 PWA with
  Tailwind and service worker
  already configured via
  next.config.js:1
  - Mobile-first UI; relies
  on camera uploads for future
  label scanning, so native
  bridge must expose media
  capture
  - Server features (Prisma,
  NextAuth) mean the app
  must stay connected to the
  hosted backend, so offline
  is limited to what the PWA
  caches

  Recommended Direction

  - Wrap the existing PWA in
  a Capacitor iOS shell so the
  native bundle is thin and
  all functional updates ship
  from your Next.js deployment
  - Use Capacitor plugins
  (camera, secure storage if
  needed later) only where the
  web stack falls short; any
  new native plugin requires
  App Store review
  - Keep the hosted Next.js
  app as the live source of
  truth; publish web releases
  to trigger “new version
  available” prompts inside
  the shell

  Implementation Plan

  - Harden the PWA: audit
  manifest/icons, make sure
  all critical views work in
  Safari/iPhone simulators,
  and add an in-app “refresh
  for latest version” flow
  - Add Capacitor (@capacitor/
  core, @capacitor/cli) and
  create a capacitor.config.ts
  pointing server.url to your
  production Next.js domain
  - Generate the iOS project
  (npx cap add ios), enable
  camera/photo permissions,
  and add a small adaptor
  script so the web app can
  call Capacitor’s camera
  plugin when the AI label
  scanner ships
  - Automate builds with
  Fastlane: signing,
  incrementing build numbers,
  and pushing to TestFlight/
  App Store Connect
  - Add monitoring: keep Apple
  crash logs, tie Sentry (or
  similar) to both the web app
  and native shell

  Update Workflow

  - Routine feature/content
  updates: deploy new Next.js
  build; Capacitor shell loads
  it the next time the user
  opens the app (optionally
  compare a /version.json
  endpoint to prompt a reload)
  - Urgent hotfix while app
  is open: use service-worker
  skipWaiting + postMessage to
  push a soft reboot
  - Native-breaking change
  (new plugin, entitlement,
  deep OS integration): cut
  a new iOS build, but keep
  them rare
  - Optional: integrate
  @capacitor/updater to cache
  packaged web assets for
  offline-first behavior while
  still pulling zips over
  the air

  Risks & Mitigations

  - Apple review: ensure
  the wrapped app feels app-
  like (splash screen, native
  navigation chrome if needed)
  and document remote-code
  usage in review notes
  - Camera quality: test on
  real devices; fallback to
  native camera plugin to
  avoid WebView limitations
  - Authentication redirects:
  confirm NextAuth callbacks
  work inside the webview; use
  universal links or custom
  scheme when necessary
  - Offline expectations:
  communicate that AI label
  scanning needs connectivity;
  consider background sync for
  queueing scans

  Next Steps

  - Decide on hosting domain/
  SSL for the production web
  app
  - Create a prototype
  Capacitor shell, run on
  simulator and physical
  device, validate auth +
  file upload
  - Draft Fastlane lanes for
  beta distribution and gather
  provisioning assets from
  Apple Developer account