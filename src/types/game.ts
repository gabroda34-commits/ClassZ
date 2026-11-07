export type GameMode = 'single' | 'coop' | 'deathmatch' | 'online_coop';
export type ArenaId = 'boxy' | 'columns' | 'hell';
export type GameScreenState =
  | 'LOADING'
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'WAVE_DRAFT'
  | 'PAUSED'
  | 'REVIVE_PROMPT'
  | 'GAME_OVER';

export type OperatorClassId = 'reaper' | 'marksman' | 'vanguard' | 'medic' | 'mage' | 'engineer';

export type HeroArchetypeRole = 'MELEE' | 'RANGED' | 'TANK' | 'HEALER' | 'MAGIC USER';

export type PcControlScheme = 'lol_mouse' | 'wasd';

export type AbilitySlotKey = 'Q' | 'W' | 'E' | 'R';

export type MobaItemId =
  | 'vampire_fang'
  | 'hellfire_cloak'
  | 'wraith_striders'
  | 'capacitor_coil'
  | 'necronomicon_tome'
  | 'gargoyle_plate'
  | 'frost_shard'
  | 'soul_reaver'
  | 'philosopher_chalice'
  | 'morrigan_hourglass';

export type MobaItemCategory = 'OFFENSE' | 'MAGIC' | 'DEFENSE' | 'UTILITY';

export type WeaponClass = 'sidearm' | 'smg' | 'shotgun' | 'marksman' | 'heavy' | 'support';

export type BossElement = 'fire' | 'lightning' | 'frost' | 'venom';

export type EnemyType =
  | 'zombie'
  | 'runner'
  | 'spitter'
  | 'sniper'
  | 'shield_brute'
  | 'crusher_tank'
  | 'bomber'
  | 'healer_shaman'
  | 'tesla_gorilla'
  | 'devil'
  | 'boss_fire'
  | 'boss_lightning'
  | 'boss_frost'
  | 'boss_venom';

export type WeaponId =
  | 'pistol'
  | 'revolver'
  | 'dual_pistols'
  | 'uzi'
  | 'vector_smg'
  | 'plasma_carbine'
  | 'shotgun'
  | 'auto_shotgun'
  | 'cryo_shotgun'
  | 'battle_rifle'
  | 'sniper_rifle'
  | 'railgun'
  | 'grenade'
  | 'rocket'
  | 'cluster_mortar'
  | 'flamethrower'
  | 'tesla_rifle'
  | 'sentry_turret'
  | 'barricade_kit';

export interface CurrencyBundle {
  gold: number;
  scrap: number;
  gems: number;
}

export interface HeroAbilityDefinition {
  slot: AbilitySlotKey;
  id: string;
  name: string;
  shortName?: string;
  type: 'ACTIVE' | 'PASSIVE';
  kind?: 'ACTIVE' | 'PASSIVE' | 'active' | 'passive';
  isPassive?: boolean;
  cooldown: number;
  baseCooldown: number;
  color: string;
  iconKind: string;
  description: string;
  scalingText: string;
}

export interface OperatorClassDefinition {
  id: OperatorClassId;
  name: string;
  shortName: string;
  archetypeLabel: HeroArchetypeRole;
  archetype: HeroArchetypeRole;
  roleTitle: string;
  color: string;
  primaryWeaponId: WeaponId;
  signatureWeaponVisualId: WeaponId;
  primaryWeaponName: string;
  signatureWeaponName: string;
  primaryWeaponDesc: string;
  signatureWeaponDesc: string;
  primaryAttackCooldown: number;
  primaryAttackDamage: number;
  primaryAttackRange: number;
  signatureRange: number;
  abilities: [HeroAbilityDefinition, HeroAbilityDefinition, HeroAbilityDefinition, HeroAbilityDefinition];
  preferredWeaponClasses: WeaponClass[];
  affinityBonusDesc: string;
  passiveName: string;
  passiveDesc: string;
  skillName: string;
  skillDesc: string;
  skillCooldown: number;
  baseHp: number;
  speedMultiplier: number;
  damageMultiplier: number;
  armorReduction: number;
}

