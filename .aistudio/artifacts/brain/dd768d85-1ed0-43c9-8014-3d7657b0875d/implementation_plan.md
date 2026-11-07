# Hero Visual Overhaul, Authentic Skill Mechanics, Two-Tier Bosses & Streamlined Loot

This update overhauls all 5 hero classes so each character has a distinct visual identity, unique signature weapon behavior, and authentic `[Q]`, `[W]`, `[E]`, and `[R]` skill mechanics and animations, introduces a two-tier boss structure (**End-of-Wave Boss at the end of every wave** + **Cataclysmic Mega Raid Boss every 5 waves**), and streamlines all enemy loot drops exclusively to **XP and Gold**.

## User Review & Critical Decisions

> [!IMPORTANT]
> The plan has been updated to rework all mob and boss drops so enemies exclusively drop **XP and Gold**, keeping the battlefield clean and progression focused on leveling skills and buying upgrades.

- **Confirmed Decision — Hero Visual Differentiation**: Distinct silhouettes, armor, signature weapons, ambient class foot-auras, and pixel-art UI portraits for all 5 classes.
- **Confirmed Decision — Deep Skill & Primary Attack Overhaul**: Every class's primary weapon and all 20 `[Q][W][E][R]` abilities use custom animations, persistent ground zones, summons, and projectile behaviors matching their exact descriptions.
- **Confirmed Decision — Two-Tier Boss System**:
  - **Every Wave Climax (Waves 1, 2, 3, 4, 6, 7, …)**: Once the regular wave horde finishes spawning, a **Wave Warden Mini-Boss** emerges as the final guardian of that wave.
  - **Every 5th Wave Cataclysm (Waves 5, 10, 15, 20, …)**: A **Cataclysmic Mega Raid Boss** spawns with massive health, multi-phase enrage patterns, elite minion summons, bullet-hell / telegraphed elemental attacks, and a strict per-hit armor cap.
- **Confirmed Decision — Streamlined Mob Drops (XP & Gold Only)**:
  - Removed all miscellaneous/clutter item drops (health packs, ammo crates, temporary power-up tokens, etc.) from enemy deaths.
  - Mobs and bosses now **exclusively drop XP Orbs and Gold Coins** (with magnetic pickup pull, clear pixel icons, and massive Gold + XP jackpots from Wave Bosses and Mega Raid Bosses).

---

## 1. Overview & Core Concept

- **What It Does**: Transforms combat readability, hero fantasy, loot clarity, and wave pacing so every hero looks and plays like a true gothic-arcade archetype, every wave builds toward a climactic boss battle (with a Mega Raid Boss every 5th wave), and enemy drops are purely focused on **XP** (for hero level-ups & skill ranks) and **Gold** (for shop & stat upgrades).
- **Target Audience / Persona**: Action-roguelite and co-op arena survival players who want tactile class variety, readable skill descriptions before and during runs, clean battlefield loot, and intense boss fights.
- **Key Value**: Eliminates visual repetition across classes and skills, removes battlefield drop clutter in favor of pure XP & Gold progression, and makes every wave end in a rewarding boss fight.

---

## 2. User Experience & Visual Design

### Distinct Character Visuals (Silhouettes, Auras & UI Portraits)
1. **Unique Multi-Frame Pixel Silhouettes**:
   - **Crypt Reaper (Melee)**: Tattered crimson/obsidian hooded cloak, glowing skull mask, trailing shadow cape, floating crimson soul wisps, and an oversized **Cursed Soul Scythe** with a sweeping crimson blade.
   - **Witch Hunter (Ranged)**: Wide-brimmed Van Helsing leather duster and slouch hat, silver stake bandolier across the chest, golden monocle, and a heavy **Silver Vanquisher Crossbow**.
   - **Grave Warden (Tank)**: Hulking broad-shouldered **Gargoyle Stoneplate** juggernaut with horned gargoyle pauldrons, glowing amber visor, granite tombstone crest, and a massive **Gargoyle Crypt Maul**.
   - **Plague Alchemist (Healer)**: Iconic **Plague Doctor** beaked mask and emerald apothecary hood, bandolier of glowing neon-green elixir flasks, pressurized backpack cauldron tank, and **Necro-Tonic Syringe Launcher**.
   - **Necro-Warlock (Magic User)**: Towering horned lich crown and tattered violet astral robes, levitating hover animation with arcane runes orbiting his feet, and the **Eldritch Skull Staff** burning with violet soul-fire.
