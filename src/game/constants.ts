import {
  ArenaDefinition,
  ArenaId,
  BossElement,
  ComboMilestone,
  MobaItemDefinition,
  MobaItemId,
  ObstacleRect,
  OperatorClassDefinition,
  OperatorClassId,
  RoguelikePerkDefinition,
  WeaponClass,
  WeaponId,
  WeaponStats
} from '../types/game';

// ============================================================================
// 5 CLASSZ HERO ARCHETYPES (Melee, Ranged, Tank, Healer, Magic User)
// Each Hero has a Fixed Unlimited Signature Primary Attack + 4 Abilities (Q, W, E, R)
// ============================================================================
const RAW_MAGE_DEFINITION = {
  id: 'mage' as OperatorClassId,
  name: 'Necro-Warlock',
  shortName: 'WARLOCK',
  archetypeLabel: 'MAGIC USER' as const,
  roleTitle: 'Eldritch Spellcaster & AoE Sorcerer',
  color: '#A855F7',
  primaryWeaponId: 'tesla_rifle' as WeaponId,
  primaryWeaponName: 'Eldritch Skull Staff',
  primaryWeaponDesc: 'Casts unlimited arcane soul-fire bolts that splash on impact and arc to a nearby zombie.',
  primaryAttackCooldown: 0.34,
  primaryAttackDamage: 48,
  primaryAttackRange: 640,
  abilities: [
    {
      slot: 'Q' as const,
      id: 'mage_q',
      name: "Hellfire Jack-o'-Meteor",
      type: 'ACTIVE' as const,
      cooldown: 6.5,
      color: '#F97316',
      iconKind: 'meteor_rain',
      description: 'Calls down a cluster of blazing pumpkin meteors at the target area that detonate in fiery chain blasts.',
      scalingText: '+22% Meteor Damage & -0.4s CD per Lv'
    },
    {
      slot: 'W' as const,
      id: 'mage_w',
      name: 'Franken-Chain Tempest',
      type: 'ACTIVE' as const,
      cooldown: 8.5,
      color: '#22D3EE',
      iconKind: 'chain_tempest',
      description: 'Unleashes a high-voltage arc of necromantic lightning that jumps across up to 8 zombies and shocks them.',
      scalingText: '+20% Lightning Damage & +1 Arc Target per Lv'
    },
    {
      slot: 'E' as const,
      id: 'mage_e',
      name: 'Wraith Phase & Frost Nova',
      type: 'ACTIVE' as const,
      cooldown: 12.0,
      color: '#60A5FA',
      iconKind: 'wraith_nova',
      description: 'Blinks through the ether toward your aim/move direction and freezes surrounding foes in a Grave-Frost Nova.',
      scalingText: '+25% Frost Nova Damage & +0.5s Freeze per Lv'
    },
    {
      slot: 'R' as const,
      id: 'mage_r',
      name: 'Arcane Soul Resonance',
      type: 'PASSIVE' as const,
      cooldown: 0,
      color: '#C084FC',
      iconKind: 'arcane_resonance',
      description: 'Every 4th primary staff spell unleashes a free Arcane Soul Nova and shaves 0.6s off Q/W/E cooldowns.',
      scalingText: '+18% Nova Damage & +5% Ability Power per Lv'
    }
  ],
  preferredWeaponClasses: ['support', 'heavy'] as WeaponClass[],
  affinityBonusDesc: 'Every 4th primary spell triggers a free Arcane Nova & reduces active cooldowns',
  passiveName: 'Arcane Soul Resonance',
  passiveDesc: 'Every 4th primary staff spell unleashes a free Arcane Soul Nova and shaves 0.6s off Q/W/E cooldowns.',
  skillName: "Hellfire Jack-o'-Meteor",
  skillDesc: 'Calls down a cluster of blazing pumpkin meteors & chain lightning.',
  skillCooldown: 6.5,
  baseHp: 135,
  speedMultiplier: 1.04,
  damageMultiplier: 1.15,
  armorReduction: 0.1
};

