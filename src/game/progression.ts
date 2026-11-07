import {
  ArmoryWeaponUpgradeState,
  CurrencyBundle,
  GameSettings,
  ItemUpgradeState,
  MobaItemId,
  OperatorClassId,
  PlayerProfileState,
  WeaponId
} from '../types/game';
import {
  MOBA_ITEM_BY_ID,
  MOBA_ITEMS,
  OPERATOR_CLASSES,
  PLAYABLE_CLASS_IDS,
  WEAPON_BY_ID,
  WEAPON_DEFINITIONS
} from './constants';

const PROFILE_STORAGE_KEY = 'classz_profile_v4';
const LEGACY_PROFILE_KEY = 'boxhead_profile_v3';
const SETTINGS_STORAGE_KEY = 'classz_settings_v4';

export const DEFAULT_SETTINGS: GameSettings = {
  pcControlScheme: 'lol_mouse',
  mouseAim: true,
  autoReload: true,
  friendlyFire: false,
  notificationPosition: 'top-right',
  colorblindMode: 'none',
  screenShakeIntensity: 80,
  uiScale: 'normal',
  highContrastOutlines: true,
  reducedMotion: false,
  particleDensity: 'high',
  bloodDecals: true,
  dynamicGlow: true,
  floatingDamageNumbers: true,
  muted: false,
  musicVolume: 45,
  sfxVolume: 75,
  bgmStyle: 'industrial'
};

function createDefaultItems(): Record<MobaItemId, ItemUpgradeState> {
  const items = {} as Record<MobaItemId, ItemUpgradeState>;
  for (const item of MOBA_ITEMS) {
    items[item.id] = {
      unlocked: item.starterUnlocked,
      level: 1,
      upgradeLevel: 1
    };
  }
  return items;
}

function createDefaultHeroAbilityLevels(): Record<OperatorClassId, [number, number, number, number]> {
  return {
    reaper: [1, 1, 1, 1],
    marksman: [1, 1, 1, 1],
    vanguard: [1, 1, 1, 1],
    medic: [1, 1, 1, 1],
    mage: [1, 1, 1, 1],
    engineer: [1, 1, 1, 1]
  };
}

function createDefaultArmory(): Record<WeaponId, ArmoryWeaponUpgradeState> {
  const armory = {} as Record<WeaponId, ArmoryWeaponUpgradeState>;
  for (const w of WEAPON_DEFINITIONS) {
    armory[w.id] = {
      unlocked: true,
      level: 1,
      damageTier: 0,
      fireRateTier: 0,
      magTier: 0,
      reloadTier: 0
    };
  }
  return armory;
}

export function getAccountXpForRank(rank: number): number {
  return Math.round(400 + (rank - 1) * 280 + Math.pow(rank - 1, 1.55) * 120);
}

