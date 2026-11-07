import { soundEngine } from '../audio/soundEngine';
import {
  multiplayerClient,
  NetworkPlayerAction,
  RemotePlayerPacket,
  WorldSyncPacket
} from '../network/multiplayerClient';
import {
  ActivePerkState,
  ArenaDefinition,
  ArenaId,
  BossElement,
  BossHUDData,
  CurrencyBundle,
  EnemyType,
  GameMode,
  GameScreenState,
  HUDStateSnapshot,
  LobbyDetail,
  ObstacleRect,
  OperatorClassId,
  PlayerAbilityHUDSlot,
  PlayerEquippedItemHUD,
  PlayerHUDData,
  PlayerWeaponState,
  RemoteAllyHUD,
  ReviveOfferData,
  RoguelikePerkDefinition,
  TacticalPingData,
  TacticalPingKind,
  WeaponId
} from '../types/game';
import {
  buildAdaptiveArena,
  COMBO_MILESTONES,
  ELEMENTAL_BOSS_CONFIGS,
  getElementalBossForWave,
  MOBA_ITEM_BY_ID,
  OPERATOR_CLASSES,
  ROGUELIKE_PERKS,
  WEAPON_BY_ID,
  WEAPON_DEFINITIONS
} from './constants';
import {
  drawPixelHalloweenObstacle,
  drawPixelOperatorSprite,
  drawPixelWeaponInHand,
  drawPixelZombieSprite,
  getArenaPixelPattern
} from './pixelArt';
import { progressionManager } from './progression';

interface PlayerEntity {
  id: 1 | 2;
  name: string;
  operatorClass: OperatorClassId;
  headbandColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  hp: number;
  maxHp: number;
  shieldHp: number;
  maxShieldHp: number;
  shieldRegenTimer: number;
  alive: boolean;
  respawnTimer: number;
  invulnTimer: number;
  hitFlashTimer: number;
  chillTimer: number;
  walkCycle: number;
  score: number;
  kills: number;
  deaths: number;
  frags: number;
  inMatchLevel: number;
  inMatchXp: number;
  inMatchXpToNext: number;
  skillCooldown: number;
  skillMaxCooldown: number;
  skillActiveTimer: number;
  abilityCooldowns: [number, number, number, number];
  abilityMaxCooldowns: [number, number, number, number];
  abilityActiveTimers: [number, number, number, number];
  moveTarget: { x: number; y: number } | null;
  attackTargetId: number | null;
  primaryAttackCount: number;
  meleeSwingTimer: number;
  meleeSwingDir: number;
  reaperFrenzyTimer: number;
  spectralPhaseTimer: number;
  activeWeaponIndex: number;
  fireCooldown: number;
  weapons: PlayerWeaponState[];
  isBot?: boolean;
  botTargetTimer?: number;
  botMoveDir?: { x: number; y: number };
}

interface RemoteAllyEntity {
  id: string;
  name: string;
  color: string;
  operatorClass?: OperatorClassId;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
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
  walkCycle: number;
}

interface EnemyEntity {
  id: number;
  type: EnemyType;
  isBoss?: boolean;
  isMegaBoss?: boolean;
  bossPhase?: number;
  bossElement?: BossElement;
  bossName?: string;
  bossTitle?: string;
  bossWeaknessText?: string;
  bossResistanceText?: string;
  bossScaledPlayers?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  hitFlashTimer: number;
  chillTimer: number;
  burnTimer: number;
  walkCycle: number;
  attackCooldown: number;
  windupTimer: number;
  isWindingUp: boolean;
  attackPattern: number;
  scoreValue: number;
  abilityCooldown?: number;
  dashTimer?: number;
  dashVx?: number;
  dashVy?: number;
  frenzyTimer?: number;
  strafeDir?: number;
  aimX?: number;
  aimY?: number;
}

interface PlaceableEntity {
  id: number;
  type: 'barrel' | 'fake_wall' | 'claymore' | 'charge_pack' | 'sentry_turret';
  ownerId: 1 | 2;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  blastRadius: number;
  damage: number;
  chainTimer: number;
  armedTimer: number;
  lifeTimer?: number;
  fireTimer?: number;
  turretAngle?: number;
  cluster?: boolean;
}

interface ProjectileEntity {
  id: number;
  kind:
    | 'grenade'
    | 'rocket'
    | 'fireball'
    | 'cluster_bomblet'
    | 'tesla_orb'
    | 'acid_glob'
    | 'frost_shard'
    | 'sniper_bolt'
    | 'silver_stake'
    | 'alchemist_syringe'
    | 'eldritch_skull'
    | 'cauldron_flask';
  ownerId: 1 | 2 | 0;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  damage: number;
  blastRadius: number;
  timer: number;
  cluster: boolean;
  pierceLeft?: number;
  hitIds?: Set<number>;
}

interface SlashArcEffect {
  x: number;
  y: number;
  angle: number;
  radius: number;
  arcSpan: number;
  color: string;
  coreColor?: string;
  secondaryColor?: string;
  life: number;
  maxLife: number;
  kind:
    | 'scythe_cleave'
    | 'guillotine_slam'
    | 'whirlwind_spin'
    | 'maul_cone'
    | 'tombstone_charge'
    | 'afterimage';
  ownerClass?: OperatorClassId;
  operatorClass?: OperatorClassId;
  swingDir?: number;
}

interface SkillGroundZone {
  id: number;
  kind:
    | 'acid_pool'
    | 'sanctuary_totem'
    | 'seismic_crater'
    | 'pumpkin_snare'
    | 'meteor_strike'
    | 'frost_prison';
  ownerId: 1 | 2 | 0;
  x: number;
  y: number;
  radius: number;
  damage: number;
  heal?: number;
  meteorsLeft?: number;
  life: number;
  maxLife: number;
  tickTimer: number;
  color: string;
  triggered?: boolean;
}

interface BeamEffect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
  isLightning?: boolean;
}

interface ExplosionRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  leaveDecal?: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

interface PickupCrate {
  id: number;
  kind: 'ammo' | 'medkit' | 'dm_weapon' | 'gold' | 'scrap' | 'xp' | 'gold_pouch';
  x: number;
  y: number;
  life: number;
  pulse: number;
  value?: number;
}