const RAW_OPERATOR_CLASSES = {
  reaper: {
    id: 'reaper' as OperatorClassId,
    name: 'Crypt Reaper',
    shortName: 'REAPER',
    archetypeLabel: 'MELEE' as const,
    roleTitle: 'Soul-Scythe Executioner & Vampiric Bruiser',
    color: '#EF4444',
    primaryWeaponId: 'shotgun' as WeaponId,
    primaryWeaponName: 'Cursed Soul Scythe',
    primaryWeaponDesc: 'Sweeps a wide 140° crimson melee scythe cleave in front of the Reaper, hitting and staggering all undead in arc.',
    primaryAttackCooldown: 0.36,
    primaryAttackDamage: 68,
    primaryAttackRange: 135,
    abilities: [
      {
        slot: 'Q' as const,
        id: 'reaper_q',
        name: 'Phantom Scythe Dash',
        type: 'ACTIVE' as const,
        cooldown: 5.5,
        color: '#F43F5E',
        iconKind: 'scythe_dash',
        description: 'Lunges forward through undead ranks toward the target, slashing all foes in your path and inflicting bleed.',
        scalingText: '+22% Slash Damage & -0.35s CD per Lv'
      },
      {
        slot: 'W' as const,
        id: 'reaper_w',
        name: 'Whirlwind Harvest',
        type: 'ACTIVE' as const,
        cooldown: 8.0,
        color: '#FB923C',
        iconKind: 'whirlwind',
        description: 'Spins a 360° crimson scythe storm around the Reaper, cleaving and knocking back all nearby zombies.',
        scalingText: '+24% Whirlwind Damage & +15px Radius per Lv'
      },
      {
        slot: 'E' as const,
        id: 'reaper_e',
        name: "Executioner's Guillotine",
        type: 'ACTIVE' as const,
        cooldown: 13.0,
        color: '#DC2626',
        iconKind: 'guillotine',
        description: 'Leaps and slams a massive cursed scythe shockwave that deals 2x execution damage to foes below 50% HP.',
        scalingText: '+25% Slam Damage & +8 HP Heal per Hit per Lv'
      },
      {
        slot: 'R' as const,
        id: 'reaper_r',
        name: 'Soul Siphon',
        type: 'PASSIVE' as const,
        cooldown: 0,
        color: '#F87171',
        iconKind: 'soul_siphon',
        description: 'Melee scythe hits restore +4 HP (+12 HP on kill) and grant stacking Blood Frenzy attack speed for 4s.',
        scalingText: '+2 HP Siphon on Hit & +6% Melee Speed per Lv'
      }
    ],
    preferredWeaponClasses: ['shotgun', 'smg'] as WeaponClass[],
    affinityBonusDesc: 'Wide 140° Cursed Scythe melee cleave with built-in Soul Siphon lifesteal',
    passiveName: 'Soul Siphon',
    passiveDesc: 'Melee scythe hits restore HP and grant stacking attack speed.',
    skillName: 'Phantom Scythe Dash',
    skillDesc: 'Lunges forward through undead ranks, slashing all foes in your path.',
    skillCooldown: 5.5,
    baseHp: 175,
    speedMultiplier: 1.14,
    damageMultiplier: 1.18,
    armorReduction: 0.22
  },

  marksman: {
    id: 'marksman' as OperatorClassId,
    name: 'Witch Hunter',
    shortName: 'HUNTER',
    archetypeLabel: 'RANGED' as const,
    roleTitle: 'Silver Crossbow Sharpshooter & Boss Slayer',
    color: '#F97316',
    primaryWeaponId: 'battle_rifle' as WeaponId,
    primaryWeaponName: 'Silver Vanquisher Crossbow',
    primaryWeaponDesc: 'Fires unlimited high-velocity consecrated silver bolts with long range and innate undead piercing.',
    primaryAttackCooldown: 0.24,
    primaryAttackDamage: 44,
    primaryAttackRange: 780,
    abilities: [
      {
        slot: 'Q' as const,
        id: 'marksman_q',
        name: 'Fan of Silver Stakes',
        type: 'ACTIVE' as const,
        cooldown: 5.5,
        color: '#FB923C',
        iconKind: 'silver_fan',
        description: 'Fires a wide 9-bolt conical volley of consecrated silver stakes that pierce through zombie waves.',
        scalingText: '+20% Volley Damage & +1 Bolt Pierce per Lv'
      },
      {
        slot: 'W' as const,
        id: 'marksman_w',
        name: "Hunter's Evasive Vault",
        type: 'ACTIVE' as const,
        cooldown: 8.5,
        color: '#FBBF24',
        iconKind: 'vault_trap',
        description: 'Vaults swiftly while dropping an explosive Cursed Pumpkin Snare that blasts and roots nearby undead.',
        scalingText: '+22% Trap Blast Damage & -0.5s CD per Lv'
      },
      {
        slot: 'E' as const,
        id: 'marksman_e',
        name: 'Blood-Moon Deadeye',
        type: 'ACTIVE' as const,
        cooldown: 14.0,
        color: '#38BDF8',
        iconKind: 'deadeye',
        description: 'Enters a 6s Blood-Moon Overdrive granting +50% Attack Speed, +2 Bolt Pierce, and guaranteed critical bolts.',
        scalingText: '+0.6s Duration & +12% Crit Bolt Damage per Lv'
      },
      {
        slot: 'R' as const,
        id: 'marksman_r',
        name: 'Consecrated Silver',
        type: 'PASSIVE' as const,
        cooldown: 0,
        color: '#FDBA74',
        iconKind: 'silver_bolts',
        description: 'Silver crossbow bolts pierce +1 additional target and deal +25% bonus damage to Elite Zombies & Raid Bosses.',
        scalingText: '+8% Elite/Boss Damage & +5% Crit Chance per Lv'
      }
    ],
    preferredWeaponClasses: ['marksman', 'sidearm'] as WeaponClass[],
    affinityBonusDesc: 'Unlimited piercing silver crossbow bolts with +25% Boss & Elite damage',
    passiveName: 'Consecrated Silver',
    passiveDesc: 'Bolts pierce +1 target and deal +25% bonus damage to Elites & Bosses.',
    skillName: 'Fan of Silver Stakes',
    skillDesc: 'Fires a 9-bolt conical volley of piercing silver stakes.',
    skillCooldown: 5.5,
    baseHp: 140,
    speedMultiplier: 1.08,
    damageMultiplier: 1.14,
    armorReduction: 0.1
  },

  vanguard: {
    id: 'vanguard' as OperatorClassId,
    name: 'Grave Warden',
    shortName: 'WARDEN',
    archetypeLabel: 'TANK' as const,
    roleTitle: 'Tombstone Juggernaut & Crowd-Control Fortress',
    color: '#F59E0B',
    primaryWeaponId: 'auto_shotgun' as WeaponId,
    primaryWeaponName: 'Gargoyle Crypt Maul',
    primaryWeaponDesc: 'Smashes the ground in a heavy frontal shockwave cone, dealing crushing blunt damage and high knockback.',
    primaryAttackCooldown: 0.44,
    primaryAttackDamage: 74,
    primaryAttackRange: 155,
    abilities: [
      {
        slot: 'Q' as const,
        id: 'vanguard_q',
        name: 'Tombstone Bull-Charge',
        type: 'ACTIVE' as const,
        cooldown: 6.5,
        color: '#FBBF24',
        iconKind: 'bull_charge',
        description: 'Charges forward behind a granite tombstone shield, trampling and stunning all zombies in your path.',
        scalingText: '+22% Trample Damage & +0.3s Stun per Lv'
      },
      {
        slot: 'W' as const,
        id: 'vanguard_w',
        name: 'Catacomb Earthshaker',
        type: 'ACTIVE' as const,
        cooldown: 9.0,
        color: '#F97316',
        iconKind: 'earthshaker',
        description: 'Slams the crypt floor to unleash a 210px seismic ring that damages, knocks back, and slows undead by 50%.',
        scalingText: '+24% Tremor Damage & +18px Ring Radius per Lv'
      },
      {
        slot: 'E' as const,
        id: 'vanguard_e',
        name: 'Iron Crypt Bastion',
        type: 'ACTIVE' as const,
        cooldown: 15.0,
        color: '#38BDF8',
        iconKind: 'iron_bastion',
        description: 'Summons a 5.5s Gargoyle Fortress Ward granting +60% ShieldHP, Invulnerability, and thorny shock pulses.',
        scalingText: '+25 Shield HP & +0.5s Fortress Duration per Lv'
      },
      {
        slot: 'R' as const,
        id: 'vanguard_r',
        name: 'Gargoyle Stoneplates',
        type: 'PASSIVE' as const,
        cooldown: 0,
        color: '#FDE047',
        iconKind: 'stoneplates',
        description: 'Reduces all incoming damage by 30%, grants +80 bonus Max HP, and regenerates 5 HP/sec near monsters.',
        scalingText: '+25 Max HP & +3% Damage Reduction per Lv'
      }
    ],
    preferredWeaponClasses: ['shotgun', 'heavy'] as WeaponClass[],
    affinityBonusDesc: 'Heavy frontal Crypt Maul shockwaves with 30% innate armor & HP regen',
    passiveName: 'Gargoyle Stoneplates',
    passiveDesc: '30% incoming damage reduction, +80 Max HP, and passive health regen.',
    skillName: 'Tombstone Bull-Charge',
    skillDesc: 'Unstoppable shielded charge that tramples and stuns undead.',
    skillCooldown: 6.5,
    baseHp: 230,
    speedMultiplier: 1.0,
    damageMultiplier: 1.08,
    armorReduction: 0.3
  },

  medic: {
    id: 'medic' as OperatorClassId,
    name: 'Plague Alchemist',
    shortName: 'ALCHEMIST',
    archetypeLabel: 'HEALER' as const,
    roleTitle: 'Coven Apothecary & Blight Support',
    color: '#10B981',
    primaryWeaponId: 'plasma_carbine' as WeaponId,
    primaryWeaponName: 'Necro-Tonic Syringe Launcher',
    primaryWeaponDesc: 'Fires unlimited pressurized alchemical darts that corrode undead armor and siphon vitality.',
    primaryAttackCooldown: 0.22,
    primaryAttackDamage: 36,
    primaryAttackRange: 660,
    abilities: [
      {
        slot: 'Q' as const,
        id: 'medic_q',
        name: 'Panacea Healing Brew',
        type: 'ACTIVE' as const,
        cooldown: 6.5,
        color: '#34D399',
        iconKind: 'panacea_heal',
        description: 'Unleashes an instant herbal burst that restores +65 HP to self and allies, cleanses chill, and boosts speed.',
        scalingText: '+18 HP Heal Burst & -0.4s CD per Lv'
      },
      {
        slot: 'W' as const,
        id: 'medic_w',
        name: 'Blight Cauldron Flask',
        type: 'ACTIVE' as const,
        cooldown: 8.5,
        color: '#84CC16',
        iconKind: 'blight_flask',
        description: 'Hurls a volatile plague flask that explodes into a toxic acid zone, melting and slowing zombies.',
        scalingText: '+24% Acid Blast Damage & +18px Zone Radius per Lv'
      },
      {
        slot: 'E' as const,
        id: 'medic_e',
        name: 'Necro-Sanctuary Totem',
        type: 'ACTIVE' as const,
        cooldown: 15.0,
        color: '#10B981',
        iconKind: 'sanctuary_totem',
        description: 'Deploys a pulsing Apothecary Totem for 16s that heals nearby allies every second and zaps undead.',
        scalingText: '+3s Totem Duration & +25% Totem Zap/Heal per Lv'
      },
      {
        slot: 'R' as const,
        id: 'medic_r',
        name: 'Apothecary Aura',
        type: 'PASSIVE' as const,
        cooldown: 0,
        color: '#6EE7B7',
        iconKind: 'apothecary_aura',
        description: 'Continuously regenerates +6 HP/sec for yourself and nearby squadmates; healing grants +15% Attack Speed.',
        scalingText: '+2 HP/sec Aura Regen & +5% Healing Power per Lv'
      }
    ],
    preferredWeaponClasses: ['smg', 'support'] as WeaponClass[],
    affinityBonusDesc: 'Rapid corrosive syringe darts + continuous squad healing aura & totems',
    passiveName: 'Apothecary Aura',
    passiveDesc: 'Passively regenerates +6 HP/sec for yourself and nearby squadmates.',
    skillName: 'Panacea Healing Brew',
    skillDesc: 'Restores +65 HP to self and allies and cleanses debuffs.',
    skillCooldown: 6.5,
    baseHp: 155,
    speedMultiplier: 1.12,
    damageMultiplier: 1.06,
    armorReduction: 0.15
  },

  mage: RAW_MAGE_DEFINITION,
  engineer: RAW_MAGE_DEFINITION
};

