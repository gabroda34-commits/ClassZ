# Boxhead: 2Play Rooms — Tesla AOE Screen-Shake & Particles, Gorilla AI Overhaul & 16-Weapon Arsenal Expansion

This update elevates combat impact and tactical depth by adding multi-layered electric particle explosions and directional camera screen-shake to the **Tesla Silverback Gorilla's** AOE Tesla Cannon, upgrading the Gorilla's combat AI with predictive target leading, laser-sight charge telegraphs, and a shock-leap ability, and expanding the weapon dock from 10 to **16 unlockable weapons** across Elemental/Energy and Tactical Ordnance classes.

## User Review & Critical Decisions

> [!IMPORTANT]
> All design and gameplay preferences were confirmed via interactive questions and are incorporated below.

- **Confirmed Decision 1 — 6 New Exotic Weapon Variations (16 Total Weapons)**:
  - **Elemental & Energy Class**:
    1. **Dragonbreath Flamethrower**: Continuous cone of pressurized fire that ignites enemies with stacking burn damage-over-time (DoT) and leaves glowing embers.
    2. **Tesla Arc Rifle**: Fires high-voltage chain-lightning beams that jump across up to 4 nearby hostiles with instant electric arcs.
    3. **Cryo-Freeze Ray**: Fires sub-zero frost beams that chill and slow enemies (including Bosses and Gorillas) by up to 60% while tinting them in ice crystals.
  - **Tactical Ordnance Class**:
    4. **Auto-Sentry Turret**: Deploys autonomous 360° tracking gun turrets on the arena floor that automatically target and suppress nearby hostiles.
    5. **Ricochet Sawblade Launcher**: Launches high-velocity spinning titanium sawblades that pierce through zombie lines and bounce off arena walls up to 4 times.
    6. **Cluster Mortar**: Launches a high-arcing artillery shell over walls that detonates into 6 secondary mini-bomblets across a wide killzone.
- **Confirmed Decision 2 — Optimized Tesla Gorilla Combat AI**:
  - **Predictive Lead-Aiming**: Calculates target velocity to lead moving players rather than firing at stale positions, while steering around pillars and maintaining optimal artillery firing range.
  - **Laser-Sight Charge Telegraph**: Projects a pulsing cyan targeting laser and charges its shoulder Tesla coils for `0.65s` before firing the AOE Tesla Orb, giving skilled players a crisp visual and audio window to dodge.
  - **Shock-Leap Slam**: When a player closes within melee range or when the Gorilla is cornered/wounded, it executes a high-arcing **Shock-Leap** toward the engagement zone, landing with a localized electric tremor.
- **Confirmed Decision 3 — Expanded Scrollable Weapon Dock**:
  - All 6 new weapons are integrated directly into the **Combo Streak Unlock Progression** and the **Bottom Weapon Dock**, accessible via Mouse Scroll Wheel, Q/E cycling, on-screen Touch/Mobile controls, and direct hotkeys.

---

## 1. Overview & Core Concept

- **What It Does**: Enhances *Boxhead: 2Play Rooms* with kinetic screen-shake physics, multi-stage electric particle simulations for the Tesla Cannon AOE impact, smarter multi-phase AI for the Tesla Silverback Gorilla, and 6 new specialized weapons that create rich tactical synergies in Solo, 2P Local, and 10-Player Online Co-op.
- **Target Audience / Persona**: Action-arcade and roguelike co-op players who want visceral audiovisual hit feedback, readable enemy telegraphs, and diverse weapon loadouts.
- **Key Value**: Transforms the Tesla Gorilla into a signature mini-boss encounter with fair, readable counterplay and rewards high combo streaks with exotic elemental and tactical weaponry.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Tesla Cannon Telegraph & AOE Impact**: As a Tesla Silverback Gorilla locks onto a player, its shoulder coils crackle and a cyan targeting laser tracks the player's predicted movement path. Upon firing, the plasma orb crackles across the arena (`tesla_orb`) with trailing sparks and detonates with a camera screen-shake impulse, dual concentric shockwave rings, branching plasma lightning bolts, rising ionized embers, and persistent electrified floor scorches.
  2. **Expanded 16-Weapon Arsenal Dock**: Players unlock all 16 weapons through combo streaks (without forced auto-switching). Players can scroll with the mouse wheel, press `Q`/`E`, tap weapon cards on mobile/desktop, or use hotkeys to switch between classic ballistic weapons, Elemental/Energy weapons, and deployable Tactical Ordnance.
  3. **Bestiary & Arsenal Reference**: The in-game *Arsenal & Bestiary* modal displays all 16 weapons, their combo unlock thresholds, and the upgraded Tesla Gorilla abilities.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-Contrast Tactical Isometric Arcade (`60%` clean gridded concrete/basalt arena floor, `30%` dark slate `#141619` perimeter HUD, `10%` semantic accents).
  - *Color Palette & Particle Coding*:
    - **Tesla AOE & Arc Rifle**: Electric Cyan (`#38BDF8`), Core White (`#F8FAFC`), and Deep Cobalt (`#0284C7`).
    - **Flamethrower & Cluster Mortar**: Napalm Orange (`#F97316`), Solar Amber (`#FACC15`), and Crimson (`#EF4444`).
    - **Cryo-Freeze Ray**: Glacial Cyan (`#67E8F9`) and Frost Blue (`#22D3EE`).
    - **Auto-Sentry Turret & Sawblade**: Tactical Emerald (`#10B981`) and Titanium Silver (`#E2E8F0`).
  - *Typography & Hierarchy*: Display headers in `Oswald`, UI labels in `Plus Jakarta Sans`, and tabular ammo/combo/wave telemetry in `JetBrains Mono` (`tabular-nums`).