export class BoxheadEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private decalCanvas: HTMLCanvasElement;
  private decalCtx: CanvasRenderingContext2D;

  private viewW: number = 1200;
  private viewH: number = 760;
  private isPortrait: boolean = false;
  private cameraX: number = 600;
  private cameraY: number = 450;

  private rafId: number | null = null;
  private lastTime: number = 0;

  private screen: GameScreenState = 'TITLE_MENU';
  private mode: GameMode = 'single';
  private arenaId: ArenaId = 'boxy';
  private arena: ArenaDefinition;
  private friendlyFire: boolean = false;
  private mouseAimEnabled: boolean = true;

  private players: PlayerEntity[] = [];
  private remoteAllies: Map<string, RemoteAllyEntity> = new Map();
  private enemies: EnemyEntity[] = [];
  private placeables: PlaceableEntity[] = [];
  private projectiles: ProjectileEntity[] = [];
  private slashArcs: SlashArcEffect[] = [];
  private skillZones: SkillGroundZone[] = [];
  private beams: BeamEffect[] = [];
  private rings: ExplosionRing[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private pickups: PickupCrate[] = [];
  private dynamicObstacles: ObstacleRect[] = [];
  private tacticalPings: TacticalPingData[] = [];

  // Roguelike Perks & Passive Timers
  private perkStacks: Map<string, number> = new Map();
  private activePerks: ActivePerkState[] = [];
  private draftChoices: RoguelikePerkDefinition[] = [];
  private rerollsLeft: number = 2;
  private droneFireTimer: number = 0;
  private ammoRegenTimer: number = 0;
  private shockwaveNovaTimer: number = 0;
  private medicAuraTimer: number = 0;
  private engineerAmmoTimer: number = 0;
  private whirlwindTickTimer: number = 0;
  private bastionPulseTimer: number = 0;

  private nextEntityId: number = 1;
  private syncSeq: number = 1;
  private lastReceivedSyncSeq: number = 0;

  // Wave, Boss & Overdrive Combo state
  private wave: number = 1;
  private isBossWave: boolean = false;
  private waveEndBossSpawned: boolean = false;
  private enemiesToSpawnInWave: number = 0;
  private clientEnemiesRemaining: number = 0;
  private spawnTimer: number = 0;
  private waveIntermissionTimer: number = 0;
  private waveClearDraftDoneForWave: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private comboDecayTimer: number = 0;
  private unlockedMilestoneIndex: number = -1;
  private recentBanner: { title: string; subtitle: string; color: string; timestamp: number } | null = null;
  private winnerText: string | null = null;
  private elapsedSeconds: number = 0;

  // Session Currency & Revive State
  private sessionEarned: CurrencyBundle = { gold: 0, scrap: 0, gems: 0 };
  private reviveCount: number = 0;
  private reviveCountdown: number = 0;

  // Network sync accumulators
  private netStateTimer: number = 0;
  private netWorldSyncTimer: number = 0;

  // Feel & Camera Shake
  private hitstopTimer: number = 0;
  private shakeMagnitude: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;

  // Input state
  private heldKeys: Set<string> = new Set();
  private justPressedKeys: Set<string> = new Set();
  private mouseScreenPos: { x: number; y: number } = { x: 600, y: 380 };
  private mouseHeld: boolean = false;
  private mouseJustPressed: boolean = false;
  private mouseMovedRecently: boolean = false;
  private lastWheelSwitchTime: number = 0;

  // Mobile / Touchscreen virtual joystick state
  private touchMoveVec: { x: number; y: number } = { x: 0, y: 0 };
  private touchAimAngle: number | null = null;
  private touchFireHeld: boolean = false;
  private touchFireJustPressed: boolean = false;

  private onHUDUpdate: (snapshot: HUDStateSnapshot) => void;
  private hudSyncAccumulator: number = 0;

  constructor(canvas: HTMLCanvasElement, onHUDUpdate: (snapshot: HUDStateSnapshot) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not initialize 2D context');
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;

    this.mouseAimEnabled = progressionManager.settings.mouseAim;
    this.friendlyFire = progressionManager.settings.friendlyFire;

    this.updateViewportDimensions();
    this.arena = buildAdaptiveArena(this.arenaId, this.isPortrait, false);

    this.decalCanvas = document.createElement('canvas');
    this.decalCanvas.width = this.arena.width;
    this.decalCanvas.height = this.arena.height;
    const dCtx = this.decalCanvas.getContext('2d');
    if (!dCtx) throw new Error('Could not initialize decal 2D context');
    dCtx.imageSmoothingEnabled = false;
    this.decalCtx = dCtx;

    this.onHUDUpdate = onHUDUpdate;

    for (let i = 0; i < 550; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 4,
        color: '#DC2626',
        life: 0,
        maxLife: 1
      });
    }

    this.bindEvents();
    this.bindMultiplayerHooks();
    this.setupDemoWorld();
  }

  public updateViewportDimensions() {
    const w = window.innerWidth || 1200;
    const h = window.innerHeight || 760;
    const portrait = h > w;
    this.isPortrait = portrait;

    // Adapt virtual camera resolution to match exact screen aspect ratio while keeping crisp scale
    const aspect = w / Math.max(1, h);
    if (portrait) {
      // Portrait mobile: e.g. 540w x 960h or proportional
      this.viewW = Math.round(Math.max(460, Math.min(720, 920 * aspect)));
      this.viewH = Math.round(this.viewW / Math.max(0.42, aspect));
    } else {
      // Landscape desktop/mobile: e.g. 1280w x 720h
      this.viewH = 760;
      this.viewW = Math.round(Math.max(960, Math.min(1680, this.viewH * aspect)));
    }

    if (this.canvas.width !== this.viewW || this.canvas.height !== this.viewH) {
      this.canvas.width = this.viewW;
      this.canvas.height = this.viewH;
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  private handleResize = () => {
    const prevPortrait = this.isPortrait;
    this.updateViewportDimensions();
    if (prevPortrait !== this.isPortrait && this.screen === 'TITLE_MENU') {
      this.setupDemoWorld();
    }
    this.emitHUD();
  };

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private bindMultiplayerHooks() {
    multiplayerClient.onMatchStarted = (room: LobbyDetail, startOnBossWave: boolean) => {
      this.startOnlineCoopGame(room, startOnBossWave);
    };

    multiplayerClient.onRemotePlayerState = (pkt: RemotePlayerPacket) => {
      if (this.mode !== 'online_coop') return;
      const existing = this.remoteAllies.get(pkt.id);
      if (existing) {
        existing.name = pkt.name;
        existing.color = pkt.color;
        existing.operatorClass = pkt.operatorClass;
        existing.targetX = pkt.x;
        existing.targetY = pkt.y;
        existing.vx = pkt.vx;
        existing.vy = pkt.vy;
        existing.angle = pkt.angle;
        existing.hp = pkt.hp;
        existing.maxHp = pkt.maxHp;
        existing.alive = pkt.alive;
        existing.weaponId = pkt.weaponId;
        existing.score = pkt.score;
        existing.kills = pkt.kills;
        existing.droneCount = pkt.droneCount;
      } else {
        this.remoteAllies.set(pkt.id, {
          id: pkt.id,
          name: pkt.name,
          color: pkt.color,
          operatorClass: pkt.operatorClass,
          x: pkt.x,
          y: pkt.y,
          targetX: pkt.x,
          targetY: pkt.y,
          vx: pkt.vx,
          vy: pkt.vy,
          angle: pkt.angle,
          hp: pkt.hp,
          maxHp: pkt.maxHp,
          alive: pkt.alive,
          weaponId: pkt.weaponId,
          score: pkt.score,
          kills: pkt.kills,
          droneCount: pkt.droneCount,
          walkCycle: 0
        });
      }

      if (this.screen === 'PLAYING' && !this.isAnySquadMemberAlive()) {
        this.openReviveOrGameOver(false);
      }
    };

    multiplayerClient.onPlayerLeft = (playerId: string) => {
      this.remoteAllies.delete(playerId);
      if (this.mode === 'online_coop' && this.screen === 'PLAYING' && !this.isAnySquadMemberAlive()) {
        this.openReviveOrGameOver(false);
      }
    };

    multiplayerClient.onRemotePlayerAction = (_playerId: string, action: NetworkPlayerAction) => {
      if (this.mode !== 'online_coop') return;
      switch (action.kind) {
        case 'beam': {
          soundEngine.playWeaponFire(action.weaponId);
          this.beams.push({
            x1: action.x1,
            y1: action.y1,
            x2: action.x2,
            y2: action.y2,
            color: action.color,
            width: action.width,
            life: action.width > 3 ? 0.18 : 0.065,
            maxLife: action.width > 3 ? 0.18 : 0.065
          });
          break;
        }
        case 'explosion': {
          this.triggerExplosion(action.x, action.y, action.blastRadius, action.damage, 1, action.cluster, true);
          break;
        }
        case 'placeable': {
          if (action.placeableType === 'fake_wall') {
            this.dynamicObstacles.push({
              id: `fw_net_${this.nextEntityId++}`,
              x: action.x - 22,
              y: action.y - 22,
              w: 44,
              h: 44,
              kind: 'crate',
              destructible: true,
              hp: 400,
              maxHp: 400
            });
          } else {
            this.placeables.push({
              id: this.nextEntityId++,
              type: action.placeableType,
              ownerId: 1,
              x: action.x,
              y: action.y,
              radius: action.placeableType === 'barrel' ? 16 : 14,
              hp: 40,
              maxHp: 40,
              blastRadius: action.blastRadius,
              damage: action.damage,
              chainTimer: 0,
              armedTimer: 0.4,
              lifeTimer: action.placeableType === 'sentry_turret' ? 18 : undefined,
              fireTimer: 0,
              turretAngle: 0
            });
          }
          break;
        }
        case 'damage_enemy': {
          if (multiplayerClient.isHost()) {
            const target = this.enemies.find((e) => e.id === action.enemyId);
            if (target) {
              this.damageEnemy(
                target,
                action.amount,
                undefined,
                action.knockX,
                action.knockY,
                false,
                true,
                action.weaponId
              );
            }
          }
          break;
        }
        case 'enemy_killed': {
          const idx = this.enemies.findIndex((e) => e.id === action.enemyId);
          if (idx !== -1) {
            const dead = this.enemies[idx];
            this.drawBloodSplatter(dead.x, dead.y, dead.isBoss ? 42 : 14);
            this.enemies.splice(idx, 1);
          }
          break;
        }
        case 'class_heal_burst': {
          const p1 = this.players[0];
          if (p1) {
            if (!p1.alive) {
              p1.alive = true;
              p1.hp = Math.round(p1.maxHp * 0.6);
              p1.invulnTimer = 2.5;
              if (this.screen === 'REVIVE_PROMPT') this.screen = 'PLAYING';
            } else {
              p1.hp = Math.min(p1.maxHp, p1.hp + action.healAmount);
            }
            this.addFloatingText(p1.x, p1.y - 30, `+${action.healAmount} HP MEDIC BURST`, undefined, '#10B981', 1.1);
          }
          this.rings.push({
            x: action.x,
            y: action.y,
            radius: 16,
            maxRadius: 260,
            color: '#10B981',
            life: 0.4,
            maxLife: 0.4
          });
          break;
        }
        case 'trigger_boss': {
          if (multiplayerClient.isHost()) {
            this.triggerImmediateBossWave();
          }
          break;
        }
        case 'ping': {
          this.receiveTacticalPing(
            action.id,
            action.senderName,
            action.senderColor,
            action.pingKind,
            action.label,
            action.x,
            action.y
          );
          break;
        }
        case 'game_over': {
          this.triggerSquadWipeGameOver(true);
          break;
        }
      }
    };

    multiplayerClient.onWorldSync = (sync: WorldSyncPacket) => {
      if (this.mode !== 'online_coop' || multiplayerClient.isHost()) return;
      if (sync.seq && sync.seq < this.lastReceivedSyncSeq) return;
      this.lastReceivedSyncSeq = sync.seq || 0;

      if (sync.wave > this.wave) {
        const prevWave = this.wave;
        this.wave = sync.wave;
        this.isBossWave = sync.isBossWave;
        soundEngine.setMusicState(this.isBossWave ? 'boss' : 'combat');
        if (this.screen === 'PLAYING' && this.waveClearDraftDoneForWave < prevWave) {
          this.waveClearDraftDoneForWave = prevWave;
          this.openWavePerkDraft();
        }
      }
      this.isBossWave = sync.isBossWave;
      if (sync.combo > this.combo) {
        this.combo = sync.combo;
        this.comboDecayTimer = 1.0;
        this.checkComboMilestones(this.players[0]);
      }
      if (sync.maxCombo > this.maxCombo) {
        this.maxCombo = sync.maxCombo;
      }
      this.enemiesToSpawnInWave = sync.enemiesToSpawn;
      this.clientEnemiesRemaining =
        typeof sync.enemiesRemaining === 'number'
          ? sync.enemiesRemaining
          : sync.enemies.length + sync.enemiesToSpawn;

      // Authoritative enemy list reconciliation
      const incomingIds = new Set<number>();
      for (const ne of sync.enemies) {
        incomingIds.add(ne.id);
        const existing = this.enemies.find((e) => e.id === ne.id);
        if (existing) {
          existing.x += (ne.x - existing.x) * 0.55;
          existing.y += (ne.y - existing.y) * 0.55;
          existing.vx = ne.vx;
          existing.vy = ne.vy;
          existing.angle = ne.angle;
          existing.hp = ne.hp;
          existing.maxHp = ne.maxHp;
          existing.isWindingUp = ne.isWindingUp;
          existing.chillTimer = ne.chillTimer;
          existing.bossElement = ne.bossElement;
          existing.isMegaBoss = ne.isMegaBoss;
        } else {
          const bossCfg = ne.isBoss
            ? ELEMENTAL_BOSS_CONFIGS.find((c) => c.element === ne.bossElement) || ELEMENTAL_BOSS_CONFIGS[0]
            : null;
          this.enemies.push({
            id: ne.id,
            type: ne.type,
            isBoss: ne.isBoss,
            isMegaBoss: ne.isMegaBoss,
            bossElement: ne.bossElement,
            bossName: ne.bossName || bossCfg?.name,
            bossTitle: ne.bossTitle || bossCfg?.title,
            bossWeaknessText: bossCfg?.weaknessText,
            bossResistanceText: bossCfg?.resistanceText,
            bossScaledPlayers: 1 + this.remoteAllies.size,
            x: ne.x,
            y: ne.y,
            vx: ne.vx,
            vy: ne.vy,
            radius: this.getEnemyRadius(ne.type, !!ne.isBoss),
            angle: ne.angle,
            hp: ne.hp,
            maxHp: ne.maxHp,
            speed: 95,
            damage: 25,
            hitFlashTimer: 0,
            chillTimer: ne.chillTimer,
            burnTimer: 0,
            walkCycle: 0,
            attackCooldown: 1.0,
            windupTimer: 0,
            isWindingUp: ne.isWindingUp,
            attackPattern: 0,
            scoreValue: ne.isBoss ? 5000 : 150
          });
        }
      }

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        if (!incomingIds.has(this.enemies[i].id)) {
          const dead = this.enemies[i];
          this.drawBloodSplatter(dead.x, dead.y, dead.isBoss ? 40 : 14);
          this.enemies.splice(i, 1);
        }
      }

      this.emitHUD();
    };
  }

  public destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    soundEngine.stopMusic();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const targetTag = (e.target as HTMLElement)?.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

    const code = e.code;
    if (
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
        'Slash',
        'Comma',
        'Period',
        'Enter'
      ].includes(code) &&
      this.screen === 'PLAYING'
    ) {
      e.preventDefault();
    }

    if (!this.heldKeys.has(code)) {
      this.justPressedKeys.add(code);
    }
    this.heldKeys.add(code);

    const scheme = progressionManager.settings.pcControlScheme || 'lol_mouse';

    if (code === 'Escape' || code === 'KeyP') {
      if (this.screen === 'PLAYING') {
        this.setScreen('PAUSED');
      } else if (this.screen === 'PAUSED') {
        this.setScreen('PLAYING');
      }
    } else if (code === 'KeyG' && this.screen === 'PLAYING') {
      this.triggerPlayerPing();
    } else if (this.screen === 'PLAYING') {
      if (scheme === 'lol_mouse') {
        // League of Legends Q / W / E / R Smart Cast + S Stop + A Attack-Move
        if (code === 'KeyQ' || code === 'Digit1') {
          this.triggerHeroAbility(1, 0);
        } else if (code === 'KeyW' || code === 'Digit2') {
          this.triggerHeroAbility(1, 1);
        } else if (code === 'KeyE' || code === 'Digit3') {
          this.triggerHeroAbility(1, 2);
        } else if (code === 'KeyR' || code === 'Digit4') {
          this.triggerHeroAbility(1, 3);
        } else if (code === 'KeyS') {
          const p1 = this.players[0];
          if (p1) {
            p1.moveTarget = null;
            p1.attackTargetId = null;
            p1.vx = 0;
            p1.vy = 0;
          }
        }
      } else {
        // WASD Mode: 1 / 2 / 3 / 4 or Q / E / C / R for abilities
        if (code === 'Digit1' || code === 'KeyQ') {
          this.triggerHeroAbility(1, 0);
        } else if (code === 'Digit2' || code === 'KeyE') {
          this.triggerHeroAbility(1, 1);
        } else if (code === 'Digit3' || code === 'KeyC') {
          this.triggerHeroAbility(1, 2);
        } else if (code === 'Digit4' || code === 'KeyR') {
          this.triggerHeroAbility(1, 3);
        }
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private handleBlur = () => {
    this.heldKeys.clear();
    this.justPressedKeys.clear();
    this.mouseHeld = false;
    this.mouseJustPressed = false;
    this.touchMoveVec = { x: 0, y: 0 };
    this.touchFireHeld = false;
    this.touchFireJustPressed = false;
  };

  private handleWheel = (e: WheelEvent) => {
    if (this.screen !== 'PLAYING') return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    e.preventDefault();
  };

  private handleContextMenu = (e: MouseEvent) => {
    if (this.screen === 'PLAYING') {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.viewW / Math.max(1, rect.width);
      const scaleY = this.viewH / Math.max(1, rect.height);
      this.mouseScreenPos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
      const worldPos = this.getMouseWorldPos();
      const scheme = progressionManager.settings.pcControlScheme || 'lol_mouse';

      if (scheme === 'lol_mouse') {
        const p1 = this.players[0];
        if (p1 && p1.alive && !p1.isBot) {
          // Check if right-clicking an enemy to lock target & auto-attack
          let clickedEnemy: EnemyEntity | null = null;
          let minDist = 48;
          for (const enemy of this.enemies) {
            const d = Math.hypot(enemy.x - worldPos.x, enemy.y - worldPos.y);
            if (d <= enemy.radius + minDist) {
              minDist = d;
              clickedEnemy = enemy;
            }
          }
          if (clickedEnemy) {
            p1.attackTargetId = clickedEnemy.id;
            p1.moveTarget = null;
            this.rings.push({
              x: clickedEnemy.x,
              y: clickedEnemy.y,
              radius: 8,
              maxRadius: clickedEnemy.radius + 14,
              color: '#EF4444',
              life: 0.22,
              maxLife: 0.22
            });
          } else {
            p1.attackTargetId = null;
            p1.moveTarget = {
              x: Math.max(42, Math.min(this.arena.width - 42, worldPos.x)),
              y: Math.max(42, Math.min(this.arena.height - 42, worldPos.y))
            };
            this.rings.push({
              x: p1.moveTarget.x,
              y: p1.moveTarget.y,
              radius: 4,
              maxRadius: 20,
              color: '#10B981',
              life: 0.24,
              maxLife: 0.24
            });
          }
        }
      } else {
        this.sendTacticalPingAtWorld(worldPos.x, worldPos.y);
      }
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.viewW / Math.max(1, rect.width);
    const scaleY = this.viewH / Math.max(1, rect.height);
    this.mouseScreenPos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
    this.mouseMovedRecently = true;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (this.screen !== 'PLAYING') return;
    if (e.button === 0) {
      this.mouseHeld = true;
      this.mouseJustPressed = true;
      this.mouseMovedRecently = true;
    } else if (e.button === 1) {
      e.preventDefault();
      const worldPos = this.getMouseWorldPos();
      this.sendTacticalPingAtWorld(worldPos.x, worldPos.y);
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouseHeld = false;
    }
  };

  private getMouseWorldPos() {
    return {
      x: this.mouseScreenPos.x + this.cameraX,
      y: this.mouseScreenPos.y + this.cameraY
    };
  }

  public setTouchMoveVector(x: number, y: number) {
    this.touchMoveVec = { x, y };
    if (Math.hypot(x, y) > 0.08 && this.players[0]) {
      this.players[0].moveTarget = null;
    }
  }

  public setTouchAimAndFire(angle: number | null, firing: boolean) {
    this.touchAimAngle = angle;
    if (firing && !this.touchFireHeld) {
      this.touchFireJustPressed = true;
    }
    this.touchFireHeld = firing;
  }

  public triggerMobilePrimaryAttack(aimAngle?: number | null) {
    const p1 = this.players[0];
    if (!p1 || !p1.alive) return;
    if (typeof aimAngle === 'number') {
      p1.angle = aimAngle;
    } else {
      // Auto-face nearest zombie on mobile tap
      const nearest = this.findNearestEnemy(p1.x, p1.y, 680);
      if (nearest) {
        p1.angle = Math.atan2(nearest.y - p1.y, nearest.x - p1.x);
      }
    }
    if (p1.fireCooldown <= 0) {
      const activeWep = p1.weapons[p1.activeWeaponIndex] || p1.weapons[0];
      if (activeWep) {
        this.fireWeapon(p1, activeWep, WEAPON_BY_ID[activeWep.id]);
      }
    }
  }

  private findNearestEnemy(x: number, y: number, maxRange: number = 700): EnemyEntity | null {
    let best: EnemyEntity | null = null;
    let bestDist = maxRange;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  public cyclePlayerWeapon(_playerId: 1 | 2, _dir: -1 | 1) {
    // Fixed signature weapons in ClassZ — no weapon switching
  }

  public triggerReload(_playerId: 1 | 2 = 1) {
    // Unlimited primary attacks in ClassZ — no reloading needed
  }

  public triggerClassSkill(playerId: 1 | 2 = 1) {
    this.triggerHeroAbility(playerId, 2);
  }

  public triggerHeroAbility(playerId: 1 | 2 = 1, slotIndex: 0 | 1 | 2 | 3 = 0, customAimAngle?: number | null) {
    const p = this.players.find((pl) => pl.id === playerId);
    if (!p || !p.alive) return;

    const opClass = OPERATOR_CLASSES[p.operatorClass] || OPERATOR_CLASSES.reaper;
    const abilityDef = opClass.abilities[slotIndex];
    if (!abilityDef) return;

    // Slot 3 ([R]) is the Hero's Innate Passive Trait
    if (abilityDef.kind === 'passive' || slotIndex === 3) {
      this.addFloatingText(
        p.x,
        p.y - 38,
        `PASSIVE [R]: ${abilityDef.name.toUpperCase()}`,
        'ALWAYS ACTIVE',
        abilityDef.color,
        0.95
      );
      return;
    }

    if (p.abilityCooldowns[slotIndex] > 0) return;

    const heroStats = progressionManager.computeHeroCombatStats(p.operatorClass);
    const abilityLv = heroStats.abilityLevels[slotIndex] || 1;
    const levelScale = 1 + (abilityLv - 1) * 0.16;
    const apMult = heroStats.abilityPowerMultiplier * levelScale;

    // Compute Effective Cooldown with Cooldown Haste & Ability Level
    const cdLevelFactor = Math.max(0.68, 1 - (abilityLv - 1) * 0.05);
    const effCd = Math.max(1.2, (abilityDef.baseCooldown * cdLevelFactor) / (1 + heroStats.cooldownHaste));
    p.abilityCooldowns[slotIndex] = effCd;
    p.abilityMaxCooldowns[slotIndex] = effCd;
    p.skillCooldown = effCd;
    p.skillMaxCooldown = effCd;

    // Determine Aim Direction (Custom mobile drag angle > PC Mouse Cursor > Auto-target nearest zombie > Hero facing)
    let castAngle = p.angle;
    if (typeof customAimAngle === 'number') {
      castAngle = customAimAngle;
    } else if (p.id === 1 && this.mouseMovedRecently) {
      const mw = this.getMouseWorldPos();
      castAngle = Math.atan2(mw.y - p.y, mw.x - p.x);
    } else {
      const nearest = this.findNearestEnemy(p.x, p.y, 620);
      if (nearest) {
        castAngle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
      }
    }
    p.angle = castAngle;

    // Spectral Striders item proc (+25% move speed on ability cast)
    if (heroStats.hasSpectralPhaseOnCast) {
      p.spectralPhaseTimer = 2.0;
    }

    soundEngine.playClassSkill();

    const cls = p.operatorClass === 'engineer' ? 'mage' : p.operatorClass;

    // =========================================================================
    // 1. MELEE CLASS: CRYPT REAPER ('reaper')
    // =========================================================================
    if (cls === 'reaper') {
      if (slotIndex === 0) {
        // [Q] Phantom Scythe Dash (4 spectral crimson afterimages + twin diagonal scythe cleaves + bleed DoT)
        const dashDist = 215;
        const startX = p.x;
        const startY = p.y;
        const steps = 10;
        for (let s = 1; s <= steps; s++) {
          this.moveCircleWithCollision(
            p,
            (Math.cos(castAngle) * dashDist) / steps,
            (Math.sin(castAngle) * dashDist) / steps,
            true
          );
          if (s % 2 === 0 && s < steps) {
            this.slashArcs.push({
              x: p.x,
              y: p.y,
              angle: castAngle,
              radius: 36,
              arcSpan: Math.PI,
              color: '#EF4444',
              secondaryColor: '#991B1B',
              life: 0.28 + s * 0.02,
              maxLife: 0.28 + s * 0.02,
              kind: 'afterimage',
              operatorClass: p.operatorClass,
              swingDir: s % 4 === 0 ? 1 : -1
            });
          }
        }
        p.invulnTimer = Math.max(p.invulnTimer, 0.5);
        // Twin diagonal X-slash scythe arcs at destination
        for (const dir of [-1, 1] as const) {
          this.slashArcs.push({
            x: p.x,
            y: p.y,
            angle: castAngle + dir * 0.25,
            radius: 120,
            arcSpan: 2.3,
            color: '#EF4444',
            secondaryColor: '#FCA5A5',
            life: 0.26,
            maxLife: 0.26,
            kind: 'scythe_cleave',
            swingDir: dir
          });
        }
        this.beams.push({
          x1: startX,
          y1: startY - 10,
          x2: p.x,
          y2: p.y - 10,
          color: '#EF4444',
          width: 8,
          life: 0.24,
          maxLife: 0.24
        });
        const dmg = Math.round(96 * apMult);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          const distToEnd = Math.hypot(e.x - p.x, e.y - p.y);
          const distToMid = Math.hypot(e.x - (startX + p.x) / 2, e.y - (startY + p.y) / 2);
          if (distToEnd <= 105 || distToMid <= 88) {
            e.burnTimer = Math.max(e.burnTimer, 4.0);
            this.damageEnemy(e, dmg, p, Math.cos(castAngle) * 210, Math.sin(castAngle) * 210, true);
          }
        }
        this.addCameraShake(5.5);
        this.addFloatingText(p.x, p.y - 38, 'PHANTOM SCYTHE DASH!', `${dmg} BLEED CLEAVE`, '#EF4444', 1.15);
      } else if (slotIndex === 1) {
        // [W] Whirlwind Harvest (Sustained 1.2s 360° dual-scythe vortex + blood siphon beams)
        p.abilityActiveTimers[1] = 1.25;
        this.whirlwindTickTimer = 0.25;
        const radius = 175;
        const dmg = Math.round(108 * apMult);
        let hitCount = 0;
        this.slashArcs.push({
          x: p.x,
          y: p.y,
          angle: castAngle,
          radius,
          arcSpan: Math.PI * 2,
          color: '#F43F5E',
          secondaryColor: '#FDA4AF',
          life: 0.42,
          maxLife: 0.42,
          kind: 'whirlwind_spin',
          swingDir: 1
        });
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= radius + e.radius) {
            hitCount++;
            const ang = Math.atan2(e.y - p.y, e.x - p.x);
            this.beams.push({
              x1: e.x,
              y1: e.y - 12,
              x2: p.x,
              y2: p.y - 12,
              color: '#F43F5E',
              width: 3,
              life: 0.2,
              maxLife: 0.2
            });
            this.damageEnemy(e, dmg, p, Math.cos(ang) * 230, Math.sin(ang) * 230, true);
          }
        }
        const healAmt = Math.min(90, hitCount * Math.round(14 * levelScale));
        if (healAmt > 0) {
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
        }
        this.addCameraShake(6.5);
        this.addFloatingText(
          p.x,
          p.y - 40,
          'WHIRLWIND HARVEST!',
          healAmt > 0 ? `+${healAmt} HP SIPHON` : '360° SCYTHE VORTEX',
          '#F43F5E',
          1.2
        );
      } else if (slotIndex === 2) {
        // [E] Executioner's Guillotine (Leap forward + colossal overhead scythe blade drop + 2x execute + reset on kill)
        const leapSteps = 6;
        for (let s = 1; s <= leapSteps; s++) {
          this.moveCircleWithCollision(
            p,
            (Math.cos(castAngle) * 75) / leapSteps,
            (Math.sin(castAngle) * 75) / leapSteps,
            true
          );
        }
        const strikeX = p.x + Math.cos(castAngle) * 78;
        const strikeY = p.y + Math.sin(castAngle) * 78;
        const radius = 155;
        const baseDmg = Math.round(170 * apMult);
        let killedAny = false;
        this.slashArcs.push({
          x: strikeX,
          y: strikeY,
          angle: castAngle,
          radius,
          arcSpan: Math.PI,
          color: '#DC2626',
          secondaryColor: '#FACC15',
          life: 0.5,
          maxLife: 0.5,
          kind: 'guillotine_slam'
        });
        this.spawnParticleBurst(strikeX, strikeY, '#EF4444', 24, 230, true);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (Math.hypot(e.x - strikeX, e.y - strikeY) <= radius + e.radius) {
            const executeMult = e.hp < e.maxHp * 0.5 ? 2.0 : 1.0;
            const prevCount = this.enemies.length;
            this.damageEnemy(
              e,
              baseDmg * executeMult,
              p,
              Math.cos(castAngle) * 320,
              Math.sin(castAngle) * 320,
              true
            );
            if (this.enemies.length < prevCount) {
              killedAny = true;
            }
          }
        }
        if (killedAny) {
          p.abilityCooldowns[2] = Math.min(p.abilityCooldowns[2], 1.0);
          p.skillCooldown = p.abilityCooldowns[2];
          this.addFloatingText(p.x, p.y - 44, 'GUILLOTINE EXECUTE!', 'COOLDOWN RESET!', '#FACC15', 1.3);
        } else {
          this.addFloatingText(p.x, p.y - 40, "EXECUTIONER'S GUILLOTINE!", '2X EXECUTE SLAM', '#DC2626', 1.2);
        }
        this.addCameraShake(9.5);
      }
    }
    // =========================================================================
    // 2. RANGED CLASS: WITCH HUNTER ('marksman')
    // =========================================================================
    else if (cls === 'marksman') {
      if (slotIndex === 0) {
        // [Q] Fan of Silver Stakes (9 physical silver cross-stakes in a wide cone that pierce 4 undead)
        const boltCount = 9;
        const spread = 0.72;
        const dmg = Math.round(62 * apMult);
        const muzzleX = p.x + Math.cos(castAngle) * 20;
        const muzzleY = p.y + Math.sin(castAngle) * 20;
        for (let i = 0; i < boltCount; i++) {
          const rayAngle = castAngle + (i / (boltCount - 1) - 0.5) * spread;
          const spd = 760;
          this.projectiles.push({
            id: this.nextEntityId++,
            kind: 'silver_stake',
            ownerId: p.id,
            x: muzzleX,
            y: muzzleY,
            z: 12,
            vx: Math.cos(rayAngle) * spd,
            vy: Math.sin(rayAngle) * spd,
            vz: 0,
            radius: 7,
            damage: dmg,
            blastRadius: 0,
            timer: 0.9,
            cluster: false,
            pierceLeft: 4,
            hitIds: new Set()
          });
        }
        this.spawnParticleBurst(muzzleX, muzzleY, '#38BDF8', 10, 150);
        this.addCameraShake(4.5);
        this.addFloatingText(p.x, p.y - 38, 'FAN OF SILVER STAKES!', '9 PIERCING STAKES', '#38BDF8', 1.15);
      } else if (slotIndex === 1) {
        // [W] Hunter's Evasive Vault (Drops a persistent Jack-o'-Snare Trap Zone & backflips away)
        const trapX = p.x;
        const trapY = p.y;
        const dmg = Math.round(98 * apMult);
        this.skillZones.push({
          id: this.nextEntityId++,
          kind: 'pumpkin_snare',
          ownerId: p.id,
          x: trapX,
          y: trapY,
          radius: 145,
          life: 3.4,
          maxLife: 3.4,
          tickTimer: 0.15,
          damage: dmg,
          heal: 0,
          color: '#F97316'
        });
        this.triggerExplosion(trapX, trapY, 130, dmg, p.id, false);
        for (const e of this.enemies) {
          if (Math.hypot(e.x - trapX, e.y - trapY) <= 145) {
            e.chillTimer = 3.5;
          }
        }
        const vaultDist = 185;
        const steps = 8;
        for (let s = 1; s <= steps; s++) {
          this.moveCircleWithCollision(
            p,
            (-Math.cos(castAngle) * vaultDist) / steps,
            (-Math.sin(castAngle) * vaultDist) / steps,
            true
          );
          if (s % 2 === 0 && s < steps) {
            this.slashArcs.push({
              x: p.x,
              y: p.y,
              angle: castAngle,
              radius: 30,
              arcSpan: Math.PI,
              color: '#F97316',
              secondaryColor: '#38BDF8',
              life: 0.24,
              maxLife: 0.24,
              kind: 'afterimage',
              operatorClass: p.operatorClass
            });
          }
        }
        p.invulnTimer = Math.max(p.invulnTimer, 0.55);
        this.addFloatingText(p.x, p.y - 38, "HUNTER'S VAULT!", 'JACK-O-SNARE + EVADE', '#F97316', 1.15);
      } else if (slotIndex === 2) {
        // [E] Blood-Moon Deadeye (6s Overdrive: +60% Attack Speed, +3 Pierce, Guaranteed Crits & Blood-Moon Crest)
        const dur = 6.0 + (abilityLv - 1) * 0.5;
        p.abilityActiveTimers[2] = dur;
        p.skillActiveTimer = dur;
        this.rings.push({
          x: p.x,
          y: p.y,
          radius: 12,
          maxRadius: 145,
          color: '#A855F7',
          life: 0.35,
          maxLife: 0.35
        });
        this.addFloatingText(p.x, p.y - 40, 'BLOOD-MOON DEADEYE!', '+60% ATK SPD · CRIT STAKES', '#A855F7', 1.25);
      }
    }
    // =========================================================================
    // 3. TANK CLASS: GRAVE WARDEN ('vanguard')
    // =========================================================================
    else if (cls === 'vanguard') {
      if (slotIndex === 0) {
        // [Q] Tombstone Bull-Charge (Rushes forward with a Giant Stone Tombstone Shield, plowing & stunning undead)
        const chargeDist = 215;
        const steps = 10;
        const dmg = Math.round(102 * apMult);
        const hitDuringCharge = new Set<number>();
        for (let s = 1; s <= steps; s++) {
          this.moveCircleWithCollision(
            p,
            (Math.cos(castAngle) * chargeDist) / steps,
            (Math.sin(castAngle) * chargeDist) / steps,
            true
          );
          if (s % 3 === 0) {
            this.slashArcs.push({
              x: p.x,
              y: p.y,
              angle: castAngle,
              radius: 75,
              arcSpan: 1.5,
              color: '#F59E0B',
              secondaryColor: '#38BDF8',
              life: 0.25,
              maxLife: 0.25,
              kind: 'tombstone_charge'
            });
          }
          for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!hitDuringCharge.has(e.id) && Math.hypot(e.x - p.x, e.y - p.y) <= 78 + e.radius) {
              hitDuringCharge.add(e.id);
              e.chillTimer = 3.0;
              this.damageEnemy(e, dmg, p, Math.cos(castAngle) * 350, Math.sin(castAngle) * 350, false);
            }
          }
        }
        p.invulnTimer = Math.max(p.invulnTimer, 0.65);
        const slamRadius = 145;
        this.slashArcs.push({
          x: p.x,
          y: p.y,
          angle: castAngle,
          radius: 95,
          arcSpan: 1.8,
          color: '#F59E0B',
          secondaryColor: '#FDE047',
          life: 0.35,
          maxLife: 0.35,
          kind: 'tombstone_charge'
        });
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (!hitDuringCharge.has(e.id) && Math.hypot(e.x - p.x, e.y - p.y) <= slamRadius + e.radius) {
            e.chillTimer = 3.0;
            const ang = Math.atan2(e.y - p.y, e.x - p.x);
            this.damageEnemy(e, dmg, p, Math.cos(ang) * 340, Math.sin(ang) * 340, false);
          }
        }
        this.addCameraShake(7.5);
        this.addFloatingText(p.x, p.y - 38, 'TOMBSTONE BULL-CHARGE!', 'SHIELD PLOW + STUN', '#F59E0B', 1.15);
      } else if (slotIndex === 1) {
        // [W] Catacomb Earthshaker (220px Seismic Stomp + 3.5s Persistent Cracked Earth Fissure Zone)
        const slamRadius = 220;
        const dmg = Math.round(125 * apMult);
        this.skillZones.push({
          id: this.nextEntityId++,
          kind: 'seismic_crater',
          ownerId: p.id,
          x: p.x,
          y: p.y,
          radius: slamRadius,
          life: 3.5,
          maxLife: 3.5,
          tickTimer: 0.5,
          damage: Math.round(28 * apMult),
          heal: 0,
          color: '#FB923C'
        });
        this.spawnParticleBurst(p.x, p.y, '#FB923C', 20, 210);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (Math.hypot(e.x - p.x, e.y - p.y) <= slamRadius + e.radius) {
            e.chillTimer = 3.5;
            const ang = Math.atan2(e.y - p.y, e.x - p.x);
            this.damageEnemy(e, dmg, p, Math.cos(ang) * 360, Math.sin(ang) * 360, false);
          }
        }
        this.addCameraShake(9.5);
        this.addFloatingText(p.x, p.y - 40, 'CATACOMB EARTHSHAKER!', 'SEISMIC CRATER + STUN', '#FB923C', 1.2);
      } else if (slotIndex === 2) {
        // [E] Iron Crypt Bastion (4.5s Fortress Shield + 4 Orbiting Gargoyle Stone Shields + Invuln + Heal)
        const dur = 4.5 + (abilityLv - 1) * 0.4;
        p.abilityActiveTimers[2] = dur;
        p.skillActiveTimer = dur;
        p.invulnTimer = Math.max(p.invulnTimer, dur);
        this.bastionPulseTimer = 0.8;
        const bonusShield = Math.round(105 * levelScale);
        p.maxShieldHp = Math.max(p.maxShieldHp, bonusShield);
        p.shieldHp = Math.min(p.maxShieldHp + bonusShield, p.shieldHp + bonusShield);
        p.hp = Math.min(p.maxHp, p.hp + Math.round(45 * levelScale));
        this.rings.push({
          x: p.x,
          y: p.y,
          radius: 16,
          maxRadius: 165,
          color: '#FBBF24',
          life: 0.4,
          maxLife: 0.4
        });
        this.addFloatingText(p.x, p.y - 42, 'IRON CRYPT BASTION!', `GARGOYLE AEGIS +${bonusShield} SHIELD`, '#FBBF24', 1.25);
      }
    }
    // =========================================================================
    // 4. HEALER CLASS: PLAGUE ALCHEMIST ('medic')
    // =========================================================================
    else if (cls === 'medic') {
      if (slotIndex === 0) {
        // [Q] Panacea Healing Brew (Instant Squad Heal + Cleanse + Shield + Emerald Herbal Aura)
        const healAmt = Math.round(74 * apMult);
        for (const ally of this.players) {
          if (!ally.alive) {
            ally.alive = true;
            ally.hp = Math.round(ally.maxHp * 0.65);
            ally.invulnTimer = 2.5;
          } else {
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
            ally.chillTimer = 0;
            ally.maxShieldHp = Math.max(ally.maxShieldHp, Math.round(ally.maxHp * 0.4));
            ally.shieldHp = Math.min(ally.maxShieldHp, ally.shieldHp + Math.round(32 * levelScale));
          }
          this.spawnParticleBurst(ally.x, ally.y, '#10B981', 16, 145);
          this.spawnParticleBurst(ally.x, ally.y, '#A7F3D0', 10, 110);
        }
        this.rings.push({
          x: p.x,
          y: p.y,
          radius: 14,
          maxRadius: 260,
          color: '#10B981',
          life: 0.42,
          maxLife: 0.42
        });
        this.addFloatingText(p.x, p.y - 40, 'PANACEA HEALING BREW!', `+${healAmt} HP · SHIELD & CLEANSE`, '#10B981', 1.2);
        if (this.mode === 'online_coop') {
          multiplayerClient.sendPlayerAction({
            kind: 'class_heal_burst',
            x: Math.round(p.x),
            y: Math.round(p.y),
            healAmount: healAmt
          });
        }
      } else if (slotIndex === 1) {
        // [W] Blight Cauldron Flask (3 Volatile Acid Cauldrons that shatter into persistent 5s Corrosive Acid Pools)
        const dmg = Math.round(92 * apMult);
        for (let k = -1; k <= 1; k++) {
          const ang = castAngle + k * 0.25;
          const spd = 320;
          this.projectiles.push({
            id: this.nextEntityId++,
            kind: 'cauldron_flask',
            ownerId: p.id,
            x: p.x + Math.cos(ang) * 20,
            y: p.y + Math.sin(ang) * 20,
            z: 14,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            vz: 155,
            radius: 10,
            damage: dmg,
            blastRadius: 120,
            timer: 0.65,
            cluster: false
          });
        }
        this.addFloatingText(p.x, p.y - 38, 'BLIGHT CAULDRON FLASK!', '3 CORROSIVE ACID POOLS', '#84CC16', 1.15);
      } else if (slotIndex === 2) {
        // [E] Necro-Sanctuary Totem (Deploys a Sacred Apothecary Totem & Healing/Zapping Rune Circle)
        const totemLife = 14 + abilityLv * 2;
        p.abilityActiveTimers[2] = Math.min(8.0, totemLife);
        const tx = Math.max(60, Math.min(this.arena.width - 60, p.x + Math.cos(castAngle) * 52));
        const ty = Math.max(60, Math.min(this.arena.height - 60, p.y + Math.sin(castAngle) * 52));
        this.skillZones.push({
          id: this.nextEntityId++,
          kind: 'sanctuary_totem',
          ownerId: p.id,
          x: tx,
          y: ty,
          radius: 175,
          life: totemLife,
          maxLife: totemLife,
          tickTimer: 0.6,
          damage: Math.round(42 * apMult),
          heal: Math.round(16 * levelScale),
          color: '#10B981'
        });
        for (const ally of this.players) {
          if (ally.alive) {
            ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(45 * levelScale));
          }
        }
        this.addFloatingText(p.x, p.y - 40, 'NECRO-SANCTUARY TOTEM!', 'HEALING & ZAPPING WARD', '#34D399', 1.2);
      }
    }
    // =========================================================================
    // 5. MAGIC USER CLASS: NECRO-WARLOCK ('mage' / 'engineer')
    // =========================================================================
    else {
      if (slotIndex === 0) {
        // [Q] Hellfire Jack-o'-Meteor (Summons a Fiery Pentagram that rains 5 Jack-o'-Meteors from the sky!)
        const targetDist = 230;
        const tx = Math.max(60, Math.min(this.arena.width - 60, p.x + Math.cos(castAngle) * targetDist));
        const ty = Math.max(60, Math.min(this.arena.height - 60, p.y + Math.sin(castAngle) * targetDist));
        const dmg = Math.round(95 * apMult);
        this.skillZones.push({
          id: this.nextEntityId++,
          kind: 'meteor_strike',
          ownerId: p.id,
          x: tx,
          y: ty,
          radius: 170,
          life: 1.65,
          maxLife: 1.65,
          tickTimer: 0.05,
          damage: dmg,
          heal: 0,
          color: '#F97316',
          meteorsLeft: 5
        });
        this.addFloatingText(p.x, p.y - 38, "HELLFIRE JACK-O'-METEOR!", '5 CATACLYSM METEORS', '#F97316', 1.2);
      } else if (slotIndex === 1) {
        // [W] Franken-Chain Tempest (Multi-forked Cyan-Violet Chain Lightning across up to 8 zombies)
        const maxTargets = 7 + Math.floor(abilityLv / 2);
        const dmg = Math.round(92 * apMult);
        let curX = p.x;
        let curY = p.y;
        const hitIds = new Set<number>();
        for (let step = 0; step < maxTargets; step++) {
          let nextEnemy: EnemyEntity | null = null;
          let minDist = step === 0 ? 490 : 275;
          for (const e of this.enemies) {
            if (hitIds.has(e.id) || e.hp <= 0) continue;
            const d = Math.hypot(e.x - curX, e.y - curY);
            if (d <= minDist) {
              minDist = d;
              nextEnemy = e;
            }
          }
          if (!nextEnemy) break;
          hitIds.add(nextEnemy.id);
          // Dual cyan + violet lightning forks
          this.beams.push({
            x1: curX,
            y1: curY - 12,
            x2: nextEnemy.x,
            y2: nextEnemy.y - 12,
            color: '#38BDF8',
            width: 5,
            life: 0.28,
            maxLife: 0.28,
            isLightning: true
          });
          this.beams.push({
            x1: curX,
            y1: curY - 14,
            x2: nextEnemy.x,
            y2: nextEnemy.y - 14,
            color: '#C084FC',
            width: 2.5,
            life: 0.28,
            maxLife: 0.28,
            isLightning: true
          });
          this.spawnParticleBurst(nextEnemy.x, nextEnemy.y, '#38BDF8', 8, 140);
          curX = nextEnemy.x;
          curY = nextEnemy.y;
          nextEnemy.chillTimer = 2.4;
          this.damageEnemy(nextEnemy, dmg, p, 0, 0, false);
        }
        soundEngine.playTeslaCannon();
        this.addCameraShake(5.5);
        this.addFloatingText(
          p.x,
          p.y - 40,
          'FRANKEN-CHAIN TEMPEST!',
          `${hitIds.size} TARGETS ELECTROCUTED`,
          '#38BDF8',
          1.2
        );
      } else if (slotIndex === 2) {
        // [E] Wraith Phase & Frost Nova (Crystalline Ice Spike Prison at departure + Spectral Blink + Arcane Nova)
        const depRadius = 155;
        const dmg = Math.round(90 * apMult);
        this.skillZones.push({
          id: this.nextEntityId++,
          kind: 'frost_prison',
          ownerId: p.id,
          x: p.x,
          y: p.y,
          radius: depRadius,
          life: 3.2,
          maxLife: 3.2,
          tickTimer: 0.6,
          damage: Math.round(22 * apMult),
          heal: 0,
          color: '#60A5FA'
        });
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (Math.hypot(e.x - p.x, e.y - p.y) <= depRadius + e.radius) {
            e.chillTimer = 3.8;
            this.damageEnemy(e, dmg * 0.7, p, 0, 0, false);
          }
        }
        const blinkDist = 215;
        const steps = 10;
        for (let s = 1; s <= steps; s++) {
          this.moveCircleWithCollision(
            p,
            (Math.cos(castAngle) * blinkDist) / steps,
            (Math.sin(castAngle) * blinkDist) / steps,
            true
          );
          if (s % 2 === 0 && s < steps) {
            this.slashArcs.push({
              x: p.x,
              y: p.y,
              angle: castAngle,
              radius: 32,
              arcSpan: Math.PI * 2,
              color: '#A855F7',
              secondaryColor: '#38BDF8',
              life: 0.28,
              maxLife: 0.28,
              kind: 'afterimage',
              operatorClass: p.operatorClass
            });
          }
        }
        p.invulnTimer = Math.max(p.invulnTimer, 0.8);
        this.slashArcs.push({
          x: p.x,
          y: p.y,
          angle: castAngle,
          radius: 170,
          arcSpan: Math.PI * 2,
          color: '#A855F7',
          secondaryColor: '#60A5FA',
          life: 0.38,
          maxLife: 0.38,
          kind: 'whirlwind_spin',
          swingDir: -1
        });
        this.spawnParticleBurst(p.x, p.y, '#A855F7', 20, 195);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (Math.hypot(e.x - p.x, e.y - p.y) <= 170 + e.radius) {
            const ang = Math.atan2(e.y - p.y, e.x - p.x);
            this.damageEnemy(e, dmg, p, Math.cos(ang) * 240, Math.sin(ang) * 240, false);
          }
        }
        this.addCameraShake(6.0);
        this.addFloatingText(p.x, p.y - 40, 'WRAITH PHASE & FROST NOVA!', 'FROST PRISON + ARCANE NOVA', '#A855F7', 1.2);
      }
    }

    this.emitHUD();
  }

  public triggerPlayerPing() {
    const p1 = this.players[0];
    if (!p1) return;
    if ((this.mode === 'single' || this.mode === 'online_coop') && this.mouseAimEnabled && this.mouseMovedRecently) {
      const worldPos = this.getMouseWorldPos();
      this.sendTacticalPingAtWorld(worldPos.x, worldPos.y);
    } else {
      const px = Math.max(60, Math.min(this.arena.width - 60, p1.x + Math.cos(p1.angle) * 190));
      const py = Math.max(60, Math.min(this.arena.height - 60, p1.y + Math.sin(p1.angle) * 190));
      this.sendTacticalPingAtWorld(px, py);
    }
  }

  public sendTacticalPingAtWorld(worldX: number, worldY: number, forcedKind?: TacticalPingKind) {
    const clampedX = Math.max(40, Math.min(this.arena.width - 40, Math.round(worldX)));
    const clampedY = Math.max(40, Math.min(this.arena.height - 40, Math.round(worldY)));

    const p1 = this.players[0];
    const senderName = p1?.name || multiplayerClient.playerName || 'OPERATOR';
    const senderColor = p1?.headbandColor || multiplayerClient.playerColor || '#38BDF8';

    let pingKind: TacticalPingKind = forcedKind || 'RALLY';
    let label = 'RALLY HERE';
    let finalX = clampedX;
    let finalY = clampedY;

    if (!forcedKind) {
      let closestEnemy: EnemyEntity | null = null;
      let minEnemyDist = 155;
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - clampedX, e.y - clampedY);
        if (d < minEnemyDist) {
          minEnemyDist = d;
          closestEnemy = e;
        }
      }

      if (closestEnemy) {
        pingKind = 'ENEMY';
        finalX = Math.round(closestEnemy.x);
        finalY = Math.round(closestEnemy.y);
        if (closestEnemy.isBoss) {
          label = `BOSS: ${closestEnemy.bossName || 'TITAN'}`;
        } else {
          label = `HOSTILE: ${closestEnemy.type.toUpperCase()}`;
        }
      } else {
        for (const pk of this.pickups) {
          if (Math.hypot(pk.x - clampedX, pk.y - clampedY) < 110) {
            pingKind = 'SUPPLY';
            finalX = Math.round(pk.x);
            finalY = Math.round(pk.y);
            label = pk.kind === 'medkit' ? 'MEDKIT HERE' : 'SUPPLY CRATE';
            break;
          }
        }
      }
    }

    const pingId = `ping_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.receiveTacticalPing(pingId, senderName, senderColor, pingKind, label, finalX, finalY);

    if (this.mode === 'online_coop') {
      multiplayerClient.sendPlayerAction({
        kind: 'ping',
        id: pingId,
        senderName,
        senderColor,
        pingKind,
        label,
        x: finalX,
        y: finalY
      });
    }
  }

  private receiveTacticalPing(
    id: string,
    senderName: string,
    senderColor: string,
    kind: TacticalPingKind,
    label: string,
    x: number,
    y: number
  ) {
    soundEngine.playTacticalPing(kind);
    const pingColor = kind === 'ENEMY' ? '#EF4444' : kind === 'SUPPLY' ? '#10B981' : senderColor;

    this.tacticalPings.push({
      id,
      senderName,
      senderColor,
      kind,
      label,
      x,
      y,
      life: 5.5,
      maxLife: 5.5
    });
    if (this.tacticalPings.length > 10) {
      this.tacticalPings.shift();
    }

    this.addFloatingText(x, y - 28, `[PING] ${label}`, `BY ${senderName}`, pingColor, 1.0);
    this.emitHUD();
  }

  public startLoop() {
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      this.justPressedKeys.clear();
      this.mouseJustPressed = false;
      this.touchFireJustPressed = false;

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public setConfig(mode: GameMode, arenaId: ArenaId, friendlyFire: boolean, mouseAim: boolean) {
    const arenaChanged = this.arenaId !== arenaId;
    this.mode = mode;
    this.arenaId = arenaId;
    this.friendlyFire = friendlyFire;
    this.mouseAimEnabled = mouseAim;
    this.arena = buildAdaptiveArena(this.arenaId, this.isPortrait, this.mode === 'online_coop');

    if (this.screen === 'TITLE_MENU' && arenaChanged) {
      this.setupDemoWorld();
    }
    this.emitHUD();
  }

  public setFriendlyFire(enabled: boolean) {
    this.friendlyFire = enabled;
    progressionManager.updateSettings({ friendlyFire: enabled });
  }

  public setMouseAim(enabled: boolean) {
    this.mouseAimEnabled = enabled;
    progressionManager.updateSettings({ mouseAim: enabled });
  }

  public setScreen(screen: GameScreenState) {
    this.screen = screen;
    this.heldKeys.clear();
    this.justPressedKeys.clear();
    this.mouseHeld = false;
    if (screen === 'TITLE_MENU') {
      soundEngine.setMusicState('menu');
    } else if (screen === 'PLAYING') {
      soundEngine.setMusicState(this.isBossWave ? 'boss' : 'combat');
    }
    this.emitHUD();
  }

  public togglePause() {
    if (this.screen === 'PLAYING') {
      this.setScreen('PAUSED');
    } else if (this.screen === 'PAUSED') {
      this.setScreen('PLAYING');
    }
  }

  public startNewGame(mode: GameMode, arenaId: ArenaId, startOnBossWave: boolean = false) {
    this.mode = mode;
    this.arenaId = arenaId;
    this.updateViewportDimensions();
    this.arena = buildAdaptiveArena(arenaId, this.isPortrait, mode === 'online_coop');
    this.screen = 'PLAYING';
    this.remoteAllies.clear();
    this.resetWorld(false, startOnBossWave);
    soundEngine.setMusicState(startOnBossWave ? 'boss' : 'combat');
    this.emitHUD();
  }

  public startOnlineCoopGame(room: LobbyDetail, startOnBossWave: boolean = false) {
    this.mode = 'online_coop';
    this.arenaId = room.arenaId;
    this.updateViewportDimensions();
    this.arena = buildAdaptiveArena(room.arenaId, this.isPortrait, true);
    this.screen = 'PLAYING';
    this.remoteAllies.clear();

    for (const m of room.members) {
      if (m.id !== multiplayerClient.clientId) {
        this.remoteAllies.set(m.id, {
          id: m.id,
          name: m.name,
          color: m.color,
          operatorClass: m.operatorClass,
          x: m.x,
          y: m.y,
          targetX: m.x,
          targetY: m.y,
          vx: 0,
          vy: 0,
          angle: 0,
          hp: 100,
          maxHp: 100,
          alive: true,
          weaponId: 'pistol',
          score: 0,
          kills: 0,
          droneCount: 0,
          walkCycle: 0
        });
      }
    }

    this.resetWorld(false, startOnBossWave);
    soundEngine.setMusicState(startOnBossWave ? 'boss' : 'combat');
    this.emitHUD();
  }

  public triggerImmediateBossWave() {
    if (this.screen !== 'PLAYING' && this.screen !== 'PAUSED') return;
    if (this.mode === 'online_coop' && !multiplayerClient.isHost()) {
      multiplayerClient.sendPlayerAction({ kind: 'trigger_boss' });
      this.screen = 'PLAYING';
      this.emitHUD();
      return;
    }
    this.screen = 'PLAYING';
    const nextBossWave = this.wave % 5 === 0 ? this.wave : this.wave + (5 - (this.wave % 5));
    this.enemies = [];
    this.enemiesToSpawnInWave = 0;
    this.startWave(nextBossWave, false, true);
    this.emitHUD();
  }

  public returnToTitle() {
    if (this.mode === 'online_coop') {
      multiplayerClient.leaveLobby();
      this.remoteAllies.clear();
    }
    this.screen = 'TITLE_MENU';
    soundEngine.setMusicState('menu');
    this.setupDemoWorld();
    this.emitHUD();
  }

  private setupDemoWorld() {
    this.updateViewportDimensions();
    this.arena = buildAdaptiveArena(this.arenaId, this.isPortrait, false);
    this.resetWorld(true, false);
  }

  private getPerkStacks(perkId: string): number {
    return this.perkStacks.get(perkId) || 0;
  }

  // ==========================================================================
  // CURRENCY REVIVE SYSTEM
  // ==========================================================================
  public getReviveCosts(): { goldCost: number; gemCost: number } {
    const mult = Math.pow(1.65, this.reviveCount);
    return {
      goldCost: Math.round(180 * mult),
      gemCost: Math.max(1, Math.round(2 * mult))
    };
  }

  private openReviveOrGameOver(fromRemote: boolean) {
    if (this.screen === 'GAME_OVER' || this.screen === 'REVIVE_PROMPT') return;
    const { goldCost, gemCost } = this.getReviveCosts();
    const canGold = progressionManager.profile.currencies.gold >= goldCost;
    const canGems = progressionManager.profile.currencies.gems >= gemCost;

    if (!fromRemote && (canGold || canGems)) {
      this.reviveCountdown = 7.0;
      this.screen = 'REVIVE_PROMPT';
      this.emitHUD();
    } else {
      this.triggerSquadWipeGameOver(fromRemote);
    }
  }

  public purchaseRevive(currencyType: 'gold' | 'gems'): boolean {
    if (this.screen !== 'REVIVE_PROMPT') return false;
    const { goldCost, gemCost } = this.getReviveCosts();
    const cost: CurrencyBundle =
      currencyType === 'gold'
        ? { gold: goldCost, scrap: 0, gems: 0 }
        : { gold: 0, scrap: 0, gems: gemCost };

    if (!progressionManager.spendCurrencies(cost)) {
      return false;
    }

    this.reviveCount += 1;
    soundEngine.playRevive();

    for (const p of this.players) {
      p.alive = true;
      p.hp = p.maxHp;
      p.invulnTimer = 3.5;
      p.chillTimer = 0;
      for (const w of p.weapons) {
        if (w.unlocked) {
          w.isReloading = false;
          w.magAmmo = w.magSize;
        }
      }
      // Clear wave of nearby mobs with revive shockwave
      this.rings.push({
        x: p.x,
        y: p.y,
        radius: 16,
        maxRadius: 280,
        color: '#F59E0B',
        life: 0.45,
        maxLife: 0.45
      });
      for (const e of this.enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d <= 280) {
          const ang = Math.atan2(e.y - p.y, e.x - p.x);
          e.x += Math.cos(ang) * 180;
          e.y += Math.sin(ang) * 180;
          e.chillTimer = 2.5;
        }
      }
      this.addFloatingText(p.x, p.y - 42, 'EMERGENCY FIELD REVIVE!', 'FULL HP & INVULNERABLE', '#F59E0B', 1.3);
    }

    this.screen = 'PLAYING';
    this.emitHUD();
    return true;
  }

  public declineRevive() {
    this.triggerSquadWipeGameOver(false);
  }

  // ==========================================================================
  // ROGUELIKE WAVE PERK DRAFT SYSTEM
  // ==========================================================================
  private openWavePerkDraft() {
    const shuffled = [...ROGUELIKE_PERKS].sort(() => Math.random() - 0.5);
    this.draftChoices = shuffled.slice(0, 3);
    this.screen = 'WAVE_DRAFT';
    soundEngine.playPickup(true);
    this.emitHUD();
  }

  public rerollDraftChoices() {
    if (this.rerollsLeft <= 0 || this.screen !== 'WAVE_DRAFT') return;
    this.rerollsLeft -= 1;
    const shuffled = [...ROGUELIKE_PERKS].sort(() => Math.random() - 0.5);
    this.draftChoices = shuffled.slice(0, 3);
    soundEngine.playUIClick();
    this.emitHUD();
  }

  public selectRoguelikePerk(perkId: string) {
    if (this.screen !== 'WAVE_DRAFT') return;
    const def = ROGUELIKE_PERKS.find((p) => p.id === perkId);
    if (!def) return;

    const prevStacks = this.getPerkStacks(perkId);
    const nextStacks = prevStacks + 1;
    this.perkStacks.set(perkId, nextStacks);

    const existing = this.activePerks.find((a) => a.id === perkId);
    if (existing) {
      existing.stacks = nextStacks;
    } else {
      this.activePerks.push({
        id: def.id,
        name: def.name,
        category: def.category,
        color: def.color,
        stacks: 1
      });
    }

    for (const p of this.players) {
      if (perkId === 'vampiric_rounds') {
        p.maxHp += 20;
        p.hp = Math.min(p.maxHp, p.hp + 30);
      } else if (perkId === 'sleight_of_hand') {
        for (const w of p.weapons) {
          w.magSize = Math.round(w.magSize * 1.2);
          w.magAmmo = w.magSize;
        }
      } else if (perkId === 'adrenaline_overdrive') {
        for (const w of p.weapons) {
          w.fireRateMultiplier *= 1.18;
        }
      } else if (perkId === 'pyromaniac_core') {
        for (const w of p.weapons) {
          w.blastRadiusMultiplier *= 1.25;
          w.damageMultiplier *= 1.25;
        }
      } else if (perkId === 'ammo_synthesizer') {
        for (const w of p.weapons) {
          if (w.unlocked && w.maxReserveAmmo > 0) {
            w.reserveAmmo = Math.min(w.maxReserveAmmo, w.reserveAmmo + Math.round(w.maxReserveAmmo * 0.5));
          }
        }
      } else if (perkId === 'boss_slayer') {
        for (const w of p.weapons) {
          w.damageMultiplier *= 1.22;
          w.piercingBonus += 1;
        }
      } else if (perkId === 'fortune_hunter') {
        this.awardCurrencies(150, 15, 0);
      }
      this.addFloatingText(p.x, p.y - 36, `PERK: ${def.name.toUpperCase()}`, def.statSummary, def.color, 1.1);
    }

    soundEngine.playPickup(true);
    this.screen = 'PLAYING';
    if (this.mode !== 'online_coop' || multiplayerClient.isHost()) {
      this.startWave(this.wave + 1, false);
    }
    this.emitHUD();
  }

  public refreshPlayerArmoryLoadout() {
    const opClassId = progressionManager.profile.selectedClass;
    const opClass = OPERATOR_CLASSES[opClassId];
    const heroStats = progressionManager.computeHeroCombatStats(opClassId);
    for (const p of this.players) {
      if (p.isBot) continue;
      p.operatorClass = opClassId;
      p.skillMaxCooldown = opClass.skillCooldown;
      p.maxHp = heroStats.maxHp + (p.inMatchLevel - 1) * 14;
      p.hp = Math.min(p.maxHp, Math.max(p.hp, heroStats.maxHp));
      p.maxShieldHp = heroStats.hasWraithHourglass ? Math.round(p.maxHp * 0.25) : 0;
      p.shieldHp = p.maxShieldHp;
      p.abilityMaxCooldowns = [
        opClass.abilities[0].baseCooldown,
        opClass.abilities[1].baseCooldown,
        opClass.abilities[2].baseCooldown,
        opClass.abilities[3].baseCooldown
      ];
      p.weapons = this.createWeaponsFromArmory(opClassId, this.mode === 'deathmatch');
    }
    this.emitHUD();
  }

  private createWeaponsFromArmory(
    operatorClassId: OperatorClassId,
    unlockAll: boolean
  ): PlayerWeaponState[] {
    return WEAPON_DEFINITIONS.map((def) => {
      const eff = progressionManager.computeEffectiveWeaponStats(def.id, operatorClassId);
      const isUnlocked = unlockAll || eff.unlocked;
      return {
        id: def.id,
        unlocked: isUnlocked,
        magAmmo: 9999,
        magSize: 9999,
        reserveAmmo: -1,
        maxReserveAmmo: -1,
        reloadTime: 0.5,
        isReloading: false,
        reloadTimer: 0,
        fireRateMultiplier: eff.fireRateMultiplier,
        damageMultiplier: eff.damageMultiplier,
        blastRadiusMultiplier: 1,
        extraPellets: 0,
        piercingBonus: eff.piercingBonus,
        clusterBombs: def.id === 'cluster_mortar',
        upgradeLevel: eff.upgradeLevel,
        hasClassAffinity: eff.hasClassAffinity
      };
    });
  }

  private resetWorld(isDemo: boolean, startOnBossWave: boolean = false) {
    if (this.decalCanvas.width !== this.arena.width || this.decalCanvas.height !== this.arena.height) {
      this.decalCanvas.width = this.arena.width;
      this.decalCanvas.height = this.arena.height;
    }
    this.decalCtx.clearRect(0, 0, this.decalCanvas.width, this.decalCanvas.height);

    this.decalCtx.fillStyle = 'rgba(0,0,0,0.03)';
    for (let i = 0; i < 90; i++) {
      const rx = 80 + Math.random() * (this.arena.width - 160);
      const ry = 80 + Math.random() * (this.arena.height - 160);
      this.decalCtx.beginPath();
      this.decalCtx.arc(rx, ry, 14 + Math.random() * 42, 0, Math.PI * 2);
      this.decalCtx.fill();
    }

    this.enemies = [];
    this.placeables = [];
    this.projectiles = [];
    this.slashArcs = [];
    this.skillZones = [];
    this.beams = [];
    this.rings = [];
    this.floatingTexts = [];
    this.pickups = [];
    this.tacticalPings = [];
    this.dynamicObstacles = this.arena.obstacles.map((o) => ({ ...o }));

    this.perkStacks.clear();
    this.activePerks = [];
    this.draftChoices = [];
    this.rerollsLeft = 3;
    this.droneFireTimer = 0;
    this.ammoRegenTimer = 0;
    this.shockwaveNovaTimer = 0;
    this.whirlwindTickTimer = 0;
    this.bastionPulseTimer = 0;
    this.waveEndBossSpawned = false;

    for (const p of this.particles) {
      p.active = false;
    }

    this.wave = startOnBossWave ? 5 : 1;
    this.isBossWave = startOnBossWave;
    this.waveClearDraftDoneForWave = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.comboDecayTimer = 0;
    this.unlockedMilestoneIndex = -1;
    this.recentBanner = null;
    this.winnerText = null;
    this.elapsedSeconds = 0;
    this.hitstopTimer = 0;
    this.shakeMagnitude = 0;
    this.sessionEarned = { gold: 0, scrap: 0, gems: 0 };
    this.reviveCount = 0;
    this.reviveCountdown = 0;

    const isDeathmatch = !isDemo && this.mode === 'deathmatch';
    const isOnline = !isDemo && this.mode === 'online_coop';
    const includeLocalP2 = isDemo || this.mode === 'coop' || this.mode === 'deathmatch';

    const myMember = isOnline
      ? multiplayerClient.currentRoom?.members.find((m) => m.id === multiplayerClient.clientId)
      : null;

    const opClassId = progressionManager.profile.selectedClass;
    const opClass = OPERATOR_CLASSES[opClassId];
    const p1HeroStats = progressionManager.computeHeroCombatStats(opClassId);
    const p1InitShield = p1HeroStats.hasWraithHourglass ? Math.round(p1HeroStats.maxHp * 0.25) : 0;

    const p1: PlayerEntity = {
      id: 1,
      name: isOnline ? myMember?.name || multiplayerClient.playerName : `${opClass.name} (P1)`,
      operatorClass: opClassId,
      headbandColor: isOnline ? myMember?.color || multiplayerClient.playerColor : opClass.color,
      x: myMember ? myMember.x : this.arena.p1Spawn.x,
      y: myMember ? myMember.y : this.arena.p1Spawn.y,
      vx: 0,
      vy: 0,
      radius: 17,
      angle: 0,
      hp: p1HeroStats.maxHp,
      maxHp: p1HeroStats.maxHp,
      shieldHp: p1InitShield,
      maxShieldHp: p1InitShield,
      shieldRegenTimer: 0,
      alive: true,
      respawnTimer: 0,
      invulnTimer: 0,
      hitFlashTimer: 0,
      chillTimer: 0,
      walkCycle: 0,
      score: 0,
      kills: 0,
      deaths: 0,
      frags: 0,
      inMatchLevel: 1,
      inMatchXp: 0,
      inMatchXpToNext: 120,
      skillCooldown: 0,
      skillMaxCooldown: opClass.skillCooldown,
      skillActiveTimer: 0,
      abilityCooldowns: [0, 0, 0, 0],
      abilityMaxCooldowns: [
        opClass.abilities[0].baseCooldown,
        opClass.abilities[1].baseCooldown,
        opClass.abilities[2].baseCooldown,
        opClass.abilities[3].baseCooldown
      ],
      abilityActiveTimers: [0, 0, 0, 0],
      moveTarget: null,
      attackTargetId: null,
      primaryAttackCount: 0,
      meleeSwingTimer: 0,
      meleeSwingDir: 1,
      reaperFrenzyTimer: 0,
      spectralPhaseTimer: 0,
      activeWeaponIndex: 0,
      fireCooldown: 0,
      weapons: this.createWeaponsFromArmory(opClassId, isDemo || isDeathmatch),
      isBot: isDemo,
      botTargetTimer: 0,
      botMoveDir: { x: 1, y: 0 }
    };

    this.players = [p1];

    if (includeLocalP2) {
      const p2ClassId: OperatorClassId = opClassId === 'medic' ? 'vanguard' : 'medic';
      const p2Class = OPERATOR_CLASSES[p2ClassId];
      const p2HeroStats = progressionManager.computeHeroCombatStats(p2ClassId);
      const p2: PlayerEntity = {
        id: 2,
        name: `${p2Class.name} (P2)`,
        operatorClass: p2ClassId,
        headbandColor: '#F59E0B',
        x: this.arena.p2Spawn.x,
        y: this.arena.p2Spawn.y,
        vx: 0,
        vy: 0,
        radius: 17,
        angle: Math.PI,
        hp: p2HeroStats.maxHp,
        maxHp: p2HeroStats.maxHp,
        shieldHp: 0,
        maxShieldHp: 0,
        shieldRegenTimer: 0,
        alive: true,
        respawnTimer: 0,
        invulnTimer: 0,
        hitFlashTimer: 0,
        chillTimer: 0,
        walkCycle: 0,
        score: 0,
        kills: 0,
        deaths: 0,
        frags: 0,
        inMatchLevel: 1,
        inMatchXp: 0,
        inMatchXpToNext: 120,
        skillCooldown: 0,
        skillMaxCooldown: p2Class.skillCooldown,
        skillActiveTimer: 0,
        abilityCooldowns: [0, 0, 0, 0],
        abilityMaxCooldowns: [
          p2Class.abilities[0].baseCooldown,
          p2Class.abilities[1].baseCooldown,
          p2Class.abilities[2].baseCooldown,
          p2Class.abilities[3].baseCooldown
        ],
        abilityActiveTimers: [0, 0, 0, 0],
        moveTarget: null,
        attackTargetId: null,
        primaryAttackCount: 0,
        meleeSwingTimer: 0,
        meleeSwingDir: 1,
        reaperFrenzyTimer: 0,
        spectralPhaseTimer: 0,
        activeWeaponIndex: 0,
        fireCooldown: 0,
        weapons: this.createWeaponsFromArmory(p2ClassId, isDemo || isDeathmatch),
        isBot: isDemo,
        botTargetTimer: 0,
        botMoveDir: { x: -1, y: 0 }
      };
      this.players.push(p2);
    }

    this.cameraX = Math.max(0, Math.min(this.arena.width - this.viewW, p1.x - this.viewW / 2));
    this.cameraY = Math.max(0, Math.min(this.arena.height - this.viewH, p1.y - this.viewH / 2));

    this.seedArenaBarrels();

    if (isDeathmatch) {
      this.enemiesToSpawnInWave = 8;
      this.spawnTimer = 2.0;
      this.recentBanner = {
        title: 'DEATHMATCH: 10 FRAGS',
        subtitle: 'All Weapons Active',
        color: '#F59E0B',
        timestamp: performance.now()
      };
    } else if (!isOnline || multiplayerClient.isHost()) {
      this.startWave(this.wave, isDemo, startOnBossWave);
    } else {
      this.recentBanner = {
        title: `SQUAD CO-OP (${1 + this.remoteAllies.size}P)`,
        subtitle: `Lobby #${multiplayerClient.currentRoom?.code}`,
        color: '#38BDF8',
        timestamp: performance.now()
      };
    }
  }

  private seedArenaBarrels() {
    const W = this.arena.width;
    const H = this.arena.height;
    const spots = [
      { x: Math.round(W * 0.35), y: Math.round(H * 0.42) },
      { x: Math.round(W * 0.65), y: Math.round(H * 0.42) },
      { x: Math.round(W * 0.35), y: Math.round(H * 0.58) },
      { x: Math.round(W * 0.65), y: Math.round(H * 0.58) },
      { x: Math.round(W * 0.5), y: Math.round(H * 0.32) },
      { x: Math.round(W * 0.5), y: Math.round(H * 0.68) }
    ];
    for (const s of spots) {
      if (!this.circleIntersectsAnyObstacle(s.x, s.y, 24)) {
        this.placeables.push({
          id: this.nextEntityId++,
          type: 'barrel',
          ownerId: 1,
          x: s.x,
          y: s.y,
          radius: 16,
          hp: 45,
          maxHp: 45,
          blastRadius: 140,
          damage: 210,
          chainTimer: 0,
          armedTimer: 0
        });
      }
    }
  }

  private startWave(waveNum: number, isDemo: boolean, forceBoss: boolean = false) {
    this.wave = waveNum;
    const isBoss = forceBoss || waveNum % 5 === 0;
    this.isBossWave = isBoss;
    this.waveEndBossSpawned = isBoss;

    const totalPartyCount = Math.max(
      1,
      (this.players.filter((p) => !p.isBot).length || 1) + this.remoteAllies.size
    );
    const partyMultiplier = 1 + (totalPartyCount - 1) * 0.35;
    // Harder wave enemy counts!
    this.enemiesToSpawnInWave = Math.round((14 + waveNum * 8) * partyMultiplier);
    this.spawnTimer = 0.45;
    this.waveIntermissionTimer = 0;

    if (this.placeables.filter((p) => p.type === 'barrel').length < 4) {
      this.seedArenaBarrels();
    }

    if (!isDemo && waveNum > 1) {
      // Award Wave Clear Bonus Currencies & Account XP
      const waveGold = 45 + waveNum * 18;
      const waveScrap = 8 + Math.floor(waveNum * 3);
      const waveGems = (waveNum - 1) % 5 === 0 ? 2 : 0;
      this.awardCurrencies(waveGold, waveScrap, waveGems);
      progressionManager.addAccountXp(65 + waveNum * 25);
    }

    if (!isDemo && (this.mode === 'coop' || this.mode === 'online_coop')) {
      for (const p of this.players) {
        if (!p.alive) {
          p.alive = true;
          p.hp = Math.round(p.maxHp * 0.7);
          p.invulnTimer = 2.0;
          this.addFloatingText(p.x, p.y - 30, 'REVIVED!', 'WAVE CLEAR BONUS', '#10B981', 1.1);
        }
      }
    }

    if (!isDemo && this.screen === 'PLAYING') {
      soundEngine.setMusicState(isBoss ? 'boss' : 'combat');
    }

    if (isBoss) {
      const bossCfg = this.spawnElementalBoss(waveNum, totalPartyCount);
      if (!isDemo) {
        this.recentBanner = {
          title: `CATACLYSM RAID BOSS (W${waveNum}): ${bossCfg.name}`,
          subtitle: `OVERLORD TIER · 3 PHASES · ${totalPartyCount}P Scaled · ${bossCfg.weaknessText}`,
          color: '#EF4444',
          timestamp: performance.now()
        };
        soundEngine.playExplosion(1.5);
        this.addCameraShake(14);
      }
    } else if (!isDemo) {
      const nextBoss = waveNum + (5 - (waveNum % 5));
      this.recentBanner = {
        title: `WAVE ${waveNum} INCOMING`,
        subtitle: `${this.enemiesToSpawnInWave} Hostiles + Wave-End Boss · Mega Raid Boss at Wave ${nextBoss}`,
        color: '#F59E0B',
        timestamp: performance.now()
      };
    }
  }

  private spawnElementalBoss(waveNum: number, activePlayerCount: number) {
    const cfg = getElementalBossForWave(waveNum);
    const p1 = this.players[0];
    const angle = Math.random() * Math.PI * 2;
    const spawnX = Math.max(
      180,
      Math.min(this.arena.width - 180, (p1?.x || this.arena.width / 2) + Math.cos(angle) * 440)
    );
    const spawnY = Math.max(
      180,
      Math.min(this.arena.height - 180, (p1?.y || this.arena.height / 2) + Math.sin(angle) * 380)
    );

    const bossTier = Math.max(1, Math.floor(waveNum / 5));
    const tierScale = 1 + (bossTier - 1) * 0.65;
    const playerScale = 1 + (activePlayerCount - 1) * 0.72;
    // Cataclysmic 5-Wave Mega Raid Boss: 3.6x Base Boss HP!
    const bossMaxHp = Math.round(cfg.baseHp * 3.6 * tierScale * playerScale);

    const boss: EnemyEntity = {
      id: this.nextEntityId++,
      type: cfg.type,
      isBoss: true,
      isMegaBoss: true,
      bossPhase: 1,
      bossElement: cfg.element,
      bossName: `OVERLORD ${cfg.name}`,
      bossTitle: `CATACLYSMIC RAID BOSS · ${cfg.title}`,
      bossWeaknessText: `${cfg.weaknessText} · 5% MAX HP HIT CAP`,
      bossResistanceText: cfg.resistanceText,
      bossScaledPlayers: activePlayerCount,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      radius: 44,
      angle: 0,
      hp: bossMaxHp,
      maxHp: bossMaxHp,
      speed: cfg.baseSpeed + 14 + Math.min(28, (bossTier - 1) * 5),
      damage: Math.round(cfg.baseDamage * 1.45 * (1 + (bossTier - 1) * 0.22)),
      hitFlashTimer: 0,
      chillTimer: 0,
      burnTimer: 0,
      walkCycle: 0,
      attackCooldown: 1.25,
      windupTimer: 0,
      isWindingUp: false,
      attackPattern: 0,
      scoreValue: 12000 * bossTier
    };

    this.enemies.push(boss);
    this.rings.push({
      x: spawnX,
      y: spawnY,
      radius: 20,
      maxRadius: 260,
      color: '#EF4444',
      life: 0.65,
      maxLife: 0.65
    });
    this.rings.push({
      x: spawnX,
      y: spawnY,
      radius: 10,
      maxRadius: 190,
      color: cfg.color,
      life: 0.45,
      maxLife: 0.45
    });
    return cfg;
  }

  private spawnWaveEndBoss(waveNum: number, activePlayerCount: number) {
    const cfg = getElementalBossForWave(waveNum * 5);
    const p1 = this.players[0];
    const angle = Math.random() * Math.PI * 2;
    const spawnX = Math.max(
      180,
      Math.min(this.arena.width - 180, (p1?.x || this.arena.width / 2) + Math.cos(angle) * 410)
    );
    const spawnY = Math.max(
      180,
      Math.min(this.arena.height - 180, (p1?.y || this.arena.height / 2) + Math.sin(angle) * 350)
    );

    const waveScale = 1 + (waveNum - 1) * 0.24;
    const playerScale = 1 + (activePlayerCount - 1) * 0.55;
    const bossMaxHp = Math.round(cfg.baseHp * 0.85 * waveScale * playerScale);

    const boss: EnemyEntity = {
      id: this.nextEntityId++,
      type: cfg.type,
      isBoss: true,
      isMegaBoss: false,
      bossPhase: 1,
      bossElement: cfg.element,
      bossName: `${cfg.name} WARDEN`,
      bossTitle: `WAVE ${waveNum} END BOSS · ${cfg.title}`,
      bossWeaknessText: cfg.weaknessText,
      bossResistanceText: cfg.resistanceText,
      bossScaledPlayers: activePlayerCount,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      radius: 34,
      angle: 0,
      hp: bossMaxHp,
      maxHp: bossMaxHp,
      speed: cfg.baseSpeed + Math.min(20, waveNum * 2),
      damage: Math.round(cfg.baseDamage * (1 + (waveNum - 1) * 0.08)),
      hitFlashTimer: 0,
      chillTimer: 0,
      burnTimer: 0,
      walkCycle: 0,
      attackCooldown: 1.5,
      windupTimer: 0,
      isWindingUp: false,
      attackPattern: 0,
      scoreValue: 2500 + waveNum * 450
    };

    this.enemies.push(boss);
    this.rings.push({
      x: spawnX,
      y: spawnY,
      radius: 15,
      maxRadius: 195,
      color: cfg.color,
      life: 0.45,
      maxLife: 0.45
    });
    if (this.screen === 'PLAYING') {
      soundEngine.setMusicState('boss');
      soundEngine.playExplosion(1.1);
      this.addCameraShake(8);
      this.recentBanner = {
        title: `WAVE ${waveNum} BOSS: ${boss.bossName}`,
        subtitle: `Defeat the Wave Warden to clear Wave ${waveNum}!`,
        color: cfg.color,
        timestamp: performance.now()
      };
    }
    return boss;
  }

  private awardCurrencies(gold: number, scrap: number, gems: number) {
    this.sessionEarned.gold += gold;
    this.sessionEarned.scrap += scrap;
    this.sessionEarned.gems += gems;
    progressionManager.addCurrencies(gold, scrap, gems);
  }

  private awardInMatchXp(p: PlayerEntity, xp: number) {
    p.inMatchXp += xp;
    while (p.inMatchXp >= p.inMatchXpToNext) {
      p.inMatchXp -= p.inMatchXpToNext;
      p.inMatchLevel += 1;
      p.inMatchXpToNext = Math.round(120 * Math.pow(1.28, p.inMatchLevel - 1));
      p.maxHp += 15;
      p.hp = Math.min(p.maxHp, p.hp + 35);
      for (const w of p.weapons) {
        w.damageMultiplier *= 1.06;
      }
      soundEngine.playLevelUp();
      this.addFloatingText(
        p.x,
        p.y - 44,
        `LEVEL UP! LV.${p.inMatchLevel}`,
        '+15 MAX HP · +6% DMG',
        '#38BDF8',
        1.2
      );
    }
  }

  private update(dt: number) {
    const shakeSetting = progressionManager.settings.screenShakeIntensity / 100;
    if (this.shakeMagnitude > 0.1 && shakeSetting > 0 && !progressionManager.settings.reducedMotion) {
      this.shakeMagnitude *= Math.pow(0.001, dt);
      this.shakeX = (Math.random() * 2 - 1) * this.shakeMagnitude * shakeSetting;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeMagnitude * shakeSetting;
    } else {
      this.shakeMagnitude = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }

    this.updateRemoteAllies(dt);

    // Always broadcast authoritative world sync in online co-op even during WAVE_DRAFT / PAUSED / REVIVE_PROMPT!
    if (this.mode === 'online_coop' && multiplayerClient.isHost() && this.screen !== 'TITLE_MENU') {
      this.netWorldSyncTimer += dt;
      if (this.netWorldSyncTimer >= 0.065) {
        this.netWorldSyncTimer = 0;
        this.broadcastAuthoritativeWorldSync();
      }
    }

    if (this.screen === 'REVIVE_PROMPT') {
      this.reviveCountdown -= dt;
      if (this.reviveCountdown <= 0) {
        this.triggerSquadWipeGameOver(false);
      } else {
        this.hudSyncAccumulator += dt;
        if (this.hudSyncAccumulator >= 0.1) {
          this.hudSyncAccumulator = 0;
          this.emitHUD();
        }
      }
      return;
    }

    if (this.screen === 'PAUSED' || this.screen === 'GAME_OVER' || this.screen === 'WAVE_DRAFT') {
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateParticlesAndVisuals(dt * 0.25);
      return;
    }

    this.elapsedSeconds += dt;

    if (this.combo > 0) {
      const decayRate = 0.24 + Math.min(0.6, this.combo * 0.006);
      this.comboDecayTimer -= decayRate * dt;
      if (this.comboDecayTimer <= 0) {
        this.combo = Math.max(0, this.combo - 1);
        this.comboDecayTimer = this.combo > 0 ? 0.55 : 0;
      }
    }

    for (const p of this.players) {
      this.updatePlayer(p, dt);
    }

    this.updateCamera(dt);
    this.updateRoguelikeAndClassPassives(dt);

    const isAuthoritative = this.mode !== 'online_coop' || multiplayerClient.isHost();
    if (isAuthoritative) {
      this.updateSpawner(dt);
    }

    this.updatePlaceables(dt, isAuthoritative);
    this.updateProjectiles(dt);
    this.updateEnemies(dt, isAuthoritative);
    this.updatePickups(dt);
    this.updateParticlesAndVisuals(dt);

    if (this.mode === 'online_coop' && this.screen === 'PLAYING') {
      this.netStateTimer += dt;
      if (this.netStateTimer >= 0.045) {
        this.netStateTimer = 0;
        const p1 = this.players[0];
        if (p1) {
          multiplayerClient.sendPlayerState({
            operatorClass: p1.operatorClass,
            x: Math.round(p1.x),
            y: Math.round(p1.y),
            vx: Math.round(p1.vx),
            vy: Math.round(p1.vy),
            angle: Number(p1.angle.toFixed(2)),
            hp: Math.ceil(p1.hp),
            maxHp: p1.maxHp,
            alive: p1.alive,
            weaponId: p1.weapons[p1.activeWeaponIndex]?.id || 'pistol',
            score: p1.score,
            kills: p1.kills,
            droneCount: Math.min(3, this.getPerkStacks('orbital_drone'))
          });
        }
      }
    }

    this.hudSyncAccumulator += dt;
    if (this.hudSyncAccumulator >= 0.08) {
      this.hudSyncAccumulator = 0;
      this.emitHUD();
    }
  }

  private broadcastAuthoritativeWorldSync() {
    multiplayerClient.sendWorldSync({
      seq: this.syncSeq++,
      wave: this.wave,
      isBossWave: this.isBossWave,
      combo: this.combo,
      maxCombo: this.maxCombo,
      enemiesToSpawn: this.enemiesToSpawnInWave,
      enemiesRemaining: this.enemies.length + this.enemiesToSpawnInWave,
      enemies: this.enemies.map((e) => ({
        id: e.id,
        type: e.type,
        isBoss: e.isBoss,
        isMegaBoss: e.isMegaBoss,
        bossElement: e.bossElement,
        bossName: e.bossName,
        bossTitle: e.bossTitle,
        x: Math.round(e.x),
        y: Math.round(e.y),
        vx: Math.round(e.vx),
        vy: Math.round(e.vy),
        angle: Number(e.angle.toFixed(2)),
        hp: Math.ceil(e.hp),
        maxHp: e.maxHp,
        isWindingUp: e.isWindingUp,
        chillTimer: Number(e.chillTimer.toFixed(1))
      })),
      placeables: this.placeables.map((pl) => ({
        id: pl.id,
        type: pl.type,
        x: Math.round(pl.x),
        y: Math.round(pl.y),
        radius: pl.radius,
        chainTimer: pl.chainTimer
      })),
      pickups: this.pickups.map((pk) => ({
        id: pk.id,
        kind: pk.kind,
        x: Math.round(pk.x),
        y: Math.round(pk.y)
      }))
    });
  }

  private updateRemoteAllies(dt: number) {
    for (const ally of this.remoteAllies.values()) {
      ally.x += (ally.targetX - ally.x) * Math.min(1, dt * 14);
      ally.y += (ally.targetY - ally.y) * Math.min(1, dt * 14);
      if (Math.hypot(ally.vx, ally.vy) > 10) {
        ally.walkCycle += dt * 14;
      }
    }
  }

  private updateCamera(dt: number) {
    const alivePlayers = this.players.filter((p) => p.alive);
    const focusPlayers = alivePlayers.length > 0 ? alivePlayers : this.players;
    if (focusPlayers.length === 0) return;

    const avgX = focusPlayers.reduce((sum, p) => sum + p.x, 0) / focusPlayers.length;
    const avgY = focusPlayers.reduce((sum, p) => sum + p.y, 0) / focusPlayers.length;

    const maxCamX = Math.max(0, this.arena.width - this.viewW);
    const maxCamY = Math.max(0, this.arena.height - this.viewH);
    const targetCamX = Math.max(0, Math.min(maxCamX, avgX - this.viewW / 2));
    const targetCamY = Math.max(0, Math.min(maxCamY, avgY - this.viewH / 2));

    const lerpFactor = 1 - Math.exp(-8 * dt);
    this.cameraX += (targetCamX - this.cameraX) * lerpFactor;
    this.cameraY += (targetCamY - this.cameraY) * lerpFactor;
  }

  private updateRoguelikeAndClassPassives(dt: number) {
    this.updateSkillZones(dt);

    // Sustained Crypt Reaper [W] Whirlwind Harvest ticks (every 0.25s while abilityActiveTimers[1] > 0)
    this.whirlwindTickTimer += dt;
    if (this.whirlwindTickTimer >= 0.25) {
      this.whirlwindTickTimer = 0;
      for (const p of this.players) {
        if (!p.alive || p.operatorClass !== 'reaper' || p.abilityActiveTimers[1] <= 0) continue;
        const heroStats = progressionManager.computeHeroCombatStats('reaper');
        const wLevel = progressionManager.getHeroAbilityLevel('reaper', 1);
        const tickDmg = Math.round((42 + wLevel * 14 + heroStats.attackDamage * 0.45) * 0.45);
        this.slashArcs.push({
          x: p.x,
          y: p.y,
          angle: this.elapsedSeconds * 12,
          arcSpan: Math.PI * 1.85,
          radius: 145,
          color: '#EF4444',
          coreColor: '#FCA5A5',
          life: 0.16,
          maxLife: 0.16,
          kind: 'whirlwind_spin'
        });
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (Math.hypot(e.x - p.x, e.y - p.y) <= 150 + e.radius) {
            this.damageEnemy(e, tickDmg, p, Math.cos(p.angle) * 60, Math.sin(p.angle) * 60);
          }
        }
      }
    }

    // Sustained Grave Warden [E] Iron Crypt Bastion pulses (every 0.6s while abilityActiveTimers[2] > 0)
    this.bastionPulseTimer += dt;
    if (this.bastionPulseTimer >= 0.6) {
      this.bastionPulseTimer = 0;
      for (const p of this.players) {
        if (!p.alive || p.operatorClass !== 'vanguard' || p.abilityActiveTimers[2] <= 0) continue;
        const heroStats = progressionManager.computeHeroCombatStats('vanguard');
        const pulseDmg = Math.round(35 + heroStats.abilityPower * 0.45 + heroStats.armorReduction * 60);
        this.rings.push({
          x: p.x,
          y: p.y,
          radius: 20,
          maxRadius: 155,
          color: '#38BDF8',
          life: 0.25,
          maxLife: 0.25
        });
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d <= 155 + e.radius) {
            const nx = (e.x - p.x) / (d || 1);
            const ny = (e.y - p.y) / (d || 1);
            this.damageEnemy(e, pulseDmg, p, nx * 240, ny * 240);
          }
        }
      }
    }

    // Plague Alchemist Passive [R] Apothecary Aura & Item HP Regen / Immolation Aura
    this.medicAuraTimer += dt;
    if (this.medicAuraTimer >= 1.0) {
      this.medicAuraTimer = 0;
      for (const p of this.players) {
        if (!p.alive) continue;
        const heroStats = progressionManager.computeHeroCombatStats(p.operatorClass);

        // Item HP Regen per second
        if (heroStats.hpRegenPerSec > 0 && p.hp < p.maxHp) {
          p.hp = Math.min(p.maxHp, p.hp + heroStats.hpRegenPerSec);
        }

        // Plague Alchemist [R] Apothecary Aura (heals self & allies within 260px)
        if (p.operatorClass === 'medic') {
          const rLevel = progressionManager.getHeroAbilityLevel('medic', 3);
          const healAmt = 7 + rLevel * 3 + Math.round(heroStats.abilityPower * 0.12);
          for (const ally of this.players) {
            if (ally.alive && ally.hp < ally.maxHp && Math.hypot(ally.x - p.x, ally.y - p.y) <= 260) {
              ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
            }
          }
        }

        // Cursed Item: Jack-o'-Lantern Lantern (hasImmolationAura)
        if (heroStats.hasImmolationAura) {
          const burnDmg = 45 + heroStats.abilityPower * 0.42;
          for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (Math.hypot(e.x - p.x, e.y - p.y) <= 155) {
              e.burnTimer = Math.max(e.burnTimer, 2.0);
              this.damageEnemy(e, burnDmg, p, 0, 0, false);
            }
          }
        }
      }
    }

    const droneStacks = this.getPerkStacks('orbital_drone');
    if (droneStacks > 0) {
      this.droneFireTimer -= dt;
      if (this.droneFireTimer <= 0) {
        this.droneFireTimer = Math.max(0.2, 0.5 / droneStacks);
        for (const p of this.players) {
          if (!p.alive) continue;
          const droneAngle = this.elapsedSeconds * 3.2 + (p.id === 2 ? Math.PI : 0);
          const dx = p.x + Math.cos(droneAngle) * 44;
          const dy = p.y + Math.sin(droneAngle) * 34;

          let target: EnemyEntity | null = null;
          let minDist = 350;
          for (const e of this.enemies) {
            const d = Math.hypot(e.x - dx, e.y - dy);
            if (d < minDist) {
              minDist = d;
              target = e;
            }
          }
          if (target) {
            this.damageEnemy(target, 28 * droneStacks, p, 0, 0, false);
            this.beams.push({
              x1: dx,
              y1: dy - 12,
              x2: target.x,
              y2: target.y - 14,
              color: '#22D3EE',
              width: 2.5,
              life: 0.09,
              maxLife: 0.09
            });
          }
        }
      }
    }

    const ammoStacks = this.getPerkStacks('ammo_synthesizer');
    if (ammoStacks > 0) {
      this.ammoRegenTimer += dt;
      if (this.ammoRegenTimer >= 4.0) {
        this.ammoRegenTimer = 0;
        for (const p of this.players) {
          if (!p.alive) continue;
          p.hp = Math.min(p.maxHp, p.hp + 10 * ammoStacks);
          for (let i = 0; i < 3; i++) {
            p.abilityCooldowns[i] = Math.max(0, p.abilityCooldowns[i] - 0.5 * ammoStacks);
          }
        }
      }
    }

    const novaStacks = this.getPerkStacks('shockwave_nova');
    if (novaStacks > 0) {
      this.shockwaveNovaTimer += dt;
      if (this.shockwaveNovaTimer >= Math.max(3.0, 6.5 - (novaStacks - 1) * 1.0)) {
        this.shockwaveNovaTimer = 0;
        for (const p of this.players) {
          if (!p.alive) continue;
          const novaRadius = 170 + novaStacks * 22;
          this.rings.push({
            x: p.x,
            y: p.y,
            radius: 16,
            maxRadius: novaRadius,
            color: '#34D399',
            life: 0.32,
            maxLife: 0.32
          });
          for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist <= novaRadius) {
              const ang = Math.atan2(e.y - p.y, e.x - p.x);
              this.damageEnemy(e, 60 * novaStacks, p, Math.cos(ang) * 280, Math.sin(ang) * 280, false);
            }
          }
        }
      }
    }
  }

  private isAnySquadMemberAlive(): boolean {
    for (const p of this.players) {
      if (!p.isBot && p.alive) return true;
    }
    if (this.mode === 'online_coop') {
      for (const ally of this.remoteAllies.values()) {
        if (ally.alive) return true;
      }
    }
    return false;
  }

  private triggerSquadWipeGameOver(fromRemote: boolean) {
    if (this.screen === 'GAME_OVER') return;
    this.winnerText = null;
    this.saveHighScores();
    this.screen = 'GAME_OVER';
    soundEngine.setMusicState('menu');
    if (this.mode === 'online_coop' && !fromRemote) {
      multiplayerClient.sendPlayerAction({ kind: 'game_over' });
    }
    this.emitHUD();
  }

  private updatePlayer(p: PlayerEntity, dt: number) {
    if (!p.alive) {
      if (this.mode === 'online_coop' && !p.isBot) {
        if (!this.isAnySquadMemberAlive()) {
          this.openReviveOrGameOver(false);
          return;
        }
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.alive = true;
          p.hp = p.maxHp;
          p.invulnTimer = 2.5;
          const spawn = this.arena.p1Spawn;
          p.x = spawn.x + (Math.random() * 120 - 60);
          p.y = spawn.y + (Math.random() * 120 - 60);
          this.addFloatingText(p.x, p.y - 28, 'SQUAD REVIVED', undefined, '#38BDF8', 1.0);
        }
      } else if (this.mode === 'deathmatch' || p.isBot) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.alive = true;
          p.hp = p.maxHp;
          p.invulnTimer = 2.0;
          const spawn = p.id === 1 ? this.arena.p1Spawn : this.arena.p2Spawn;
          p.x = spawn.x + (Math.random() * 120 - 60);
          p.y = spawn.y + (Math.random() * 120 - 60);
          this.addFloatingText(p.x, p.y - 28, 'RESPAWNED', undefined, '#38BDF8', 1.0);
        }
      }
      return;
    }

    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.hitFlashTimer > 0) p.hitFlashTimer -= dt;
    if (p.chillTimer > 0) p.chillTimer -= dt;
    if (p.fireCooldown > 0) p.fireCooldown -= dt;
    if (p.skillCooldown > 0) p.skillCooldown = Math.max(0, p.skillCooldown - dt);
    if (p.skillActiveTimer > 0) p.skillActiveTimer = Math.max(0, p.skillActiveTimer - dt);
    if (p.meleeSwingTimer > 0) p.meleeSwingTimer = Math.max(0, p.meleeSwingTimer - dt);
    if (p.reaperFrenzyTimer > 0) p.reaperFrenzyTimer = Math.max(0, p.reaperFrenzyTimer - dt);
    if (p.spectralPhaseTimer > 0) p.spectralPhaseTimer = Math.max(0, p.spectralPhaseTimer - dt);

    for (let i = 0; i < 4; i++) {
      if (p.abilityCooldowns[i] > 0) {
        p.abilityCooldowns[i] = Math.max(0, p.abilityCooldowns[i] - dt);
      }
      if (p.abilityActiveTimers[i] > 0) {
        p.abilityActiveTimers[i] = Math.max(0, p.abilityActiveTimers[i] - dt);
      }
    }

    const opClass = OPERATOR_CLASSES[p.operatorClass];
    const heroStats = progressionManager.computeHeroCombatStats(p.operatorClass);

    // Wraith's Hourglass Shield regeneration
    if (heroStats.hasWraithHourglass) {
      const targetMaxShield = Math.round(p.maxHp * 0.25);
      p.maxShieldHp = Math.max(p.maxShieldHp, targetMaxShield);
      p.shieldRegenTimer += dt;
      if (p.shieldRegenTimer >= 8.0 && p.shieldHp < p.maxShieldHp) {
        p.shieldHp = Math.min(p.maxShieldHp, p.shieldHp + p.maxShieldHp * 0.35 * dt);
      }
    }

    let moveX = 0;
    let moveY = 0;
    let wantsFire = false;

    const isSingleLocal = this.mode === 'single' || this.mode === 'online_coop';
    const pcControlScheme = progressionManager.profile.pcControlScheme || 'lol_mouse';
    const hasTouchMove = Math.hypot(this.touchMoveVec.x, this.touchMoveVec.y) > 0.08;

    if (p.isBot) {
      const botInput = this.computeBotInput(p, dt);
      moveX = botInput.moveX;
      moveY = botInput.moveY;
      p.angle = botInput.angle;
      wantsFire = botInput.fire;
    } else if (p.id === 1) {
      if (hasTouchMove) {
        // Mobile MOBA virtual analog joystick overrides PC movement
        moveX = this.touchMoveVec.x;
        moveY = this.touchMoveVec.y;
        p.moveTarget = null;
        p.attackTargetId = null;
        wantsFire = this.touchFireHeld || this.touchFireJustPressed;
      } else if (pcControlScheme === 'lol_mouse' && isSingleLocal) {
        // League of Legends PC Mouse Control Scheme
        if (p.attackTargetId !== null) {
          const targetEnemy = this.enemies.find((e) => e.id === p.attackTargetId && e.hp > 0);
          if (!targetEnemy) {
            p.attackTargetId = null;
          } else {
            const distToEnemy = Math.hypot(targetEnemy.x - p.x, targetEnemy.y - p.y);
            const effectiveRange = Math.max(95, opClass.signatureRange - 12);
            p.angle = Math.atan2(targetEnemy.y - p.y, targetEnemy.x - p.x);
            if (distToEnemy <= effectiveRange) {
              moveX = 0;
              moveY = 0;
              p.moveTarget = null;
              wantsFire = true;
            } else {
              moveX = (targetEnemy.x - p.x) / distToEnemy;
              moveY = (targetEnemy.y - p.y) / distToEnemy;
            }
          }
        } else if (p.moveTarget !== null) {
          const dx = p.moveTarget.x - p.x;
          const dy = p.moveTarget.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 12) {
            p.moveTarget = null;
          } else {
            moveX = dx / dist;
            moveY = dy / dist;
            p.angle = Math.atan2(dy, dx);
          }
        }

        // Allow Space / Left-Click / A-key Attack-Move in LoL mode
        if (this.heldKeys.has('Space') || this.heldKeys.has('KeyA') || this.mouseHeld || this.touchFireHeld) {
          wantsFire = true;
          const mouseWorld = this.getMouseWorldPos();
          const nearest = this.findNearestEnemy(p.x, p.y, opClass.signatureRange + 65);
          if (nearest) {
            p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
          } else if (this.mouseMovedRecently) {
            p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
          }
        }
      } else {
        // WASD Movement Mode
        if (this.heldKeys.has('KeyW') || (isSingleLocal && this.heldKeys.has('ArrowUp'))) moveY -= 1;
        if (this.heldKeys.has('KeyS') || (isSingleLocal && this.heldKeys.has('ArrowDown'))) moveY += 1;
        if (this.heldKeys.has('KeyA') || (isSingleLocal && this.heldKeys.has('ArrowLeft'))) moveX -= 1;
        if (this.heldKeys.has('KeyD') || (isSingleLocal && this.heldKeys.has('ArrowRight'))) moveX += 1;

        wantsFire =
          this.heldKeys.has('Space') ||
          this.touchFireHeld ||
          (isSingleLocal && this.mouseHeld);
      }
    } else if (p.id === 2) {
      if (this.heldKeys.has('ArrowUp')) moveY -= 1;
      if (this.heldKeys.has('ArrowDown')) moveY += 1;
      if (this.heldKeys.has('ArrowLeft')) moveX -= 1;
      if (this.heldKeys.has('ArrowRight')) moveX += 1;

      wantsFire =
        this.heldKeys.has('Enter') ||
        this.heldKeys.has('Slash') ||
        this.heldKeys.has('NumpadEnter');
    }

    const len = Math.hypot(moveX, moveY);
    const perkSpeedBonus = 1 + this.getPerkStacks('adrenaline_overdrive') * 0.15;
    const chillPenalty = p.chillTimer > 0 ? 0.68 : 1.0;
    const frenzySpeed = p.reaperFrenzyTimer > 0 ? 1.25 : 1.0;
    const phaseSpeed = p.spectralPhaseTimer > 0 ? 1.35 : 1.0;
    const medicPassiveSpeed = p.operatorClass === 'medic' ? 1.12 : 1.0;
    const speed =
      225 *
      heroStats.moveSpeedMultiplier *
      perkSpeedBonus *
      chillPenalty *
      frenzySpeed *
      phaseSpeed *
      medicPassiveSpeed;
    const mouseWorld = this.getMouseWorldPos();

    if (len > 0) {
      const normScale = len > 1 ? 1 / len : 1;
      p.vx = moveX * normScale * speed;
      p.vy = moveY * normScale * speed;
      p.walkCycle += dt * 14 * perkSpeedBonus;

      if (!p.isBot) {
        if (p.id === 1 && this.touchAimAngle !== null) {
          p.angle = this.touchAimAngle;
        } else if (p.id === 1 && wantsFire && (hasTouchMove || pcControlScheme === 'lol_mouse')) {
          const nearest = this.findNearestEnemy(p.x, p.y, opClass.signatureRange + 80);
          if (nearest) {
            p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
          } else {
            p.angle = Math.atan2(moveY, moveX);
          }
        } else if (p.id === 1 && pcControlScheme === 'wasd' && isSingleLocal && this.mouseAimEnabled && this.mouseMovedRecently) {
          p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
        } else if (!wantsFire && p.attackTargetId === null) {
          p.angle = Math.atan2(moveY, moveX);
        }
      }
    } else {
      p.vx = 0;
      p.vy = 0;
      if (!p.isBot && p.id === 1) {
        if (this.touchAimAngle !== null) {
          p.angle = this.touchAimAngle;
        } else if (wantsFire) {
          const nearest = this.findNearestEnemy(p.x, p.y, opClass.signatureRange + 90);
          if (nearest) {
            p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
          } else if (isSingleLocal && this.mouseMovedRecently) {
            p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
          }
        } else if (pcControlScheme === 'wasd' && isSingleLocal && this.mouseAimEnabled && this.mouseMovedRecently) {
          p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);
        }
      }
    }

    const ignoreDynamicObstacles = p.spectralPhaseTimer > 0 || heroStats.hasSpectralStride;
    if (ignoreDynamicObstacles) {
      p.x = Math.max(36, Math.min(this.arena.width - 36, p.x + p.vx * dt));
      p.y = Math.max(36, Math.min(this.arena.height - 36, p.y + p.vy * dt));
    } else {
      this.moveCircleWithCollision(p, p.vx * dt, p.vy * dt, true);
    }

    if (this.players.length > 1 && !p.isBot) {
      const other = this.players.find((o) => o.id !== p.id && o.alive);
      if (other) {
        const maxSepX = this.viewW - 110;
        const maxSepY = this.viewH - 110;
        if (Math.abs(p.x - other.x) > maxSepX) {
          p.x = other.x + Math.sign(p.x - other.x) * maxSepX;
        }
        if (Math.abs(p.y - other.y) > maxSepY) {
          p.y = other.y + Math.sign(p.y - other.y) * maxSepY;
        }
      }
    }

    for (const obs of this.dynamicObstacles) {
      if (obs.kind === 'lava' && this.circleIntersectsRect(p.x, p.y, p.radius - 4, obs)) {
        this.damagePlayer(p, 18 * dt, 0);
      }
    }

    const activeWep = p.weapons[p.activeWeaponIndex] || p.weapons[0];
    if (!activeWep) return;
    const wepStats = WEAPON_BY_ID[activeWep.id];

    if (wantsFire && p.fireCooldown <= 0) {
      this.fireWeapon(p, activeWep, wepStats);
    }
  }

  private computeBotInput(p: PlayerEntity, dt: number) {
    p.botTargetTimer = (p.botTargetTimer || 0) - dt;
    if (p.botTargetTimer <= 0) {
      p.botTargetTimer = 0.5 + Math.random() * 0.7;
      const angle = Math.random() * Math.PI * 2;
      p.botMoveDir = { x: Math.cos(angle), y: Math.sin(angle) };
    }

    let nearest: EnemyEntity | null = null;
    let minDist = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }

    let moveX = p.botMoveDir?.x || 0;
    let moveY = p.botMoveDir?.y || 0;
    let angle = p.angle;
    let fire = false;

    if (nearest) {
      angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
      if (minDist < 170) {
        moveX = -Math.cos(angle);
        moveY = -Math.sin(angle);
      } else if (minDist > 380) {
        moveX = Math.cos(angle);
        moveY = Math.sin(angle);
      }
      fire = minDist < 480;
    }

    if (p.x < 350) moveX = 1;
    if (p.x > this.arena.width - 350) moveX = -1;
    if (p.y < 350) moveY = 1;
    if (p.y > this.arena.height - 350) moveY = -1;

    return { moveX, moveY, angle, fire, justFire: fire && Math.random() < 0.15 };
  }

  private cycleWeapon(_p: PlayerEntity, _dir: -1 | 1) {
    // Weapon switching is disabled in ClassZ: each Hero uses their fixed Signature Primary Attack
  }

  private fireWeapon(p: PlayerEntity, _state: PlayerWeaponState, _stats: typeof WEAPON_DEFINITIONS[0]) {
    const opClass = OPERATOR_CLASSES[p.operatorClass];
    const heroStats = progressionManager.computeHeroCombatStats(p.operatorClass);

    const frenzyBonus = p.reaperFrenzyTimer > 0 ? 1.45 : 1.0;
    const deadeyeRate = p.operatorClass === 'marksman' && p.skillActiveTimer > 0 ? 1.45 : 1.0;
    const overdriveRate = 1 + Math.min(0.25, Math.floor(this.combo / 20) * 0.05);
    const effectiveAttackSpeed = heroStats.attackSpeed * frenzyBonus * deadeyeRate * overdriveRate;

    p.fireCooldown = Math.max(0.11, 1 / effectiveAttackSpeed);
    p.primaryAttackCount += 1;

    const isCrit = Math.random() * 100 < heroStats.critChancePct;
    const critMult = isCrit ? 1.75 : 1.0;
    const baseAd = heroStats.attackDamage * critMult;
    const baseAp = heroStats.abilityPower * critMult;

    const muzzleX = p.x + Math.cos(p.angle) * 22;
    const muzzleY = p.y + Math.sin(p.angle) * 22;

    if (p.operatorClass === 'reaper') {
      // CRYPT REAPER (MELEE): Cursed Soul Scythe 145-degree Crescent Slash
      soundEngine.playWeaponFire('shotgun');
      p.meleeSwingTimer = 0.24;
      p.meleeSwingDir = p.meleeSwingDir === 1 ? -1 : 1;

      const reach = opClass.signatureRange; // 125px
      const slashDmg = baseAd * 1.25 + baseAp * 0.3;
      const rLevel = progressionManager.getHeroAbilityLevel('reaper', 3);

      this.slashArcs.push({
        x: p.x,
        y: p.y,
        angle: p.angle,
        arcSpan: 2.5, // ~143 degrees
        radius: reach,
        color: isCrit ? '#FACC15' : '#EF4444',
        coreColor: isCrit ? '#FEF08A' : '#FCA5A5',
        life: 0.22,
        maxLife: 0.22,
        kind: 'scythe_cleave',
        swingDir: p.meleeSwingDir
      });

      let hitAny = false;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist <= reach + e.radius) {
          const angToEnemy = Math.atan2(e.y - p.y, e.x - p.x);
          let diff = Math.abs(angToEnemy - p.angle);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff <= 1.35 || dist <= 56) {
            hitAny = true;
            this.spawnParticleBurst(e.x, e.y, '#EF4444', 6, 130);
            this.damageEnemy(
              e,
              slashDmg,
              p,
              Math.cos(angToEnemy) * 210,
              Math.sin(angToEnemy) * 210,
              true
            );
          }
        }
      }

      if (hitAny) {
        // [R] Soul Siphon passive heal on scythe hit
        const siphonHeal = 4 + rLevel * 2;
        p.hp = Math.min(p.maxHp, p.hp + siphonHeal);
      }
    } else if (p.operatorClass === 'marksman') {
      // WITCH HUNTER (RANGED): Silver Vanquisher Crossbow Piercing Stake Projectile
      soundEngine.playWeaponFire('sniper_rifle');
      const rLevel = progressionManager.getHeroAbilityLevel('marksman', 3);
      const isDeadeye = p.skillActiveTimer > 0 || p.abilityActiveTimers[2] > 0;
      const pierceCount = 2 + Math.floor(rLevel / 2) + (isDeadeye ? 3 : 0);
      const boltDmg = baseAd * 1.18 * (isDeadeye ? 1.25 : 1.0);

      this.spawnParticleBurst(muzzleX, muzzleY, isDeadeye ? '#EF4444' : '#F97316', 6, 140);
      const speed = 1180;
      this.projectiles.push({
        id: this.nextEntityId++,
        ownerId: p.id,
        kind: 'silver_stake',
        x: muzzleX,
        y: muzzleY,
        z: 10,
        vx: Math.cos(p.angle) * speed,
        vy: Math.sin(p.angle) * speed,
        vz: 0,
        radius: isDeadeye ? 7 : 5,
        damage: boltDmg,
        blastRadius: 0,
        timer: opClass.signatureRange / speed,
        cluster: false,
        pierceLeft: pierceCount,
        hitIds: new Set()
      });
    } else if (p.operatorClass === 'vanguard') {
      // GRAVE WARDEN (TANK): Gargoyle Crypt Maul Frontal Shockwave Cone Smash
      soundEngine.playWeaponFire('shotgun');
      p.meleeSwingTimer = 0.26;
      p.meleeSwingDir = p.meleeSwingDir === 1 ? -1 : 1;

      const smashX = p.x + Math.cos(p.angle) * 58;
      const smashY = p.y + Math.sin(p.angle) * 58;
      const smashRadius = 120;
      const maulDmg = baseAd * 1.1 + p.maxHp * 0.05;

      this.slashArcs.push({
        x: p.x,
        y: p.y,
        angle: p.angle,
        arcSpan: 1.85,
        radius: 132,
        color: '#38BDF8',
        coreColor: '#E0F2FE',
        life: 0.24,
        maxLife: 0.24,
        kind: 'maul_cone',
        swingDir: p.meleeSwingDir
      });

      this.rings.push({
        x: smashX,
        y: smashY,
        radius: 14,
        maxRadius: smashRadius,
        color: '#38BDF8',
        life: 0.24,
        maxLife: 0.24
      });
      this.spawnParticleBurst(smashX, smashY, '#38BDF8', 12, 160);

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        const dist = Math.hypot(e.x - smashX, e.y - smashY);
        if (dist <= smashRadius + e.radius) {
          const ang = Math.atan2(e.y - p.y, e.x - p.x);
          e.chillTimer = Math.max(e.chillTimer, 1.5);
          this.damageEnemy(e, maulDmg, p, Math.cos(ang) * 340, Math.sin(ang) * 340, true);
        }
      }
    } else if (p.operatorClass === 'medic') {
      // PLAGUE ALCHEMIST (HEALER): Necro-Tonic Syringe Launcher
      soundEngine.playWeaponFire('plasma_carbine');
      const tonicDmg = baseAd * 0.88 + baseAp * 0.6;
      this.spawnParticleBurst(muzzleX, muzzleY, '#10B981', 6, 120);

      const speed = 920;
      this.projectiles.push({
        id: this.nextEntityId++,
        ownerId: p.id,
        kind: 'alchemist_syringe',
        x: muzzleX,
        y: muzzleY,
        z: 10,
        vx: Math.cos(p.angle) * speed,
        vy: Math.sin(p.angle) * speed,
        vz: 0,
        radius: 6,
        damage: tonicDmg,
        blastRadius: 68,
        timer: opClass.signatureRange / speed,
        cluster: false,
        pierceLeft: 1,
        hitIds: new Set()
      });

      // Every primary syringe shot mists nearby wounded allies for +7 HP with a visible emerald beam
      for (const ally of this.players) {
        if (ally.alive && ally.hp < ally.maxHp && Math.hypot(ally.x - p.x, ally.y - p.y) <= 230) {
          ally.hp = Math.min(ally.maxHp, ally.hp + 7);
          if (ally.id !== p.id) {
            this.beams.push({
              x1: p.x,
              y1: p.y,
              x2: ally.x,
              y2: ally.y,
              color: '#34D399',
              width: 3,
              life: 0.14,
              maxLife: 0.14
            });
          }
        }
      }
    } else {
      // NECRO-WARLOCK (MAGIC USER): Eldritch Skull Staff Projectile + [R] Arcane Soul Resonance
      soundEngine.playWeaponFire('railgun');
      const rLevel = progressionManager.getHeroAbilityLevel('mage', 3);
      const boltDmg = baseAd * 0.78 + baseAp * 0.85;

      this.spawnParticleBurst(muzzleX, muzzleY, '#A855F7', 7, 135);
      const speed = 860;
      this.projectiles.push({
        id: this.nextEntityId++,
        ownerId: p.id,
        kind: 'eldritch_skull',
        x: muzzleX,
        y: muzzleY,
        z: 10,
        vx: Math.cos(p.angle) * speed,
        vy: Math.sin(p.angle) * speed,
        vz: 0,
        radius: 8,
        damage: boltDmg,
        blastRadius: 75,
        timer: opClass.signatureRange / speed,
        cluster: false,
        pierceLeft: 1,
        hitIds: new Set()
      });

      // [R] Arcane Soul Resonance: Every 4th attack unleashes a double-ring Eldritch Soul Nova & grants Shield
      if (p.primaryAttackCount % 4 === 0) {
        const novaRadius = 165 + rLevel * 14;
        const novaDmg = 58 + baseAp * 0.68 + rLevel * 18;
        p.maxShieldHp = Math.max(p.maxShieldHp, Math.round(p.maxHp * 0.32));
        p.shieldHp = Math.min(p.maxShieldHp, p.shieldHp + 24 + rLevel * 6);
        this.rings.push({
          x: p.x,
          y: p.y,
          radius: 16,
          maxRadius: novaRadius,
          color: '#C084FC',
          life: 0.3,
          maxLife: 0.3
        });
        this.rings.push({
          x: p.x,
          y: p.y,
          radius: 8,
          maxRadius: novaRadius * 0.72,
          color: '#F472B6',
          life: 0.24,
          maxLife: 0.24
        });
        this.addFloatingText(p.x, p.y - 34, 'SOUL RESONANCE!', '+ARCANE SHIELD', '#C084FC', 0.9);
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const e = this.enemies[i];
          if (Math.hypot(e.x - p.x, e.y - p.y) <= novaRadius) {
            const ang = Math.atan2(e.y - p.y, e.x - p.x);
            this.damageEnemy(e, novaDmg, p, Math.cos(ang) * 230, Math.sin(ang) * 230, false);
          }
        }
      }
    }

    // Cursed MOBA Item Passive: Stormcaller's Tesla Coil (every 3rd attack chains lightning)
    if (heroStats.hasStaticChain && p.primaryAttackCount % 3 === 0) {
      const nearest = this.findNearestEnemy(p.x, p.y, opClass.signatureRange + 80);
      if (nearest) {
        const arcDmg = 48 + heroStats.abilityPower * 0.55;
        this.damageEnemy(nearest, arcDmg, p, 0, 0, true, false, 'tesla_rifle');
      }
    }
  }

  private castBallisticRay(
    shooter: PlayerEntity,
    startX: number,
    startY: number,
    angle: number,
    maxDist: number,
    damage: number,
    maxHits: number,
    beamColor: string,
    beamWidth: number,
    weaponId: WeaponId,
    isTeslaWeapon: boolean = false
  ) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const stepSize = 9;
    const steps = Math.floor(maxDist / stepSize);

    let endX = startX + dx * maxDist;
    let endY = startY + dy * maxDist;
    let hits = 0;
    const hitEnemyIds = new Set<number>();

    const expRoundStacks = this.getPerkStacks('explosive_rounds');

    for (let i = 1; i <= steps; i++) {
      const cx = startX + dx * (i * stepSize);
      const cy = startY + dy * (i * stepSize);

      if (cx < 32 || cx > this.arena.width - 32 || cy < 32 || cy > this.arena.height - 32) {
        endX = cx;
        endY = cy;
        this.spawnParticleBurst(cx, cy, '#CBD5E1', 3, 65);
        break;
      }

      let hitWall = false;
      for (let oIdx = this.dynamicObstacles.length - 1; oIdx >= 0; oIdx--) {
        const obs = this.dynamicObstacles[oIdx];
        if (obs.kind !== 'lava' && cx >= obs.x && cx <= obs.x + obs.w && cy >= obs.y && cy <= obs.y + obs.h) {
          endX = cx;
          endY = cy;
          hitWall = true;
          this.spawnParticleBurst(cx, cy, '#94A3B8', 3, 70);
          if (obs.destructible && obs.hp !== undefined) {
            obs.hp -= damage * 0.6;
            if (obs.hp <= 0) {
              this.dynamicObstacles.splice(oIdx, 1);
              this.spawnParticleBurst(obs.x + obs.w / 2, obs.y + obs.h / 2, '#A8A29E', 10, 120);
            }
          }
          break;
        }
      }
      if (hitWall) break;

      for (const pl of this.placeables) {
        if (pl.type === 'barrel' && pl.chainTimer === 0) {
          if (Math.hypot(cx - pl.x, cy - pl.y) <= pl.radius + 4) {
            pl.chainTimer = 0.02;
            hits++;
            endX = cx;
            endY = cy;
            break;
          }
        }
      }
      if (hits >= maxHits) break;

      for (const e of this.enemies) {
        if (!hitEnemyIds.has(e.id) && Math.hypot(cx - e.x, cy - e.y) <= e.radius + 4) {
          hitEnemyIds.add(e.id);
          this.damageEnemy(e, damage, shooter, dx * 120, dy * 120, true, false, weaponId);

          if (expRoundStacks > 0 && Math.random() < Math.min(0.75, expRoundStacks * 0.25)) {
            this.triggerExplosion(cx, cy, 72, damage * 0.65, shooter.id, false);
          }

          hits++;
          if (hits >= maxHits) {
            endX = cx;
            endY = cy;
            break;
          }
        }
      }
      if (hits >= maxHits) break;

      if (this.mode === 'deathmatch' || (this.mode === 'coop' && this.friendlyFire)) {
        for (const targetPlayer of this.players) {
          if (targetPlayer.id !== shooter.id && targetPlayer.alive) {
            if (Math.hypot(cx - targetPlayer.x, cy - targetPlayer.y) <= targetPlayer.radius + 3) {
              const pvpMultiplier = this.mode === 'deathmatch' ? 0.42 : 0.25;
              this.damagePlayer(targetPlayer, damage * pvpMultiplier, shooter.id);
              hits++;
              if (hits >= maxHits) {
                endX = cx;
                endY = cy;
                break;
              }
            }
          }
        }
      }
      if (hits >= maxHits) break;
    }

    this.beams.push({
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      color: beamColor,
      width: beamWidth,
      life: beamWidth > 3 ? 0.15 : 0.065,
      maxLife: beamWidth > 3 ? 0.15 : 0.065,
      isLightning: isTeslaWeapon
    });

    if (this.mode === 'online_coop') {
      multiplayerClient.sendPlayerAction({
        kind: 'beam',
        x1: Math.round(startX),
        y1: Math.round(startY),
        x2: Math.round(endX),
        y2: Math.round(endY),
        color: beamColor,
        width: beamWidth,
        weaponId
      });
    }
  }

  private triggerExplosion(
    x: number,
    y: number,
    blastRadius: number,
    damage: number,
    ownerId: 1 | 2 | 0,
    cluster: boolean = false,
    fromRemote: boolean = false
  ) {
    soundEngine.playExplosion(blastRadius / 120);
    this.addCameraShake(Math.min(14, (blastRadius / 115) * 7.0));

    if (this.mode === 'online_coop' && !fromRemote && ownerId !== 0) {
      multiplayerClient.sendPlayerAction({
        kind: 'explosion',
        x: Math.round(x),
        y: Math.round(y),
        blastRadius: Math.round(blastRadius),
        damage: Math.round(damage),
        cluster
      });
    }

    if (progressionManager.settings.bloodDecals) {
      const grad = this.decalCtx.createRadialGradient(x, y, 4, x, y, blastRadius * 0.72);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.5)');
      grad.addColorStop(0.5, 'rgba(30, 41, 59, 0.25)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      this.decalCtx.fillStyle = grad;
      this.decalCtx.beginPath();
      this.decalCtx.arc(x, y, blastRadius * 0.72, 0, Math.PI * 2);
      this.decalCtx.fill();
    }

    this.rings.push({
      x,
      y,
      radius: 12,
      maxRadius: blastRadius,
      color: '#F59E0B',
      life: 0.28,
      maxLife: 0.28
    });

    this.spawnParticleBurst(x, y, '#F97316', 18, 220);
    this.spawnParticleBurst(x, y, '#FACC15', 10, 170);

    if (cluster) {
      for (let i = 0; i < 4; i++) {
        const ang = (Math.PI * 2 * i) / 4 + Math.random() * 0.5;
        const spd = 115 + Math.random() * 55;
        this.projectiles.push({
          id: this.nextEntityId++,
          kind: 'cluster_bomblet',
          ownerId,
          x,
          y,
          z: 8,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          vz: 110,
          radius: 5,
          damage: damage * 0.45,
          blastRadius: blastRadius * 0.62,
          timer: 0.45 + Math.random() * 0.15,
          cluster: false
        });
      }
    }

    for (const pl of this.placeables) {
      if (pl.type === 'barrel' && pl.chainTimer === 0) {
        const dist = Math.hypot(pl.x - x, pl.y - y);
        if (dist <= blastRadius + pl.radius) {
          pl.chainTimer = 0.065 + (dist / blastRadius) * 0.06;
        }
      }
    }

    for (let i = this.dynamicObstacles.length - 1; i >= 0; i--) {
      const obs = this.dynamicObstacles[i];
      if (obs.destructible && obs.hp !== undefined) {
        const cx = obs.x + obs.w / 2;
        const cy = obs.y + obs.h / 2;
        if (Math.hypot(cx - x, cy - y) <= blastRadius + 24) {
          obs.hp -= damage * 0.85;
          if (obs.hp <= 0) {
            this.dynamicObstacles.splice(i, 1);
          }
        }
      }
    }

    if (!fromRemote) {
      const ownerPlayer = this.players.find((p) => p.id === ownerId) || this.players[0];
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        const dist = Math.hypot(e.x - x, e.y - y);
        if (dist <= blastRadius + e.radius) {
          const falloff = 1 - (dist / (blastRadius + e.radius)) * 0.45;
          const pushAngle = Math.atan2(e.y - y, e.x - x);
          this.damageEnemy(
            e,
            damage * falloff,
            ownerPlayer,
            Math.cos(pushAngle) * (e.isBoss ? 50 : 220),
            Math.sin(pushAngle) * (e.isBoss ? 50 : 220),
            false,
            false,
            'rocket'
          );
        }
      }
    }

    const pyroStacks = this.getPerkStacks('pyromaniac_core');
    for (const p of this.players) {
      if (!p.alive) continue;
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist <= blastRadius + p.radius) {
        const isSelf = p.id === ownerId;
        const canHurt =
          ownerId === 0 ||
          this.mode === 'deathmatch' ||
          isSelf ||
          (this.mode === 'coop' && this.friendlyFire);
        if (canHurt) {
          const falloff = 1 - (dist / (blastRadius + p.radius)) * 0.55;
          let selfMitigation = isSelf && this.mode !== 'deathmatch' ? 0.22 : 0.4;
          if (p.operatorClass === 'vanguard') selfMitigation *= 0.5;
          if (isSelf && pyroStacks > 0) {
            selfMitigation *= Math.pow(0.4, pyroStacks);
          }
          this.damagePlayer(p, damage * falloff * selfMitigation, ownerId);
        }
      }
    }
  }

  private triggerTeslaAOEExplosion(x: number, y: number, blastRadius: number, damage: number) {
    soundEngine.playTeslaCannon();
    this.addCameraShake(7.0);

    this.rings.push({
      x,
      y,
      radius: 10,
      maxRadius: blastRadius,
      color: '#22D3EE',
      life: 0.34,
      maxLife: 0.34
    });

    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.35;
      const dist = blastRadius * 0.85;
      this.beams.push({
        x1: x,
        y1: y,
        x2: x + Math.cos(ang) * dist,
        y2: y + Math.sin(ang) * dist,
        color: '#22D3EE',
        width: 3,
        life: 0.2,
        maxLife: 0.2,
        isLightning: true
      });
    }

    this.spawnParticleBurst(x, y, '#22D3EE', 16, 200);

    for (const p of this.players) {
      if (!p.alive) continue;
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist <= blastRadius + p.radius) {
        const falloff = 1 - (dist / (blastRadius + p.radius)) * 0.4;
        this.damagePlayer(p, damage * falloff, 0);
      }
    }
  }

  private damageEnemy(
    e: EnemyEntity,
    amount: number,
    attacker: PlayerEntity | undefined,
    knockX: number,
    knockY: number,
    allowChainLightning: boolean = false,
    fromRemote: boolean = false,
    weaponId?: WeaponId
  ) {
    let finalDamage = amount;
    const wepDef = weaponId ? WEAPON_BY_ID[weaponId] : undefined;
    const heroStats = attacker ? progressionManager.computeHeroCombatStats(attacker.operatorClass) : null;

    if (e.type === 'shield_brute' && wepDef?.id !== 'sniper_rifle' && wepDef?.id !== 'railgun') {
      finalDamage *= 0.65;
      knockX *= 0.35;
      knockY *= 0.35;
    } else if (e.type === 'crusher_tank') {
      finalDamage *= 0.76;
      knockX *= 0.2;
      knockY *= 0.2;
    }

    // Witch Hunter [R] Silvered Bolts & Silver Crossbow Limb (hasCullExecute)
    const isEliteOrBoss =
      !!e.isBoss ||
      e.type === 'devil' ||
      e.type === 'tesla_gorilla' ||
      e.type === 'crusher_tank' ||
      e.type === 'shield_brute';

    if (attacker?.operatorClass === 'marksman' && isEliteOrBoss) {
      const rLevel = progressionManager.getHeroAbilityLevel('marksman', 3);
      finalDamage += Math.min(260, e.maxHp * (0.025 + rLevel * 0.006));
    }

    if (heroStats?.hasCullExecute && (isEliteOrBoss || e.hp / e.maxHp <= 0.35)) {
      finalDamage *= 1.28;
    }

    // Elemental Boss Weakness / Resistance & Anti-One-Shot Armor Cap
    if (e.isBoss && e.bossElement) {
      const bossCfg = ELEMENTAL_BOSS_CONFIGS.find((c) => c.element === e.bossElement);
      if (bossCfg && wepDef) {
        if (
          bossCfg.weaknessWeaponClasses.includes(wepDef.weaponClass) ||
          (wepDef.element && bossCfg.weaknessElements.includes(wepDef.element))
        ) {
          finalDamage *= 1.25;
        } else if (wepDef.element && bossCfg.resistanceElements.includes(wepDef.element)) {
          finalDamage *= 0.8;
        }
      }

      const bossSlayerStacks = this.getPerkStacks('boss_slayer');
      if (bossSlayerStacks > 0) {
        finalDamage *= 1 + 0.25 * bossSlayerStacks;
      }
      if (attacker?.operatorClass === 'marksman') {
        finalDamage *= 1.2;
      }

      // Per-hit Boss Armor Cap: Mega Raid Bosses cap at 5% Max HP; Wave-End Bosses cap at 14% Max HP
      const maxSingleHit = e.maxHp * (e.isMegaBoss ? 0.05 : 0.14);
      if (finalDamage > maxSingleHit) {
        finalDamage = maxSingleHit;
      }
    }

    if (this.mode === 'online_coop' && !multiplayerClient.isHost() && !fromRemote) {
      multiplayerClient.sendPlayerAction({
        kind: 'damage_enemy',
        enemyId: e.id,
        amount: Math.round(finalDamage),
        knockX: Math.round(knockX),
        knockY: Math.round(knockY),
        weaponId
      });
    }

    e.hp -= finalDamage;
    e.hitFlashTimer = 0.09;

    // Cataclysmic 5-Wave Mega Raid Boss Phase Transitions (Phase 2 @ 65% HP, Phase 3 @ 30% HP)
    if (e.isMegaBoss && e.hp > 0) {
      const currentPhase = e.bossPhase || 1;
      if (currentPhase === 1 && e.hp <= e.maxHp * 0.65) {
        e.bossPhase = 2;
        e.speed *= 1.22;
        e.damage = Math.round(e.damage * 1.2);
        e.frenzyTimer = 5.0;
        soundEngine.playExplosion(1.35);
        this.addCameraShake(11);
        this.rings.push({
          x: e.x,
          y: e.y,
          radius: 25,
          maxRadius: 240,
          color: '#F97316',
          life: 0.5,
          maxLife: 0.5
        });
        this.addFloatingText(e.x, e.y - 54, 'MEGA BOSS PHASE 2!', 'BLOOD OVERDRIVE + ELITE GUARD', '#F97316', 1.35);
        for (let m = 0; m < 3; m++) {
          this.spawnEnemyFromDoorway();
        }
      } else if (currentPhase === 2 && e.hp <= e.maxHp * 0.3) {
        e.bossPhase = 3;
        e.speed *= 1.25;
        e.damage = Math.round(e.damage * 1.25);
        e.frenzyTimer = 8.0;
        soundEngine.playExplosion(1.55);
        this.addCameraShake(14);
        this.rings.push({
          x: e.x,
          y: e.y,
          radius: 30,
          maxRadius: 280,
          color: '#EF4444',
          life: 0.6,
          maxLife: 0.6
        });
        this.addFloatingText(e.x, e.y - 58, 'PHASE 3: CATACLYSM!', 'APOCALYPSE ENRAGE UNLEASHED', '#EF4444', 1.45);
        for (let m = 0; m < 4; m++) {
          this.spawnEnemyFromDoorway();
        }
      }
    }

    // Lifesteal from Cursed MOBA Items (e.g. Bloodstone Fang)
    if (attacker && attacker.alive && heroStats && heroStats.lifestealPct > 0 && allowChainLightning) {
      const leech = Math.max(1, Math.round(finalDamage * (heroStats.lifestealPct / 100) * 0.22));
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + leech);
    }

    if (
      wepDef?.element === 'frost' ||
      this.getPerkStacks('cryo_munitions') > 0 ||
      heroStats?.hasFrostChill
    ) {
      e.chillTimer = Math.max(e.chillTimer, 2.6);
    }
    if (wepDef?.element === 'fire') {
      e.burnTimer = Math.max(e.burnTimer, 3.0);
    }

    const knockScale = e.isBoss ? 0.012 : e.type === 'crusher_tank' || e.type === 'tesla_gorilla' ? 0.03 : 0.075;
    e.x = Math.max(36, Math.min(this.arena.width - 36, e.x + knockX * knockScale));
    e.y = Math.max(36, Math.min(this.arena.height - 36, e.y + knockY * knockScale));

    this.spawnParticleBurst(e.x, e.y, e.type === 'spitter' ? '#84CC16' : '#DC2626', 4, 120, true);
    soundEngine.playEnemyHit(e.type === 'devil' || e.type === 'tesla_gorilla' || !!e.isBoss);

    const teslaStacks = this.getPerkStacks('chain_lightning') + (weaponId === 'tesla_rifle' ? 2 : 0);
    if (allowChainLightning && teslaStacks > 0) {
      let arcsRemaining = Math.min(4, teslaStacks);
      let lastX = e.x;
      let lastY = e.y;
      for (const other of this.enemies) {
        if (other.id === e.id || other.hp <= 0) continue;
        if (Math.hypot(other.x - lastX, other.y - lastY) <= 190) {
          this.beams.push({
            x1: lastX,
            y1: lastY - 12,
            x2: other.x,
            y2: other.y - 12,
            color: '#38BDF8',
            width: 3,
            life: 0.14,
            maxLife: 0.14,
            isLightning: true
          });
          lastX = other.x;
          lastY = other.y;
          this.damageEnemy(other, finalDamage * 0.45, attacker, 0, 0, false, fromRemote);
          arcsRemaining--;
          if (arcsRemaining <= 0) break;
        }
      }
    }

    if (e.hp <= 0) {
      const idx = this.enemies.indexOf(e);
      if (idx !== -1) {
        this.enemies.splice(idx, 1);
      }

      if (this.mode === 'online_coop' && multiplayerClient.isHost()) {
        multiplayerClient.sendPlayerAction({
          kind: 'enemy_killed',
          enemyId: e.id,
          x: Math.round(e.x),
          y: Math.round(e.y),
          isBoss: !!e.isBoss
        });
      }

      this.drawBloodSplatter(e.x, e.y, e.isBoss ? 44 : 15);
      this.spawnParticleBurst(e.x, e.y, '#991B1B', e.isBoss ? 36 : 10, 175, true);

      if (e.type === 'bomber') {
        this.triggerExplosion(e.x, e.y, 110, 125, attacker ? attacker.id : 1, false);
      }

      const vampStacks = this.getPerkStacks('vampiric_rounds');
      if (attacker && attacker.alive) {
        let killHeal = vampStacks * 4;
        // Crypt Reaper [R] Soul Siphon bonus heal + frenzy on kill
        if (attacker.operatorClass === 'vanguard') {
          const rLevel = progressionManager.getHeroAbilityLevel('vanguard', 3);
          killHeal += 8 + rLevel * 3;
          attacker.reaperFrenzyTimer = 3.5;
        }
        if (killHeal > 0) {
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + killHeal);
        }

        // Necromancer's Grimoire (hasCooldownRefundOnKill): refund 0.5s on Q, W, E
        if (heroStats?.hasCooldownRefundOnKill) {
          for (let i = 0; i < 3; i++) {
            attacker.abilityCooldowns[i] = Math.max(0, attacker.abilityCooldowns[i] - 0.5);
          }
        }
      }

      this.combo += e.isMegaBoss ? 20 : e.isBoss ? 10 : e.type === 'tesla_gorilla' || e.type === 'crusher_tank' ? 2 : 1;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
      this.comboDecayTimer = 1.0;

      const pts = e.scoreValue * Math.max(1, Math.min(25, this.combo));
      if (attacker && !attacker.isBot) {
        attacker.score += pts;
        attacker.kills += 1;
      }

      const fortuneMult = 1 + this.getPerkStacks('fortune_hunter') * 0.4;

      // Account XP & Soul Gem rewards on Boss Kills
      if (this.screen === 'PLAYING' && (!attacker || !attacker.isBot)) {
        if (e.isMegaBoss) {
          this.awardCurrencies(0, 0, 5);
          progressionManager.addAccountXp(420);
        } else if (e.isBoss) {
          this.awardCurrencies(0, 0, 2);
          progressionManager.addAccountXp(180);
        } else {
          progressionManager.addAccountXp(8);
        }
      }

      if (progressionManager.settings.floatingDamageNumbers) {
        this.addFloatingText(
          e.x,
          e.y - 18,
          e.isMegaBoss
            ? `OVERLORD SLAIN! +5 GEMS`
            : e.isBoss
            ? `WAVE BOSS SLAIN! +2 GEMS`
            : `+${pts}`,
          this.combo > 1 ? `STREAK x${this.combo}` : undefined,
          e.isMegaBoss ? '#EF4444' : e.isBoss ? '#A855F7' : this.combo >= 10 ? '#F59E0B' : '#F8FAFC',
          e.isMegaBoss ? 1.55 : e.isBoss ? 1.35 : 0.85
        );
      }

      this.checkComboMilestones(attacker || this.players[0]);

      // STREAMLINED DROPS: Mobs and Bosses drop ONLY XP Orbs ('xp') and Gold ('gold' / 'gold_pouch')!
      if (e.isBoss) {
        soundEngine.playExplosion(e.isMegaBoss ? 1.65 : 1.4);
        this.addCameraShake(e.isMegaBoss ? 16 : 12);
        const pouchCount = e.isMegaBoss ? 12 : 5;
        const xpCount = e.isMegaBoss ? 12 : 6;
        const scatter = e.isMegaBoss ? 130 : 85;
        for (let k = 0; k < pouchCount; k++) {
          this.pickups.push({
            id: this.nextEntityId++,
            kind: 'gold_pouch',
            x: Math.max(45, Math.min(this.arena.width - 45, e.x + (Math.random() * scatter - scatter / 2))),
            y: Math.max(45, Math.min(this.arena.height - 45, e.y + (Math.random() * scatter - scatter / 2))),
            life: 32,
            pulse: k * 0.5,
            value: Math.round((e.isMegaBoss ? 65 + this.wave * 10 : 40 + this.wave * 8) * fortuneMult)
          });
        }
        for (let k = 0; k < xpCount; k++) {
          this.pickups.push({
            id: this.nextEntityId++,
            kind: 'xp',
            x: Math.max(45, Math.min(this.arena.width - 45, e.x + (Math.random() * scatter - scatter / 2))),
            y: Math.max(45, Math.min(this.arena.height - 45, e.y + (Math.random() * scatter - scatter / 2))),
            life: 32,
            pulse: k * 0.4,
            value: e.isMegaBoss ? 50 + this.wave * 6 : 36 + this.wave * 5
          });
        }
      } else {
        // Every mob drops an XP Orb, plus Gold Coin (or Gold Pouch for Elites)
        this.pickups.push({
          id: this.nextEntityId++,
          kind: 'xp',
          x: Math.max(40, Math.min(this.arena.width - 40, e.x + (Math.random() * 20 - 10))),
          y: Math.max(40, Math.min(this.arena.height - 40, e.y + (Math.random() * 20 - 10))),
          life: 24,
          pulse: Math.random() * 3,
          value: isEliteOrBoss ? 40 + this.wave * 4 : 20 + this.wave * 2
        });

        if (isEliteOrBoss) {
          this.pickups.push({
            id: this.nextEntityId++,
            kind: 'gold_pouch',
            x: Math.max(40, Math.min(this.arena.width - 40, e.x + (Math.random() * 26 - 13))),
            y: Math.max(40, Math.min(this.arena.height - 40, e.y + (Math.random() * 26 - 13))),
            life: 24,
            pulse: Math.random() * 3,
            value: Math.round((28 + this.wave * 4) * fortuneMult)
          });
        } else if (Math.random() < 0.72) {
          this.pickups.push({
            id: this.nextEntityId++,
            kind: 'gold',
            x: Math.max(40, Math.min(this.arena.width - 40, e.x + (Math.random() * 24 - 12))),
            y: Math.max(40, Math.min(this.arena.height - 40, e.y + (Math.random() * 24 - 12))),
            life: 22,
            pulse: Math.random() * 3,
            value: Math.round((9 + this.wave * 2) * fortuneMult)
          });
        }
      }
    }
  }

  private checkComboMilestones(triggerPlayer: PlayerEntity) {
    if (this.mode === 'deathmatch') return;

    for (let i = 0; i < COMBO_MILESTONES.length; i++) {
      const m = COMBO_MILESTONES[i];
      if (this.combo >= m.combo && i > this.unlockedMilestoneIndex) {
        this.unlockedMilestoneIndex = i;
        if (!triggerPlayer?.isBot) {
          this.awardCurrencies(m.rewardGold, m.rewardScrap, 0);
        }
        soundEngine.playPickup(true);
        this.recentBanner = {
          title: m.title,
          subtitle: m.subtitle,
          color: '#F59E0B',
          timestamp: performance.now()
        };
      }
    }
  }

  private damagePlayer(p: PlayerEntity, amount: number, _attackerId: 1 | 2 | 0) {
    if (!p.alive || p.invulnTimer > 0) return;

    const heroStats = progressionManager.computeHeroCombatStats(p.operatorClass);
    const wardenWallBonus = p.operatorClass === 'vanguard' && p.skillActiveTimer > 0 ? 0.35 : 0;
    const totalArmor = Math.min(0.75, heroStats.armorReduction + wardenWallBonus);
    let finalDamage = amount * (1 - totalArmor);

    p.shieldRegenTimer = 0;

    // Absorb with Shield HP first (Grave Warden [W], Necro-Warlock [R], Wraith's Hourglass)
    if (p.shieldHp > 0) {
      const absorbed = Math.min(p.shieldHp, finalDamage);
      p.shieldHp -= absorbed;
      finalDamage -= absorbed;
    }

    p.hp -= finalDamage;
    p.hitFlashTimer = 0.12;
    soundEngine.playPlayerHurt();

    // Grave Warden [R] Graveborn Bulwark & Gargoyle Stoneplate (hasThornsPlate) thorny reflect
    if (p.operatorClass === 'vanguard' || heroStats.hasThornsPlate) {
      const rLevel = progressionManager.getHeroAbilityLevel('vanguard', 3);
      const thornsDmg = 28 + p.maxHp * 0.08 + rLevel * 12;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (Math.hypot(e.x - p.x, e.y - p.y) <= 130) {
          const ang = Math.atan2(e.y - p.y, e.x - p.x);
          this.damageEnemy(e, thornsDmg, p, Math.cos(ang) * 180, Math.sin(ang) * 180, false);
        }
      }
    }

    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      p.deaths += 1;
      p.respawnTimer = this.mode === 'online_coop' ? 5.0 : 2.5;
      this.drawBloodSplatter(p.x, p.y, 22);
      this.spawnParticleBurst(p.x, p.y, '#DC2626', 16, 170, true);

      if (this.mode === 'online_coop' && !p.isBot) {
        multiplayerClient.sendPlayerState({
          operatorClass: p.operatorClass,
          x: Math.round(p.x),
          y: Math.round(p.y),
          vx: 0,
          vy: 0,
          angle: Number(p.angle.toFixed(2)),
          hp: 0,
          maxHp: p.maxHp,
          alive: false,
          weaponId: p.weapons[p.activeWeaponIndex]?.id || 'pistol',
          score: p.score,
          kills: p.kills,
          droneCount: Math.min(3, this.getPerkStacks('orbital_drone'))
        });
      }

      if (this.mode === 'deathmatch') {
        const killer = this.players.find((other) => other.id !== p.id);
        if (killer) {
          killer.frags += 1;
          killer.score += 500;
          if (killer.frags >= 10) {
            this.winnerText = `${killer.name} WINS DEATHMATCH!`;
            this.saveHighScores();
            this.screen = 'GAME_OVER';
            this.emitHUD();
          }
        }
      } else if (this.mode === 'online_coop' && !p.isBot) {
        if (!this.isAnySquadMemberAlive()) {
          this.openReviveOrGameOver(false);
        } else {
          this.addFloatingText(p.x, p.y - 25, 'DOWNED!', 'ALLY ALIVE — REVIVING IN 5S', '#38BDF8', 1.1);
        }
      } else if (!p.isBot) {
        const anyAlive = this.players.some((pl) => pl.alive);
        if (!anyAlive) {
          this.openReviveOrGameOver(false);
        } else {
          this.addFloatingText(p.x, p.y - 25, 'DOWNED!', 'SURVIVE WAVE TO REVIVE', '#EF4444', 1.1);
        }
      }
    }
  }

  private updateSpawner(dt: number) {
    if (this.mode === 'deathmatch' && this.screen === 'PLAYING') {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 6.5;
        if (this.pickups.length < 8) {
          const rx = 200 + Math.random() * (this.arena.width - 400);
          const ry = 200 + Math.random() * (this.arena.height - 400);
          if (!this.circleIntersectsAnyObstacle(rx, ry, 20)) {
            this.pickups.push({
              id: this.nextEntityId++,
              kind: Math.random() < 0.5 ? 'xp' : 'gold',
              x: rx,
              y: ry,
              life: 24,
              pulse: 0,
              value: 25
            });
          }
        }
      }
      return;
    }

    // Sanitize enemy array against any invalid/out-of-bounds entities so waves never stall at Stage 5+
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.hp) || e.hp <= 0) {
        this.enemies.splice(i, 1);
        continue;
      }
      e.x = Math.max(30, Math.min(this.arena.width - 30, e.x));
      e.y = Math.max(30, Math.min(this.arena.height - 30, e.y));
    }

    if (this.enemiesToSpawnInWave > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const baseInterval = Math.max(0.18, 0.88 - this.wave * 0.045);
        this.spawnTimer = baseInterval;
        this.spawnEnemyFromDoorway();
        this.enemiesToSpawnInWave -= 1;
      }
    } else if (!this.waveEndBossSpawned && !this.isBossWave) {
      // Every non-5th wave spawns a Wave-End Boss once all regular wave enemies have spawned!
      this.waveEndBossSpawned = true;
      const totalPartyCount = Math.max(
        1,
        (this.players.filter((p) => !p.isBot).length || 1) + this.remoteAllies.size
      );
      this.spawnWaveEndBoss(this.wave, totalPartyCount);
    } else if (this.enemies.length === 0) {
      this.waveIntermissionTimer += dt;
      if (this.waveIntermissionTimer >= 1.1) {
        this.waveIntermissionTimer = 0;
        if (this.screen === 'PLAYING' && this.waveClearDraftDoneForWave < this.wave) {
          this.waveClearDraftDoneForWave = this.wave;
          this.openWavePerkDraft();
        } else {
          this.startWave(this.wave + 1, this.screen === 'TITLE_MENU');
        }
      }
    }
  }

  private getEnemyRadius(type: EnemyType, isBoss: boolean): number {
    if (isBoss) return 38;
    switch (type) {
      case 'crusher_tank':
        return 27;
      case 'tesla_gorilla':
        return 25;
      case 'devil':
        return 22;
      case 'shield_brute':
        return 20;
      default:
        return 16;
    }
  }

  private spawnEnemyFromDoorway() {
    const p1 = this.players[0];
    const sortedSpawners = [...this.arena.spawners].sort((a, b) => {
      const da = Math.hypot(a.x - (p1?.x || 1000), a.y - (p1?.y || 900));
      const db = Math.hypot(b.x - (p1?.x || 1000), b.y - (p1?.y || 900));
      return da - db;
    });
    const pool = sortedSpawners.slice(0, 6);
    const sp = pool[Math.floor(Math.random() * pool.length)] || this.arena.spawners[0];

    // Normalized weighted table across all 10 non-boss enemy types so Stage 5+ always spawns cleanly
    const w = this.wave;
    const weights: { type: EnemyType; weight: number }[] = [
      { type: 'zombie', weight: Math.max(18, 45 - w * 2) },
      { type: 'runner', weight: 16 + Math.min(18, w * 1.5) },
      { type: 'spitter', weight: w >= 2 ? 10 + Math.min(12, w) : 4 },
      { type: 'shield_brute', weight: w >= 2 ? 9 + Math.min(12, w) : 3 },
      { type: 'bomber', weight: w >= 2 ? 8 + Math.min(10, w) : 3 },
      { type: 'sniper', weight: w >= 3 ? 8 + Math.min(10, w) : 0 },
      { type: 'healer_shaman', weight: w >= 3 ? 7 + Math.min(8, w * 0.8) : 0 },
      { type: 'crusher_tank', weight: w >= 4 ? 7 + Math.min(10, w) : 0 },
      { type: 'tesla_gorilla', weight: w >= 3 ? 7 + Math.min(10, w) : 2 },
      { type: 'devil', weight: w >= 4 ? (6 + Math.min(10, w)) * this.arena.devilSpawnRateMultiplier : 0 }
    ];

    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    let type: EnemyType = 'zombie';
    for (const item of weights) {
      if (roll < item.weight) {
        type = item.type;
        break;
      }
      roll -= item.weight;
    }

    // Harder wave HP & Speed scaling!
    const totalPartyCount = Math.max(
      1,
      (this.players.filter((p) => !p.isBot).length || 1) + this.remoteAllies.size
    );
    const waveHpScale = (1 + (this.wave - 1) * 0.24) * (1 + (totalPartyCount - 1) * 0.22);

    const baseHpMap: Record<string, number> = {
      crusher_tank: 520,
      tesla_gorilla: 420,
      devil: 360,
      shield_brute: 270,
      healer_shaman: 180,
      spitter: 135,
      sniper: 120,
      bomber: 95,
      runner: 85,
      zombie: 115
    };

    const baseSpeedMap: Record<string, number> = {
      crusher_tank: 64,
      tesla_gorilla: 90,
      devil: 96,
      shield_brute: 74,
      healer_shaman: 84,
      spitter: 98,
      sniper: 88,
      bomber: 134,
      runner: 148,
      zombie: 86 + Math.random() * 14
    };

    const baseDamageMap: Record<string, number> = {
      crusher_tank: 36,
      tesla_gorilla: 30,
      devil: 28,
      shield_brute: 24,
      healer_shaman: 16,
      spitter: 20,
      sniper: 26,
      bomber: 24,
      runner: 18,
      zombie: 18
    };

    const scoreMap: Record<string, number> = {
      crusher_tank: 700,
      tesla_gorilla: 650,
      devil: 500,
      shield_brute: 320,
      healer_shaman: 300,
      sniper: 260,
      spitter: 220,
      bomber: 200,
      runner: 150,
      zombie: 100
    };

    const baseHp = baseHpMap[type] || 115;
    const speedBoost = 1 + Math.min(0.35, (this.wave - 1) * 0.025);

    const enemy: EnemyEntity = {
      id: this.nextEntityId++,
      type,
      x: Math.max(40, Math.min(this.arena.width - 40, sp.x + (Math.random() * 26 - 13))),
      y: Math.max(40, Math.min(this.arena.height - 40, sp.y + (Math.random() * 26 - 13))),
      vx: sp.dirX * 40,
      vy: sp.dirY * 40,
      radius: this.getEnemyRadius(type, false),
      angle: Math.atan2(sp.dirY, sp.dirX),
      hp: Math.round(baseHp * waveHpScale),
      maxHp: Math.round(baseHp * waveHpScale),
      speed: (baseSpeedMap[type] || 90) * speedBoost,
      damage: Math.round((baseDamageMap[type] || 18) * (1 + (this.wave - 1) * 0.06)),
      hitFlashTimer: 0,
      chillTimer: 0,
      burnTimer: 0,
      walkCycle: Math.random() * 6,
      attackCooldown: 1.2,
      windupTimer: 0,
      isWindingUp: false,
      attackPattern: 0,
      scoreValue: scoreMap[type] || 100,
      abilityCooldown: 1.5 + Math.random() * 1.5,
      dashTimer: 0,
      dashVx: 0,
      dashVy: 0,
      frenzyTimer: 0,
      strafeDir: Math.random() < 0.5 ? 1 : -1
    };

    this.enemies.push(enemy);
  }

  private updatePlaceables(dt: number, isAuthoritative: boolean) {
    for (let i = this.placeables.length - 1; i >= 0; i--) {
      const pl = this.placeables[i];
      if (pl.armedTimer > 0) {
        pl.armedTimer -= dt;
      }

      if (pl.lifeTimer !== undefined) {
        pl.lifeTimer -= dt;
        if (pl.lifeTimer <= 0) {
          this.placeables.splice(i, 1);
          continue;
        }
      }

      // Autonomous Sentry Turret AI
      if (pl.type === 'sentry_turret' && pl.armedTimer <= 0) {
        pl.fireTimer = (pl.fireTimer || 0) - dt;
        if (pl.fireTimer <= 0) {
          let target: EnemyEntity | null = null;
          let minDist = 450;
          for (const e of this.enemies) {
            const d = Math.hypot(e.x - pl.x, e.y - pl.y);
            if (d < minDist) {
              minDist = d;
              target = e;
            }
          }
          if (target) {
            pl.fireTimer = 0.24;
            pl.turretAngle = Math.atan2(target.y - pl.y, target.x - pl.x);
            if (isAuthoritative) {
              const owner = this.players.find((p) => p.id === pl.ownerId) || this.players[0];
              this.damageEnemy(target, pl.damage, owner, 0, 0, false);
            }
            this.beams.push({
              x1: pl.x,
              y1: pl.y - 10,
              x2: target.x,
              y2: target.y - 12,
              color: '#A855F7',
              width: 2.5,
              life: 0.08,
              maxLife: 0.08
            });
          }
        }
      }

      if (pl.chainTimer > 0) {
        pl.chainTimer -= dt;
        if (pl.chainTimer <= 0) {
          this.placeables.splice(i, 1);
          this.triggerExplosion(pl.x, pl.y, pl.blastRadius, pl.damage, pl.ownerId, pl.cluster);
          continue;
        }
      }

      if (pl.type === 'claymore' && pl.armedTimer <= 0 && pl.chainTimer === 0) {
        let triggered = false;
        for (const e of this.enemies) {
          if (Math.hypot(e.x - pl.x, e.y - pl.y) <= pl.radius + e.radius + 14) {
            triggered = true;
            break;
          }
        }
        if (triggered) {
          pl.chainTimer = 0.03;
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.timer -= dt;

      if (pr.kind === 'grenade' || pr.kind === 'cluster_bomblet' || pr.kind === 'cauldron_flask') {
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
        pr.vz -= 420 * dt;
        pr.z += pr.vz * dt;
        if (pr.z < 0) {
          pr.z = 0;
          pr.vz = -pr.vz * 0.55;
          pr.vx *= 0.72;
          pr.vy *= 0.72;
        }

        if (pr.x < 34 || pr.x > this.arena.width - 34) pr.vx = -pr.vx * 0.7;
        if (pr.y < 34 || pr.y > this.arena.height - 34) pr.vy = -pr.vy * 0.7;

        if (pr.timer <= 0) {
          this.projectiles.splice(i, 1);
          if (pr.kind === 'cauldron_flask') {
            soundEngine.playExplosion(0.95);
            const zoneR = pr.blastRadius || 135;
            this.skillZones.push({
              id: this.nextEntityId++,
              kind: 'acid_pool',
              ownerId: pr.ownerId,
              x: pr.x,
              y: pr.y,
              radius: zoneR,
              damage: Math.round(pr.damage * 0.42),
              life: 4.5,
              maxLife: 4.5,
              tickTimer: 0.1,
              color: '#10B981'
            });
            this.rings.push({
              x: pr.x,
              y: pr.y,
              radius: 14,
              maxRadius: zoneR,
              color: '#10B981',
              life: 0.32,
              maxLife: 0.32
            });
            this.spawnParticleBurst(pr.x, pr.y, '#10B981', 18, 165);
            const owner = this.players.find((p) => p.id === pr.ownerId);
            for (let k = this.enemies.length - 1; k >= 0; k--) {
              const e = this.enemies[k];
              if (Math.hypot(e.x - pr.x, e.y - pr.y) <= zoneR + e.radius) {
                e.chillTimer = Math.max(e.chillTimer, 2.2);
                this.damageEnemy(e, pr.damage, owner, 0, 0, false);
              }
            }
          } else {
            this.triggerExplosion(pr.x, pr.y, pr.blastRadius, pr.damage, pr.ownerId, pr.cluster);
          }
        }
      } else if (
        pr.kind === 'silver_stake' ||
        pr.kind === 'alchemist_syringe' ||
        pr.kind === 'eldritch_skull'
      ) {
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        let removeProj =
          pr.timer <= 0 ||
          pr.x < 28 ||
          pr.x > this.arena.width - 28 ||
          pr.y < 28 ||
          pr.y > this.arena.height - 28;

        if (!removeProj) {
          for (const obs of this.dynamicObstacles) {
            if (obs.kind !== 'lava' && pr.x >= obs.x && pr.x <= obs.x + obs.w && pr.y >= obs.y && pr.y <= obs.y + obs.h) {
              removeProj = true;
              break;
            }
          }
        }

        if (!removeProj) {
          const shooter = this.players.find((p) => p.id === pr.ownerId);
          if (!pr.hitIds) pr.hitIds = new Set();

          for (let k = this.enemies.length - 1; k >= 0; k--) {
            const e = this.enemies[k];
            if (pr.hitIds.has(e.id)) continue;
            if (Math.hypot(pr.x - e.x, pr.y - e.y) <= e.radius + pr.radius + 5) {
              pr.hitIds.add(e.id);
              this.damageEnemy(e, pr.damage, shooter, pr.vx * 0.16, pr.vy * 0.16, true);

              if (pr.kind === 'silver_stake') {
                this.spawnParticleBurst(e.x, e.y, '#FDE047', 6, 130);
                // Witch Hunter [R] Silvered Bolts flare on Elites & Bosses
                if (e.isBoss || e.type === 'devil' || e.type === 'tesla_gorilla' || e.type === 'crusher_tank') {
                  this.rings.push({
                    x: e.x,
                    y: e.y,
                    radius: 8,
                    maxRadius: 56,
                    color: '#FEF08A',
                    life: 0.18,
                    maxLife: 0.18
                  });
                }
              } else if (pr.kind === 'alchemist_syringe') {
                const splashR = pr.blastRadius || 68;
                this.rings.push({
                  x: e.x,
                  y: e.y,
                  radius: 8,
                  maxRadius: splashR,
                  color: '#10B981',
                  life: 0.2,
                  maxLife: 0.2
                });
                this.spawnParticleBurst(e.x, e.y, '#10B981', 8, 130);
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                  const other = this.enemies[j];
                  if (other.id !== e.id && Math.hypot(other.x - e.x, other.y - e.y) <= splashR) {
                    other.chillTimer = Math.max(other.chillTimer, 1.4);
                    this.damageEnemy(other, pr.damage * 0.45, shooter, 0, 0, false);
                  }
                }
              } else if (pr.kind === 'eldritch_skull') {
                const splashR = pr.blastRadius || 75;
                this.rings.push({
                  x: e.x,
                  y: e.y,
                  radius: 10,
                  maxRadius: splashR,
                  color: '#A855F7',
                  life: 0.22,
                  maxLife: 0.22
                });
                this.spawnParticleBurst(e.x, e.y, '#C084FC', 9, 140);
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                  const other = this.enemies[j];
                  if (other.id !== e.id && Math.hypot(other.x - e.x, other.y - e.y) <= splashR) {
                    this.damageEnemy(other, pr.damage * 0.5, shooter, 0, 0, false);
                  }
                }
              }

              pr.pierceLeft = (pr.pierceLeft ?? 1) - 1;
              if (pr.pierceLeft <= 0) {
                removeProj = true;
                break;
              }
            }
          }
        }

        if (removeProj) {
          this.projectiles.splice(i, 1);
        }
      } else {
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        let hit =
          pr.timer <= 0 ||
          pr.x < 28 ||
          pr.x > this.arena.width - 28 ||
          pr.y < 28 ||
          pr.y > this.arena.height - 28;

        if (!hit) {
          for (const obs of this.dynamicObstacles) {
            if (obs.kind !== 'lava' && pr.x >= obs.x && pr.x <= obs.x + obs.w && pr.y >= obs.y && pr.y <= obs.y + obs.h) {
              hit = true;
              break;
            }
          }
        }

        if (!hit && pr.kind === 'rocket') {
          for (const e of this.enemies) {
            if (Math.hypot(pr.x - e.x, pr.y - e.y) <= e.radius + pr.radius) {
              hit = true;
              break;
            }
          }
        }

        if (!hit && pr.ownerId === 0) {
          for (const p of this.players) {
            if (p.alive && Math.hypot(pr.x - p.x, pr.y - p.y) <= p.radius + pr.radius) {
              hit = true;
              if (pr.kind === 'frost_shard') {
                p.chillTimer = 2.8;
              }
              break;
            }
          }
        }

        if (hit) {
          this.projectiles.splice(i, 1);
          if (pr.kind === 'tesla_orb') {
            this.triggerTeslaAOEExplosion(pr.x, pr.y, pr.blastRadius, pr.damage);
          } else {
            this.triggerExplosion(pr.x, pr.y, pr.blastRadius, pr.damage, pr.ownerId, pr.cluster);
          }
        }
      }
    }
  }

  private updateEnemies(dt: number, isAuthoritative: boolean) {
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.hitFlashTimer > 0) e.hitFlashTimer -= dt;
      if (e.chillTimer > 0) e.chillTimer -= dt;
      if (e.frenzyTimer && e.frenzyTimer > 0) e.frenzyTimer -= dt;
      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.hp -= 14 * dt;
      }

      const chillScale = e.chillTimer > 0 ? 0.62 : 1.0;
      const frenzyMult = e.frenzyTimer && e.frenzyTimer > 0 ? 1.32 : 1.0;
      if (e.attackCooldown > 0) e.attackCooldown -= dt * chillScale * frenzyMult;
      if (e.abilityCooldown !== undefined && e.abilityCooldown > 0) {
        e.abilityCooldown -= dt * chillScale;
      }

      let targetX = 0;
      let targetY = 0;
      let targetVx = 0;
      let targetVy = 0;
      let targetRadius = 17;
      let localTarget: PlayerEntity | null = null;
      let minDist = Infinity;

      for (const p of this.players) {
        if (!p.alive) continue;
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d < minDist) {
          minDist = d;
          targetX = p.x;
          targetY = p.y;
          targetVx = p.vx;
          targetVy = p.vy;
          targetRadius = p.radius;
          localTarget = p;
        }
      }

      for (const ally of this.remoteAllies.values()) {
        if (!ally.alive) continue;
        const d = Math.hypot(ally.x - e.x, ally.y - e.y);
        if (d < minDist) {
          minDist = d;
          targetX = ally.x;
          targetY = ally.y;
          targetVx = ally.vx;
          targetVy = ally.vy;
          targetRadius = 17;
          localTarget = null;
        }
      }

      if (minDist === Infinity) continue;

      const toTargetAngle = Math.atan2(targetY - e.y, targetX - e.x);
      e.angle = toTargetAngle;

      // Active Dash / Lunge / Bull-Charge override (Runner Pounce, Shield Brute Charge, Gorilla Leap, Boss Surge)
      if (e.dashTimer && e.dashTimer > 0) {
        e.dashTimer -= dt;
        const dvx = (e.dashVx || 0) * chillScale;
        const dvy = (e.dashVy || 0) * chillScale;
        e.walkCycle += dt * 22;
        this.moveCircleWithCollision(e, dvx * dt, dvy * dt, false);

        if (Math.random() < 0.45) {
          this.spawnParticleBurst(
            e.x,
            e.y,
            e.type === 'runner' ? '#FB7185' : e.type === 'tesla_gorilla' ? '#38BDF8' : '#F97316',
            1,
            50
          );
        }

        if (localTarget && Math.hypot(localTarget.x - e.x, localTarget.y - e.y) <= e.radius + targetRadius + 8) {
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 0.75;
            this.damagePlayer(localTarget, e.damage * 1.15, 0);
          }
        }

        // End-of-dash slam effects
        if (e.dashTimer <= 0 && isAuthoritative) {
          if (e.type === 'shield_brute') {
            // Tombstone Bull-Charge ends with a Gravestone Tremor Ring
            this.rings.push({
              x: e.x,
              y: e.y,
              radius: 12,
              maxRadius: 95,
              color: '#60A5FA',
              life: 0.28,
              maxLife: 0.28
            });
            this.addCameraShake(4.0);
            for (const p of this.players) {
              if (p.alive && Math.hypot(p.x - e.x, p.y - e.y) <= 95 + p.radius) {
                this.damagePlayer(p, e.damage * 0.75, 0);
              }
            }
          } else if (e.type === 'tesla_gorilla') {
            // Franken-Volt Gargoyle Shock-Leap Slam
            this.triggerTeslaAOEExplosion(e.x, e.y, 120, e.damage * 0.9);
          } else if (e.isBoss) {
            // Boss Surge Nova
            this.rings.push({
              x: e.x,
              y: e.y,
              radius: 16,
              maxRadius: e.isMegaBoss ? 225 : 185,
              color: e.isMegaBoss ? '#EF4444' : '#F97316',
              life: 0.34,
              maxLife: 0.34
            });
            this.addCameraShake(e.isMegaBoss ? 11.0 : 8.0);
            for (const p of this.players) {
              if (p.alive && Math.hypot(p.x - e.x, p.y - e.y) <= (e.isMegaBoss ? 225 : 185) + p.radius) {
                this.damagePlayer(p, e.damage * 0.9, 0);
              }
            }
          }
        }
        continue;
      }

      // =====================================================================
      // 1. 4 ELEMENTAL ZOMBIE RAID BOSSES (Wave-End Boss & 5-Wave Mega Raid Boss)
      // =====================================================================
      if (e.isBoss && isAuthoritative) {
        if (e.isWindingUp) {
          e.windupTimer -= dt * chillScale;
          if (e.windupTimer <= 0) {
            e.isWindingUp = false;
            const phase = e.bossPhase || 1;
            const enraged = e.hp < e.maxHp * 0.5 || phase >= 2;
            e.attackCooldown = e.isMegaBoss
              ? phase === 3
                ? 1.15
                : phase === 2
                ? 1.45
                : 1.75
              : enraged
              ? 1.75
              : 2.25;

            if (e.attackPattern === 1) {
              // Pattern 1: Unstoppable Boss Bull-Rush + Elemental Slam
              const dashSpeed = e.speed * (e.isMegaBoss ? 3.5 : enraged ? 3.1 : 2.7);
              e.dashVx = Math.cos(e.angle) * dashSpeed;
              e.dashVy = Math.sin(e.angle) * dashSpeed;
              e.dashTimer = e.isMegaBoss ? 0.48 : 0.42;
              this.addFloatingText(
                e.x,
                e.y - 42,
                e.isMegaBoss ? 'CATACLYSMIC BULL-RUSH!' : 'WARDEN SURGE!',
                undefined,
                e.isMegaBoss ? '#EF4444' : '#F97316',
                0.95
              );
            } else if (e.attackPattern === 2) {
              // Pattern 2: Radial Elemental Ring (12-Way for Mega Raid Boss, 8-Way for Wave Boss)
              const projKind =
                e.bossElement === 'lightning'
                  ? 'tesla_orb'
                  : e.bossElement === 'frost'
                  ? 'frost_shard'
                  : e.bossElement === 'venom'
                  ? 'acid_glob'
                  : 'fireball';
              const ringWays = e.isMegaBoss ? (phase >= 3 ? 14 : 12) : 8;
              const ringSpeed = e.isMegaBoss ? 330 : 280;
              for (let k = 0; k < ringWays; k++) {
                const ang = (Math.PI * 2 * k) / ringWays + e.angle;
                this.projectiles.push({
                  id: this.nextEntityId++,
                  kind: projKind,
                  ownerId: 0,
                  x: e.x + Math.cos(ang) * 40,
                  y: e.y + Math.sin(ang) * 40,
                  z: 16,
                  vx: Math.cos(ang) * ringSpeed,
                  vy: Math.sin(ang) * ringSpeed,
                  vz: 0,
                  radius: e.isMegaBoss ? 12 : 10,
                  damage: e.damage * 0.85,
                  blastRadius: 90,
                  timer: 2.5,
                  cluster: false
                });
              }
              this.rings.push({
                x: e.x,
                y: e.y,
                radius: 20,
                maxRadius: e.isMegaBoss ? 220 : 170,
                color: e.isMegaBoss ? '#EF4444' : '#A855F7',
                life: 0.35,
                maxLife: 0.35
              });
            } else if (e.bossElement === 'fire') {
              soundEngine.playDevilFireball();
              const count = e.isMegaBoss ? (phase >= 2 ? 7 : 5) : enraged ? 5 : 3;
              for (let k = -Math.floor(count / 2); k <= Math.floor(count / 2); k++) {
                const ang = e.angle + k * 0.19;
                this.projectiles.push({
                  id: this.nextEntityId++,
                  kind: 'fireball',
                  ownerId: 0,
                  x: e.x + Math.cos(ang) * 38,
                  y: e.y + Math.sin(ang) * 38,
                  z: 18,
                  vx: Math.cos(ang) * 340,
                  vy: Math.sin(ang) * 340,
                  vz: 0,
                  radius: 12,
                  damage: e.damage,
                  blastRadius: 95,
                  timer: 2.6,
                  cluster: false
                });
              }
            } else if (e.bossElement === 'lightning') {
              soundEngine.playTeslaCannon();
              const count = e.isMegaBoss ? 4 : enraged ? 3 : 2;
              for (let k = 0; k < count; k++) {
                const ang = e.angle + (k - (count - 1) / 2) * 0.25;
                this.projectiles.push({
                  id: this.nextEntityId++,
                  kind: 'tesla_orb',
                  ownerId: 0,
                  x: e.x + Math.cos(ang) * 38,
                  y: e.y + Math.sin(ang) * 38,
                  z: 18,
                  vx: Math.cos(ang) * 320,
                  vy: Math.sin(ang) * 320,
                  vz: 0,
                  radius: 13,
                  damage: e.damage,
                  blastRadius: 135,
                  timer: 2.4,
                  cluster: false
                });
              }
            } else if (e.bossElement === 'frost') {
              soundEngine.playTeslaCannon();
              const spread = e.isMegaBoss ? 3 : 2;
              for (let k = -spread; k <= spread; k++) {
                const ang = e.angle + k * 0.18;
                this.projectiles.push({
                  id: this.nextEntityId++,
                  kind: 'frost_shard',
                  ownerId: 0,
                  x: e.x + Math.cos(ang) * 38,
                  y: e.y + Math.sin(ang) * 38,
                  z: 16,
                  vx: Math.cos(ang) * 350,
                  vy: Math.sin(ang) * 350,
                  vz: 0,
                  radius: 10,
                  damage: e.damage * 0.85,
                  blastRadius: 85,
                  timer: 2.5,
                  cluster: false
                });
              }
            } else {
              const count = e.isMegaBoss ? 6 : 4;
              for (let k = 0; k < count; k++) {
                const ang = e.angle + (Math.random() - 0.5) * 0.85;
                this.projectiles.push({
                  id: this.nextEntityId++,
                  kind: 'acid_glob',
                  ownerId: 0,
                  x: e.x + Math.cos(ang) * 34,
                  y: e.y + Math.sin(ang) * 34,
                  z: 16,
                  vx: Math.cos(ang) * 320,
                  vy: Math.sin(ang) * 320,
                  vz: 0,
                  radius: 11,
                  damage: e.damage * 0.9,
                  blastRadius: 95,
                  timer: 2.3,
                  cluster: false
                });
              }
            }
            e.attackPattern = (e.attackPattern + 1) % 3;
          }
          continue;
        } else if (minDist < 660 && e.attackCooldown <= 0) {
          e.isWindingUp = true;
          e.windupTimer = e.isMegaBoss ? 0.48 : 0.58;
          continue;
        }
      }
      // =====================================================================
      // 2. FERAL GHOUL ZOMBIE (runner): Zig-Zag Stalk + Shadow Pounce Dash
      // =====================================================================
      else if (e.type === 'runner' && isAuthoritative) {
        if (e.isWindingUp) {
          e.windupTimer -= dt * chillScale;
          if (e.windupTimer <= 0) {
            e.isWindingUp = false;
            e.abilityCooldown = 3.2;
            const pounceSpeed = e.speed * 3.1;
            e.dashVx = Math.cos(e.angle) * pounceSpeed;
            e.dashVy = Math.sin(e.angle) * pounceSpeed;
            e.dashTimer = 0.26;
            this.spawnParticleBurst(e.x, e.y, '#FB7185', 6, 120);
          }
          continue;
        } else if (minDist > 95 && minDist < 235 && (e.abilityCooldown || 0) <= 0) {
          e.isWindingUp = true;
          e.windupTimer = 0.25;
          e.aimX = targetX;
          e.aimY = targetY;
          continue;
        }
      }
      // =====================================================================
      // 3. TOMBSTONE RIOT ZOMBIE (shield_brute): Bull-Charge & Tremor Slam
      // =====================================================================
      else if (e.type === 'shield_brute' && isAuthoritative) {
        if (e.isWindingUp) {
          e.windupTimer -= dt * chillScale;
          if (e.windupTimer <= 0) {
            e.isWindingUp = false;
            e.abilityCooldown = 4.2;
            const chargeSpeed = e.speed * 2.85;
            e.dashVx = Math.cos(e.angle) * chargeSpeed;
            e.dashVy = Math.sin(e.angle) * chargeSpeed;
            e.dashTimer = 0.36;
          }
          continue;
        } else if (minDist > 85 && minDist < 260 && (e.abilityCooldown || 0) <= 0) {
          e.isWindingUp = true;
          e.windupTimer = 0.42;
          e.aimX = targetX;
          e.aimY = targetY;
          continue;
        }
      }
      // =====================================================================
      // 4. FRANKEN-CRUSHER TANK (crusher_tank): Seismic Ground-Pound Nova
      // =====================================================================
      else if (e.type === 'crusher_tank' && isAuthoritative) {
        if (e.isWindingUp) {
          e.windupTimer -= dt * chillScale;
          if (e.windupTimer <= 0) {
            e.isWindingUp = false;
            e.attackCooldown = 3.2;
            this.addCameraShake(6.5);
            this.rings.push({
              x: e.x,
              y: e.y,
              radius: 14,
              maxRadius: 155,
              color: '#F59E0B',
              life: 0.34,
              maxLife: 0.34
            });
            this.spawnParticleBurst(e.x, e.y, '#94A3B8', 14, 180);
            for (const p of this.players) {
              if (!p.alive) continue;
              const d = Math.hypot(p.x - e.x, p.y - e.y);
              if (d <= 155 + p.radius) {
                p.chillTimer = 1.4;
                this.damagePlayer(p, e.damage * 1.1, 0);
              }
            }
          }
          continue;
        } else if (minDist <= 165 && e.attackCooldown <= 0) {
          e.isWindingUp = true;
          e.windupTimer = 0.52;
          continue;
        }
      }
      // =====================================================================
      // 5. JACK-O'-BOMBER ZOMBIE (bomber): Proximity Lit-Fuse Self-Detonation
      // =====================================================================
      else if (e.type === 'bomber' && isAuthoritative) {
        if (e.isWindingUp) {
          e.windupTimer -= dt * chillScale;
          if (e.windupTimer <= 0) {
            // Self-detonate in a pumpkin shrapnel explosion!
            e.hp = 0;
            this.enemies.splice(i, 1);
            i--;
            this.triggerExplosion(e.x, e.y, 125, 130, 0, true);
            continue;
          }
          continue;
        } else if (minDist <= 72) {
          e.isWindingUp = true;
          e.windupTimer = 0.36;
          this.rings.push({
            x: e.x,
            y: e.y,
            radius: 8,
            maxRadius: 120,
            color: '#F97316',
            life: 0.35,
            maxLife: 0.35
          });
          continue;
        }
      }
      // =====================================================================
      // 6. FRANKEN-VOLT GARGOYLE (tesla_gorilla): Predictive Lead-Shot & Shock-Leap
      // =====================================================================
      else if (e.type === 'tesla_gorilla' && isAuthoritative) {
        if (e.isWindingUp) {
          e.windupTimer -= dt * chillScale;
          if (e.windupTimer <= 0) {
            e.isWindingUp = false;
            e.attackCooldown = 2.7;

            if (e.attackPattern === 1 && minDist < 310) {
              // Pattern 1: Shock-Leap Slam toward hunter
              const leapSpd = e.speed * 3.1;
              e.dashVx = Math.cos(e.angle) * leapSpd;
              e.dashVy = Math.sin(e.angle) * leapSpd;
              e.dashTimer = 0.34;
            } else {
              // Pattern 0: Predictive lead-aimed Tesla Orb
              soundEngine.playTeslaCannon();
              const spd = 295;
              const travelTime = minDist / spd;
              const leadX = targetX + targetVx * travelTime * 0.45;
              const leadY = targetY + targetVy * travelTime * 0.45;
              const leadAngle = Math.atan2(leadY - e.y, leadX - e.x);
              this.projectiles.push({
                id: this.nextEntityId++,
                kind: 'tesla_orb',
                ownerId: 0,
                x: e.x + Math.cos(leadAngle) * 30,
                y: e.y + Math.sin(leadAngle) * 30,
                z: 16,
                vx: Math.cos(leadAngle) * spd,
                vy: Math.sin(leadAngle) * spd,
                vz: 0,
                radius: 12,
                damage: e.damage,
                blastRadius: 130,
                timer: 2.2,
                cluster: false
              });
            }
            e.attackPattern = (e.attackPattern + 1) % 2;
          }
          continue;
        } else if (minDist < 480 && minDist > 85 && e.attackCooldown <= 0) {
          e.isWindingUp = true;
          e.windupTimer = 0.55;
          e.aimX = targetX;
          e.aimY = targetY;
          continue;
        }
      }
      // =====================================================================
      // 7. PUMPKIN ARCH-FIEND ZOMBIE (devil): Shadow-Blink Teleport + 3-Way Hellfire Fan
      // =====================================================================
      else if (e.type === 'devil' && isAuthoritative) {
        // Periodic lateral Shadow-Blink teleport step
        if ((e.abilityCooldown || 0) <= 0 && minDist < 460 && !e.isWindingUp) {
          e.abilityCooldown = 4.0 + Math.random() * 1.5;
          const perpAngle = toTargetAngle + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
          const blinkX = Math.max(55, Math.min(this.arena.width - 55, e.x + Math.cos(perpAngle) * 95));
          const blinkY = Math.max(55, Math.min(this.arena.height - 55, e.y + Math.sin(perpAngle) * 95));
          if (!this.circleIntersectsAnyObstacle(blinkX, blinkY, e.radius + 4)) {
            this.spawnParticleBurst(e.x, e.y, '#A855F7', 10, 130);
            e.x = blinkX;
            e.y = blinkY;
            this.spawnParticleBurst(e.x, e.y, '#F97316', 10, 130);
          }
        }

        if (e.isWindingUp) {
          e.windupTimer -= dt * chillScale;
          if (e.windupTimer <= 0) {
            e.isWindingUp = false;
            e.attackCooldown = 2.6;
            soundEngine.playDevilFireball();
            // Fires a 3-way fan of blazing Hellfire Jack-o'-Lanterns
            const count = e.attackPattern === 1 ? 3 : 1;
            for (let k = -Math.floor(count / 2); k <= Math.floor(count / 2); k++) {
              const ang = e.angle + k * 0.24;
              this.projectiles.push({
                id: this.nextEntityId++,
                kind: 'fireball',
                ownerId: 0,
                x: e.x + Math.cos(ang) * 24,
                y: e.y + Math.sin(ang) * 24,
                z: 14,
                vx: Math.cos(ang) * 295,
                vy: Math.sin(ang) * 295,
                vz: 0,
                radius: 10,
                damage: e.damage,
                blastRadius: 85,
                timer: 2.4,
                cluster: false
              });
            }
            e.attackPattern = (e.attackPattern + 1) % 2;
          }
          continue;
        } else if (minDist < 460 && minDist > 105 && e.attackCooldown <= 0) {
          e.isWindingUp = true;
          e.windupTimer = 0.52;
          continue;
        }
      }
      // =====================================================================
      // 8. BILE-ROT SPITTER ZOMBIE (spitter): Kiting Strafe + Tri-Acid Volley
      // =====================================================================
      else if (e.type === 'spitter' && isAuthoritative) {
        if (minDist < 430 && minDist > 85 && e.attackCooldown <= 0) {
          e.attackCooldown = 2.4;
          const spreadCount = e.attackPattern === 1 ? 3 : 1;
          for (let k = -Math.floor(spreadCount / 2); k <= Math.floor(spreadCount / 2); k++) {
            const ang = e.angle + k * 0.18;
            this.projectiles.push({
              id: this.nextEntityId++,
              kind: 'acid_glob',
              ownerId: 0,
              x: e.x + Math.cos(ang) * 18,
              y: e.y + Math.sin(ang) * 18,
              z: 12,
              vx: Math.cos(ang) * 315,
              vy: Math.sin(ang) * 315,
              vz: 0,
              radius: 7,
              damage: e.damage,
              blastRadius: 68,
              timer: 1.9,
              cluster: false
            });
          }
          e.attackPattern = (e.attackPattern + 1) % 2;
        }
      }
      // =====================================================================
      // 9. DEADEYE SKELETON ZOMBIE (sniper): Laser-Sight Lock-On + Recoil Step
      // =====================================================================
      else if (e.type === 'sniper' && isAuthoritative) {
        if (e.isWindingUp) {
          e.windupTimer -= dt * chillScale;
          e.aimX = targetX;
          e.aimY = targetY;
          if (e.windupTimer <= 0) {
            e.isWindingUp = false;
            e.attackCooldown = 2.9;
            const aimAngle = Math.atan2((e.aimY || targetY) - e.y, (e.aimX || targetX) - e.x);
            this.projectiles.push({
              id: this.nextEntityId++,
              kind: 'sniper_bolt',
              ownerId: 0,
              x: e.x + Math.cos(aimAngle) * 20,
              y: e.y + Math.sin(aimAngle) * 20,
              z: 14,
              vx: Math.cos(aimAngle) * 510,
              vy: Math.sin(aimAngle) * 510,
              vz: 0,
              radius: 6,
              damage: e.damage,
              blastRadius: 45,
              timer: 1.8,
              cluster: false
            });
            // Recoil backstep after firing
            e.dashVx = -Math.cos(aimAngle) * 180;
            e.dashVy = -Math.sin(aimAngle) * 180;
            e.dashTimer = 0.14;
          }
          continue;
        } else if (minDist < 640 && minDist > 130 && e.attackCooldown <= 0) {
          e.isWindingUp = true;
          e.windupTimer = 0.62;
          e.aimX = targetX;
          e.aimY = targetY;
          continue;
        }
      }
      // =====================================================================
      // 10. NECRO-WITCH ZOMBIE (healer_shaman): Blood-Pact Heal & Undead Haste Buff
      // =====================================================================
      else if (e.type === 'healer_shaman' && isAuthoritative) {
        if (e.attackCooldown <= 0) {
          e.attackCooldown = 3.1;
          this.rings.push({
            x: e.x,
            y: e.y,
            radius: 10,
            maxRadius: 185,
            color: '#10B981',
            life: 0.38,
            maxLife: 0.38
          });
          let buffedAny = false;
          for (const allyMob of this.enemies) {
            if (allyMob.id !== e.id && Math.hypot(allyMob.x - e.x, allyMob.y - e.y) <= 185) {
              allyMob.hp = Math.min(allyMob.maxHp, allyMob.hp + 45);
              allyMob.frenzyTimer = 3.8; // Grants +32% speed & attack rate!
              buffedAny = true;
              this.beams.push({
                x1: e.x,
                y1: e.y - 14,
                x2: allyMob.x,
                y2: allyMob.y - 14,
                color: '#34D399',
                width: 2,
                life: 0.18,
                maxLife: 0.18
              });
            }
          }
          // If no allies nearby to buff, fire a Necrotic Hex Bolt at the player
          if (!buffedAny && minDist < 460) {
            this.projectiles.push({
              id: this.nextEntityId++,
              kind: 'acid_glob',
              ownerId: 0,
              x: e.x + Math.cos(e.angle) * 18,
              y: e.y + Math.sin(e.angle) * 18,
              z: 12,
              vx: Math.cos(e.angle) * 290,
              vy: Math.sin(e.angle) * 290,
              vz: 0,
              radius: 7,
              damage: e.damage,
              blastRadius: 65,
              timer: 2.0,
              cluster: false
            });
          }
        }
      }

      // =====================================================================
      // DISTINCT MOVEMENT PATTERNS PER ZOMBIE ARCHETYPE
      // =====================================================================
      let sepX = 0;
      let sepY = 0;
      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        const dx = e.x - other.x;
        const dy = e.y - other.y;
        const dist = Math.hypot(dx, dy);
        const minSep = e.radius + other.radius + 2;
        if (dist > 0 && dist < minSep) {
          const push = (minSep - dist) / minSep;
          sepX += (dx / dist) * push * 90;
          sepY += (dy / dist) * push * 90;
        }
      }

      let moveAngle = toTargetAngle;
      let speedMod = 1.0;

      if (e.type === 'zombie') {
        // Graveyard Shambler: Staggered lurching gait + Blood-Scent Lunge when close
        const lurch = 0.78 + 0.42 * Math.max(0, Math.sin(e.walkCycle * 0.75));
        speedMod = minDist < 145 ? 1.32 : lurch;
      } else if (e.type === 'runner') {
        // Feral Ghoul: Evasive lateral zig-zag weave while closing distance
        const weave = Math.sin(e.walkCycle * 1.35) * 0.58;
        moveAngle = toTargetAngle + weave;
        speedMod = 1.08;
      } else if (e.type === 'bomber') {
        // Jack-o'-Bomber: Accelerating manic fuse sprint as it nears target
        speedMod = minDist < 190 ? 1.48 : 1.05;
        if (minDist < 190 && Math.random() < 0.25) {
          this.spawnParticleBurst(e.x, e.y - 16, '#F97316', 1, 45);
        }
      } else if (e.type === 'spitter') {
        // Bile-Rot Spitter: Skirmisher kiting (retreats if too close, strafes at mid-range)
        if (minDist < 165) {
          moveAngle = toTargetAngle + Math.PI;
          speedMod = 0.92;
        } else if (minDist < 310) {
          moveAngle = toTargetAngle + (e.strafeDir || 1) * (Math.PI * 0.46);
          speedMod = 0.85;
        }
      } else if (e.type === 'sniper') {
        // Deadeye Skeleton: Keeps sniper distance (backs up if < 230px, orbits at 230-460px)
        if (minDist < 230) {
          moveAngle = toTargetAngle + Math.PI;
          speedMod = 0.9;
        } else if (minDist < 460) {
          moveAngle = toTargetAngle + (e.strafeDir || 1) * (Math.PI * 0.5);
          speedMod = 0.72;
        }
      } else if (e.type === 'healer_shaman') {
        // Necro-Witch: Orbits behind the horde and kites away from close hunters
        if (minDist < 210) {
          moveAngle = toTargetAngle + Math.PI;
          speedMod = 0.95;
        } else if (minDist < 360) {
          moveAngle = toTargetAngle + (e.strafeDir || 1) * (Math.PI * 0.48);
          speedMod = 0.82;
        }
      } else if (e.type === 'tesla_gorilla' || e.type === 'devil') {
        // Flankers: Slight diagonal stalk angle when mid-range
        if (minDist > 150 && minDist < 340) {
          moveAngle = toTargetAngle + Math.sin(e.walkCycle * 0.5) * 0.35;
        }
      }

      const curSpeed = e.speed * speedMod * chillScale * frenzyMult;
      e.vx = Math.cos(moveAngle) * curSpeed + sepX;
      e.vy = Math.sin(moveAngle) * curSpeed + sepY;
      e.walkCycle += dt * (e.type === 'runner' ? 14 : 8) * speedMod * chillScale * frenzyMult;

      for (let oIdx = this.dynamicObstacles.length - 1; oIdx >= 0; oIdx--) {
        const obs = this.dynamicObstacles[oIdx];
        if (obs.destructible && obs.hp !== undefined && this.circleIntersectsRect(e.x, e.y, e.radius + 6, obs)) {
          const smashMult = e.type === 'crusher_tank' || e.type === 'shield_brute' ? 3.2 : 1.6;
          obs.hp -= e.damage * smashMult * dt;
          if (obs.hp <= 0) {
            this.dynamicObstacles.splice(oIdx, 1);
          }
        }
      }

      this.moveCircleWithCollision(e, e.vx * dt, e.vy * dt, false);

      if (localTarget && minDist <= e.radius + targetRadius + 4 && e.attackCooldown <= 0) {
        e.attackCooldown = 0.78;
        this.damagePlayer(localTarget, e.damage, 0);
        // Graveyard Shambler infectious bite briefly slows the hunter
        if (e.type === 'zombie') {
          localTarget.chillTimer = Math.max(localTarget.chillTimer, 0.55);
        }
      }
    }
  }

  private updatePickups(dt: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.life -= dt;
      pk.pulse += dt * 5;
      if (pk.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }

      // Magnetic pull toward nearest alive hunter within 165px
      let nearestPlayer: PlayerEntity | null = null;
      let minDist = 165;
      for (const p of this.players) {
        if (!p.alive) continue;
        const d = Math.hypot(p.x - pk.x, p.y - pk.y);
        if (d < minDist) {
          minDist = d;
          nearestPlayer = p;
        }
      }
      if (nearestPlayer && minDist > 12) {
        const pullSpeed = 240 + (1 - minDist / 165) * 280;
        pk.x += ((nearestPlayer.x - pk.x) / minDist) * pullSpeed * dt;
        pk.y += ((nearestPlayer.y - pk.y) / minDist) * pullSpeed * dt;
      }

      for (const p of this.players) {
        if (!p.alive) continue;
        if (Math.hypot(p.x - pk.x, p.y - pk.y) <= p.radius + 20) {
          soundEngine.playPickup(pk.kind === 'gold_pouch');
          if (pk.kind === 'xp') {
            const xpVal = pk.value || 22;
            this.awardInMatchXp(p, xpVal);
            if (!p.isBot) {
              progressionManager.addAccountXp(Math.max(4, Math.round(xpVal * 0.35)));
            }
            this.addFloatingText(p.x, p.y - 26, `+${xpVal} XP`, undefined, '#38BDF8', 0.85);
          } else if (pk.kind === 'gold_pouch') {
            const goldVal = pk.value || 45;
            if (!p.isBot) {
              this.awardCurrencies(goldVal, 0, 0);
            }
            this.addFloatingText(p.x, p.y - 30, `+${goldVal} GOLD POUCH!`, undefined, '#FACC15', 1.05);
          } else {
            const goldVal = pk.value || 12;
            if (!p.isBot) {
              this.awardCurrencies(goldVal, 0, 0);
            }
            this.addFloatingText(p.x, p.y - 26, `+${goldVal} GOLD`, undefined, '#FBBF24', 0.85);
          }
          this.pickups.splice(i, 1);
          this.emitHUD();
          break;
        }
      }
    }
  }

  private updateSkillZones(dt: number) {
    for (let i = this.skillZones.length - 1; i >= 0; i--) {
      const sz = this.skillZones[i];
      sz.life -= dt;
      sz.tickTimer -= dt;
      const owner = this.players.find((p) => p.id === sz.ownerId);

      if (sz.kind === 'meteor_strike') {
        if (sz.life <= 0) {
          if (!sz.triggered) {
            sz.triggered = true;
            soundEngine.playExplosion(1.35);
            this.addCameraShake(11);
            this.rings.push({
              x: sz.x,
              y: sz.y,
              radius: 18,
              maxRadius: sz.radius,
              color: '#F97316',
              life: 0.42,
              maxLife: 0.42
            });
            this.rings.push({
              x: sz.x,
              y: sz.y,
              radius: 10,
              maxRadius: sz.radius * 0.72,
              color: '#A855F7',
              life: 0.35,
              maxLife: 0.35
            });
            this.spawnParticleBurst(sz.x, sz.y, '#F97316', 24, 210);
            for (let k = this.enemies.length - 1; k >= 0; k--) {
              const e = this.enemies[k];
              const d = Math.hypot(e.x - sz.x, e.y - sz.y);
              if (d <= sz.radius + e.radius) {
                e.burnTimer = Math.max(e.burnTimer, 3.5);
                const nx = (e.x - sz.x) / (d || 1);
                const ny = (e.y - sz.y) / (d || 1);
                this.damageEnemy(e, sz.damage, owner, nx * 280, ny * 280, false);
              }
            }
          }
          this.skillZones.splice(i, 1);
        }
        continue;
      }

      if (sz.kind === 'pumpkin_snare') {
        let tripped = sz.life <= 0;
        if (!tripped) {
          for (const e of this.enemies) {
            if (Math.hypot(e.x - sz.x, e.y - sz.y) <= sz.radius * 0.85 + e.radius) {
              tripped = true;
              break;
            }
          }
        }
        if (tripped) {
          soundEngine.playExplosion(0.95);
          const blastR = sz.radius * 1.45;
          this.rings.push({
            x: sz.x,
            y: sz.y,
            radius: 12,
            maxRadius: blastR,
            color: '#F97316',
            life: 0.32,
            maxLife: 0.32
          });
          this.spawnParticleBurst(sz.x, sz.y, '#F97316', 16, 160);
          for (let k = this.enemies.length - 1; k >= 0; k--) {
            const e = this.enemies[k];
            if (Math.hypot(e.x - sz.x, e.y - sz.y) <= blastR + e.radius) {
              e.chillTimer = Math.max(e.chillTimer, 3.2);
              e.burnTimer = Math.max(e.burnTimer, 2.5);
              this.damageEnemy(e, sz.damage, owner, 0, 0, false);
            }
          }
          this.skillZones.splice(i, 1);
        }
        continue;
      }

      if (sz.tickTimer <= 0) {
        sz.tickTimer = 0.5;
        if (sz.kind === 'acid_pool') {
          for (let k = this.enemies.length - 1; k >= 0; k--) {
            const e = this.enemies[k];
            if (Math.hypot(e.x - sz.x, e.y - sz.y) <= sz.radius + e.radius) {
              e.chillTimer = Math.max(e.chillTimer, 1.5);
              this.damageEnemy(e, sz.damage, owner, 0, 0, false);
            }
          }
          for (const ally of this.players) {
            if (ally.alive && ally.hp < ally.maxHp && Math.hypot(ally.x - sz.x, ally.y - sz.y) <= sz.radius) {
              ally.hp = Math.min(ally.maxHp, ally.hp + 9);
            }
          }
        } else if (sz.kind === 'sanctuary_totem') {
          this.rings.push({
            x: sz.x,
            y: sz.y,
            radius: 14,
            maxRadius: sz.radius,
            color: '#10B981',
            life: 0.28,
            maxLife: 0.28
          });
          for (const ally of this.players) {
            if (ally.alive && Math.hypot(ally.x - sz.x, ally.y - sz.y) <= sz.radius) {
              ally.hp = Math.min(ally.maxHp, ally.hp + 24);
              ally.maxShieldHp = Math.max(ally.maxShieldHp, Math.round(ally.maxHp * 0.25));
              ally.shieldHp = Math.min(ally.maxShieldHp, ally.shieldHp + 14);
            }
          }
          for (let k = this.enemies.length - 1; k >= 0; k--) {
            const e = this.enemies[k];
            if (Math.hypot(e.x - sz.x, e.y - sz.y) <= sz.radius + e.radius) {
              this.damageEnemy(e, sz.damage * 0.45, owner, 0, 0, false);
            }
          }
        } else if (sz.kind === 'seismic_crater' || sz.kind === 'frost_prison') {
          for (let k = this.enemies.length - 1; k >= 0; k--) {
            const e = this.enemies[k];
            if (Math.hypot(e.x - sz.x, e.y - sz.y) <= sz.radius + e.radius) {
              e.chillTimer = Math.max(e.chillTimer, sz.kind === 'frost_prison' ? 2.2 : 1.4);
              this.damageEnemy(e, sz.damage, owner, 0, 0, false);
            }
          }
        }
      }

      if (sz.life <= 0) {
        this.skillZones.splice(i, 1);
      }
    }
  }

  private updateParticlesAndVisuals(dt: number) {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vz -= 360 * dt;
      pt.z += pt.vz * dt;
      if (pt.z <= 0) {
        pt.z = 0;
        pt.vx *= 0.65;
        pt.vy *= 0.65;
      }
    }

    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      this.slashArcs[i].life -= dt;
      if (this.slashArcs[i].life <= 0) {
        this.slashArcs.splice(i, 1);
      }
    }

    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) this.beams.splice(i, 1);
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      r.radius = r.maxRadius * (1 - r.life / r.maxLife);
      if (r.life <= 0) this.rings.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= 28 * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.tacticalPings.length - 1; i >= 0; i--) {
      const tp = this.tacticalPings[i];
      tp.life -= dt;
      if (tp.life <= 0) this.tacticalPings.splice(i, 1);
    }
  }

  private moveCircleWithCollision(
    entity: { x: number; y: number; radius: number },
    dx: number,
    dy: number,
    clampInsideDoorways: boolean
  ) {
    const r = entity.radius;
    const minWall = clampInsideDoorways ? 30 + r : 8 + r;

    entity.x += dx;
    if (entity.x < minWall) entity.x = minWall;
    if (entity.x > this.arena.width - minWall) entity.x = this.arena.width - minWall;

    for (const obs of this.dynamicObstacles) {
      if (obs.kind === 'lava') continue;
      if (this.circleIntersectsRect(entity.x, entity.y, r, obs)) {
        if (dx > 0) entity.x = obs.x - r;
        else if (dx < 0) entity.x = obs.x + obs.w + r;
      }
    }

    entity.y += dy;
    if (entity.y < minWall) entity.y = minWall;
    if (entity.y > this.arena.height - minWall) entity.y = this.arena.height - minWall;

    for (const obs of this.dynamicObstacles) {
      if (obs.kind === 'lava') continue;
      if (this.circleIntersectsRect(entity.x, entity.y, r, obs)) {
        if (dy > 0) entity.y = obs.y - r;
        else if (dy < 0) entity.y = obs.y + obs.h + r;
      }
    }
  }

  private circleIntersectsRect(cx: number, cy: number, cr: number, rect: ObstacleRect): boolean {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  }

  private circleIntersectsAnyObstacle(cx: number, cy: number, cr: number): boolean {
    for (const obs of this.dynamicObstacles) {
      if (this.circleIntersectsRect(cx, cy, cr, obs)) return true;
    }
    return false;
  }

  private spawnParticleBurst(
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number,
    leaveDecal: boolean = false
  ) {
    const density = progressionManager.settings.particleDensity;
    const mult = density === 'low' ? 0.35 : density === 'medium' ? 0.68 : 1.0;
    const targetCount = Math.max(1, Math.round(count * mult));

    let spawned = 0;
    for (const pt of this.particles) {
      if (!pt.active) {
        const ang = Math.random() * Math.PI * 2;
        const spd = (0.3 + Math.random() * 0.7) * speed;
        pt.active = true;
        pt.x = x;
        pt.y = y;
        pt.z = 4 + Math.random() * 8;
        pt.vx = Math.cos(ang) * spd;
        pt.vy = Math.sin(ang) * spd;
        pt.vz = 60 + Math.random() * 90;
        pt.size = 3 + Math.random() * 4;
        pt.color = color;
        pt.life = 0.25 + Math.random() * 0.35;
        pt.maxLife = pt.life;
        pt.leaveDecal = leaveDecal;
        spawned++;
        if (spawned >= targetCount) break;
      }
    }
  }

  private drawBloodSplatter(x: number, y: number, radius: number) {
    if (!progressionManager.settings.bloodDecals) return;
    this.decalCtx.save();
    this.decalCtx.imageSmoothingEnabled = false;
    for (let i = 0; i < 7; i++) {
      const ox = Math.round(((Math.random() - 0.5) * radius * 1.5) / 4) * 4;
      const oy = Math.round(((Math.random() - 0.5) * radius * 1.5) / 4) * 4;
      const s = Math.max(4, Math.round(((0.25 + Math.random() * 0.55) * radius) / 4) * 4);
      this.decalCtx.fillStyle = i % 3 === 0 ? 'rgba(22, 101, 52, 0.55)' : 'rgba(153, 27, 27, 0.55)';
      this.decalCtx.fillRect(Math.round(x + ox - s / 2), Math.round(y + oy - s / 2), s, s);
    }
    this.decalCtx.restore();
  }

  private drawBrassCasing(x: number, y: number, angle: number) {
    if (!progressionManager.settings.bloodDecals) return;
    this.decalCtx.save();
    const sideAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    const dist = 10 + Math.random() * 14;
    const cx = Math.round((x + Math.cos(sideAngle) * dist) / 2) * 2;
    const cy = Math.round((y + Math.sin(sideAngle) * dist) / 2) * 2;
    this.decalCtx.fillStyle = 'rgba(245, 158, 11, 0.72)';
    this.decalCtx.fillRect(cx, cy, 4, 2);
    this.decalCtx.restore();
  }

  private addFloatingText(
    x: number,
    y: number,
    text: string,
    subtext: string | undefined,
    color: string,
    scale: number = 1
  ) {
    if (!progressionManager.settings.floatingDamageNumbers) return;
    this.floatingTexts.push({
      x,
      y,
      text,
      subtext,
      color,
      life: 1.0,
      maxLife: 1.0,
      scale
    });
  }

  private addCameraShake(amount: number) {
    this.shakeMagnitude = Math.min(18, Math.max(this.shakeMagnitude, amount));
  }

  // ==========================================================================
  // 16-BIT HALLOWEEN PIXEL-ART RENDERING
  // ==========================================================================
  private render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    const W = this.arena.width;
    const H = this.arena.height;

    ctx.clearRect(0, 0, this.viewW, this.viewH);
    ctx.save();
    ctx.translate(Math.round(-this.cameraX + this.shakeX), Math.round(-this.cameraY + this.shakeY));

    const floorPattern = getArenaPixelPattern(ctx, this.arenaId);
    ctx.fillStyle = floorPattern || this.arena.floorColor;
    ctx.fillRect(this.cameraX - 32, this.cameraY - 32, this.viewW + 64, this.viewH + 64);

    ctx.strokeStyle = this.arena.gridLineColor;
    ctx.lineWidth = 2;
    const tileSize = 64;
    const startTileX = Math.floor(this.cameraX / tileSize) * tileSize;
    const endTileX = Math.min(W, this.cameraX + this.viewW + tileSize);
    const startTileY = Math.floor(this.cameraY / tileSize) * tileSize;
    const endTileY = Math.min(H, this.cameraY + this.viewH + tileSize);

    ctx.beginPath();
    for (let x = startTileX; x <= endTileX; x += tileSize) {
      ctx.moveTo(x, startTileY);
      ctx.lineTo(x, endTileY);
    }
    for (let y = startTileY; y <= endTileY; y += tileSize) {
      ctx.moveTo(startTileX, y);
      ctx.lineTo(endTileX, y);
    }
    ctx.stroke();

    if (progressionManager.settings.bloodDecals) {
      const sx = Math.max(0, Math.floor(this.cameraX));
      const sy = Math.max(0, Math.floor(this.cameraY));
      const sw = Math.min(W - sx, this.viewW);
      const sh = Math.min(H - sy, this.viewH);
      if (sw > 0 && sh > 0) {
        ctx.drawImage(this.decalCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
      }
    }

    for (const obs of this.dynamicObstacles) {
      if (obs.kind === 'lava') {
        this.drawLavaHazard(ctx, obs);
      }
    }

    for (const sz of this.skillZones) {
      this.drawSkillGroundZone(ctx, sz);
    }

    for (const pk of this.pickups) {
      this.drawPickupCrate(ctx, pk);
    }

    for (const pl of this.placeables) {
      this.drawPlaceable(ctx, pl);
    }

    const renderables: { y: number; draw: () => void }[] = [];

    for (const obs of this.dynamicObstacles) {
      if (obs.kind !== 'lava') {
        if (
          obs.x + obs.w >= this.cameraX - 80 &&
          obs.x <= this.cameraX + this.viewW + 80 &&
          obs.y + obs.h >= this.cameraY - 80 &&
          obs.y <= this.cameraY + this.viewH + 80
        ) {
          renderables.push({
            y: obs.y + obs.h,
            draw: () => this.drawBlockyObstacle(ctx, obs)
          });
        }
      }
    }

    for (const p of this.players) {
      if (p.alive) {
        renderables.push({
          y: p.y,
          draw: () => this.drawBoxheadPlayer(ctx, p)
        });
      }
    }

    for (const ally of this.remoteAllies.values()) {
      if (ally.alive) {
        renderables.push({
          y: ally.y,
          draw: () => this.drawRemoteAllyPlayer(ctx, ally)
        });
      }
    }

    for (const e of this.enemies) {
      if (
        e.x >= this.cameraX - 120 &&
        e.x <= this.cameraX + this.viewW + 120 &&
        e.y >= this.cameraY - 120 &&
        e.y <= this.cameraY + this.viewH + 120
      ) {
        renderables.push({
          y: e.y,
          draw: () => this.drawBoxheadEnemy(ctx, e)
        });
      }
    }

    renderables.sort((a, b) => a.y - b.y);
    for (const item of renderables) {
      item.draw();
    }

    for (const sa of this.slashArcs) {
      this.drawSlashArcEffect(ctx, sa);
    }

    for (const b of this.beams) {
      const alpha = Math.max(0, b.life / b.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = Math.max(2, Math.round(b.width));
      ctx.lineCap = 'square';
      ctx.beginPath();
      if (b.isLightning) {
        const midX = Math.round((b.x1 + b.x2) / 2 + (Math.random() - 0.5) * 24);
        const midY = Math.round((b.y1 + b.y2) / 2 + (Math.random() - 0.5) * 24);
        ctx.moveTo(Math.round(b.x1), Math.round(b.y1));
        ctx.lineTo(midX, midY);
        ctx.lineTo(Math.round(b.x2), Math.round(b.y2));
      } else {
        ctx.moveTo(Math.round(b.x1), Math.round(b.y1));
        ctx.lineTo(Math.round(b.x2), Math.round(b.y2));
      }
      ctx.stroke();
      ctx.restore();
    }

    for (const pr of this.projectiles) {
      this.drawProjectile(ctx, pr);
    }

    for (const r of this.rings) {
      const alpha = Math.max(0, r.life / r.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 4;
      const rad = Math.round(r.radius / 2) * 2;
      ctx.strokeRect(Math.round(r.x - rad), Math.round(r.y - rad * 0.75), rad * 2, rad * 1.5);
      ctx.restore();
    }

    for (const pt of this.particles) {
      if (!pt.active) continue;
      const alpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = alpha;
      const ps = Math.max(3, Math.round(pt.size / 2) * 2);
      ctx.fillRect(Math.round(pt.x - ps / 2), Math.round(pt.y - pt.z - ps / 2), ps, ps);
    }
    ctx.globalAlpha = 1;

    this.drawPerimeterWalls(ctx, W, H);
    this.drawTacticalPings(ctx);

    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${Math.round(14 * ft.scale)}px 'Oswald', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#09070F';
      ctx.fillText(ft.text, Math.round(ft.x + 2), Math.round(ft.y + 2));
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));

      if (ft.subtext) {
        ctx.font = `600 9px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText(ft.subtext, Math.round(ft.x), Math.round(ft.y + 12));
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private drawSkillGroundZone(ctx: CanvasRenderingContext2D, sz: SkillGroundZone) {
    const alpha = Math.min(1, (sz.life / sz.maxLife) * 1.4);
    ctx.save();
    ctx.translate(Math.round(sz.x), Math.round(sz.y));

    if (sz.kind === 'acid_pool') {
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = '#065F46';
      ctx.beginPath();
      ctx.ellipse(0, 0, sz.radius, sz.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Bubbling toxic skulls / bubbles
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI * 2 * i) / 6 + this.elapsedSeconds * 1.6;
        const bx = Math.round(Math.cos(ang) * (sz.radius * 0.55));
        const by = Math.round(Math.sin(ang) * (sz.radius * 0.38));
        ctx.fillStyle = '#6EE7B7';
        ctx.fillRect(bx - 4, by - 4, 8, 8);
      }
    } else if (sz.kind === 'sanctuary_totem') {
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = '#064E3B';
      ctx.beginPath();
      ctx.ellipse(0, 0, sz.radius, sz.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 3;
      ctx.stroke();
      // 16-bit Caduceus Sanctuary Totem pillar in center
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-10, -28, 20, 32);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(-8, -26, 16, 28);
      ctx.fillStyle = '#ECFDF5';
      ctx.fillRect(-2, -22, 4, 16);
      ctx.fillRect(-6, -16, 12, 4);
    } else if (sz.kind === 'seismic_crater') {
      ctx.globalAlpha = alpha * 0.38;
      ctx.fillStyle = '#0C4A6E';
      ctx.beginPath();
      ctx.ellipse(0, 0, sz.radius, sz.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.stroke();
      // Jagged tombstone fissures
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI * 2 * i) / 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * sz.radius * 0.85, Math.sin(ang) * sz.radius * 0.6);
        ctx.stroke();
      }
    } else if (sz.kind === 'pumpkin_snare') {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(-sz.radius * 0.6, -sz.radius * 0.45, sz.radius * 1.2, sz.radius * 0.9);
      // Glowing Jack-o'-lantern jaw trap in center
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-5, -4, 4, 4);
      ctx.fillRect(1, -4, 4, 4);
      ctx.fillRect(-5, 3, 10, 3);
    } else if (sz.kind === 'meteor_strike') {
      const progress = 1 - Math.max(0, sz.life / sz.maxLife);
      ctx.globalAlpha = 0.35 + progress * 0.5;
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, sz.radius, sz.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, sz.radius * progress, sz.radius * 0.72 * progress, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Descending giant flaming Jack-o'-Meteor from the sky!
      const dropY = -Math.round((1 - progress) * 260);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-20, dropY - 20, 40, 40);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(-17, dropY - 17, 34, 34);
      ctx.fillStyle = '#A855F7';
      ctx.fillRect(-12, dropY - 28, 24, 12);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-10, dropY - 8, 7, 7);
      ctx.fillRect(3, dropY - 8, 7, 7);
      ctx.fillRect(-10, dropY + 4, 20, 6);
    } else if (sz.kind === 'frost_prison') {
      ctx.globalAlpha = alpha * 0.32;
      ctx.fillStyle = '#1E3A8A';
      ctx.beginPath();
      ctx.ellipse(0, 0, sz.radius, sz.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSlashArcEffect(ctx: CanvasRenderingContext2D, sa: SlashArcEffect) {
    const alpha = Math.max(0, sa.life / sa.maxLife);
    ctx.save();
    ctx.translate(Math.round(sa.x), Math.round(sa.y));
    ctx.globalAlpha = alpha;

    if (sa.kind === 'afterimage') {
      drawPixelOperatorSprite(ctx, sa.ownerClass || 'vanguard', sa.color, true, 0);
      ctx.restore();
      return;
    }

    if (sa.kind === 'guillotine_slam') {
      // X-shaped Crimson Guillotine Cross-Slash
      ctx.strokeStyle = sa.color;
      ctx.lineWidth = 8;
      const r = sa.radius * 0.85;
      ctx.beginPath();
      ctx.moveTo(-r, -r * 0.7);
      ctx.lineTo(r, r * 0.7);
      ctx.moveTo(r, -r * 0.7);
      ctx.lineTo(-r, r * 0.7);
      ctx.stroke();
      ctx.strokeStyle = sa.coreColor || sa.secondaryColor || '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      return;
    }

    const startAng = sa.angle - sa.arcSpan / 2;
    const endAng = sa.angle + sa.arcSpan / 2;

    // Outer glowing crescent arc
    ctx.strokeStyle = sa.color;
    ctx.lineWidth = sa.kind === 'maul_cone' ? 14 : 10;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.arc(0, 0, sa.radius, startAng, endAng);
    ctx.stroke();

    // Inner bright core blade arc
    ctx.strokeStyle = sa.coreColor || sa.secondaryColor || '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, sa.radius - 5, startAng + 0.08, endAng - 0.08);
    ctx.stroke();

    ctx.restore();
  }

  private drawTacticalPings(ctx: CanvasRenderingContext2D) {
    for (const ping of this.tacticalPings) {
      const alpha = Math.min(1, (ping.life / ping.maxLife) * 1.5);
      const color =
        ping.kind === 'ENEMY' ? '#EF4444' : ping.kind === 'SUPPLY' ? '#10B981' : ping.senderColor;
      const pulse = (this.elapsedSeconds * 2.2) % 1;
      const ringRadius = Math.round(14 + pulse * 40);

      ctx.save();
      ctx.translate(Math.round(ping.x), Math.round(ping.y));
      ctx.globalAlpha = alpha * (1 - pulse);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(-ringRadius, -ringRadius, ringRadius * 2, ringRadius * 2);

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -10, 20, 20);
      ctx.restore();
    }
  }

  private drawLavaHazard(ctx: CanvasRenderingContext2D, obs: ObstacleRect) {
    const stepFrame = Math.floor(this.elapsedSeconds * 4) % 2;
    const x = Math.round(obs.x);
    const y = Math.round(obs.y);
    const w = Math.round(obs.w);
    const h = Math.round(obs.h);

    ctx.save();
    // Dark charred crypt trench rim
    ctx.fillStyle = '#09070F';
    ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    ctx.fillStyle = '#450A0A';
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);

    // Hellfire & Ectoplasm bubbling pixel trench
    ctx.fillStyle = stepFrame === 0 ? '#991B1B' : '#B91C1C';
    ctx.fillRect(x, y, w, h);

    // Stepped inner magma pools
    ctx.fillStyle = stepFrame === 0 ? '#EA580C' : '#F97316';
    ctx.fillRect(x + 8, y + 8, w - 16, h - 16);

    ctx.fillStyle = stepFrame === 0 ? '#FACC15' : '#FB923C';
    for (let bx = x + 16; bx < x + w - 20; bx += 36) {
      for (let by = y + 16; by < y + h - 20; by += 32) {
        const offset = ((bx + by + stepFrame * 8) % 12) - 4;
        ctx.fillRect(bx + offset, by, 8, 8);
      }
    }
    ctx.restore();
  }

  private drawBlockyObstacle(ctx: CanvasRenderingContext2D, obs: ObstacleRect) {
    drawPixelHalloweenObstacle(ctx, obs, this.arenaId, this.elapsedSeconds);
  }

  private drawPickupCrate(ctx: CanvasRenderingContext2D, pk: PickupCrate) {
    const bounce = Math.round(Math.sin(pk.pulse) * 3);
    ctx.save();
    ctx.translate(Math.round(pk.x), Math.round(pk.y + bounce));

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-10, 2, 20, 8);

    if (pk.kind === 'xp') {
      // Glowing Cyan/Violet Soul XP Crystal Orb
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-8, -10, 16, 16);
      ctx.fillStyle = '#0284C7';
      ctx.fillRect(-6, -8, 12, 12);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-4, -6, 8, 8);
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(-2, -4, 4, 4);
    } else if (pk.kind === 'gold_pouch') {
      // Boss & Elite Overflowing Treasure Gold Pouch
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-11, -13, 22, 20);
      ctx.fillStyle = '#92400E';
      ctx.fillRect(-9, -9, 18, 14);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-7, -11, 14, 14);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-5, -7, 10, 8);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-2, -5, 4, 4);
    } else {
      // Gleaming 16-bit Gold Coin
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-8, -10, 16, 16);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(-6, -8, 12, 12);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-4, -6, 8, 8);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-1, -4, 2, 4);
    }
    ctx.restore();
  }

  private drawPlaceable(ctx: CanvasRenderingContext2D, pl: PlaceableEntity) {
    ctx.save();
    ctx.translate(Math.round(pl.x), Math.round(pl.y));

    if (pl.type === 'barrel') {
      // Bubbling Witch Cauldron / Volatile Pumpkin Keg
      const flashing = pl.chainTimer > 0;
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-15, -18, 30, 26);
      ctx.fillStyle = flashing ? '#FACC15' : '#1E1B2E';
      ctx.fillRect(-13, -16, 26, 22);
      // Bubbling green/orange cauldron top
      ctx.fillStyle = flashing ? '#EF4444' : '#84CC16';
      ctx.fillRect(-11, -14, 22, 6);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(-7, -5, 14, 4);
    } else if (pl.type === 'sentry_turret') {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-15, -15, 30, 30);
      ctx.fillStyle = '#1E1B2E';
      ctx.fillRect(-13, -13, 26, 26);
      ctx.fillStyle = '#A855F7';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.rotate(pl.turretAngle || 0);
      ctx.fillStyle = '#09070F';
      ctx.fillRect(0, -5, 20, 10);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(2, -3, 16, 6);
    } else {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-11, -8, 22, 16);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-9, -6, 18, 12);
      const blink = Math.floor(this.elapsedSeconds * 8) % 2 === 0;
      ctx.fillStyle = blink ? '#EF4444' : '#F97316';
      ctx.fillRect(-3, -3, 6, 6);
    }
    ctx.restore();
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, pr: ProjectileEntity) {
    ctx.save();
    const drawY = Math.round(pr.y - pr.z);
    ctx.translate(Math.round(pr.x), drawY);

    if (pr.kind === 'silver_stake') {
      ctx.rotate(Math.atan2(pr.vy, pr.vx));
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-12, -4, 24, 8);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-10, -2, 20, 4);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(4, -3, 7, 6);
    } else if (pr.kind === 'alchemist_syringe') {
      ctx.rotate(Math.atan2(pr.vy, pr.vx));
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-10, -5, 20, 10);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(-6, -3, 12, 6);
      ctx.fillStyle = '#ECFDF5';
      ctx.fillRect(6, -1, 5, 2);
    } else if (pr.kind === 'eldritch_skull') {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = '#A855F7';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#F3E8FF';
      ctx.fillRect(-4, -5, 8, 8);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-3, -3, 2, 2);
      ctx.fillRect(1, -3, 2, 2);
    } else if (pr.kind === 'cauldron_flask') {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#A7F3D0';
      ctx.fillRect(-4, -4, 8, 6);
    } else if (pr.kind === 'grenade' || pr.kind === 'cluster_bomblet' || pr.kind === 'fireball') {
      // Mini Pixel Jack-o'-Lantern / Hellfire Pumpkin Bomb
      const s = pr.kind === 'cluster_bomblet' ? 8 : 12;
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-s / 2 - 2, -s / 2 - 2, s + 4, s + 4);
      ctx.fillStyle = pr.kind === 'fireball' ? '#EF4444' : '#F97316';
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
    } else if (pr.kind === 'rocket') {
      ctx.rotate(Math.atan2(pr.vy, pr.vx));
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-11, -6, 22, 12);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-9, -4, 18, 8);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(5, -4, 6, 8);
    } else if (pr.kind === 'frost_shard') {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#60A5FA';
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(-2, -2, 4, 4);
    } else if (pr.kind === 'tesla_orb') {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = '#CFFAFE';
      ctx.fillRect(-3, -3, 6, 6);
    } else if (pr.kind === 'acid_glob') {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#84CC16';
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = '#ECFCCB';
      ctx.fillRect(-2, -2, 4, 4);
    } else {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(-4, -4, 8, 8);
    }
    ctx.restore();
  }

  private drawBoxheadPlayer(ctx: CanvasRenderingContext2D, p: PlayerEntity) {
    const opClass = OPERATOR_CLASSES[p.operatorClass];
    const heroStats = progressionManager.computeHeroCombatStats(p.operatorClass);

    // Draw League of Legends ground move waypoint marker or target reticle in world space
    if (!p.isBot && p.id === 1) {
      if (p.moveTarget) {
        ctx.save();
        ctx.translate(Math.round(p.moveTarget.x), Math.round(p.moveTarget.y));
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -7, 20, 14);
        ctx.fillStyle = '#34D399';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
      }
      if (p.attackTargetId !== null) {
        const targetEnemy = this.enemies.find((e) => e.id === p.attackTargetId && e.hp > 0);
        if (targetEnemy) {
          ctx.save();
          ctx.translate(Math.round(targetEnemy.x), Math.round(targetEnemy.y));
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(-18, -12, 36, 24);
          ctx.restore();
        }
      }
    }

    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));

    // Distinct Class Foot-Aura on the battlefield
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(-16, -2, 32, 12);
    ctx.strokeStyle = opClass.color;
    ctx.lineWidth = 2;

    if (p.operatorClass === 'reaper') {
      // Crypt Reaper: Rotating crimson blood-mist ring + floating soul wisps
      ctx.strokeRect(-18, -4, 36, 14);
      for (let i = 0; i < 3; i++) {
        const ang = this.elapsedSeconds * 3.5 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(Math.round(Math.cos(ang) * 20) - 2, Math.round(Math.sin(ang) * 8) - 2, 5, 5);
      }
    } else if (p.operatorClass === 'marksman') {
      // Witch Hunter: Golden-amber crosshair reticle under boots
      ctx.strokeRect(-16, -3, 32, 12);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(-22, 2, 6, 2);
      ctx.fillRect(16, 2, 6, 2);
    } else if (p.operatorClass === 'vanguard') {
      // Grave Warden: Heavy hexagonal cobalt fortress bastion aura
      ctx.strokeRect(-20, -5, 40, 16);
      ctx.strokeStyle = '#BAE6FD';
      ctx.strokeRect(-15, -2, 30, 10);
    } else if (p.operatorClass === 'medic') {
      // Plague Alchemist: Pulsing emerald healing cross aura
      ctx.strokeRect(-17, -4, 34, 14);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = '#10B981';
      ctx.strokeRect(-88, -66, 176, 132);
      ctx.restore();
    } else {
      // Necro-Warlock: Rotating violet pentagram / arcane sigil + orbiting soul orbs
      ctx.strokeRect(-18, -4, 36, 14);
      const stacks = p.primaryAttackCount % 4;
      for (let i = 0; i < 3; i++) {
        const ang = -this.elapsedSeconds * 3.2 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = i < stacks ? '#F472B6' : '#A855F7';
        ctx.fillRect(Math.round(Math.cos(ang) * 22) - 3, Math.round(Math.sin(ang) * 10) - 12, 6, 6);
      }
    }

    // Active Skill Visual Overlays on Heroes
    if (p.operatorClass === 'reaper' && p.abilityActiveTimers[1] > 0) {
      // [W] Whirlwind Harvest: Dual spinning crimson scythe blades orbiting Reaper
      for (let b = 0; b < 2; b++) {
        const bladeAng = this.elapsedSeconds * 14 + b * Math.PI;
        const bx = Math.round(Math.cos(bladeAng) * 52);
        const by = Math.round(Math.sin(bladeAng) * 38);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(bx - 8, by - 4, 16, 8);
        ctx.fillStyle = '#FCA5A5';
        ctx.fillRect(bx - 5, by - 2, 10, 4);
      }
    } else if (p.operatorClass === 'marksman' && (p.abilityActiveTimers[2] > 0 || p.skillActiveTimer > 0)) {
      // [E] Blood-Moon Overdrive: Glowing crimson-gold hunter halo
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(-22, -38, 44, 44);
    } else if (p.operatorClass === 'vanguard' && p.abilityActiveTimers[2] > 0) {
      // [E] Iron Crypt Bastion: 4 Orbiting Gargoyle Stone Shields
      for (let s = 0; s < 4; s++) {
        const shAng = this.elapsedSeconds * 4.2 + (s * Math.PI) / 2;
        const sx = Math.round(Math.cos(shAng) * 38);
        const sy = Math.round(Math.sin(shAng) * 26) - 8;
        ctx.fillStyle = '#09070F';
        ctx.fillRect(sx - 6, sy - 8, 12, 16);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(sx - 4, sy - 6, 8, 12);
      }
    }

    // Cursed Item: Jack-o'-Lantern Lantern Immolation Aura ring
    if (heroStats.hasImmolationAura) {
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(-72, -56, 144, 112);
      ctx.restore();
    }

    const bob = Math.round(Math.sin(p.walkCycle) * 2);
    const isFlashing = p.hitFlashTimer > 0 || (p.invulnTimer > 0 && Math.floor(this.elapsedSeconds * 14) % 2 === 0);

    ctx.save();
    ctx.translate(0, bob);
    if (p.spectralPhaseTimer > 0) {
      ctx.globalAlpha = 0.65;
    }
    drawPixelOperatorSprite(ctx, p.operatorClass, p.headbandColor || opClass.color, isFlashing, p.walkCycle);
    ctx.restore();

    // Draw Hero's Fixed Signature Weapon
    const swingOffset =
      p.meleeSwingTimer > 0 ? Math.sin((p.meleeSwingTimer / 0.24) * Math.PI) * 1.15 * p.meleeSwingDir : 0;
    ctx.save();
    ctx.translate(0, -10 + bob);
    ctx.rotate(p.angle + swingOffset);
    drawPixelWeaponInHand(ctx, opClass.signatureWeaponVisualId, opClass.color);
    ctx.restore();

    // 16-bit Pixel Health bar
    const hpPct = Math.max(0, p.hp / Math.max(1, p.maxHp));
    ctx.fillStyle = '#09070F';
    ctx.fillRect(-16, -42, 32, 6);
    ctx.fillStyle = hpPct > 0.5 ? '#10B981' : hpPct > 0.25 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(-14, -40, Math.round(28 * hpPct), 3);

    // 16-bit Shield bar above HP bar if Shield active
    if (p.shieldHp > 0 && p.maxShieldHp > 0) {
      const shPct = Math.max(0, Math.min(1, p.shieldHp / p.maxShieldHp));
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-16, -49, 32, 5);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-14, -48, Math.round(28 * shPct), 3);
    }

    ctx.restore();
  }

  private drawRemoteAllyPlayer(ctx: CanvasRenderingContext2D, ally: RemoteAllyEntity) {
    ctx.save();
    ctx.translate(Math.round(ally.x), Math.round(ally.y));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(-14, -2, 28, 10);
    ctx.strokeStyle = ally.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-14, -2, 28, 10);

    const bob = Math.round(Math.sin(ally.walkCycle) * 2);
    ctx.save();
    ctx.translate(0, bob);
    drawPixelOperatorSprite(ctx, ally.operatorClass || 'marksman', ally.color, false, ally.walkCycle);
    ctx.restore();

    const allyClass = OPERATOR_CLASSES[ally.operatorClass || 'marksman'] || OPERATOR_CLASSES.marksman;
    ctx.save();
    ctx.translate(0, -10 + bob);
    ctx.rotate(ally.angle);
    drawPixelWeaponInHand(ctx, allyClass.signatureWeaponVisualId, allyClass.color);
    ctx.restore();

    const hpPct = Math.max(0, ally.hp / Math.max(1, ally.maxHp));
    ctx.fillStyle = '#09070F';
    ctx.fillRect(-16, -42, 32, 6);
    ctx.fillStyle = hpPct > 0.5 ? '#10B981' : '#EF4444';
    ctx.fillRect(-14, -40, Math.round(28 * hpPct), 3);

    ctx.font = `700 10px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = ally.color;
    ctx.fillText(ally.name, 0, -46);

    ctx.restore();
  }

  private drawBoxheadEnemy(ctx: CanvasRenderingContext2D, e: EnemyEntity) {
    ctx.save();
    ctx.translate(Math.round(e.x), Math.round(e.y));

    const isBoss = !!e.isBoss;
    const isMegaBoss = !!e.isMegaBoss;
    const isGorilla = e.type === 'tesla_gorilla';
    const isCrusher = e.type === 'crusher_tank';
    const isDevil = e.type === 'devil';
    const isBrute = e.type === 'shield_brute';

    const scale = isMegaBoss
      ? 1.95
      : isBoss
      ? 1.65
      : isCrusher
      ? 1.35
      : isGorilla
      ? 1.3
      : isDevil
      ? 1.2
      : isBrute
      ? 1.15
      : 1.0;
    ctx.scale(scale, scale);

    // Pixel shadow under zombie
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(-14, -2, 28, 10);

    if (isMegaBoss) {
      // Cataclysmic 5-Wave Mega Raid Boss: Dual counter-rotating ritual magic circles!
      ctx.save();
      ctx.strokeStyle = (e.bossPhase || 1) >= 3 ? '#EF4444' : '#F59E0B';
      ctx.lineWidth = 2;
      ctx.strokeRect(-24, -8, 48, 20);
      ctx.strokeStyle = '#A855F7';
      ctx.strokeRect(-20, -5, 40, 14);
      ctx.restore();
    } else if (isBoss || progressionManager.settings.highContrastOutlines) {
      const elemColor = isBoss
        ? e.bossElement === 'lightning'
          ? '#22D3EE'
          : e.bossElement === 'frost'
          ? '#60A5FA'
          : e.bossElement === 'venom'
          ? '#84CC16'
          : '#F97316'
        : '#F97316';
      ctx.strokeStyle = elemColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -4, 32, 12);
    }

    // Necro-Witch Frenzy Haste Aura indicator
    if (e.frenzyTimer && e.frenzyTimer > 0) {
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -3, 30, 10);
    }

    // Windup telegraph indicators for bosses, snipers, chargers & bombers
    if (e.isWindingUp) {
      ctx.strokeStyle = e.type === 'sniper' ? '#EF4444' : e.type === 'bomber' ? '#F97316' : '#FACC15';
      ctx.lineWidth = 2;
      ctx.strokeRect(-18, -36, 36, 40);

      // Deadeye Skeleton Sniper / Charger directional laser-line telegraph
      if ((e.type === 'sniper' || e.type === 'runner' || e.type === 'shield_brute') && e.aimX !== undefined && e.aimY !== undefined) {
        ctx.save();
        ctx.scale(1 / scale, 1 / scale);
        ctx.strokeStyle = e.type === 'sniper' ? 'rgba(239, 68, 68, 0.75)' : 'rgba(251, 146, 60, 0.65)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(e.aimX - e.x, e.aimY - e.y - 14);
        ctx.stroke();
        ctx.restore();
      }
    }

    const wobble = Math.round(Math.sin(e.walkCycle) * 2);
    const flash = e.hitFlashTimer > 0;
    const chilled = e.chillTimer > 0;
    const burning = e.burnTimer > 0;

    ctx.save();
    ctx.translate(0, wobble);
    drawPixelZombieSprite(ctx, e.type, isBoss, e.bossElement, e.walkCycle, flash, chilled, burning, isMegaBoss);
    // Translucent Ice Block encasing enemies frozen by Frost Tomb / Cryo effects
    if (e.chillTimer > 1.8) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.fillRect(-14, -32, 28, 34);
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-14, -32, 28, 34);
    }
    ctx.restore();

    if (e.hp < e.maxHp || isBoss) {
      const pct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-15, -42, 30, 5);
      ctx.fillStyle = isMegaBoss ? '#EF4444' : isBoss ? '#F97316' : '#4ADE80';
      ctx.fillRect(-14, -41, Math.round(28 * pct), 3);
    }

    ctx.restore();
  }

  private drawPerimeterWalls(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const t = 32;
    ctx.save();
    ctx.fillStyle = this.arena.wallTopColor;
    ctx.strokeStyle = '#09070F';
    ctx.lineWidth = 4;

    ctx.fillRect(0, 0, W, t);
    ctx.fillRect(0, H - t, W, t);
    ctx.fillRect(0, 0, t, H);
    ctx.fillRect(W - t, 0, t, H);

    // 16-bit wrought-iron fence posts along perimeter
    ctx.fillStyle = this.arena.wallSideColor;
    for (let x = 0; x < W; x += 32) {
      ctx.fillRect(x, 0, 8, t);
      ctx.fillRect(x, H - t, 8, t);
    }
    for (let y = 0; y < H; y += 32) {
      ctx.fillRect(0, y, t, 8);
      ctx.fillRect(W - t, y, t, 8);
    }

    for (const sp of this.arena.spawners) {
      ctx.fillStyle = this.arena.floorColor;
      if (sp.dirY !== 0) {
        const gy = sp.dirY > 0 ? 0 : H - t;
        ctx.fillRect(sp.x - 54, gy, 108, t);
        // Haunted Crypt Gate Pillars with Jack-o'-Lantern torches
        ctx.fillStyle = '#F97316';
        ctx.fillRect(sp.x - 58, gy + 6, 8, 8);
        ctx.fillRect(sp.x + 50, gy + 6, 8, 8);
      } else {
        const gx = sp.dirX > 0 ? 0 : W - t;
        ctx.fillRect(gx, sp.y - 54, t, 108);
        ctx.fillStyle = '#F97316';
        ctx.fillRect(gx + 6, sp.y - 58, 8, 8);
        ctx.fillRect(gx + 6, sp.y + 50, 8, 8);
      }
    }
    ctx.restore();
  }

  private buildPlayerHUD(p: PlayerEntity): PlayerHUDData {
    const opClass = OPERATOR_CLASSES[p.operatorClass];
    const heroStats = progressionManager.computeHeroCombatStats(p.operatorClass);
    const abilityLevels = progressionManager.profile.heroAbilityLevels[p.operatorClass] || [1, 1, 1, 1];

    const abilities: [
      PlayerAbilityHUDSlot,
      PlayerAbilityHUDSlot,
      PlayerAbilityHUDSlot,
      PlayerAbilityHUDSlot
    ] = [0, 1, 2, 3].map((idx) => {
      const def = opClass.abilities[idx];
      const lv = abilityLevels[idx] || 1;
      const cdScale = Math.max(0.55, (1 - (lv - 1) * 0.08) * (1 - heroStats.cooldownReduction));
      const maxCd = def.isPassive ? 0 : Number((def.baseCooldown * cdScale).toFixed(1));
      const cdRem = Number((p.abilityCooldowns[idx] || 0).toFixed(1));
      return {
        slot: def.slot,
        id: def.id,
        name: def.name,
        shortName: def.shortName || def.name.split(' ')[0].toUpperCase(),
        type: def.type,
        kind: def.type,
        isPassive: !!def.isPassive,
        cooldown: cdRem,
        cooldownRemaining: cdRem,
        maxCooldown: maxCd,
        activeTimer: Number((p.abilityActiveTimers[idx] || 0).toFixed(1)),
        level: lv,
        maxLevel: 5,
        color: def.color,
        iconKind: def.iconKind,
        description: def.description,
        scalingText: def.scalingText
      };
    }) as [PlayerAbilityHUDSlot, PlayerAbilityHUDSlot, PlayerAbilityHUDSlot, PlayerAbilityHUDSlot];

    const equippedItems: PlayerEquippedItemHUD[] = [];
    for (const itemId of progressionManager.profile.equippedItems) {
      const def = MOBA_ITEM_BY_ID[itemId];
      const st = progressionManager.profile.items[itemId];
      if (!def) continue;
      equippedItems.push({
        id: def.id,
        name: def.name,
        shortName: def.shortName,
        category: def.category,
        level: st?.upgradeLevel || st?.level || 1,
        color: def.color,
        iconKind: def.iconKind,
        statSummary: def.statSummary,
        effectName: def.effectName,
        passiveName: def.passiveName,
        passiveDesc: def.passiveDesc,
        passiveSummary: def.passiveDesc
      });
    }

    const baseAttackPeriod = Math.max(0.11, 1 / Math.max(0.5, heroStats.attackSpeed));
    const primaryCooldownProgress =
      p.fireCooldown <= 0 ? 1 : Math.max(0, Math.min(1, 1 - p.fireCooldown / baseAttackPeriod));

    return {
      id: p.id,
      name: p.name,
      operatorClass: p.operatorClass,
      className: opClass.name,
      roleTitle: opClass.roleTitle,
      archetypeLabel: opClass.archetypeLabel,
      archetype: opClass.archetype,
      classColor: opClass.color,
      primaryWeaponName: opClass.primaryWeaponName,
      signatureWeaponName: opClass.signatureWeaponName,
      signatureWeaponDesc: opClass.signatureWeaponDesc,
      primaryAttackName: opClass.primaryWeaponName,
      primaryAttackColor: opClass.color,
      primaryCooldownProgress,
      primaryAttackDamage: heroStats.attackDamage,
      primaryAttackRate: heroStats.attackSpeed,
      alive: p.alive,
      hp: Math.ceil(p.hp),
      maxHp: p.maxHp,
      shieldHp: Math.ceil(p.shieldHp),
      maxShieldHp: p.maxShieldHp,
      score: p.score,
      kills: p.kills,
      deaths: p.deaths,
      frags: p.frags,
      inMatchLevel: p.inMatchLevel,
      inMatchXp: p.inMatchXp,
      inMatchXpToNext: p.inMatchXpToNext,
      attackDamage: heroStats.attackDamage,
      abilityPower: heroStats.abilityPower,
      attackSpeed: heroStats.attackSpeed,
      attacksPerSecond: heroStats.attackSpeed,
      armor: Math.round(heroStats.armorReduction * 100),
      armorPct: Math.round(heroStats.armorReduction * 100),
      moveSpeed: Math.round(heroStats.moveSpeedMultiplier * 100),
      lifestealPct: heroStats.lifestealPct,
      critChancePct: heroStats.critChancePct,
      cooldownHastePct: Math.round(heroStats.cooldownHaste * 100),
      attackDamageBonusPct: Math.round((heroStats.attackDamageMult - 1) * 100),
      abilityPowerBonusPct: Math.round((heroStats.abilityPowerMult - 1) * 100),
      attackSpeedBonusPct: Math.round((heroStats.attackSpeedMult - 1) * 100),
      pcControlScheme: progressionManager.profile.pcControlScheme || 'lol_mouse',
      abilities,
      equippedItems,
      skillName: opClass.skillName,
      skillCooldown: Number((p.abilityCooldowns[2] || p.skillCooldown).toFixed(1)),
      skillMaxCooldown: p.abilityMaxCooldowns[2] || p.skillMaxCooldown,
      skillActiveTimer: Number(p.skillActiveTimer.toFixed(1)),
      activeWeaponIndex: p.activeWeaponIndex,
      weapons: p.weapons.map((w, idx) => {
        const def = WEAPON_DEFINITIONS[idx];
        return {
          id: w.id,
          keyNumber: def.keyNumber,
          name: def.name,
          shortName: def.shortName,
          weaponClass: def.weaponClass,
          unlocked: w.unlocked,
          magAmmo: w.magAmmo,
          magSize: w.magSize,
          reserveAmmo: w.reserveAmmo,
          maxReserveAmmo: w.maxReserveAmmo,
          isReloading: w.isReloading,
          reloadProgress: 1,
          upgradeLevel: w.upgradeLevel,
          hasClassAffinity: w.hasClassAffinity,
          color: def.color
        };
      }),
      activeTurrets: this.placeables.filter((pl) => pl.type === 'sentry_turret' && pl.ownerId === p.id).length
    };
  }

  public selectWeaponByIndex(playerId: 1 | 2, weaponIndex: number) {
    const p = this.players.find((pl) => pl.id === playerId);
    if (!p || !p.weapons[weaponIndex]?.unlocked) return;
    p.activeWeaponIndex = weaponIndex;
    soundEngine.playUIClick();
    this.emitHUD();
  }

  private emitHUD() {
    const p1 = this.players[0];
    if (!p1) return;
    const p2 = this.players[1] || null;
    const activeBossEntity = this.enemies.find((e) => e.isBoss);
    const bossCfg = activeBossEntity?.bossElement
      ? ELEMENTAL_BOSS_CONFIGS.find((c) => c.element === activeBossEntity.bossElement) || ELEMENTAL_BOSS_CONFIGS[0]
      : null;

    const bossData: BossHUDData | null = activeBossEntity
      ? {
          name: activeBossEntity.bossName || bossCfg?.name || 'ELEMENTAL TITAN',
          title: activeBossEntity.bossTitle || bossCfg?.title || 'BOSS WAVE',
          element: activeBossEntity.bossElement || 'fire',
          elementLabel: bossCfg?.elementLabel || 'FIRE ELEMENT',
          elementColor: activeBossEntity.isMegaBoss ? '#EF4444' : bossCfg?.color || '#F97316',
          weaknessText: activeBossEntity.bossWeaknessText || bossCfg?.weaknessText || '',
          resistanceText: activeBossEntity.bossResistanceText || bossCfg?.resistanceText || '',
          scaledPlayers: activeBossEntity.bossScaledPlayers || 1,
          hp: Math.max(0, Math.ceil(activeBossEntity.hp)),
          maxHp: activeBossEntity.maxHp,
          phase: activeBossEntity.bossPhase || (activeBossEntity.hp < activeBossEntity.maxHp * 0.5 ? 2 : 1),
          isMegaBoss: !!activeBossEntity.isMegaBoss
        }
      : null;

    const remoteAlliesList: RemoteAllyHUD[] = Array.from(this.remoteAllies.values()).map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color,
      operatorClass: a.operatorClass,
      hp: Math.ceil(a.hp),
      maxHp: a.maxHp,
      alive: a.alive,
      weaponId: a.weaponId,
      score: a.score,
      kills: a.kills
    }));

    const minimapPlayers = [
      ...this.players.map((p) => ({
        id: String(p.id),
        x: p.x,
        y: p.y,
        alive: p.alive,
        color: p.id === 1 ? '#38BDF8' : '#F59E0B'
      })),
      ...Array.from(this.remoteAllies.values()).map((a) => ({
        id: a.id,
        x: a.x,
        y: a.y,
        alive: a.alive,
        color: a.color
      }))
    ];

    const isClientOnline = this.mode === 'online_coop' && !multiplayerClient.isHost();
    const authoritativeRemaining = isClientOnline
      ? Math.max(this.enemies.length, this.clientEnemiesRemaining)
      : this.enemies.length + this.enemiesToSpawnInWave;

    const { goldCost, gemCost } = this.getReviveCosts();
    const reviveOffer: ReviveOfferData | null =
      this.screen === 'REVIVE_PROMPT'
        ? {
            secondsRemaining: Math.ceil(this.reviveCountdown),
            goldCost,
            gemCost,
            reviveCount: this.reviveCount,
            canAffordGold: progressionManager.profile.currencies.gold >= goldCost,
            canAffordGems: progressionManager.profile.currencies.gems >= gemCost
          }
        : null;

    const nextBossWave = this.wave % 5 === 0 ? this.wave : this.wave + (5 - (this.wave % 5));

    const snapshot: HUDStateSnapshot = {
      screen: this.screen,
      mode: this.mode,
      arenaId: this.arenaId,
      isPortrait: this.isPortrait,
      pcControlScheme: progressionManager.profile.pcControlScheme || 'lol_mouse',
      wave: this.wave,
      isBossWave: this.isBossWave || !!activeBossEntity,
      nextBossWave,
      enemiesRemaining: authoritativeRemaining,
      combo: this.combo,
      maxCombo: this.maxCombo,
      comboProgress: Math.max(0, Math.min(1, this.comboDecayTimer)),
      overdriveBonusPct: Math.min(45, Math.floor(this.combo / 10) * 5),
      p1: this.buildPlayerHUD(p1),
      p2: p2 && (this.mode === 'coop' || this.mode === 'deathmatch') ? this.buildPlayerHUD(p2) : null,
      remoteAllies: remoteAlliesList,
      boss: bossData,
      activePerks: [...this.activePerks],
      draftChoices: [...this.draftChoices],
      rerollsLeft: this.rerollsLeft,
      minimap: {
        worldWidth: this.arena.width,
        worldHeight: this.arena.height,
        cameraX: this.cameraX,
        cameraY: this.cameraY,
        cameraW: this.viewW,
        cameraH: this.viewH,
        players: minimapPlayers,
        enemies: this.enemies.map((e) => ({
          x: e.x,
          y: e.y,
          isBoss: !!e.isBoss,
          isDevil: e.type === 'devil',
          element: e.bossElement
        })),
        pickups: this.pickups.map((pk) => ({ x: pk.x, y: pk.y })),
        pings: this.tacticalPings.map((tp) => ({ ...tp }))
      },
      currencies: { ...progressionManager.profile.currencies },
      sessionEarned: { ...this.sessionEarned },
      accountRank: progressionManager.profile.accountRank,
      accountXp: progressionManager.profile.accountXp,
      accountXpToNext: progressionManager.profile.accountXpToNext,
      reviveOffer,
      winnerText: this.winnerText,
      recentBanner:
        this.recentBanner && performance.now() - this.recentBanner.timestamp < 2800
          ? this.recentBanner
          : null,
      elapsedSeconds: Math.floor(this.elapsedSeconds)
    };

    this.onHUDUpdate(snapshot);
  }

  private saveHighScores() {
    try {
      const key = `boxhead_hs_${this.mode}_${this.arenaId}`;
      const raw = localStorage.getItem(key);
      const prev = raw ? JSON.parse(raw) : { highScore: 0, maxCombo: 0, maxWave: 0 };
      const combinedScore = this.players.reduce((sum, p) => sum + p.score, 0);
      const updated = {
        highScore: Math.max(prev.highScore || 0, combinedScore),
        maxCombo: Math.max(prev.maxCombo || 0, this.maxCombo),
        maxWave: Math.max(prev.maxWave || 0, this.wave)
      };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
  }

  public static getHighScore(mode: GameMode, arenaId: ArenaId) {
    try {
      const key = `boxhead_hs_${mode}_${arenaId}`;
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as { highScore: number; maxCombo: number; maxWave: number };
    } catch {
      // Ignore
    }
    return { highScore: 0, maxCombo: 0, maxWave: 1 };
  }
}