function enrichOperatorClass(
  raw: Omit<typeof RAW_MAGE_DEFINITION, 'archetypeLabel'> & {
    archetypeLabel: OperatorClassDefinition['archetypeLabel'];
  }
): OperatorClassDefinition {
  const enrichedAbilities = raw.abilities.map((ab) => ({
    ...ab,
    shortName: ab.name.split(' ')[0].toUpperCase(),
    kind: ab.type,
    isPassive: ab.type === 'PASSIVE',
    baseCooldown: ab.cooldown
  })) as [
    OperatorClassDefinition['abilities'][0],
    OperatorClassDefinition['abilities'][1],
    OperatorClassDefinition['abilities'][2],
    OperatorClassDefinition['abilities'][3]
  ];

  return {
    ...raw,
    archetype: raw.archetypeLabel,
    signatureWeaponVisualId: raw.primaryWeaponId,
    signatureWeaponName: raw.primaryWeaponName,
    signatureWeaponDesc: raw.primaryWeaponDesc,
    signatureRange: raw.primaryAttackRange,
    abilities: enrichedAbilities
  };
}

export const OPERATOR_CLASSES: Record<OperatorClassId, OperatorClassDefinition> = {
  reaper: enrichOperatorClass(RAW_OPERATOR_CLASSES.reaper),
  marksman: enrichOperatorClass(RAW_OPERATOR_CLASSES.marksman),
  vanguard: enrichOperatorClass(RAW_OPERATOR_CLASSES.vanguard),
  medic: enrichOperatorClass(RAW_OPERATOR_CLASSES.medic),
  mage: enrichOperatorClass(RAW_OPERATOR_CLASSES.mage),
  engineer: enrichOperatorClass(RAW_OPERATOR_CLASSES.engineer)
};

export const PLAYABLE_CLASS_IDS: OperatorClassId[] = ['reaper', 'marksman', 'vanguard', 'medic', 'mage'];
export const OPERATOR_CLASS_LIST: OperatorClassDefinition[] = PLAYABLE_CLASS_IDS.map((id) => OPERATOR_CLASSES[id]);