export interface MobaItemDefinition {
  id: MobaItemId;
  name: string;
  shortName: string;
  category: MobaItemCategory;
  color: string;
  iconKind: string;
  starterUnlocked: boolean;
  minAccountRank: number;
  unlockCost: CurrencyBundle;
  baseUpgradeCost: CurrencyBundle;
  statSummary: string;
  effectName: string;
  effectDesc: string;
  passiveName: string;
  passiveDesc: string;
  stats: {
    bonusHp?: number;
    attackDamagePct?: number;
    abilityPowerPct?: number;
    attackSpeedPct?: number;
    moveSpeedPct?: number;
    armorPct?: number;
    cooldownHastePct?: number;
    lifestealPct?: number;
  };
  // Per-level stat scaling (Lv.1 to Lv.5)
  maxHpBonus: number;
  attackDamagePct: number;
  abilityPowerPct: number;
  attackSpeedPct: number;
  moveSpeedPct: number;
  armorBonus: number; // e.g. 0.06 = +6% damage reduction
  cooldownHastePct: number; // e.g. 0.08 = +8% CDR
  lifestealPct: number; // e.g. 0.07 = 7% lifesteal
  hpRegenPerSec: number;
  critChancePct: number;
}

export interface ItemUpgradeState {
  unlocked: boolean;
  level: number; // 1 to 5
  upgradeLevel: number; // 1 to 5
}

export interface WeaponStats {
  id: WeaponId;
  keyNumber: number;
  name: string;
  shortName: string;
  weaponClass: WeaponClass;
  element?: 'kinetic' | 'fire' | 'lightning' | 'frost' | 'explosive';
  starterUnlocked: boolean;
  minAccountRank: number;
  unlockCost: CurrencyBundle;
  baseUpgradeCost: CurrencyBundle;
  baseCooldown: number;
  baseDamage: number;
  magSize: number;
  reloadTime: number;
  baseReserveAmmo: number;
  maxReserveAmmo: number;
  isPlaceable?: boolean;
  isProjectile?: boolean;
  isHitscan?: boolean;
  isContinuousFlame?: boolean;
  isChainArc?: boolean;
  spreadAngle?: number;
  pellets?: number;
  pierce?: number;
  range?: number;
  blastRadius?: number;
  color: string;
  description: string;
}

export interface ArmoryWeaponUpgradeState {
  unlocked: boolean;
  level: number; // 1 to 5
  damageTier: number;
  fireRateTier: number;
  magTier: number;
  reloadTier: number;
}

export interface PlayerProfileState {
  accountRank: number;
  accountXp: number;
  accountXpToNext: number;
  currencies: CurrencyBundle;
  selectedClass: OperatorClassId;
  pcControlScheme: PcControlScheme;
  equippedItems: MobaItemId[]; // Up to 6 equipped MOBA items
  items: Record<MobaItemId, ItemUpgradeState>;
  heroAbilityLevels: Record<OperatorClassId, [number, number, number, number]>;
  equippedLoadout: WeaponId[];
  armory: Record<WeaponId, ArmoryWeaponUpgradeState>;
}

export interface GameSettings {
  // Gameplay & MOBA Controls
  pcControlScheme: PcControlScheme;
  mouseAim: boolean;
  autoReload: boolean;
  friendlyFire: boolean;
  notificationPosition: 'top-right' | 'top-left';
  // Accessibility
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  screenShakeIntensity: number; // 0 to 100
  uiScale: 'compact' | 'normal' | 'large';
  highContrastOutlines: boolean;
  reducedMotion: boolean;
  // Graphics
  particleDensity: 'low' | 'medium' | 'high';
  bloodDecals: boolean;
  dynamicGlow: boolean;
  floatingDamageNumbers: boolean;
  // Sound
  muted: boolean;
  musicVolume: number; // 0 to 100
  sfxVolume: number; // 0 to 100
  bgmStyle: 'industrial' | 'synthwave' | 'off';
}