class ProgressionManager {
  public profile: PlayerProfileState;
  public settings: GameSettings;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    this.profile = this.loadProfile();
  }

  private loadProfile(): PlayerProfileState {
    const defaultItems = createDefaultItems();
    const defaultAbilityLevels = createDefaultHeroAbilityLevels();
    const defaultArmory = createDefaultArmory();
    const starterEquipped: MobaItemId[] = ['vampire_fang', 'wraith_striders', 'hellfire_cloak'];

    const fallback: PlayerProfileState = {
      accountRank: 1,
      accountXp: 0,
      accountXpToNext: getAccountXpForRank(1),
      currencies: {
        gold: 350,
        scrap: 45,
        gems: 3
      },
      selectedClass: 'reaper',
      pcControlScheme: this.settings?.pcControlScheme || 'lol_mouse',
      equippedItems: starterEquipped,
      items: defaultItems,
      heroAbilityLevels: defaultAbilityLevels,
      equippedLoadout: WEAPON_DEFINITIONS.map((w) => w.id),
      armory: defaultArmory
    };

    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY) || localStorage.getItem(LEGACY_PROFILE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);

      const mergedItems = { ...defaultItems };
      if (parsed.items) {
        for (const item of MOBA_ITEMS) {
          if (parsed.items[item.id]) {
            const lv = Math.max(
              1,
              Math.min(5, Number(parsed.items[item.id].level || parsed.items[item.id].upgradeLevel) || 1)
            );
            mergedItems[item.id] = {
              unlocked: item.starterUnlocked || !!parsed.items[item.id].unlocked,
              level: lv,
              upgradeLevel: lv
            };
          }
        }
      }

      const mergedAbilityLevels = { ...defaultAbilityLevels };
      if (parsed.heroAbilityLevels) {
        for (const cid of PLAYABLE_CLASS_IDS) {
          const arr = parsed.heroAbilityLevels[cid];
          if (Array.isArray(arr) && arr.length === 4) {
            mergedAbilityLevels[cid] = [
              Math.max(1, Math.min(5, Number(arr[0]) || 1)),
              Math.max(1, Math.min(5, Number(arr[1]) || 1)),
              Math.max(1, Math.min(5, Number(arr[2]) || 1)),
              Math.max(1, Math.min(5, Number(arr[3]) || 1))
            ];
          }
        }
      }

      let equippedItems: MobaItemId[] = starterEquipped;
      if (Array.isArray(parsed.equippedItems)) {
        const valid = parsed.equippedItems.filter(
          (id: string) => MOBA_ITEM_BY_ID[id as MobaItemId] && mergedItems[id as MobaItemId]?.unlocked
        ) as MobaItemId[];
        if (valid.length > 0) {
          equippedItems = Array.from(new Set(valid)).slice(0, 6);
        }
      }

      const rawClass = parsed.selectedClass === 'engineer' ? 'mage' : parsed.selectedClass;
      const selectedClass: OperatorClassId = PLAYABLE_CLASS_IDS.includes(rawClass) ? rawClass : 'reaper';
      const rank = Math.max(1, Number(parsed.accountRank) || 1);
      const pcControlScheme =
        parsed.pcControlScheme === 'wasd' || this.settings?.pcControlScheme === 'wasd' ? 'wasd' : 'lol_mouse';

      return {
        accountRank: rank,
        accountXp: Math.max(0, Number(parsed.accountXp) || 0),
        accountXpToNext: getAccountXpForRank(rank),
        currencies: {
          gold: Math.max(0, Math.floor(Number(parsed.currencies?.gold ?? 350))),
          scrap: Math.max(0, Math.floor(Number(parsed.currencies?.scrap ?? 45))),
          gems: Math.max(0, Math.floor(Number(parsed.currencies?.gems ?? 3)))
        },
        selectedClass,
        pcControlScheme,
        equippedItems,
        items: mergedItems,
        heroAbilityLevels: mergedAbilityLevels,
        equippedLoadout: WEAPON_DEFINITIONS.map((w) => w.id),
        armory: defaultArmory
      };
    } catch {
      return fallback;
    }
  }

  private loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        pcControlScheme: parsed.pcControlScheme === 'wasd' ? 'wasd' : 'lol_mouse'
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  public saveProfile() {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.profile));
    } catch {
      // Ignore quota errors
    }
    this.notify();
  }

  public updateSettings(partial: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...partial };
    if (partial.pcControlScheme) {
      this.profile.pcControlScheme = partial.pcControlScheme;
    }
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore quota errors
    }
    this.notify();
  }

  public setPcControlScheme(scheme: 'lol_mouse' | 'wasd') {
    this.profile.pcControlScheme = scheme;
    this.settings.pcControlScheme = scheme;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore quota errors
    }
    this.saveProfile();
  }

  public selectOperatorClass(classId: OperatorClassId) {
    this.profile.selectedClass = classId === 'engineer' ? 'mage' : classId;
    this.saveProfile();
  }

  public addCurrencies(gold: number, scrap: number = 0, gems: number = 0) {
    this.profile.currencies.gold = Math.max(0, Math.round(this.profile.currencies.gold + gold));
    this.profile.currencies.scrap = Math.max(0, Math.round(this.profile.currencies.scrap + scrap));
    this.profile.currencies.gems = Math.max(0, Math.round(this.profile.currencies.gems + gems));
    this.saveProfile();
  }

  public addAccountXp(amount: number): { rankedUp: boolean; newRank: number } {
    this.profile.accountXp += Math.round(amount);
    let rankedUp = false;
    while (this.profile.accountXp >= this.profile.accountXpToNext) {
      this.profile.accountXp -= this.profile.accountXpToNext;
      this.profile.accountRank += 1;
      this.profile.accountXpToNext = getAccountXpForRank(this.profile.accountRank);
      this.profile.currencies.gold += 160 + this.profile.accountRank * 45;
      this.profile.currencies.gems += 2;
      rankedUp = true;
    }
    this.saveProfile();
    return { rankedUp, newRank: this.profile.accountRank };
  }

  public canAfford(cost: CurrencyBundle): boolean {
    return (
      this.profile.currencies.gold >= cost.gold &&
      this.profile.currencies.scrap >= cost.scrap &&
      this.profile.currencies.gems >= cost.gems
    );
  }

  public spendCurrencies(cost: CurrencyBundle): boolean {
    if (!this.canAfford(cost)) return false;
    this.profile.currencies.gold -= cost.gold;
    this.profile.currencies.scrap -= cost.scrap;
    this.profile.currencies.gems -= cost.gems;
    this.saveProfile();
    return true;
  }

  // ==========================================================================
  // MOBA ITEM SHOP & 6-SLOT INVENTORY MANAGEMENT
  // ==========================================================================
  public unlockItem(itemId: MobaItemId): { ok: boolean; reason?: string } {
    const def = MOBA_ITEM_BY_ID[itemId];
    const state = this.profile.items[itemId];
    if (!def || !state) return { ok: false, reason: 'Invalid item' };
    if (state.unlocked) return { ok: false, reason: 'Item already unlocked' };
    if (this.profile.accountRank < def.minAccountRank) {
      return { ok: false, reason: `Requires Account Rank ${def.minAccountRank}` };
    }
    if (!this.spendCurrencies(def.unlockCost)) {
      return { ok: false, reason: 'Insufficient Gold, Scrap, or Soul Gems' };
    }
    state.unlocked = true;
    state.level = 1;
    state.upgradeLevel = 1;
    if (this.profile.equippedItems.length < 6 && !this.profile.equippedItems.includes(itemId)) {
      this.profile.equippedItems.push(itemId);
    }
    this.saveProfile();
    return { ok: true };
  }

  public getItemUpgradeCost(itemId: MobaItemId): CurrencyBundle {
    const def = MOBA_ITEM_BY_ID[itemId];
    const state = this.profile.items[itemId];
    const tierScale = Math.pow(1.52, (state?.level || 1) - 1);
    return {
      gold: Math.round(def.baseUpgradeCost.gold * tierScale),
      scrap: Math.round(def.baseUpgradeCost.scrap * tierScale),
      gems: state.level >= 3 ? Math.max(1, Math.round((def.baseUpgradeCost.gems || 1) * (state.level - 2))) : 0
    };
  }

  public upgradeItem(itemId: MobaItemId): { ok: boolean; reason?: string } {
    const state = this.profile.items[itemId];
    if (!state || !state.unlocked) return { ok: false, reason: 'Item is locked' };
    if (state.level >= 5) return { ok: false, reason: 'Max Item Level (Lv.5) reached' };

    const cost = this.getItemUpgradeCost(itemId);
    if (!this.spendCurrencies(cost)) {
      return { ok: false, reason: 'Insufficient currencies for upgrade' };
    }

    state.level += 1;
    state.upgradeLevel = state.level;
    this.saveProfile();
    return { ok: true };
  }

  public toggleEquipItem(itemId: MobaItemId): { ok: boolean; reason?: string; equipped?: boolean } {
    const state = this.profile.items[itemId];
    if (!state || !state.unlocked) {
      return { ok: false, reason: 'Unlock this item first!' };
    }

    const idx = this.profile.equippedItems.indexOf(itemId);
    if (idx !== -1) {
      this.profile.equippedItems.splice(idx, 1);
      this.saveProfile();
      return { ok: true, equipped: false };
    }

    if (this.profile.equippedItems.length >= 6) {
      return { ok: false, reason: 'All 6 Item Slots are full! Unequip an item first.' };
    }

    this.profile.equippedItems.push(itemId);
    this.saveProfile();
    return { ok: true, equipped: true };
  }

  // ==========================================================================
  // HERO ABILITY LEVELING (Q, W, E, R up to Lv.5)
  // ==========================================================================
  public getHeroAbilityLevel(classId: OperatorClassId, slotIndex: 0 | 1 | 2 | 3): number {
    const levels = this.profile.heroAbilityLevels[classId] || [1, 1, 1, 1];
    return levels[slotIndex] || 1;
  }

  public getAbilityUpgradeCost(classId: OperatorClassId, slotIndex: 0 | 1 | 2 | 3): CurrencyBundle {
    const levels = this.profile.heroAbilityLevels[classId] || [1, 1, 1, 1];
    const currentLv = levels[slotIndex] || 1;
    const scale = Math.pow(1.5, currentLv - 1);
    return {
      gold: Math.round(160 * scale),
      scrap: Math.round(25 * scale),
      gems: currentLv >= 3 ? currentLv - 2 : 0
    };
  }

  public getHeroAbilityUpgradeCost(classId: OperatorClassId, slotIndex: 0 | 1 | 2 | 3): CurrencyBundle {
    return this.getAbilityUpgradeCost(classId, slotIndex);
  }

  public upgradeHeroAbility(classId: OperatorClassId, slotIndex: 0 | 1 | 2 | 3): { ok: boolean; reason?: string } {
    if (!this.profile.heroAbilityLevels[classId]) {
      this.profile.heroAbilityLevels[classId] = [1, 1, 1, 1];
    }
    const currentLv = this.profile.heroAbilityLevels[classId][slotIndex];
    if (currentLv >= 5) {
      return { ok: false, reason: 'Ability is already at Max Level (Lv.5)' };
    }
    const cost = this.getAbilityUpgradeCost(classId, slotIndex);
    if (!this.spendCurrencies(cost)) {
      return { ok: false, reason: 'Insufficient Gold, Scrap, or Soul Gems' };
    }
    this.profile.heroAbilityLevels[classId][slotIndex] = currentLv + 1;
    this.saveProfile();
    return { ok: true };
  }

  /**
   * Computes a hero's total combat stats & passive item status effects from their
   * base class definition + all 6 equipped MOBA items + ability levels.
   */
  public computeHeroCombatStats(operatorClassId: OperatorClassId) {
    const opClass = OPERATOR_CLASSES[operatorClassId] || OPERATOR_CLASSES.reaper;
    const abilityLevels = this.profile.heroAbilityLevels[operatorClassId] || [1, 1, 1, 1];
    const passiveLevel = abilityLevels[3] || 1;

    let bonusMaxHp = operatorClassId === 'vanguard' ? (passiveLevel - 1) * 25 : 0;
    let attackDamageMult = opClass.damageMultiplier;
    let abilityPowerMult = 1.0 + (operatorClassId === 'mage' ? (passiveLevel - 1) * 0.05 : 0);
    let attackSpeedMult = 1.0 + (operatorClassId === 'reaper' ? (passiveLevel - 1) * 0.06 : 0);
    let moveSpeedMult = opClass.speedMultiplier;
    let armorReduction = opClass.armorReduction + (operatorClassId === 'vanguard' ? (passiveLevel - 1) * 0.03 : 0);
    let cooldownHaste = 0;
    let lifestealPct = operatorClassId === 'reaper' ? 0.06 + (passiveLevel - 1) * 0.02 : 0;
    let hpRegenPerSec =
      operatorClassId === 'medic'
        ? 6 + (passiveLevel - 1) * 2
        : operatorClassId === 'vanguard'
        ? 4
        : 1.0;
    let critChancePct = operatorClassId === 'marksman' ? 0.12 + (passiveLevel - 1) * 0.05 : 0.05;

    const equippedSet = new Set<MobaItemId>(this.profile.equippedItems);
    for (const itemId of equippedSet) {
      const def = MOBA_ITEM_BY_ID[itemId];
      const state = this.profile.items[itemId];
      if (!def || !state || !state.unlocked) continue;
      const lvMult = 1 + (state.level - 1) * 0.22;
      bonusMaxHp += Math.round(def.maxHpBonus * lvMult);
      attackDamageMult += def.attackDamagePct * lvMult;
      abilityPowerMult += def.abilityPowerPct * lvMult;
      attackSpeedMult += def.attackSpeedPct * lvMult;
      moveSpeedMult += def.moveSpeedPct * (1 + (state.level - 1) * 0.12);
      armorReduction += def.armorBonus * (1 + (state.level - 1) * 0.15);
      cooldownHaste += def.cooldownHastePct * (1 + (state.level - 1) * 0.15);
      lifestealPct += def.lifestealPct * lvMult;
      hpRegenPerSec += def.hpRegenPerSec * lvMult;
      critChancePct += def.critChancePct * (1 + (state.level - 1) * 0.15);
    }

    armorReduction = Math.min(0.68, armorReduction);
    cooldownHaste = Math.min(0.55, cooldownHaste);
    critChancePct = Math.min(0.75, critChancePct);

    const hasHealAmp = equippedSet.has('philosopher_chalice');
    if (hasHealAmp) {
      lifestealPct *= 1.3;
      hpRegenPerSec *= 1.3;
    }

    const attackDamage = Math.round(opClass.primaryAttackDamage * attackDamageMult);
    const abilityPower = Math.round(65 * abilityPowerMult);
    const attackSpeed = Number(((1 / Math.max(0.14, opClass.primaryAttackCooldown)) * attackSpeedMult).toFixed(2));

    return {
      maxHp: opClass.baseHp + bonusMaxHp,
      attackDamage,
      abilityPower,
      attackSpeed,
      attackDamageMult,
      abilityPowerMult,
      abilityPowerMultiplier: abilityPowerMult,
      attackSpeedMult,
      moveSpeedMult,
      moveSpeedMultiplier: moveSpeedMult,
      armorReduction,
      cooldownHaste,
      cooldownReduction: cooldownHaste,
      lifestealPct: Math.round(lifestealPct * 100),
      hpRegenPerSec,
      critChancePct: Math.round(critChancePct * 100),
      abilityLevels,
      hasImmolationAura: equippedSet.has('hellfire_cloak'),
      immolationLevel: this.profile.items.hellfire_cloak?.level || 1,
      hasStaticChain: equippedSet.has('capacitor_coil'),
      staticChainLevel: this.profile.items.capacitor_coil?.level || 1,
      hasFrostChill: equippedSet.has('frost_shard'),
      hasThornsPlate: equippedSet.has('gargoyle_plate'),
      thornsLevel: this.profile.items.gargoyle_plate?.level || 1,
      hasCullExecute: equippedSet.has('soul_reaver'),
      hasCooldownRefundOnKill: equippedSet.has('necronomicon_tome'),
      hasSpectralPhaseOnCast: equippedSet.has('wraith_striders'),
      hasSpectralStride: equippedSet.has('wraith_striders'),
      hasWraithHourglass: equippedSet.has('morrigan_hourglass'),
      hourglassLevel: this.profile.items.morrigan_hourglass?.level || 1
    };
  }

  public computeEffectiveWeaponStats(weaponId: WeaponId, operatorClassId: OperatorClassId) {
    const _def = WEAPON_BY_ID[weaponId] || WEAPON_DEFINITIONS[0];
    const heroStats = this.computeHeroCombatStats(operatorClassId);
    return {
      unlocked: true,
      upgradeLevel: 1,
      hasClassAffinity: true,
      magSize: 999,
      baseReserveAmmo: -1,
      maxReserveAmmo: -1,
      reloadTime: 0.5,
      damageMultiplier: heroStats.attackDamageMult,
      fireRateMultiplier: heroStats.attackSpeedMult,
      piercingBonus: operatorClassId === 'marksman' ? 1 : 0
    };
  }

  public exportSaveCode(): string {
    try {
      const payload = JSON.stringify({
        v: 4,
        profile: this.profile
      });
      return btoa(encodeURIComponent(payload));
    } catch {
      return '';
    }
  }

  public importSaveCode(code: string): { ok: boolean; reason?: string } {
    try {
      const trimmed = code.trim();
      if (!trimmed) return { ok: false, reason: 'Please paste a valid ClassZ Save Code.' };
      const jsonStr = decodeURIComponent(atob(trimmed));
      const parsed = JSON.parse(jsonStr);
      const prof = parsed?.profile || parsed;
      if (!prof || typeof prof.accountRank !== 'number' || !prof.currencies) {
        return { ok: false, reason: 'Invalid ClassZ Save Code format.' };
      }
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(prof));
      this.profile = this.loadProfile();
      this.notify();
      return { ok: true };
    } catch {
      return { ok: false, reason: 'Corrupted or invalid Save Code.' };
    }
  }

  public resetProfile() {
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_PROFILE_KEY);
    } catch {
      // Ignore storage errors
    }
    this.profile = this.loadProfile();
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const l of this.listeners) {
      l();
    }
  }
}

export const progressionManager = new ProgressionManager();