// ============================================================================
// 10 CLASSZ CURSED MOBA ITEMS (Modify Character Status, Stats & On-Hit Effects)
// ============================================================================
const RAW_MOBA_ITEMS = [
  {
    id: 'vampire_fang' as MobaItemId,
    name: 'Bloodmoon Vampire Fang',
    shortName: 'VAMP FANG',
    category: 'OFFENSE' as const,
    color: '#EF4444',
    iconKind: 'fang',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 180, scrap: 25, gems: 0 },
    statSummary: '+14% Attack Dmg · +8% Lifesteal',
    effectName: 'Vampiric Leech',
    effectDesc: 'Primary attacks and damaging abilities siphon crimson vitality, healing you for a % of damage dealt.',
    maxHpBonus: 15,
    attackDamagePct: 0.14,
    abilityPowerPct: 0.06,
    attackSpeedPct: 0.05,
    moveSpeedPct: 0,
    armorBonus: 0,
    cooldownHastePct: 0,
    lifestealPct: 0.08,
    hpRegenPerSec: 1.5,
    critChancePct: 0.05
  },
  {
    id: 'wraith_striders' as MobaItemId,
    name: 'Phantom Wraith Striders',
    shortName: 'STRIDERS',
    category: 'UTILITY' as const,
    color: '#38BDF8',
    iconKind: 'boots',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 160, scrap: 20, gems: 0 },
    statSummary: '+12% Move Speed · +10% Cooldown Haste',
    effectName: 'Spectral Stride',
    effectDesc: 'Casting Q, W, or E grants a 2.5s burst of phantom haste and unit-collision phasing.',
    maxHpBonus: 10,
    attackDamagePct: 0.04,
    abilityPowerPct: 0.06,
    attackSpeedPct: 0.08,
    moveSpeedPct: 0.12,
    armorBonus: 0.03,
    cooldownHastePct: 0.1,
    lifestealPct: 0,
    hpRegenPerSec: 1.0,
    critChancePct: 0
  },
  {
    id: 'hellfire_cloak' as MobaItemId,
    name: "Jack-o'-Lantern Hellfire Cloak",
    shortName: 'SUNFIRE',
    category: 'DEFENSE' as const,
    color: '#F97316',
    iconKind: 'cloak',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 210, scrap: 30, gems: 0 },
    statSummary: '+45 Max HP · +7% Armor · Burn Aura',
    effectName: 'Cursed Immolation',
    effectDesc: 'Wraps your hero in a 155px ring of Halloween hellfire that sears all nearby zombies every second.',
    maxHpBonus: 45,
    attackDamagePct: 0.05,
    abilityPowerPct: 0.08,
    attackSpeedPct: 0,
    moveSpeedPct: 0,
    armorBonus: 0.07,
    cooldownHastePct: 0.04,
    lifestealPct: 0,
    hpRegenPerSec: 2.5,
    critChancePct: 0
  },
  {
    id: 'capacitor_coil' as MobaItemId,
    name: "Frankenstein's Capacitor Coil",
    shortName: 'VOLT COIL',
    category: 'OFFENSE' as const,
    color: '#22D3EE',
    iconKind: 'coil',
    starterUnlocked: false,
    minAccountRank: 1,
    unlockCost: { gold: 280, scrap: 35, gems: 0 },
    baseUpgradeCost: { gold: 240, scrap: 40, gems: 1 },
    statSummary: '+18% Attack Speed · +10% Crit · Chain Shock',
    effectName: 'Static Discharge',
    effectDesc: 'Every 3rd primary attack unleashes galvanic chain lightning that jumps across up to 4 nearby zombies.',
    maxHpBonus: 0,
    attackDamagePct: 0.08,
    abilityPowerPct: 0.08,
    attackSpeedPct: 0.18,
    moveSpeedPct: 0.04,
    armorBonus: 0,
    cooldownHastePct: 0.05,
    lifestealPct: 0,
    hpRegenPerSec: 0,
    critChancePct: 0.1
  },
  {
    id: 'necronomicon_tome' as MobaItemId,
    name: 'Necronomicon Soul Grimoire',
    shortName: 'GRIMOIRE',
    category: 'MAGIC' as const,
    color: '#A855F7',
    iconKind: 'tome',
    starterUnlocked: false,
    minAccountRank: 2,
    unlockCost: { gold: 380, scrap: 50, gems: 1 },
    baseUpgradeCost: { gold: 290, scrap: 45, gems: 1 },
    statSummary: '+20% Skill Power · +14% Cooldown Haste',
    effectName: 'Eldritch Mastery',
    effectDesc: 'Amplifies Q/W/E ability damage and healing, and refunds 0.5s of active cooldowns on every zombie kill.',
    maxHpBonus: 20,
    attackDamagePct: 0.06,
    abilityPowerPct: 0.2,
    attackSpeedPct: 0,
    moveSpeedPct: 0,
    armorBonus: 0,
    cooldownHastePct: 0.14,
    lifestealPct: 0.03,
    hpRegenPerSec: 1.5,
    critChancePct: 0.05
  },
  {
    id: 'gargoyle_plate' as MobaItemId,
    name: "Gravekeeper's Gargoyle Plate",
    shortName: 'STONEPLATE',
    category: 'DEFENSE' as const,
    color: '#94A3B8',
    iconKind: 'armor',
    starterUnlocked: false,
    minAccountRank: 2,
    unlockCost: { gold: 420, scrap: 55, gems: 1 },
    baseUpgradeCost: { gold: 310, scrap: 50, gems: 1 },
    statSummary: '+65 Max HP · +10% Armor · Thorns',
    effectName: 'Stone Thorns',
    effectDesc: 'Reduces incoming mob damage and reflects a thorny seismic shockwave back at attackers when struck.',
    maxHpBonus: 65,
    attackDamagePct: 0.04,
    abilityPowerPct: 0,
    attackSpeedPct: 0,
    moveSpeedPct: 0,
    armorBonus: 0.1,
    cooldownHastePct: 0.04,
    lifestealPct: 0,
    hpRegenPerSec: 3.5,
    critChancePct: 0
  },
  {
    id: 'frost_shard' as MobaItemId,
    name: 'Cryo-Crypt Frost Shard',
    shortName: 'CRYO SHARD',
    category: 'MAGIC' as const,
    color: '#60A5FA',
    iconKind: 'crystal',
    starterUnlocked: false,
    minAccountRank: 3,
    unlockCost: { gold: 540, scrap: 75, gems: 2 },
    baseUpgradeCost: { gold: 360, scrap: 60, gems: 1 },
    statSummary: '+12% Atk & Skill Power · +30 Max HP · Chill',
    effectName: 'Grave Chill',
    effectDesc: 'All primary attacks and Q/W/E abilities chill enemies on hit, slowing their movement and attacks by 38%.',
    maxHpBonus: 30,
    attackDamagePct: 0.12,
    abilityPowerPct: 0.14,
    attackSpeedPct: 0.06,
    moveSpeedPct: 0,
    armorBonus: 0.04,
    cooldownHastePct: 0.06,
    lifestealPct: 0,
    hpRegenPerSec: 1.0,
    critChancePct: 0
  },
  {
    id: 'soul_reaver' as MobaItemId,
    name: "Executioner's Soul-Reaver",
    shortName: 'REAVER',
    category: 'OFFENSE' as const,
    color: '#EC4899',
    iconKind: 'scythe_gem',
    starterUnlocked: false,
    minAccountRank: 4,
    unlockCost: { gold: 720, scrap: 105, gems: 3 },
    baseUpgradeCost: { gold: 450, scrap: 75, gems: 2 },
    statSummary: '+20% Attack Dmg · +14% Crit Chance',
    effectName: 'Cull the Damned',
    effectDesc: 'Deals +28% bonus execution damage against Elite Zombies, Raid Bosses, and enemies below 40% HP.',
    maxHpBonus: 15,
    attackDamagePct: 0.2,
    abilityPowerPct: 0.1,
    attackSpeedPct: 0.08,
    moveSpeedPct: 0.03,
    armorBonus: 0,
    cooldownHastePct: 0.05,
    lifestealPct: 0.04,
    hpRegenPerSec: 0,
    critChancePct: 0.14
  },
  {
    id: 'philosopher_chalice' as MobaItemId,
    name: "Alchemist's Philosopher Chalice",
    shortName: 'CHALICE',
    category: 'UTILITY' as const,
    color: '#10B981',
    iconKind: 'chalice',
    starterUnlocked: false,
    minAccountRank: 3,
    unlockCost: { gold: 520, scrap: 70, gems: 2 },
    baseUpgradeCost: { gold: 340, scrap: 55, gems: 1 },
    statSummary: '+50 Max HP · +6 HP/s Regen · +10% Haste',
    effectName: 'Vitality Overflow',
    effectDesc: 'Continuously regenerates HP every second and amplifies all healing & lifesteal effects by +30%.',
    maxHpBonus: 50,
    attackDamagePct: 0.05,
    abilityPowerPct: 0.12,
    attackSpeedPct: 0.05,
    moveSpeedPct: 0.04,
    armorBonus: 0.05,
    cooldownHastePct: 0.1,
    lifestealPct: 0.05,
    hpRegenPerSec: 6.0,
    critChancePct: 0
  },
  {
    id: 'morrigan_hourglass' as MobaItemId,
    name: "Morrigan's Cursed Hourglass",
    shortName: 'HOURGLASS',
    category: 'DEFENSE' as const,
    color: '#FBBF24',
    iconKind: 'hourglass',
    starterUnlocked: false,
    minAccountRank: 5,
    unlockCost: { gold: 920, scrap: 140, gems: 4 },
    baseUpgradeCost: { gold: 520, scrap: 90, gems: 2 },
    statSummary: '+12% Skill Power · +8% Armor · Wraith Shield',
    effectName: 'Wraith Barrier',
    effectDesc: 'Generates a regenerating Spectral Shield Barrier every 8s that absorbs incoming zombie & boss damage.',
    maxHpBonus: 40,
    attackDamagePct: 0.08,
    abilityPowerPct: 0.12,
    attackSpeedPct: 0,
    moveSpeedPct: 0.03,
    armorBonus: 0.08,
    cooldownHastePct: 0.1,
    lifestealPct: 0,
    hpRegenPerSec: 2.0,
    critChancePct: 0.05
  }
];