2. **Ambient Class Auras & UI Portraits**:
   - Subtle class-specific foot sigils on the battlefield: crimson blood-mist for Reaper, silver crosshair sigil for Hunter, granite bastion plates for Warden, pulsing emerald apothecary circle for Alchemist, and rotating arcane pentagram for Warlock.
   - Custom pixel-art hero portrait badges rendered on the Title Screen class cards, the in-game Pause Menu skill inspection sheet, and the bottom combat HUD.

---

## 3. Unique Signature Primary Attacks & 20 Authentic Hero Skills

### Signature Primary Attacks
- **Crypt Reaper — Cursed Soul Scythe**: Multi-layered 140° crescent crimson scythe slash arc with blood-petal particles, staggering all undead in the cleave and drawing crimson Soul Siphon wisps on hit.
- **Witch Hunter — Silver Vanquisher Crossbow**: High-velocity consecrated silver stake bolts with cross-shaped tips and silver streak wakes that pierce through undead ranks and spark golden crit flares on elites and bosses.
- **Grave Warden — Gargoyle Crypt Maul**: Directional frontal earth-slam shockwave cone with flying granite rubble that fractures the crypt floor and knocks zombies backward.
- **Plague Alchemist — Necro-Tonic Syringe Launcher**: Glowing emerald syringe darts that burst into corrosive green droplets on impact (shredding enemy armor) while releasing green healing mist sparkles toward wounded allies.
- **Necro-Warlock — Eldritch Skull Staff**: Blazing violet soul-fire skull bolts that detonate in an arcane splash on impact and visibly arc purple soul-lightning to a nearby enemy.

### Authentic Class Abilities (`[Q] [W] [E] [R]`)
- **Crypt Reaper**:
  - **`[Q]` Phantom Scythe Dash**: Leaves 4 translucent crimson shadow-clone afterimages along the dash path and carves twin diagonal X-slash crescent waves through every enemy crossed, applying a dripping bleed effect.
  - **`[W]` Whirlwind Harvest**: Spins a continuous 360° multi-blade crimson scythe vortex around the Reaper for 1.2s that repeatedly cleaves, knocks back, and siphons HP orbs from surrounding undead.
  - **`[E]` Executioner's Guillotine**: Leaps forward and drops a colossal spectral crimson Guillotine blade from above onto the impact zone, splitting the ground with radial blood fissures and triggering a golden `EXECUTE 2X!` burst on foes below 50% HP.
  - **`[R]` Soul Siphon (Passive)**: Spawns homing crimson soul wisps from struck/slain foes and surrounds the Reaper with a fiery Blood Frenzy aura while attack speed stacks are active.
- **Witch Hunter**:
  - **`[Q]` Fan of Silver Stakes**: Fires 9 physical winged silver stake projectiles in a wide cone that pierce through waves with silver runic wakes.
  - **`[W]` Hunter's Evasive Vault**: Performs an acrobatic backflip with smoke/feather afterimages while dropping a visible ticking **Cursed Pumpkin Snare** that erupts in spectral chains, rooting and blasting nearby undead.
  - **`[E]` Blood-Moon Deadeye**: Summons a glowing crimson **Blood-Moon Crest** above the Hunter and a rotating targeting reticle under his feet for 6s; every bolt fired becomes an empowered crimson-gold laser stake with guaranteed crits.
  - **`[R]` Consecrated Silver (Passive)**: Flashes silver cross impact sigils on elites and bosses when bonus Consecrated Silver damage triggers.
- **Grave Warden**:
  - **`[Q]` Tombstone Bull-Charge**: Raises a massive granite **R.I.P. Tombstone Shield** in front of the Warden while charging forward, plowing through undead, leaving cracked cobblestone tracks, and stunning trampled foes.
  - **`[W]` Catacomb Earthshaker**: Smashes the floor to create a persistent 3.5s **Seismic Crater Zone** with radiating stone fissures and erupting mini-tombstone spikes around a 220px perimeter that slow undead by 50%.
  - **`[E]` Iron Crypt Bastion**: Summons 4 orbiting **Gargoyle Stone Shields** that spin around the Warden for 5.5s, emitting thorny golden-cyan shockwave pulses that damage and repel attackers.
  - **`[R]` Gargoyle Stoneplates (Passive)**: Displays a stone-armor crest shimmer when mitigating damage and green vitality runes when regenerating near monsters.