export interface PlayerWeaponState {
  id: WeaponId;
  unlocked: boolean;
  magAmmo: number;
  magSize: number;
  reserveAmmo: number;
  maxReserveAmmo: number;
  reloadTime: number;
  isReloading: boolean;
  reloadTimer: number;
  fireRateMultiplier: number;
  damageMultiplier: number;
  blastRadiusMultiplier: number;
  extraPellets: number;
  piercingBonus: number;
  clusterBombs: boolean;
  upgradeLevel: number;
  hasClassAffinity: boolean;
}

export interface ComboMilestone {
  combo: number;
  title: string;
  subtitle: string;
  rewardGold: number;
  rewardScrap: number;
}

export type RoguelikePerkCategory = 'BUFF' | 'WEAPON' | 'ABILITY' | 'SYNERGY';
export type RoguelikePerkRarity = 'RARE' | 'EPIC' | 'LEGENDARY';

export interface RoguelikePerkDefinition {
  id: string;
  name: string;
  category: RoguelikePerkCategory;
  rarity: RoguelikePerkRarity;
  color: string;
  description: string;
  statSummary: string;
}

export interface ActivePerkState {
  id: string;
  name: string;
  category: RoguelikePerkCategory;
  color: string;
  stacks: number;
}

export interface ObstacleRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'wall' | 'crate' | 'pillar' | 'lava' | 'frost_spire';
  destructible?: boolean;
  hp?: number;
  maxHp?: number;
}

export interface ArenaDefinition {
  id: ArenaId;
  name: string;
  subtitle: string;
  difficultyLabel: string;
  width: number;
  height: number;
  floorColor: string;
  gridLineColor: string;
  wallTopColor: string;
  wallSideColor: string;
  accentColor: string;
  devilSpawnRateMultiplier: number;
  obstacles: ObstacleRect[];
  spawners: { x: number; y: number; dirX: number; dirY: number }[];
  p1Spawn: { x: number; y: number };
  p2Spawn: { x: number; y: number };
}

export interface PlayerAbilityHUDSlot {
  slot: AbilitySlotKey;
  id: string;
  name: string;
  shortName: string;
  type: 'ACTIVE' | 'PASSIVE';
  kind: 'ACTIVE' | 'PASSIVE';
  isPassive: boolean;
  cooldown: number;
  cooldownRemaining: number;
  maxCooldown: number;
  activeTimer: number;
  level: number;
  maxLevel: number;
  color: string;
  iconKind: string;
  description: string;
  scalingText: string;
}

export interface PlayerEquippedItemHUD {
  id: MobaItemId;
  name: string;
  shortName: string;
  category: MobaItemCategory;
  level: number;
  color: string;
  iconKind: string;
  statSummary: string;
  effectName: string;
  passiveName: string;
  passiveDesc: string;
  passiveSummary: string;
}

export interface PlayerHUDData {
  id: 1 | 2;
  name: string;
  operatorClass: OperatorClassId;
  className: string;
  roleTitle: string;
  archetypeLabel: HeroArchetypeRole;
  archetype: HeroArchetypeRole;
  classColor: string;
  primaryWeaponName: string;
  signatureWeaponName: string;
  signatureWeaponDesc: string;
  primaryAttackName: string;
  primaryAttackColor: string;
  primaryCooldownProgress: number;
  primaryAttackDamage: number;
  primaryAttackRate: number;
  alive: boolean;
  hp: number;
  maxHp: number;
  shieldHp: number;
  maxShieldHp: number;
  score: number;
  kills: number;
  deaths: number;
  frags: number;
  inMatchLevel: number;
  inMatchXp: number;
  inMatchXpToNext: number;
  // Computed Character Status from Base + Equipped Items + Boons
  attackDamage: number;
  abilityPower: number;
  attackSpeed: number;
  attacksPerSecond: number;
  armor: number;
  armorPct: number;
  moveSpeed: number;
  lifestealPct: number;
  critChancePct: number;
  cooldownHastePct: number;
  attackDamageBonusPct: number;
  abilityPowerBonusPct: number;
  attackSpeedBonusPct: number;
  pcControlScheme: PcControlScheme;
  // 4 Hero Abilities (Q, W, E Actives + R Passive)
  abilities: [PlayerAbilityHUDSlot, PlayerAbilityHUDSlot, PlayerAbilityHUDSlot, PlayerAbilityHUDSlot];
  // 6-Slot Equipped MOBA Items
  equippedItems: PlayerEquippedItemHUD[];
  // Legacy compat fields
  skillName: string;
  skillCooldown: number;
  skillMaxCooldown: number;
  skillActiveTimer: number;
  activeWeaponIndex: number;
  weapons: {
    id: WeaponId;
    keyNumber: number;
    name: string;
    shortName: string;
    weaponClass: WeaponClass;
    unlocked: boolean;
    magAmmo: number;
    magSize: number;
    reserveAmmo: number;
    maxReserveAmmo: number;
    isReloading: boolean;
    reloadProgress: number;
    upgradeLevel: number;
    hasClassAffinity: boolean;
    color: string;
  }[];
  activeTurrets: number;
}