export const MOBA_ITEMS: MobaItemDefinition[] = RAW_MOBA_ITEMS.map((item) => ({
  ...item,
  passiveName: item.effectName,
  passiveDesc: item.effectDesc,
  stats: {
    bonusHp: item.maxHpBonus > 0 ? item.maxHpBonus : undefined,
    attackDamagePct: item.attackDamagePct > 0 ? Math.round(item.attackDamagePct * 100) : undefined,
    abilityPowerPct: item.abilityPowerPct > 0 ? Math.round(item.abilityPowerPct * 100) : undefined,
    attackSpeedPct: item.attackSpeedPct > 0 ? Math.round(item.attackSpeedPct * 100) : undefined,
    moveSpeedPct: item.moveSpeedPct > 0 ? Math.round(item.moveSpeedPct * 100) : undefined,
    armorPct: item.armorBonus > 0 ? Math.round(item.armorBonus * 100) : undefined,
    cooldownHastePct: item.cooldownHastePct > 0 ? Math.round(item.cooldownHastePct * 100) : undefined,
    lifestealPct: item.lifestealPct > 0 ? Math.round(item.lifestealPct * 100) : undefined
  }
}));

export const MOBA_ITEM_BY_ID: Record<MobaItemId, MobaItemDefinition> = MOBA_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<MobaItemId, MobaItemDefinition>
);

export const WEAPON_CLASS_LABELS: Record<WeaponClass, { label: string; color: string }> = {
  sidearm: { label: 'Sidearm', color: '#E2E8F0' },
  smg: { label: 'SMG / Rapid', color: '#4ADE80' },
  shotgun: { label: 'Shotgun', color: '#F97316' },
  marksman: { label: 'Marksman (MM)', color: '#38BDF8' },
  heavy: { label: 'Heavy / Pumpkin', color: '#EF4444' },
  support: { label: 'Occult / Tech', color: '#A855F7' }
};

// Kept for multiplayer packet & soundEngine weapon ID compatibility
export const WEAPON_DEFINITIONS: WeaponStats[] = [
  {
    id: 'pistol',
    keyNumber: 1,
    name: 'Silver-Bullet Pistol',
    shortName: 'SILVER 9MM',
    weaponClass: 'sidearm',
    element: 'kinetic',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 180, scrap: 25, gems: 0 },
    baseCooldown: 0.25,
    baseDamage: 38,
    magSize: 999,
    reloadTime: 0.5,
    baseReserveAmmo: -1,
    maxReserveAmmo: -1,
    isHitscan: true,
    spreadAngle: 0.02,
    pellets: 1,
    pierce: 2,
    range: 700,
    color: '#E2E8F0',
    description: 'Signature sidearm.'
  },
  {
    id: 'shotgun',
    keyNumber: 2,
    name: 'Cursed Soul Scythe',
    shortName: 'SOUL SCYTHE',
    weaponClass: 'shotgun',
    element: 'kinetic',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 200, scrap: 30, gems: 0 },
    baseCooldown: 0.36,
    baseDamage: 68,
    magSize: 999,
    reloadTime: 0.5,
    baseReserveAmmo: -1,
    maxReserveAmmo: -1,
    isHitscan: true,
    spreadAngle: 0.35,
    pellets: 5,
    pierce: 3,
    range: 145,
    color: '#EF4444',
    description: 'Crypt Reaper melee scythe cleave.'
  },
  {
    id: 'battle_rifle',
    keyNumber: 3,
    name: 'Silver Vanquisher Crossbow',
    shortName: 'CROSSBOW',
    weaponClass: 'marksman',
    element: 'kinetic',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 200, scrap: 30, gems: 0 },
    baseCooldown: 0.24,
    baseDamage: 44,
    magSize: 999,
    reloadTime: 0.5,
    baseReserveAmmo: -1,
    maxReserveAmmo: -1,
    isHitscan: true,
    spreadAngle: 0.01,
    pellets: 1,
    pierce: 2,
    range: 780,
    color: '#F97316',
    description: 'Witch Hunter piercing silver bolts.'
  },
  {
    id: 'auto_shotgun',
    keyNumber: 4,
    name: 'Gargoyle Crypt Maul',
    shortName: 'CRYPT MAUL',
    weaponClass: 'heavy',
    element: 'explosive',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 200, scrap: 30, gems: 0 },
    baseCooldown: 0.44,
    baseDamage: 74,
    magSize: 999,
    reloadTime: 0.5,
    baseReserveAmmo: -1,
    maxReserveAmmo: -1,
    isHitscan: true,
    spreadAngle: 0.32,
    pellets: 5,
    pierce: 3,
    range: 155,
    color: '#F59E0B',
    description: 'Grave Warden shockwave maul.'
  },
  {
    id: 'plasma_carbine',
    keyNumber: 5,
    name: 'Necro-Tonic Syringe Launcher',
    shortName: 'SYRINGE',
    weaponClass: 'support',
    element: 'lightning',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 200, scrap: 30, gems: 0 },
    baseCooldown: 0.22,
    baseDamage: 36,
    magSize: 999,
    reloadTime: 0.5,
    baseReserveAmmo: -1,
    maxReserveAmmo: -1,
    isHitscan: true,
    spreadAngle: 0.03,
    pellets: 1,
    pierce: 2,
    range: 660,
    color: '#10B981',
    description: 'Plague Alchemist corrosive syringe darts.'
  },
  {
    id: 'tesla_rifle',
    keyNumber: 6,
    name: 'Eldritch Skull Staff',
    shortName: 'SKULL STAFF',
    weaponClass: 'support',
    element: 'lightning',
    starterUnlocked: true,
    minAccountRank: 1,
    unlockCost: { gold: 0, scrap: 0, gems: 0 },
    baseUpgradeCost: { gold: 200, scrap: 30, gems: 0 },
    baseCooldown: 0.34,
    baseDamage: 48,
    magSize: 999,
    reloadTime: 0.5,
    baseReserveAmmo: -1,
    maxReserveAmmo: -1,
    isHitscan: true,
    isChainArc: true,
    spreadAngle: 0.02,
    pellets: 1,
    pierce: 1,
    range: 640,
    color: '#A855F7',
    description: 'Necro-Warlock chaining soul-fire bolts.'
  }
];