- **Plague Alchemist**:
  - **`[Q]` Panacea Healing Brew**: Shatters an emerald panacea elixir that sends out a lush herbal wave, spawning rising pixel `+` healing crosses and emerald speed-wings around self and all allies.
  - **`[W]` Blight Cauldron Flask**: Hurls 3 green glass alchemical flasks in an arc that shatter into **persistent 5s bubbling Toxic Acid Pools** on the ground—melting armor, dealing damage over time, and slowing undead inside.
  - **`[E]` Necro-Sanctuary Totem**: Deploys an **Apothecary Caduceus Totem** surrounded by a glowing 160px emerald Sanctuary runic circle that pulses healing waves to allies every second and zaps nearby zombies with alchemical lightning.
  - **`[R]` Apothecary Aura (Passive)**: Renders a gentle rotating herbal alchemy circle with floating green spores that visibly tether to nearby wounded allies.
- **Necro-Warlock**:
  - **`[Q]` Hellfire Jack-o'-Meteor**: Marks the target zone with a fiery pentagram sigil and calls down **5 blazing Jack-o'-Lantern meteors** streaking diagonally from the sky, detonating in staggered fiery blasts and leaving burning ember craters.
  - **`[W]` Franken-Chain Tempest**: Unleashes jagged, multi-forked cyan-violet necromantic lightning arcs that visibly jump from zombie to zombie (up to 8 targets) with crackling static rings.
  - **`[E]` Wraith Phase & Frost Nova**: Leaves a ghostly Wraith Portal and exploding **Grave-Frost Ice Spikes** at the departure point (encasing nearby zombies in translucent ice blocks), phases through the ether with spectral wisps, and erupts in an Arcane Nova on arrival.
  - **`[R]` Arcane Soul Resonance (Passive)**: Displays 1–3 orbiting soul-charge orbs around the Warlock and unleashes a multi-ring purple Eldritch Soul Nova with flying rune glyphs on every 4th staff attack.

---