- **Interactive Feedback & Motion**:
  - Directional damped harmonic screen-shake (`shakeX`, `shakeY`, `shakeMagnitude`, `shakeDecay`) scaled by distance from the explosion Epicenter so nearby Tesla blasts feel thunderous while distant impacts provide subtle tremors.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Distance-Attenuated Directional Screen Shake + Multi-Layer Particle Emitter**:
  - *Chosen Approach*: Combine a directional impulse (pushed along the blast vector) with high-frequency rotational jitter and 4 distinct particle layers (1: fast radial electric sparks, 2: lingering ionized plasma motes with drag, 3: 12-segment jagged branching lightning arcs, 4: expanding dual-ring shockwaves).
  - *Why*: Pure random camera offset can feel disorienting; distance-attenuated directional shake paired with layered particles gives crisp spatial awareness of where the Tesla blast landed.
- **Decision 2 — Telegraph + Predictive Lead-Aiming for Tesla Gorilla AI**:
  - *Chosen Approach*: Give the Gorilla a 3-state combat brain (`STALK_AND_FLANK`, `LASER_CHARGE_TELEGRAPH`, `SHOCK_LEAP`) that predicts player velocity (`target.x + target.vx * leadTime`) and draws a visible laser sight during its `0.65s` charge-up before launching the AOE orb.
  - *Why*: Instantaneous AOE projectiles feel unfair when multiple Gorillas spawn; a visible laser charge-up and predictive lead-aiming reward player movement and dodging.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        React Perimeter HUD & Modals                        │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Top Perimeter Status │  │ 16-Slot Scrollable   │  │ Arsenal &        │  │
│  │ + Compact Touch Radar│  │ Weapon Dock + Wheel  │  │ Bestiary Modal   │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼─────────────────────────┼───────────────────────┼────────────┘
              │                         │                       │
              ▼                         ▼                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     60fps Canvas Engine (BoxheadEngine)                    │
│                                                                            │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │ Gorilla AI State Machine     │    │ 16-Weapon Firing & Deploy System │  │
│  │ • Predictive Velocity Lead   │    │ • Flamethrower (Burn DoT Cone)   │  │
│  │ • 0.65s Laser Telegraph      │    │ • Tesla Arc Rifle (Chain Bolt)   │  │
│  │ • Obstacle Flank Steering    │    │ • Cryo Ray (Chill/Slow Status)   │  │
│  │ • Shock-Leap AOE Slam        │    │ • Auto-Sentry Turret Entity      │  │
│  └──────────────┬───────────────┘    │ • Ricochet Sawblade (4 Bounces)  │  │
│                 │                    │ • Cluster Mortar (6 Bomblets)    │  │
│                 ▼                    └─────────────────┬────────────────┘  │
│  ┌─────────────────────────────────────────────────────┴────────────────┐  │
│  │      Tesla AOE Impact, Particle Physics & Screen-Shake Pipeline      │  │
│  │ • Distance-Attenuated Directional Shake + High-Frequency Jitter      │  │
│  │ • 4-Layer Particle Burst (Sparks, Plasma Orbs, Lightning, Scorch)    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Additions
- **Weapon Arsenal (`WeaponId`)**: Expands from 10 to 16 weapons (`flamethrower`, `cryo_ray`, `sawblade`, `tesla_rifle`, `auto_turret`, `cluster_mortar`) with dedicated combo unlock milestones, upgrade scaling levels (`L1`–`L6`), and custom procedural Web Audio sound effects.
- **Deployable Turrets (`TurretEntity`)**: Autonomous arena entities with position, remaining duration/ammo, target acquisition angle, and rapid-fire barrels.
- **Enemy Status Effects**: `burnTimer` / `burnDps` (from Flamethrower) and `chillTimer` / `slowFactor` (from Cryo-Freeze Ray) rendered visually on affected enemies.
- **Gorilla AI Fields (`EnemyEntity`)**: `aiState` (`'approach' | 'charging_shot' | 'leaping'`), `chargeTimer`, `aimTargetX`, `aimTargetY`, `leapVx`, `leapVy`, and `leapTimer`.