export const WEAPON_BY_ID: Record<WeaponId, WeaponStats> = WEAPON_DEFINITIONS.reduce(
  (acc, w) => {
    acc[w.id] = w;
    return acc;
  },
  {
    revolver: WEAPON_DEFINITIONS[0],
    dual_pistols: WEAPON_DEFINITIONS[0],
    uzi: WEAPON_DEFINITIONS[4],
    vector_smg: WEAPON_DEFINITIONS[4],
    cryo_shotgun: WEAPON_DEFINITIONS[1],
    sniper_rifle: WEAPON_DEFINITIONS[2],
    railgun: WEAPON_DEFINITIONS[2],
    grenade: WEAPON_DEFINITIONS[3],
    rocket: WEAPON_DEFINITIONS[3],
    cluster_mortar: WEAPON_DEFINITIONS[3],
    flamethrower: WEAPON_DEFINITIONS[5],
    sentry_turret: WEAPON_DEFINITIONS[4],
    barricade_kit: WEAPON_DEFINITIONS[3]
  } as Record<WeaponId, WeaponStats>
);

// ============================================================================
// EVERY-5-WAVES ELEMENTAL BOSS DEFINITIONS
// ============================================================================
export interface ElementalBossConfig {
  element: BossElement;
  type: 'boss_fire' | 'boss_lightning' | 'boss_frost' | 'boss_venom';
  name: string;
  title: string;
  elementLabel: string;
  color: string;
  weaknessWeaponClasses: WeaponClass[];
  weaknessElements: ('kinetic' | 'fire' | 'lightning' | 'frost' | 'explosive')[];
  weaknessText: string;
  resistanceElements: ('kinetic' | 'fire' | 'lightning' | 'frost' | 'explosive')[];
  resistanceText: string;
  baseHp: number;
  baseSpeed: number;
  baseDamage: number;
}

export const ELEMENTAL_BOSS_CONFIGS: ElementalBossConfig[] = [
  {
    element: 'fire',
    type: 'boss_fire',
    name: "JACK-O'-INFERNO OVERLORD",
    title: 'ZOMBIE TITAN OF HELLFIRE (WAVE 5 TIER)',
    elementLabel: 'HELLFIRE ZOMBIE',
    color: '#F97316',
    weaknessWeaponClasses: ['marksman', 'shotgun'],
    weaknessElements: ['frost', 'kinetic'],
    weaknessText: 'WEAK: CRYO SHARD & RANGED/MELEE (+25% DMG)',
    resistanceElements: ['fire'],
    resistanceText: 'RESISTS: FIRE (-20% DMG)',
    baseHp: 2600,
    baseSpeed: 98,
    baseDamage: 32
  },
  {
    element: 'lightning',
    type: 'boss_lightning',
    name: 'FRANKEN-VOLT GOLIATH',
    title: 'ZOMBIE TITAN OF GALVANIC STORM (WAVE 10 TIER)',
    elementLabel: 'GALVANIC ZOMBIE',
    color: '#22D3EE',
    weaknessWeaponClasses: ['heavy', 'marksman'],
    weaknessElements: ['explosive'],
    weaknessText: 'WEAK: TANK MAUL & RANGED (+25% DMG)',
    resistanceElements: ['lightning'],
    resistanceText: 'RESISTS: LIGHTNING (-20% DMG)',
    baseHp: 3100,
    baseSpeed: 94,
    baseDamage: 35
  },
  {
    element: 'frost',
    type: 'boss_frost',
    name: 'CRYPT-LICH FROST MONARCH',
    title: 'ZOMBIE TITAN OF CURSED FROST (WAVE 15 TIER)',
    elementLabel: 'FROST LICH ZOMBIE',
    color: '#60A5FA',
    weaknessWeaponClasses: ['heavy', 'support'],
    weaknessElements: ['fire', 'explosive'],
    weaknessText: 'WEAK: HELLFIRE & MAGIC SKILLS (+25% DMG)',
    resistanceElements: ['frost'],
    resistanceText: 'RESISTS: FROST (-20% DMG)',
    baseHp: 3500,
    baseSpeed: 92,
    baseDamage: 34
  },
  {
    element: 'venom',
    type: 'boss_venom',
    name: 'PLAGUE-CAULDRON COLOSSUS',
    title: 'ZOMBIE TITAN OF NECROTIC BLIGHT (WAVE 20 TIER)',
    elementLabel: 'PLAGUE ZOMBIE',
    color: '#84CC16',
    weaknessWeaponClasses: ['smg', 'support'],
    weaknessElements: ['lightning', 'fire'],
    weaknessText: 'WEAK: MAGIC, ALCHEMIST & REAPER (+25% DMG)',
    resistanceElements: ['kinetic'],
    resistanceText: 'RESISTS: PHYSICAL (-15% DMG)',
    baseHp: 3900,
    baseSpeed: 102,
    baseDamage: 36
  }
];

export function getElementalBossForWave(waveNum: number): ElementalBossConfig {
  const bossIndex = Math.max(0, Math.floor(waveNum / 5) - 1) % ELEMENTAL_BOSS_CONFIGS.length;
  return ELEMENTAL_BOSS_CONFIGS[bossIndex];
}

// ============================================================================
// BLOOD-MOON COMBO MILESTONES (ClassZ Streak Rewards)
// ============================================================================
export const COMBO_MILESTONES: ComboMilestone[] = [
  {
    combo: 8,
    title: 'BLOOD MOON I: GRAVE FOCUS',
    subtitle: '+10% Cooldown Haste & +35 Gold Coins',
    rewardGold: 35,
    rewardScrap: 5
  },
  {
    combo: 18,
    title: 'BLOOD MOON II: CRYPT SCAVENGER',
    subtitle: '+15% Attack Speed & +65 Gold / +12 Scrap',
    rewardGold: 65,
    rewardScrap: 12
  },
  {
    combo: 32,
    title: 'BLOOD MOON III: SOUL SURGE',
    subtitle: 'Instant Q/W/E Cooldown Refresh & +110 Gold',
    rewardGold: 110,
    rewardScrap: 20
  },
  {
    combo: 50,
    title: 'BLOOD MOON IV: WITCHING REFLEX',
    subtitle: '+25% Cooldown Haste, +15% Attack Speed & +180 Gold',
    rewardGold: 180,
    rewardScrap: 35
  },
  {
    combo: 75,
    title: 'BLOOD MOON V: UNDEAD EXECUTIONER',
    subtitle: '+25% Ability & Attack Damage & +300 Gold / +60 Scrap',
    rewardGold: 300,
    rewardScrap: 60
  },
  {
    combo: 100,
    title: 'BLOOD MOON MAX: CLASSZ ASCENSION',
    subtitle: 'Full HP Restore + Q/W/E Reset & +500 Gold',
    rewardGold: 500,
    rewardScrap: 100
  }
];