## 4. Two-Tier Boss System & Streamlined XP + Gold Loot

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           WAVE PROGRESSION FLOW                            │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
┌───────────────────────────────────┐   ┌────────────────────────────────────┐
│   STANDARD WAVES (1, 2, 3, 4…)    │   │    MEGA RAID WAVES (5, 10, 15…)    │
├───────────────────────────────────┤   ├────────────────────────────────────┤
│ 1. Regular Undead Horde Spawns    │   │ 1. Vanguard Escort Horde Spawns    │
│    • Drops ONLY XP & Gold         │   │    • Drops ONLY XP & Gold          │
│ 2. Horde Depleted -> Warning!     │   │ 2. CATACLYSMIC OVERLORD Arrives    │
│ 3. WAVE WARDEN BOSS Spawns        │   │    • Massive Raid HP (3.5x–4x)     │
│    • Themed Elemental Mini-Boss   │   │    • 5% Max-HP Per-Hit Armor Cap   │
│    • Dedicated Boss HP Bar        │   │    • Phase 2 (60%) & Phase 3 (30%) │
│    • Dash + Radial Ring Attacks   │   │    • Bullet-Hell, Meteors & Summons│
│ 4. Slay Wave Boss -> Gold & XP    │   │ 3. Slay Mega Boss -> Huge Gold &   │
│    Shower -> Wave Clear           │   │    XP Jackpot Fountain!            │
└───────────────────────────────────┘   └────────────────────────────────────┘
```

### Tier 1: End-of-Wave Boss (Every Non-5th Wave Climax)
- **Trigger Timing**: During every standard wave (Waves 1, 2, 3, 4, 6, 7, 8, 9, etc.), once the regular wave horde finishes spawning (`enemiesToSpawnInWave === 0`), the wave does **not** end until the **End-of-Wave Boss** is defeated.
- **Presentation & Mechanics**:
  - Announces `⚠ WAVE [X] BOSS APPROACHING!` with a dramatic alert banner and top-center Boss Health Bar.
  - Spawns a themed **Crypt Wave Warden** (e.g., *Dread Grave Executioner*, *Blighted Bone Goliath*, *Frostbound Crypt Knight*, *Hellfire Gargoyle Lord*) scaled to the current wave.
  - Uses telegraphed shockwave slams, charge lunges, and elemental bursts, erupting into a shower of **Gold Coins** and **XP Orbs** on defeat.

### Tier 2: Every 5 Waves — Cataclysmic Mega Raid Boss (`wave % 5 === 0`)
- **Massive Stat & Armor Scaling**:
  - **3.5x–4x Raid Health Pool** with a strict **5% Max-HP Per-Hit Armor Cap** (down from 12%), preventing sudden burst one-shots and guaranteeing an intense raid battle.
  - **Colossal Visual Presence**: `2.4x` pixel boss sprite scale with dual counter-rotating elemental magic circles, a crown of floating elemental obelisks, screen-shake footsteps, and a dedicated **MEGA RAID BOSS** skull banner.
- **3-Phase Enrage & Attack Patterns**:
  - **Phase 1 (100% – 60% HP)**: Heavy telegraphed elemental shockwaves, radial projectile barrages (8-way elemental bolts), and seismic charge slams.
  - **Phase 2 (60% – 30% HP — *Blood Enrage*)**: Boss erupts in a crimson-gold aura, increases movement and attack speed by 35%, summons an escort pack of Elite Undead Guardians, and casts targeted **Cataclysm Hazard Zones** (meteors, frost spikes, or toxic pools) under players' feet.
  - **Phase 3 (Below 30% HP — *Overlord Cataclysm*)**: Unleashes spiral bullet-hell novas, chain-dash combos, and continuous elemental storms until slain, erupting into a massive fountain of **High-Value Gold Pouches** and **Greater XP Orbs**.

### Streamlined Mob Loot: XP & Gold Only
- **Pure XP & Gold Drops**:
  - All regular zombies, elites, Wave Bosses, and Mega Bosses exclusively drop **XP Orbs** (cyan/violet soul gems that fill the hero XP bar and level up skills/stats) and **Gold** (gleaming pixel coins and gold pouches for the between-wave upgrade shop).
  - Removes random clutter pickups (such as health packs, speed/damage buff tokens, or ammo boxes) from mob drop tables so healing and utility come authentically from hero skills (like the Plague Alchemist's *Panacea Healing Brew* & *Sanctuary Totem* or Crypt Reaper's *Soul Siphon*) and shop upgrades.
  - Smooth magnetic attraction pulls nearby XP Orbs and Gold Coins toward the player with crisp `+XP` and `+GOLD` floating text feedback.

---

## 5. Technical Architecture & State Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       GAME ENGINE & RENDER PIPELINE                     │
├──────────────────────┬──────────────────────────┬───────────────────────┤
│   PIXEL ART SYSTEM   │   COMBAT & SKILL ENGINE  │  WAVE, BOSS & LOOT    │
│                      │                          │                       │
│ • 5 Distinct 20x20   │ • Class Primary Attacks  │ • Standard Horde Queue│
│   2-Frame Matrices   │   (Cleave, Piercing Bolt,│ • End-of-Wave Boss    │
│ • 5 Signature Weapon │    Maul Cone, Syringe,   │   Trigger Flag        │
│   Sprite Renderers   │    Arcane Chain Bolt)    │ • Every-5-Wave Mega   │
│ • UI Portrait Canvas │ • Active Skill Entities: │   Raid Boss & 3-Phase │
│   Component          │   - Ground Hazard Zones  │   AI Loop             │
│ • XP Gem & Gold Coin │   - Orbiting Shields     │ • XP & Gold Exclusive │
│   Pixel Sprites      │   - Sanctuary Totems     │   Magnet Drop System  │
└──────────────────────┴──────────────────────────┴───────────────────────┘
```

- **Ground Zones & Persistent Skill Entities**: Extends the active combat loop to update and render persistent class skill zones (Plague Alchemist's bubbling *Toxic Acid Pools* and *Necro-Sanctuary Totem*, Grave Warden's *Seismic Crater* and orbiting *Gargoyle Stone Shields*, Witch Hunter's *Cursed Pumpkin Snare*, and Necro-Warlock's *Jack-o'-Meteors* and *Frost Nova Ice Blocks*).
- **Loot Table Simplification**: Replaces the multi-item mob drop table with a dedicated **XP Orb + Gold Coin** drop generator scaled by enemy tier (Standard Zombie, Elite, End-of-Wave Boss, and Every-5-Wave Mega Boss).