export interface BossHUDData {
  name: string;
  title: string;
  isMegaBoss?: boolean;
  element: BossElement;
  elementLabel: string;
  elementColor: string;
  weaknessText: string;
  resistanceText: string;
  scaledPlayers: number;
  hp: number;
  maxHp: number;
  phase: number;
}

export interface RemoteAllyHUD {
  id: string;
  name: string;
  color: string;
  operatorClass?: OperatorClassId;
  hp: number;
  maxHp: number;
  alive: boolean;
  weaponId: WeaponId;
  score: number;
  kills: number;
  isHost?: boolean;
}

export type TacticalPingKind = 'RALLY' | 'ENEMY' | 'SUPPLY';

export interface TacticalPingData {
  id: string;
  senderName: string;
  senderColor: string;
  kind: TacticalPingKind;
  label: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export interface MinimapData {
  worldWidth: number;
  worldHeight: number;
  cameraX: number;
  cameraY: number;
  cameraW: number;
  cameraH: number;
  players: { id: string; x: number; y: number; alive: boolean; color: string }[];
  enemies: { x: number; y: number; isBoss: boolean; isDevil: boolean; element?: BossElement }[];
  pickups: { x: number; y: number }[];
  pings: TacticalPingData[];
}

export interface ReviveOfferData {
  secondsRemaining: number;
  goldCost: number;
  gemCost: number;
  reviveCount: number;
  canAffordGold: boolean;
  canAffordGems: boolean;
}

export interface HUDStateSnapshot {
  screen: GameScreenState;
  mode: GameMode;
  arenaId: ArenaId;
  isPortrait: boolean;
  pcControlScheme: PcControlScheme;
  wave: number;
  isBossWave: boolean;
  nextBossWave: number;
  enemiesRemaining: number;
  combo: number;
  maxCombo: number;
  comboProgress: number;
  overdriveBonusPct: number;
  p1: PlayerHUDData;
  p2: PlayerHUDData | null;
  remoteAllies: RemoteAllyHUD[];
  boss: BossHUDData | null;
  activePerks: ActivePerkState[];
  draftChoices: RoguelikePerkDefinition[];
  rerollsLeft: number;
  minimap: MinimapData;
  currencies: CurrencyBundle;
  sessionEarned: CurrencyBundle;
  accountRank: number;
  accountXp: number;
  accountXpToNext: number;
  reviveOffer: ReviveOfferData | null;
  winnerText: string | null;
  recentBanner: { title: string; subtitle: string; color: string; timestamp: number } | null;
  elapsedSeconds: number;
}

export interface LobbySummary {
  code: string;
  name: string;
  isPrivate: boolean;
  arenaId: ArenaId;
  status: 'WAITING' | 'IN_GAME';
  wave: number;
  playerCount: number;
  maxPlayers: number;
  hostName: string;
}

export interface LobbyChatMessage {
  id: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
}

export interface LobbyDetail extends LobbySummary {
  members: {
    id: string;
    name: string;
    color: string;
    operatorClass?: OperatorClassId;
    ready: boolean;
    isHost: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    hp: number;
    maxHp: number;
    alive: boolean;
    weaponId: WeaponId;
    score: number;
    kills: number;
    droneCount: number;
  }[];
  chat: LobbyChatMessage[];
}

export interface HighScoreRecord {
  key: string;
  highScore: number;
  maxCombo: number;
  maxWave: number;
}