// ============================================================================
// CLASSZ IN-MATCH PASSIVE & ITEM SYNERGY BOONS (Every-3-Waves Draft)
// ============================================================================
export const ROGUELIKE_PERKS: RoguelikePerkDefinition[] = [
  {
    id: 'vampiric_rounds',
    name: 'Nosferatu Blood Siphon',
    category: 'BUFF',
    rarity: 'RARE',
    color: '#10B981',
    description: 'Every zombie kill siphons undead life-force, restoring +4 HP per stack and permanently boosting Max HP by +25.',
    statSummary: '+4 HP / Kill · +25 Max HP'
  },
  {
    id: 'chain_lightning',
    name: 'Franken-Storm Coils',
    category: 'ABILITY',
    rarity: 'EPIC',
    color: '#38BDF8',
    description: 'Primary attacks and skills arc galvanic lightning to nearby zombies for 45% bonus shock damage.',
    statSummary: '+1 Lightning Arc Target / Stack'
  },
  {
    id: 'orbital_drone',
    name: 'Haunted Will-o-Wisp',
    category: 'ABILITY',
    rarity: 'LEGENDARY',
    color: '#22D3EE',
    description: 'Summons an orbiting spectral lantern around your hero that automatically zaps nearby zombies.',
    statSummary: '+1 Spectral Wisp Orbiter'
  },
  {
    id: 'sleight_of_hand',
    name: 'Chrono-Crypt Rune',
    category: 'ABILITY',
    rarity: 'RARE',
    color: '#F59E0B',
    description: 'Reduces all Q, W, and E ability cooldowns by 15% per stack and immediately refreshes active cooldowns.',
    statSummary: '+15% Ability Cooldown Haste'
  },
  {
    id: 'explosive_rounds',
    name: 'Jack-o-Brimstone Primers',
    category: 'WEAPON',
    rarity: 'EPIC',
    color: '#EF4444',
    description: 'Primary attacks have a 30% chance per stack to detonate a fiery pumpkin-ember blast on impact.',
    statSummary: '+30% Explosive Hit Chance'
  },
  {
    id: 'cryo_munitions',
    name: 'Grave-Frost Payload',
    category: 'ABILITY',
    rarity: 'RARE',
    color: '#60A5FA',
    description: 'Primary attacks and abilities chill zombies and Raid Bosses, slowing their movement and attack speed by 35%.',
    statSummary: '35% Zombie & Boss Slow'
  },
  {
    id: 'adrenaline_overdrive',
    name: 'Full-Moon Lycan Rush',
    category: 'BUFF',
    rarity: 'RARE',
    color: '#FBBF24',
    description: 'Unleashes midnight reflexes, granting +15% Movement Speed and +20% Primary Attack Speed.',
    statSummary: '+15% Move Speed · +20% Atk Speed'
  },
  {
    id: 'pyromaniac_core',
    name: 'Hellfire Soul Amp',
    category: 'SYNERGY',
    rarity: 'EPIC',
    color: '#F97316',
    description: 'Increases all Q/W/E ability blast radii by +25% and increases Ability & Item damage by +25%.',
    statSummary: '+25% Skill Area & Ability Power'
  },
  {
    id: 'ammo_synthesizer',
    name: 'Gargoyle Bulwark Rune',
    category: 'BUFF',
    rarity: 'RARE',
    color: '#A855F7',
    description: 'Grants +35 Max HP, +8% Armor Damage Reduction, and regenerates +4 HP every second.',
    statSummary: '+35 Max HP · +8% Armor · Regen'
  },
  {
    id: 'boss_slayer',
    name: 'Blessed Silver Stakes',
    category: 'WEAPON',
    rarity: 'EPIC',
    color: '#EC4899',
    description: 'Increases primary attack damage by +22%, +1 Pierce, and deals +25% bonus damage to Zombie Raid Bosses.',
    statSummary: '+22% Damage · +25% vs Bosses'
  },
  {
    id: 'fortune_hunter',
    name: 'Grave-Robber Bounty',
    category: 'SYNERGY',
    rarity: 'RARE',
    color: '#EAB308',
    description: 'Increases Gold Coins and Cursed Scrap dropped by all undead by +40% per stack and grants +150 Gold now.',
    statSummary: '+40% Loot Drops · +150 Gold'
  },
  {
    id: 'shockwave_nova',
    name: 'Banshee Wail Nova',
    category: 'ABILITY',
    rarity: 'EPIC',
    color: '#34D399',
    description: 'Emits an automatic spectral shockwave around your hero every 6s that blasts back surrounding zombie hordes.',
    statSummary: 'Auto Banshee Blast Every 6s'
  }
];

// ============================================================================
// DYNAMIC ASPECT-ADAPTIVE ARENA BUILDER (Supports Portrait Mobile & Landscape)
// ============================================================================
export function generatePerimeterSpawners(w: number, h: number) {
  const isPortrait = h > w;
  if (isPortrait) {
    return [
      { x: Math.round(w * 0.25), y: 34, dirX: 0, dirY: 1 },
      { x: Math.round(w * 0.5), y: 34, dirX: 0, dirY: 1 },
      { x: Math.round(w * 0.75), y: 34, dirX: 0, dirY: 1 },
      { x: Math.round(w * 0.25), y: h - 34, dirX: 0, dirY: -1 },
      { x: Math.round(w * 0.5), y: h - 34, dirX: 0, dirY: -1 },
      { x: Math.round(w * 0.75), y: h - 34, dirX: 0, dirY: -1 },
      { x: 34, y: Math.round(h * 0.2), dirX: 1, dirY: 0 },
      { x: 34, y: Math.round(h * 0.4), dirX: 1, dirY: 0 },
      { x: 34, y: Math.round(h * 0.6), dirX: 1, dirY: 0 },
      { x: 34, y: Math.round(h * 0.8), dirX: 1, dirY: 0 },
      { x: w - 34, y: Math.round(h * 0.2), dirX: -1, dirY: 0 },
      { x: w - 34, y: Math.round(h * 0.4), dirX: -1, dirY: 0 },
      { x: w - 34, y: Math.round(h * 0.6), dirX: -1, dirY: 0 },
      { x: w - 34, y: Math.round(h * 0.8), dirX: -1, dirY: 0 }
    ];
  }

  return [
    { x: Math.round(w * 0.2), y: 34, dirX: 0, dirY: 1 },
    { x: Math.round(w * 0.4), y: 34, dirX: 0, dirY: 1 },
    { x: Math.round(w * 0.6), y: 34, dirX: 0, dirY: 1 },
    { x: Math.round(w * 0.8), y: 34, dirX: 0, dirY: 1 },
    { x: Math.round(w * 0.2), y: h - 34, dirX: 0, dirY: -1 },
    { x: Math.round(w * 0.4), y: h - 34, dirX: 0, dirY: -1 },
    { x: Math.round(w * 0.6), y: h - 34, dirX: 0, dirY: -1 },
    { x: Math.round(w * 0.8), y: h - 34, dirX: 0, dirY: -1 },
    { x: 34, y: Math.round(h * 0.25), dirX: 1, dirY: 0 },
    { x: 34, y: Math.round(h * 0.5), dirX: 1, dirY: 0 },
    { x: 34, y: Math.round(h * 0.75), dirX: 1, dirY: 0 },
    { x: w - 34, y: Math.round(h * 0.25), dirX: -1, dirY: 0 },
    { x: w - 34, y: Math.round(h * 0.5), dirX: -1, dirY: 0 },
    { x: w - 34, y: Math.round(h * 0.75), dirX: -1, dirY: 0 }
  ];
}

function scaleObstacles(obs: ObstacleRect[], scaleX: number, scaleY: number): ObstacleRect[] {
  return obs.map((o) => ({
    ...o,
    x: Math.round(o.x * scaleX),
    y: Math.round(o.y * scaleY),
    w: Math.max(42, Math.round(o.w * scaleX)),
    h: Math.max(42, Math.round(o.h * scaleY))
  }));
}

