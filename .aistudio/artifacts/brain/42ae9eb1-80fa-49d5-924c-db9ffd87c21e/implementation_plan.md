# Boxhead: 2Play Rooms — Visual Vector Overhaul, Clean UI & Account Sync Plan

A visual-first redesign that replaces text-heavy menus with custom SVG vector weapon illustrations, Operator Class character portraits, and visual stat bars, paired with a built-in Username & Password account system that saves and syncs progression across devices.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Design & Architecture Choices (From Phase 1 Clarifications)**
> - **Username & Password Progression Sync**: Built-in Express server account store (`/api/auth/register`, `/api/auth/login`, `/api/profile/sync`) persisted on the server (`data/accounts.json`) and cached locally so players can sign in from any device with a simple username and password to restore their Account Rank, Gold, Tech Scrap, Plasma Gems, Operator Class, Armory unlocks, upgrades, and High Scores.
> - **Detailed SVG Vector Art & Portraits**: Every one of the **16 Weapons** and **4 Operator Classes** (plus the **3 Arenas** and **4 Elemental Bosses**) receives a bespoke, multi-layered SVG vector illustration component with glowing elemental accents, weapon silhouettes, and tactical portraits.
> - **Visual Icon Cards & Reduced Text**: Strip long paragraph descriptions from the main Command Center and Armory grids. Replace text walls with visual artwork cards, compact segmented stat bars (`DMG`, `ROF`, `MAG`), icon badges, and an optional `(i)` info tooltip/drawer only when the player taps for deeper lore/details.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Visual-First Command Center & Armory**: Transforms the Title Hub, Class Selector, Arena Picker, Armory Shop, and In-Game Weapon Dock from text-dense cards into clean, high-contrast visual showcases driven by custom SVG illustrations and icon-based progress bars.
  2. **16 Custom Weapon Vector Illustrations & 4 Operator Class Portraits**:
     - **4 Operator Portraits**: Detailed vector character busts for *Marksman (Sniper Visor & Reticle)*, *Field Medic (Bio-Cross & Nanite Halo)*, *Vanguard (Heavy Riot Helmet & Aegis Shield)*, and *Combat Engineer (Tech Goggles & Sentry Rig)*.
     - **16 Weapon Vector Blueprints**: Distinct side-profile vector weapon art for every gun (*9mm Pistol, .44 Magnum, Micro-Uzi, Vector SMG, Plasma Carbine, Pump Shotgun, Sweeper Auto-Shotgun, Cryo-Blast Shotgun, DMR Battle Rifle, .50 Antimateriel Sniper, Gauss Railgun, Frag Grenade, RPG-7, Cluster Mortar, Napalm Flamethrower, Tesla Arc Rifle, Auto-Sentry Turret*) with color-coded elemental cores.
     - **3 Arena & 4 Elemental Boss Vector Emblems**: Custom vector badges for *Boxy Citadel*, *Columns Mega-Bunker*, *Hell Caldera*, and the 4 Elemental Bosses (*Fire, Lightning, Frost, Venom*).
  3. **Simple Username & Password Login & Auto-Sync**:
     - Players can register or log in with a **Username** and **Password** directly from the top bar (or play immediately and bind their guest progress to a new account at any time).
     - Automatically syncs Account Rank, XP, Currencies (`Gold`, `Scrap`, `Gems`), Operator Class, 16-Weapon Armory upgrade states, Settings, and High Scores with the backend server after every wave, purchase, or upgrade.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Clean Command Center Hub**:
   - **Top Bar**: Shows Account Badge (Username + Rank Ring + Login/Account button), 3 compact Currency counters with icons (`Gold`, `Scrap`, `Gems`), and icon-only or single-word quick buttons (`Armory`, `Online`, `Bestiary`, `Settings`, `Mute`).
   - **Center Visual Grid**:
     - **Operator Class Cards**: 4 tall portrait cards displaying the custom SVG Operator Portrait, Class Name, Role Tag, HP badge, and preferred weapon class icons. Clicking a card selects the class; a single compact strip underneath shows 3 icon pills for *Synergy*, *Passive*, and *Active Skill [C]* (hover/tap for full details).
     - **Arena & Mode Visual Cards**: 3 visual arena preview cards with architectural vector thumbnails and 4 clean mode tiles with vector icons—zero paragraph clutter.
     - **Launch Bar**: Bold primary **DEPLOY** CTA and a compact **BOSS RAID (WAVE 5)** quick-launch button.
2. **Visual Armory Grid**:
   - Each weapon card features a **large side-profile SVG weapon illustration** in an illuminated weapon bay, a 5-pip upgrade level indicator (`▪▪▪▫▫`), 3 visual stat bars (`DMG`, `ROF`, `MAG`), a class synergy star badge, and a single Unlock/Upgrade button. Detailed text descriptions are tucked into a subtle `(i)` hover/tap popover.
3. **Simple Username & Password Account Modal**:
   - Accessible from the top-left **Commander Account** button.
   - Clean 2-tab switch (**Sign In** / **Create Account**) with just `Username` and `Password` fields.
   - If the player has already earned progress as a guest, creating an account automatically merges and uploads their current rank, currencies, and unlocked weapons.
   - Shows a green `"SYNCED"` badge in the header once logged in, with a 1-click **Sync Now** and **Log Out** option.

### Visual Identity & Theme
- **Aesthetic Direction**: High-Craft Dark Tactical Arcade UI—clean silhouettes, glowing weapon bay blueprints, segmented stat meters, and zero wall-of-text clutter.
- **Color Palette**:
  - Canvas & Deep Surfaces: `#0B0D11` (`slate-950`) and `#111622` (`slate-900/90`)
  - Weapon Bay Blueprint Grid: Subtle radial glow matching each weapon's elemental signature (`#94A3B8` Kinetic, `#F97316` Fire, `#22D3EE` Volt, `#60A5FA` Frost, `#EF4444` Explosive, `#10B981` Support)
- **Typography & Scannability**:
  - Card titles in `Oswald` uppercase (`14px–18px`), numeric stats in `JetBrains Mono` (`tabular-nums`), and maximum 3 data points per card face.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Built-in Server Account Store with Password Hashing (`crypto.scryptSync`)**
  - *Chosen Approach*: Store accounts on the Express backend (`data/accounts.json`) using Node's native `crypto` module (`scryptSync` + random salt for passwords and signed session tokens) with automatic client-server merge sync.
  - *Why*: Works out-of-the-box with zero external OAuth popups or third-party configuration, allows instant registration with just a username and password, and syncs across devices/tabs connected to the server.
- **Decision 2: Dedicated SVG Vector Art Library Component**
  - *Chosen Approach*: Build a dedicated vector artwork renderer (`GameVectorArt.tsx`) containing handcrafted, multi-layered SVG illustrations for all 4 Operator Classes, all 16+ Weapons, 3 Arenas, and 4 Elemental Bosses.
  - *Why*: Crisp at any resolution on both mobile portrait and 4K desktop screens, zero network image loading delay, and dynamically tintable with elemental/upgrade glow effects.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram
```
┌───────────────────────────────────────────────────────────────────────────┐
│                        React Frontend (App.tsx)                           │
│                                                                           │
│  ┌─────────────────────────┐  ┌───────────────────────┐  ┌─────────────┐  │
│  │ Command Center (Clean)  │  │ Visual Armory Modal   │  │ Account Auth│  │
│  │ • OperatorPortraitSVG   │  │ • WeaponBlueprintSVG  │  │ Modal       │  │
│  │ • ArenaPreviewSVG       │  │ • 5-Pip Level Meter   │  │ • Login /   │  │
│  │ • ModeIconSVG           │  │ • Segmented Stat Bars │  │   Register  │  │
│  └───────────┬─────────────┘  └───────────┬───────────┘  └──────┬──────┘  │
│              └────────────────────────────┼─────────────────────┘         │
│                                           ▼                               │
│                     ┌──────────────────────────────────┐                  │
│                     │     ProgressionManager           │                  │
│                     │ • LocalStorage + Debounced Sync  │                  │
│                     │ • Merge Guest -> Account State   │                  │
│                     └─────────────────┬────────────────┘                  │
└───────────────────────────────────────┼───────────────────────────────────┘
                                        │ REST JSON (/api/auth/*, /api/profile/sync)
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                     Express + WS Backend (server.ts)                      │
│  • POST /api/auth/register (username, password, initialProfile)           │
│  • POST /api/auth/login    (username, password) -> token + savedProfile   │
│  • GET  /api/auth/me       (Bearer token) -> savedProfile                 │
│  • POST /api/profile/sync  (Bearer token, profile, highScores)            │
│  • Persistent JSON Store   (data/accounts.json with scrypt password hash) │
└───────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
1. **Account Registration & Login Flow**:
   - Submitting **Create Account** (`POST /api/auth/register`) validates `username` (3–20 chars) and `password` (4+ chars), hashes the password with a random salt, saves the player's current `profile` and `highScores` to `data/accounts.json`, and returns an `authToken` + `username`.
   - Submitting **Sign In** (`POST /api/auth/login`) verifies credentials and merges the server profile with local progress (taking the highest `accountRank`, `currencies`, and weapon `level`s so progress is never lost).
2. **Automatic Cloud Progression Sync**:
   - Whenever `progressionManager.saveProfile()` is triggered (after unlocking/upgrading a weapon, completing a wave, or finishing a match) while logged in, it debounces a `POST /api/profile/sync` request to persist the updated profile on the server.
3. **Visual Card Interactions**:
   - Clicking an **Operator Portrait Card** updates `selectedClass` and highlights matching Weapon Class cards with a glowing synergy badge.
   - Clicking a **Weapon Blueprint Card** in the Armory unlocks or upgrades the weapon; tapping the `(i)` icon toggles a compact floating tooltip with full weapon mechanics.