const BASE_W = 2400;
const BASE_H = 1800;

function buildBoxyCitadelObstacles(): ObstacleRect[] {
  return [
    { id: 'bc_c1', x: 940, y: 640, w: 85, h: 85, kind: 'pillar' },
    { id: 'bc_c2', x: 1375, y: 640, w: 85, h: 85, kind: 'pillar' },
    { id: 'bc_c3', x: 940, y: 1075, w: 85, h: 85, kind: 'pillar' },
    { id: 'bc_c4', x: 1375, y: 1075, w: 85, h: 85, kind: 'pillar' },
    { id: 'bc_nw1', x: 360, y: 310, w: 220, h: 50, kind: 'wall' },
    { id: 'bc_nw2', x: 360, y: 360, w: 50, h: 190, kind: 'wall' },
    { id: 'bc_ne1', x: 1820, y: 310, w: 220, h: 50, kind: 'wall' },
    { id: 'bc_ne2', x: 1990, y: 360, w: 50, h: 190, kind: 'wall' },
    { id: 'bc_sw1', x: 360, y: 1440, w: 220, h: 50, kind: 'wall' },
    { id: 'bc_sw2', x: 360, y: 1250, w: 50, h: 190, kind: 'wall' },
    { id: 'bc_se1', x: 1820, y: 1440, w: 220, h: 50, kind: 'wall' },
    { id: 'bc_se2', x: 1990, y: 1250, w: 50, h: 190, kind: 'wall' },
    { id: 'bc_m1', x: 660, y: 820, w: 100, h: 150, kind: 'crate' },
    { id: 'bc_m2', x: 1640, y: 820, w: 100, h: 150, kind: 'crate' },
    { id: 'bc_m3', x: 1130, y: 360, w: 140, h: 80, kind: 'crate' },
    { id: 'bc_m4', x: 1130, y: 1360, w: 140, h: 80, kind: 'crate' }
  ];
}

function buildColumnsMegaBunkerObstacles(): ObstacleRect[] {
  const obs: ObstacleRect[] = [];
  const xs = [400, 780, 1160, 1540, 1920];
  const ys = [340, 680, 1040, 1380];
  let idx = 1;
  for (const x of xs) {
    for (const y of ys) {
      if (x === 1160 && (y === 680 || y === 1040)) continue;
      obs.push({
        id: `col_${idx++}`,
        x,
        y,
        w: 80,
        h: 80,
        kind: idx % 3 === 0 ? 'crate' : 'pillar'
      });
    }
  }
  return obs;
}

function buildHellCalderaObstacles(): ObstacleRect[] {
  return [
    { id: 'hl_l1', x: 440, y: 340, w: 320, h: 190, kind: 'lava' },
    { id: 'hl_l2', x: 1640, y: 340, w: 320, h: 190, kind: 'lava' },
    { id: 'hl_l3', x: 440, y: 1270, w: 320, h: 190, kind: 'lava' },
    { id: 'hl_l4', x: 1640, y: 1270, w: 320, h: 190, kind: 'lava' },
    { id: 'hl_l5', x: 670, y: 820, w: 200, h: 150, kind: 'lava' },
    { id: 'hl_l6', x: 1530, y: 820, w: 200, h: 150, kind: 'lava' },
    { id: 'hl_p1', x: 1000, y: 610, w: 78, h: 78, kind: 'pillar' },
    { id: 'hl_p2', x: 1320, y: 610, w: 78, h: 78, kind: 'pillar' },
    { id: 'hl_p3', x: 1000, y: 1110, w: 78, h: 78, kind: 'pillar' },
    { id: 'hl_p4', x: 1320, y: 1110, w: 78, h: 78, kind: 'pillar' }
  ];
}

export const ARENA_DEFINITIONS: Record<ArenaId, ArenaDefinition> = {
  boxy: {
    id: 'boxy',
    name: 'HAUNTED GRAVEYARD',
    subtitle: 'Moonlit Tombstones & Crypt Walls',
    difficultyLabel: 'STANDARD',
    width: BASE_W,
    height: BASE_H,
    floorColor: '#181426',
    gridLineColor: 'rgba(139, 92, 246, 0.09)',
    wallTopColor: '#2D2647',
    wallSideColor: '#1A162B',
    accentColor: '#F97316',
    devilSpawnRateMultiplier: 1.0,
    p1Spawn: { x: 1140, y: 900 },
    p2Spawn: { x: 1260, y: 900 },
    spawners: generatePerimeterSpawners(BASE_W, BASE_H),
    obstacles: buildBoxyCitadelObstacles()
  },
  columns: {
    id: 'columns',
    name: 'CURSED PUMPKIN PATCH',
    subtitle: "Jack-o'-Lantern Maze & Tomb Pillars",
    difficultyLabel: 'TACTICAL',
    width: BASE_W,
    height: BASE_H,
    floorColor: '#1C130E',
    gridLineColor: 'rgba(249, 115, 22, 0.09)',
    wallTopColor: '#3E2519',
    wallSideColor: '#271710',
    accentColor: '#F59E0B',
    devilSpawnRateMultiplier: 1.25,
    p1Spawn: { x: 1140, y: 900 },
    p2Spawn: { x: 1260, y: 900 },
    spawners: generatePerimeterSpawners(BASE_W, BASE_H),
    obstacles: buildColumnsMegaBunkerObstacles()
  },
  hell: {
    id: 'hell',
    name: 'INFERNAL CRYPT',
    subtitle: 'Catacomb Vaults & Hellfire Trenches',
    difficultyLabel: 'NIGHTMARE',
    width: BASE_W,
    height: BASE_H,
    floorColor: '#180D12',
    gridLineColor: 'rgba(239, 68, 68, 0.09)',
    wallTopColor: '#3F1621',
    wallSideColor: '#260E14',
    accentColor: '#EF4444',
    devilSpawnRateMultiplier: 1.5,
    p1Spawn: { x: 1140, y: 900 },
    p2Spawn: { x: 1260, y: 900 },
    spawners: generatePerimeterSpawners(BASE_W, BASE_H),
    obstacles: buildHellCalderaObstacles()
  }
};

export function buildAdaptiveArena(arenaId: ArenaId, isPortrait: boolean, isOnlineCoop: boolean): ArenaDefinition {
  const base = ARENA_DEFINITIONS[arenaId] || ARENA_DEFINITIONS.boxy;
  const targetW = !isOnlineCoop && isPortrait ? 1500 : BASE_W;
  const targetH = !isOnlineCoop && isPortrait ? 2100 : BASE_H;
  const scaleX = targetW / BASE_W;
  const scaleY = targetH / BASE_H;

  return {
    ...base,
    width: targetW,
    height: targetH,
    p1Spawn: { x: Math.round(targetW * 0.47), y: Math.round(targetH * 0.5) },
    p2Spawn: { x: Math.round(targetW * 0.53), y: Math.round(targetH * 0.5) },
    spawners: generatePerimeterSpawners(targetW, targetH),
    obstacles: scaleObstacles(base.obstacles, scaleX, scaleY)
  };
}
