import { ArenaId, BossElement, EnemyType, ObstacleRect, OperatorClassId, WeaponId } from '../types/game';

const spriteCache = new Map<string, HTMLCanvasElement>();
const patternCache = new Map<string, CanvasPattern | null>();

/**
 * Renders a 16-bit ASCII pixel matrix onto an offscreen canvas with crisp integer pixels
 * and caches the resulting sprite for 60fps arcade rendering.
 */
export function getPixelMatrixSprite(
  cacheKey: string,
  rows: string[],
  palette: Record<string, string>,
  pixelScale: number = 2
): HTMLCanvasElement {
  const fullKey = `${cacheKey}_${pixelScale}`;
  const cached = spriteCache.get(fullKey);
  if (cached) return cached;

  const h = rows.length;
  const w = rows[0]?.length || 16;
  const canvas = document.createElement('canvas');
  canvas.width = w * pixelScale;
  canvas.height = h * pixelScale;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelScale, y * pixelScale, pixelScale, pixelScale);
      }
    }
  }
  spriteCache.set(fullKey, canvas);
  return canvas;
}

// ============================================================================
// 16-BIT HALLOWEEN ZOMBIE PIXEL MATRICES (16x16 & 20x20)
// ============================================================================

// 1. Graveyard Shambler Zombie (16x16)
const ZOMBIE_SHAMBLER_F0 = [
  '....KKKKKKKK....',
  '...KGGGGGGGGK...',
  '..KGGDDDDDDGGK..',
  '..KGGBGGGGWRGK..',
  '..KGGGGGGGGGGK..',
  '..KGGKKKKKKGGK..',
  '...KGGGGGGGGK...',
  '..KKKKTTTTKKKK..',
  '.KGGGGTTTTGGGGK.',
  '.KGGKKTRRTKKGGK.',
  '..KK.KTRRTK.KK..',
  '.....KTTTTK.....',
  '....KKPPPPKK....',
  '....KPK..KPK....',
  '....KK....KK....',
  '................'
];

const ZOMBIE_SHAMBLER_F1 = [
  '....KKKKKKKK....',
  '...KGGGGGGGGK...',
  '..KGGDDDDDDGGK..',
  '..KGGBGGGGWRGK..',
  '..KGGGGGGGGGGK..',
  '..KGGKKKKKKGGK..',
  '...KGGGGGGGGK...',
  '.KKKKKTTTTKKKKK.',
  'KGGGGGTTTTGGGGGK',
  '.KK..KTRRTK..KK.',
  '.....KTRRTK.....',
  '.....KTTTTK.....',
  '....KKPPPPKK....',
  '...KPK....KPK...',
  '...KK......KK...',
  '................'
];

// 2. Feral Ghoul Sprinter Zombie (16x16)
const ZOMBIE_GHOUL_F0 = [
  '...KKKKKKKKKK...',
  '..KGGGGGGGGGGK..',
  '.KGGKKKKKKKKGGK.',
  '.KGKRRRRKKKKRRK.',
  '.KGGGGGGGGGGGGK.',
  '..KGGKKKKKKGGK..',
  '...KGGGGGGGGK...',
  '.KKKKRRRRRRKKKK.',
  'KGGGGRRRRRRGGGGK',
  'KRRK.KRRRRK.KRRK',
  '.KK..KRRRRK..KK.',
  '....KKDDDDKK....',
  '...KDK....KDK...',
  '..KK........KK..',
  '................',
  '................'
];

// 3. Bile-Rot Spitter Zombie (16x16)
const ZOMBIE_SPITTER_F0 = [
  '....KKKKKKKK....',
  '...KGGGGGGGGK...',
  '..KGGLGLLGLGGK..',
  '..KGKLLLLLLKGK..',
  '..KGGLLLLLLGGK..',
  '..KGGGLLLLGGGK..',
  '...KGGLLLLGGK...',
  '..KKKKLLLLKKKK..',
  '.KGGGGLLLLGGGGK.',
  '.KLLKKLLLLKKLLK.',
  '..KK.KLLLLK.KK..',
  '....KKTTTTKK....',
  '....KTK..KTK....',
  '....KK....KK....',
  '................',
  '................'
];

// 4. Deadeye Skeleton Zombie Sniper (16x16)
const ZOMBIE_SNIPER_F0 = [
  '....KKKKKKKK....',
  '...KPPPPPPPPK...',
  '..KPPKKKKKKPPK..',
  '..KPKWWWWWWKPK..',
  '..KPKWKWWRWKPK..',
  '..KPKWWKKWWKPK..',
  '...KKWWWWWWKK...',
  '..KKKKPPPPKKKK..',
  '.KWWWWPPPPWWWWK.',
  '.KKKKKPPPPKKKKK.',
  '.....KPPPPK.....',
  '....KKWWWWKK....',
  '....KWK..KWK....',
  '....KK....KK....',
  '................',
  '................'
];

// 5. Tombstone Riot Shield Zombie (18x18)
const ZOMBIE_SHIELD_F0 = [
  '....KKKKKKKKKK....',
  '...KGGGGGGGGGGK...',
  '..KGGDDDDDDDDGGK..',
  '..KGGRRGGGGRRGGK..',
  '..KGGGGKKKKGGGGK..',
  '...KGGGGGGGGGGK...',
  '.KKKKKKKKKKKKKKKK.',
  'KSSSSSSSSSSSSSSSSK',
  'KSDDDDDDDDDDDDDDSK',
  'KSDKKKDKDKDDKDDDSK',
  'KSDKSKDKDKDDKDDDSK',
  'KSDDDDDDDDDDDDDDSK',
  'KSSSSSSSSSSSSSSSSK',
  '.KKKKKKKKKKKKKKKK.',
  '....KKBBBBBBKK....',
  '....KBK....KBK....',
  '....KK......KK....',
  '..................'
];

// 6. Jack-o'-Bomber Zombie (16x16)
const ZOMBIE_BOMBER_F0 = [
  '......KKKK......',
  '.....KLLLLK.....',
  '..KKKKKKKKKKKK..',
  '.KOOOOOOOOOOOOK.',
  'KOOKYYOOOOYYKOOK',
  'KOOKYYOOOOYYKOOK',
  'KOOOOOOOOOOOOOOK',
  'KOOKYKYKKYKYKOOK',
  '.KOOYYYYYYYYOOK.',
  '..KKKKKKKKKKKK..',
  '..KKKKRRRRKKKK..',
  '.KGGGGRRRRGGGGK.',
  '..KK.KRRRRK.KK..',
  '....KKDDDDKK....',
  '....KDK..KDK....',
  '....KK....KK....'
];

// 7. Necro-Witch Healer Zombie (16x16)
const ZOMBIE_WITCH_F0 = [
  '......KKKK......',
  '....KKPPPPKK....',
  '..KKPPPPPPPPKK..',
  '.KKKKKKKKKKKKKK.',
  '..KGGGGGGGGGGK..',
  '..KGGEEGGGGEEGK.',
  '..KGGGGKKKKGGGK.',
  '...KGGGGGGGGK...',
  '..KKKKPPPPKKKK..',
  '.KEEEEPPPPEEEEK.',
  '.KGGKKPPPPKKGGK.',
  '.....KPPPPK.....',
  '....KKPPPPKK....',
  '....KPK..KPK....',
  '....KK....KK....',
  '................'
];

// 8. Franken-Crusher Zombie Tank (20x20)
const ZOMBIE_CRUSHER_F0 = [
  '....KKKKKKKKKKKK....',
  '...KDDDDDDDDDDDDK...',
  '..KGGGGGGGGGGGGGGK..',
  '..KGKKKKKKKKKKKKGK..',
  '.KKGGGGGGGGGGGGGGGKK.',
  'KSSKGGRRGGGGGRRGGKSSK',
  'KSSKGGGGGGGGGGGGGKSSK',
  '.KKKGGGGKKKKKKGGGK.K.',
  '...KGGGGGGGGGGGGGK...',
  '.KKKKKKKKKKKKKKKKKK..',
  'KGGGGGGGGGGGGGGGGGGK.',
  'KGGKKKKKKKKKKKKKKGGK.',
  'KGGKTTTTTTTTTTTTKGGK.',
  'KGGKTTTTSSSSSTTTKGGK.',
  '.KK.KTTTTTTTTTTK.KK..',
  '....KTTTTTTTTTTK.....',
  '....KKDDDDDDDDKK.....',
  '....KDDK....KDDK.....',
  '....KKK......KKK.....',
  '.....................'
];

// 9. Franken-Volt Gargoyle / Gorilla Zombie (20x20)
const ZOMBIE_TESLA_F0 = [
  '..KKKK........KKKK..',
  '.KCCCCK.KKKK.KCCCCK.',
  '.KCCKCKKGGGGKKCKCCK.',
  '..KK.KGGGGGGGGK.KK..',
  '....KGGCCGGCCGGK....',
  '....KGGGGGGGGGGK....',
  '....KGGKKKKKKGGK....',
  '..KKKKGGGGGGGGKKKK..',
  '.KGGGGCCCCCCCCGGGGK.',
  'KGGGGKCCCCCCCCKGGGGK',
  'KGGGGKTTTTTTTTKGGGGK',
  'KGGK.KTTTTTTTTK.KGGK',
  '.KK..KTTTTTTTTK..KK.',
  '....KKDDDDDDDDKK....',
  '...KDDK......KDDK...',
  '...KKK........KKK...',
  '....................',
  '....................',
  '....................',
  '....................'
];

// 10. Pumpkin Arch-Fiend Zombie (18x18)
const ZOMBIE_DEVIL_F0 = [
  '..KK..........KK..',
  '.KRRK..KKKK..KRRK.',
  '.KRKKKKKKKKKKKKRK.',
  '..KOOOOOOOOOOOOK..',
  '.KOOKYYOOOOYYKOOK.',
  '.KOOKYYOOOOYYKOOK.',
  '.KOOOOOOOOOOOOOOK.',
  '.KOOKYKYKKYKYKOOK.',
  '..KOOYYYYYYYYOOK..',
  '...KKKKKKKKKKKK...',
  '.KKKKKRRRRRRKKKKK.',
  'KRRRRRDDDDDDRRRRRK',
  'KRRK.KDDDDDDK.KRRK',
  '.KK..KDDDDDDK..KK.',
  '....KKRRRRRRKK....',
  '....KRK....KRK....',
  '....KK......KK....',
  '..................'
];

// 11. Elemental Zombie Overlord Boss (22x22)
const ZOMBIE_BOSS_MATRIX = [
  '..KK....KKKKKK....KK..',
  '.KAAK..KAAAAAAK..KAAK.',
  '.KAAKKKKKKKKKKKKKKAAK.',
  '..KGGGGGGGGGGGGGGGGK..',
  '.KGGKKKKKKKKKKKKKKGGK.',
  '.KGGKAAAGGKKGGAAAGGGK.',
  '.KGGKAAAGGKKGGAAAGGGK.',
  '.KGGGGGGGGGGGGGGGGGGK.',
  '.KGGKAAAKKKKKKAAAGGGK.',
  '..KGGAAAAAAAAAAAAAGGK.',
  '...KKKKKKKKKKKKKKKK...',
  '.KKKKKDDDDDDDDDDKKKKK.',
  'KGGGGGDAAAAAAAADGGGGGK',
  'KGGGGGDAAAAAAAADGGGGGK',
  'KGGK.KDDDDDDDDDDK.KGGK',
  'KAAK.KDDDDDDDDDDK.KAAK',
  '.KK..KDDDDDDDDDDK..KK.',
  '....KKDDDDDDDDDDKK....',
  '...KDDK........KDDK...',
  '...KAAK........KAAK...',
  '...KKK..........KKK...',
  '......................'
];

// ============================================================================
// DISTINCT 20x20 2-FRAME OPERATOR CLASS SILHOUETTES
// ============================================================================

// 1. CRYPT REAPER (Melee): Pointed Executioner Hood, Skull Mask, Tattered Crimson Cloak & Floating Soul Wisps
const OPERATOR_REAPER_F0 = [
  '........KKKK........',
  '......KKDDDDKK......',
  '.....KDDDDDDDDK.....',
  '....KDDKKKKKKDDK....',
  '....KDKWWWWWWKDK....',
  '...KDDKWRKKRWKDDK...',
  '...KDDKWWWWWWKDDK...',
  'A...KDDKKKKKKDDK...A',
  '....KKKKKKKKKKKK....',
  '..KKCCCCCCCCCCCCKK..',
  '.KDDDDCCCCCCCCDDDDK.',
  '.KDDKKCCCCCCCCKKDDK.',
  'KDDK.KDDDDDDDDK.KDDK',
  '.KK..KDDDDDDDDK..KK.',
  '....KDDDDDDDDDDK....',
  '...KDDDDK..KDDDDK...',
  '..KDDK.KK..KK.KDDK..',
  '..KKK..........KKK..',
  '....................',
  '....................'
];

const OPERATOR_REAPER_F1 = [
  '........KKKK........',
  '......KKDDDDKK......',
  '.....KDDDDDDDDK.....',
  '....KDDKKKKKKDDK....',
  '....KDKWWWWWWKDK....',
  '...KDDKWRKKRWKDDK...',
  '...KDDKWWWWWWKDDK...',
  '...AKDDKKKKKKDDKA...',
  '....KKKKKKKKKKKK....',
  '..KKCCCCCCCCCCCCKK..',
  '.KDDDDCCCCCCCCDDDDK.',
  'KDDDKKCCCCCCCCKKDDDK',
  '.KK..KDDDDDDDDK..KK.',
  '....KDDDDDDDDDDK....',
  '...KDDDDDDDDDDDDK...',
  '..KDDK..KKKK..KDDK..',
  '..KK...KK..KK...KK..',
  '....................',
  '....................',
  '....................'
];

// 2. WITCH HUNTER (Ranged): Wide-Brimmed Van Helsing Hat, Golden Monocle, Duster Coat & Silver Stake Bandolier
const OPERATOR_HUNTER_F0 = [
  '......KKKKKKKK......',
  '.....KHHHHHHHHK.....',
  '....KHHHHHHHHHHK....',
  '....KHHGGGGGGHHK....',
  '.KKKKKKKKKKKKKKKKKK.',
  'KHHHHHHHHHHHHHHHHHHK',
  '.KKKKKKKKKKKKKKKKKK.',
  '....KSSKKKKKKSSK....',
  '....KSKSSKKGYKSK....',
  '.....KSSSSSSSSK.....',
  '...KKKKDDDDDDKKKK...',
  '..KDDDDSSDDDDDDDDK..',
  '.KDDDDDSSDDDDDDDDDK.',
  '.KSSK.KDDDDSSK.KSSK.',
  '..KK..KDDDDDDK..KK..',
  '.....KDDDDDDDDK.....',
  '....KDDDK..KDDDK....',
  '....KBBK....KBBK....',
  '....KKK......KKK....',
  '....................'
];

const OPERATOR_HUNTER_F1 = [
  '......KKKKKKKK......',
  '.....KHHHHHHHHK.....',
  '....KHHHHHHHHHHK....',
  '....KHHGGGGGGHHK....',
  '.KKKKKKKKKKKKKKKKKK.',
  'KHHHHHHHHHHHHHHHHHHK',
  '.KKKKKKKKKKKKKKKKKK.',
  '....KSSKKKKKKSSK....',
  '....KSKSSKKGYKSK....',
  '.....KSSSSSSSSK.....',
  '...KKKKDDDDDDKKKK...',
  '..KDDDDSSDDDDDDDDK..',
  '.KDDDDDSSDDDDDDDDDK.',
  '.KSSK.KDDDDSSK.KSSK.',
  '..KK..KDDDDDDK..KK..',
  '....KKDDDDDDDDKK....',
  '...KDDK......KDDK...',
  '...KBBK......KBBK...',
  '...KKK........KKK...',
  '....................'
];

// 3. GRAVE WARDEN (Tank): Hulking Gargoyle Stoneplate Juggernaut, Horned Pauldrons & Glowing Amber Visor
const OPERATOR_WARDEN_F0 = [
  '.KK....KKKKKK....KK.',
  'KSSK..KDDDDDDK..KSSK',
  'KSSKKKDDDDDDDDKKKSSK',
  '.KKKDDDDDDDDDDDDKKK.',
  '...KDDKKKKKKKKDDK...',
  '...KDKYYYYYYYYKDK...',
  '...KDDKKKKKKKKDDK...',
  '.KKKKKKKKKKKKKKKKKK.',
  'KSSSSDDDDDDDDDDSSSSK',
  'KSSSDDDDGGGGDDDDSSSK',
  'KDDDDDDGGGGGGDDDDDDK',
  'KDDDDDDDGGGGDDDDDDDK',
  'KDDK.KDDDDDDDDK.KDDK',
  'KSSK.KDDDDDDDDK.KSSK',
  '.KK..KKKKKKKKKK..KK.',
  '....KDDDDDDDDDDK....',
  '...KDDDDK..KDDDDK...',
  '...KSSSSK..KSSSSK...',
  '...KKKKK....KKKKK...',
  '....................'
];

const OPERATOR_WARDEN_F1 = [
  '.KK....KKKKKK....KK.',
  'KSSK..KDDDDDDK..KSSK',
  'KSSKKKDDDDDDDDKKKSSK',
  '.KKKDDDDDDDDDDDDKKK.',
  '...KDDKKKKKKKKDDK...',
  '...KDKYYYYYYYYKDK...',
  '...KDDKKKKKKKKDDK...',
  '.KKKKKKKKKKKKKKKKKK.',
  'KSSSSDDDDDDDDDDSSSSK',
  'KSSSDDDDGGGGDDDDSSSK',
  'KDDDDDDGGGGGGDDDDDDK',
  'KDDDDDDDGGGGDDDDDDDK',
  'KDDK.KDDDDDDDDK.KDDK',
  '.KK..KDDDDDDDDK..KK.',
  '....KKKKKKKKKKKK....',
  '...KDDDDDDDDDDDDK...',
  '..KDDDDK....KDDDDK..',
  '..KSSSSK....KSSSSK..',
  '..KKKKK......KKKKK..',
  '....................'
];

// 4. PLAGUE ALCHEMIST (Healer): Iconic Beaked Plague Doctor Mask, Emerald Hood, Potion Vials & Cauldron Tank
const OPERATOR_ALCHEMIST_F0 = [
  '......KKKKKKKK......',
  '....KKDDDDDDDDKK....',
  '...KDDDDDDDDDDDDK...',
  '...KDDKKKKKKKKDDK...',
  '..KDDKGGWWWWWWKDDK..',
  '..KDDKGGWWWWWWWKDK..',
  '...KDDKKKKWWWWKKK...',
  '....KKKKKKKKKKKK....',
  '..KKTTDDDDDDDDCCKK..',
  '.KTTTTDDLLLLDDCCCCK.',
  '.KTTKKDDDDDDDDKKCCK.',
  '..KK.KDDLLLLDDK.KK..',
  '.....KDDDDDDDDK.....',
  '....KDDDDDDDDDDK....',
  '....KDDDK..KDDDK....',
  '....KBBK....KBBK....',
  '....KKK......KKK....',
  '....................',
  '....................',
  '....................'
];

const OPERATOR_ALCHEMIST_F1 = [
  '......KKKKKKKK......',
  '....KKDDDDDDDDKK....',
  '...KDDDDDDDDDDDDK...',
  '...KDDKKKKKKKKDDK...',
  '..KDDKGGWWWWWWKDDK..',
  '..KDDKGGWWWWWWWKDK..',
  '...KDDKKKKWWWWKKK...',
  '....KKKKKKKKKKKK....',
  '..KKTTDDDDDDDDCCKK..',
  '.KTTTTDDLLLLDDCCCCK.',
  '.KTTKKDDDDDDDDKKCCK.',
  '..KK.KDDLLLLDDK.KK..',
  '.....KDDDDDDDDK.....',
  '...KKDDDDDDDDDDKK...',
  '..KDDDK......KDDDK..',
  '..KBBK........KBBK..',
  '..KKK..........KKK..',
  '....................',
  '....................',
  '....................'
];

// 5. NECRO-WARLOCK (Mage): Horned Lich Crown, Soul-Fire Eyes & Levitating Astral Robes with Orbiting Runes
const OPERATOR_MAGE_F0 = [
  '..KK...KKKKKK...KK..',
  '.KGGK.KDDDDDDK.KGGK.',
  '.KGGKKDDDDDDDDKKGGK.',
  '..KKKDDDDDDDDDDKKK..',
  '....KDDKKKKKKDDK....',
  '....KDKAAKKAAKDK....',
  '....KDDKKKKKKDDK....',
  '..KKKKKKKKKKKKKKKK..',
  '.KCCCCDDDDDDDDCCCCK.',
  '.KCCKDDDDDDDDDDKCCK.',
  'A.KK.KDDDDDDDDK.KK.A',
  '.....KDDDCCDDDK.....',
  '....KDDDDCCDDDDK....',
  '...KDDDDDDDDDDDDK...',
  '..KDDK.KDDDDK.KDDK..',
  '..KK....KKKK....KK..',
  '.....AA......AA.....',
  '....................',
  '....................',
  '....................'
];

const OPERATOR_MAGE_F1 = [
  '..KK...KKKKKK...KK..',
  '.KGGK.KDDDDDDK.KGGK.',
  '.KGGKKDDDDDDDDKKGGK.',
  '..KKKDDDDDDDDDDKKK..',
  '....KDDKKKKKKDDK....',
  '....KDKAAKKAAKDK....',
  '....KDDKKKKKKDDK....',
  '..KKKKKKKKKKKKKKKK..',
  '.KCCCCDDDDDDDDCCCCK.',
  '.KCCKDDDDDDDDDDKCCK.',
  '..KK.KDDDDDDDDK.KK..',
  'A....KDDDCCDDDK....A',
  '....KDDDDCCDDDDK....',
  '...KDDDDDDDDDDDDK...',
  '...KDDK.KKKK.KDDK...',
  '....KK........KK....',
  '...AA..........AA...',
  '....................',
  '....................',
  '....................'
];

export function drawPixelZombieSprite(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  isBoss: boolean,
  bossElement: BossElement | undefined,
  walkCycle: number,
  flash: boolean,
  chilled: boolean,
  burning: boolean,
  isMegaBoss: boolean = false
) {
  const frame = Math.floor(walkCycle) % 2;
  const stateKey = flash ? 'flash' : chilled ? 'chill' : burning ? 'burn' : 'norm';

  if (isBoss) {
    const elem = bossElement || 'fire';
    const accent =
      flash
        ? '#FFFFFF'
        : chilled
        ? '#7DD3FC'
        : elem === 'lightning'
        ? '#22D3EE'
        : elem === 'frost'
        ? '#60A5FA'
        : elem === 'venom'
        ? '#A3E635'
        : '#F97316';
    const skin =
      flash
        ? '#FFFFFF'
        : chilled
        ? '#38BDF8'
        : elem === 'lightning'
        ? '#4ADE80'
        : elem === 'frost'
        ? '#93C5FD'
        : elem === 'venom'
        ? '#84CC16'
        : '#EA580C';
    const dark = flash ? '#E2E8F0' : elem === 'frost' ? '#1E3A8A' : elem === 'venom' ? '#365314' : '#3B0764';

    const bossScale = isMegaBoss ? 4 : 3;
    const spr = getPixelMatrixSprite(
      `boss_${elem}_${stateKey}_${bossScale}`,
      ZOMBIE_BOSS_MATRIX,
      {
        K: '#09070F',
        A: accent,
        G: skin,
        D: dark
      },
      bossScale
    );
    ctx.drawImage(spr, -spr.width / 2, -spr.height + 6);

    // Extra Cataclysmic Overlord Crown for Every-5-Waves Mega Boss
    if (isMegaBoss) {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-20, -spr.height - 6, 40, 10);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-18, -spr.height - 4, 36, 6);
      ctx.fillRect(-18, -spr.height - 10, 6, 6);
      ctx.fillRect(-3, -spr.height - 12, 6, 8);
      ctx.fillRect(12, -spr.height - 10, 6, 6);
      ctx.fillStyle = accent;
      ctx.fillRect(-2, -spr.height - 8, 4, 4);
    }
    return;
  }

  let matrix = frame === 0 ? ZOMBIE_SHAMBLER_F0 : ZOMBIE_SHAMBLER_F1;
  let scale = 2;
  const palette: Record<string, string> = {
    K: '#09070F',
    G: flash ? '#FFFFFF' : chilled ? '#7DD3FC' : '#4ADE80',
    D: flash ? '#E2E8F0' : '#166534',
    B: '#09070F',
    W: '#FEF08A',
    R: '#EF4444',
    T: flash ? '#FFFFFF' : '#334155',
    P: '#1E1B4B',
    L: '#A3E635',
    O: '#F97316',
    Y: '#FEF08A',
    S: '#94A3B8',
    E: '#10B981',
    C: '#22D3EE'
  };

  switch (type) {
    case 'runner':
      matrix = ZOMBIE_GHOUL_F0;
      palette.G = flash ? '#FFFFFF' : chilled ? '#7DD3FC' : '#86EFAC';
      palette.R = '#F43F5E';
      break;
    case 'spitter':
      matrix = ZOMBIE_SPITTER_F0;
      palette.G = flash ? '#FFFFFF' : chilled ? '#7DD3FC' : '#65A30D';
      palette.L = '#BEF264';
      break;
    case 'sniper':
      matrix = ZOMBIE_SNIPER_F0;
      palette.P = flash ? '#FFFFFF' : '#4C1D95';
      palette.W = flash ? '#FFFFFF' : '#E2E8F0';
      break;
    case 'shield_brute':
      matrix = ZOMBIE_SHIELD_F0;
      break;
    case 'bomber':
      matrix = ZOMBIE_BOMBER_F0;
      break;
    case 'healer_shaman':
      matrix = ZOMBIE_WITCH_F0;
      palette.P = flash ? '#FFFFFF' : '#581C87';
      break;
    case 'crusher_tank':
      matrix = ZOMBIE_CRUSHER_F0;
      scale = 2;
      break;
    case 'tesla_gorilla':
      matrix = ZOMBIE_TESLA_F0;
      scale = 2;
      break;
    case 'devil':
      matrix = ZOMBIE_DEVIL_F0;
      scale = 2;
      break;
    default:
      break;
  }

  const spr = getPixelMatrixSprite(`mob_${type}_${frame}_${stateKey}`, matrix, palette, scale);
  ctx.drawImage(spr, -spr.width / 2, -spr.height + 4);
}

export function getOperatorSpritePalette(
  operatorClass: OperatorClassId,
  headbandColor: string,
  isFlashing: boolean
): Record<string, string> {
  const cls = operatorClass === 'engineer' ? 'mage' : operatorClass;
  if (isFlashing) {
    return {
      K: '#09070F',
      D: '#FFFFFF',
      C: '#FECACA',
      W: '#FFFFFF',
      R: '#EF4444',
      A: '#FDE047',
      H: '#FFFFFF',
      G: '#FDE047',
      S: '#FFFFFF',
      Y: '#FFFFFF',
      B: '#E2E8F0',
      L: '#A7F3D0',
      T: '#E2E8F0'
    };
  }

  switch (cls) {
    case 'reaper':
      return {
        K: '#09070F',
        D: '#3B0A14', // Dark crimson-obsidian cloak
        C: '#E11D48', // Blood-crimson mantle
        W: '#F1F5F9', // Bone skull mask
        R: '#FF2E4C', // Glowing red eye sockets
        A: '#FB7185', // Floating soul embers
        B: '#0F172A'
      };
    case 'marksman':
      return {
        K: '#09070F',
        H: '#29150B', // Dark leather Van Helsing hat
        G: '#FACC15', // Gold buckle & monocle rim
        Y: '#38BDF8', // Sharp cyan-gold deadeye lens
        S: '#FDE68A', // Face & silver bandolier highlights
        D: '#5C240E', // Hunter leather duster
        C: headbandColor || '#F97316',
        B: '#1E1B2E'
      };
    case 'vanguard':
      return {
        K: '#09070F',
        S: '#94A3B8', // Gargoyle stone horns & greaves
        D: '#334155', // Heavy slate fortress armor
        Y: '#F59E0B', // Glowing amber visor slit
        G: '#FBBF24', // Golden crypt cross crest
        C: headbandColor || '#38BDF8',
        B: '#0F172A'
      };
    case 'medic':
      return {
        K: '#09070F',
        D: '#064E3B', // Deep apothecary emerald cloak
        C: '#10B981', // Bright emerald mantle
        W: '#E2E8F0', // Ivory plague doctor beak mask
        G: '#4ADE80', // Glowing neon alchemist lenses
        L: '#A3E635', // Bubbling lime-acid elixir vials
        T: '#475569', // Pressurized backpack tank
        B: '#0F172A'
      };
    default:
      return {
        K: '#09070F',
        D: '#2E1065', // Deep eldritch astral robes
        C: '#A855F7', // Arcane violet trim
        G: '#FACC15', // Horned lich crown
        A: '#E879F9', // Glowing soul-fire eyes & runes
        B: '#09070F'
      };
  }
}

export function getOperatorMatrix(operatorClass: OperatorClassId, frame: number = 0): string[] {
  const cls = operatorClass === 'engineer' ? 'mage' : operatorClass;
  const isF1 = frame % 2 === 1;
  switch (cls) {
    case 'reaper':
      return isF1 ? OPERATOR_REAPER_F1 : OPERATOR_REAPER_F0;
    case 'marksman':
      return isF1 ? OPERATOR_HUNTER_F1 : OPERATOR_HUNTER_F0;
    case 'vanguard':
      return isF1 ? OPERATOR_WARDEN_F1 : OPERATOR_WARDEN_F0;
    case 'medic':
      return isF1 ? OPERATOR_ALCHEMIST_F1 : OPERATOR_ALCHEMIST_F0;
    default:
      return isF1 ? OPERATOR_MAGE_F1 : OPERATOR_MAGE_F0;
  }
}

export function drawPixelOperatorSprite(
  ctx: CanvasRenderingContext2D,
  operatorClass: OperatorClassId,
  headbandColor: string,
  isFlashing: boolean,
  walkCycle: number = 0
) {
  const frame = Math.floor(walkCycle) % 2;
  const matrix = getOperatorMatrix(operatorClass, frame);
  const palette = getOperatorSpritePalette(operatorClass, headbandColor, isFlashing);

  const spr = getPixelMatrixSprite(
    `op_v2_${operatorClass}_${headbandColor}_${frame}_${isFlashing ? 'fl' : 'nm'}`,
    matrix,
    palette,
    2
  );
  ctx.drawImage(spr, -spr.width / 2, -spr.height + 6);
}

/**
 * Renders a crisp 16-bit Hero Portrait + Signature Weapon onto a UI <canvas> element
 * for the Title Screen class cards, Pause Menu skill sheet, and Bottom MOBA HUD.
 */
export function renderOperatorPortraitToCanvas(
  canvas: HTMLCanvasElement,
  operatorClass: OperatorClassId,
  accentColor: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Subtle radial class aura backdrop
  ctx.fillStyle = '#09070F';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = `${accentColor}22`;
  ctx.fillRect(4, 4, w - 8, h - 8);
  ctx.strokeStyle = `${accentColor}66`;
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  const matrix = getOperatorMatrix(operatorClass, 0);
  const palette = getOperatorSpritePalette(operatorClass, accentColor, false);
  const spr = getPixelMatrixSprite(`portrait_${operatorClass}_${accentColor}`, matrix, palette, 2);

  ctx.save();
  ctx.translate(Math.round(w / 2), Math.round(h - 6));
  ctx.drawImage(spr, Math.round(-spr.width / 2), Math.round(-spr.height));
  ctx.restore();
}

/**
 * Renders the hero's fixed 16-bit signature weapon in their hands on the canvas.
 */
export function drawPixelWeaponInHand(ctx: CanvasRenderingContext2D, weaponId: WeaponId, color: string) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  switch (weaponId) {
    case 'shotgun': {
      // Crypt Reaper: Cursed Soul Scythe (long bone-iron polearm + giant curved crimson reaper blade)
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-8, -3, 36, 6);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(-6, -1, 32, 2); // long polearm shaft
      // Skull pommel at rear
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-8, -2, 4, 4);
      // Giant Sweeping Crescent Scythe Blade at tip
      ctx.fillStyle = '#09070F';
      ctx.fillRect(16, -20, 14, 26);
      ctx.fillRect(10, -22, 10, 8);
      ctx.fillStyle = '#E11D48';
      ctx.fillRect(18, -18, 10, 22);
      ctx.fillRect(12, -20, 8, 5);
      ctx.fillStyle = '#FDA4AF';
      ctx.fillRect(24, -16, 3, 18);
      ctx.fillRect(14, -19, 6, 2);
      break;
    }
    case 'battle_rifle': {
      // Witch Hunter: Silver Vanquisher Crossbow (wide steel bow prod + glowing consecrated silver stake)
      ctx.fillStyle = '#09070F';
      ctx.fillRect(0, -5, 24, 10);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(2, -3, 18, 6); // dark walnut stock
      // Recurve Steel Crossbow Limbs
      ctx.fillStyle = '#09070F';
      ctx.fillRect(14, -16, 6, 32);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(15, -14, 4, 28);
      // Bowstring
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(8, -13, 7, 2);
      ctx.fillRect(8, 11, 7, 2);
      // Loaded Consecrated Silver Stake
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(6, -1, 22, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(24, -3, 6, 6);
      break;
    }
    case 'auto_shotgun': {
      // Grave Warden: Gargoyle Crypt Maul (heavy iron-shod warhammer with winged gargoyle stone head)
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-4, -3, 28, 6);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-2, -1, 22, 3);
      // Massive Tombstone / Gargoyle Maul Head
      ctx.fillStyle = '#09070F';
      ctx.fillRect(14, -15, 16, 30);
      ctx.fillStyle = '#475569';
      ctx.fillRect(16, -13, 12, 26);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(18, -11, 8, 22);
      // Glowing Amber Impact Runes
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(20, -7, 4, 14);
      break;
    }
    case 'plasma_carbine': {
      // Plague Alchemist: Necro-Tonic Syringe Launcher (pressurized emerald glass chamber + long hypodermic needle)
      ctx.fillStyle = '#09070F';
      ctx.fillRect(2, -6, 24, 12);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(4, -4, 18, 8);
      // Bubbling Emerald Elixir Vial
      ctx.fillStyle = '#10B981';
      ctx.fillRect(7, -3, 12, 6);
      ctx.fillStyle = '#A7F3D0';
      ctx.fillRect(9, -2, 8, 2);
      // Long Alchemical Needle Tip
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(22, -1, 10, 2);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(29, -2, 4, 4);
      break;
    }
    case 'tesla_rifle': {
      // Necro-Warlock: Eldritch Skull Staff (twisted obsidian staff + horned skull + burning violet soul-orb)
      ctx.fillStyle = '#09070F';
      ctx.fillRect(-4, -3, 30, 6);
      ctx.fillStyle = '#4C1D95';
      ctx.fillRect(-2, -1, 24, 3);
      // Horned Skull & Burning Soul-Fire Orb at tip
      ctx.fillStyle = '#09070F';
      ctx.fillRect(17, -10, 16, 20);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(19, -6, 6, 12); // skull cranium
      ctx.fillStyle = '#A855F7';
      ctx.fillRect(23, -8, 8, 16); // soul-fire aura
      ctx.fillStyle = '#F0ABFC';
      ctx.fillRect(25, -4, 4, 8);
      break;
    }
    default: {
      ctx.fillStyle = '#09070F';
      ctx.fillRect(4, -5, 18, 9);
      ctx.fillStyle = color;
      ctx.fillRect(6, -3, 14, 5);
      break;
    }
  }

  ctx.restore();
}

// ============================================================================
// 16-BIT HALLOWEEN FLOOR TILE PATTERN GENERATOR
// ============================================================================
export function getArenaPixelPattern(ctx: CanvasRenderingContext2D, arenaId: ArenaId): CanvasPattern | null {
  if (patternCache.has(arenaId)) {
    return patternCache.get(arenaId) || null;
  }

  const tile = document.createElement('canvas');
  tile.width = 64;
  tile.height = 64;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  tctx.imageSmoothingEnabled = false;

  if (arenaId === 'boxy') {
    // HAUNTED GRAVEYARD: Moonlit cobblestone & mossy crypt pavers
    tctx.fillStyle = '#181426';
    tctx.fillRect(0, 0, 64, 64);

    // Cobblestone blocks
    tctx.fillStyle = '#221C35';
    tctx.fillRect(2, 2, 28, 28);
    tctx.fillRect(34, 2, 28, 28);
    tctx.fillRect(2, 34, 28, 28);
    tctx.fillRect(34, 34, 28, 28);

    // Pixel highlights on stone edges
    tctx.fillStyle = '#2D2546';
    tctx.fillRect(2, 2, 28, 4);
    tctx.fillRect(34, 34, 28, 4);

    // Graveyard moss & bone specks
    tctx.fillStyle = '#14532D';
    tctx.fillRect(6, 22, 6, 4);
    tctx.fillRect(48, 8, 8, 4);
    tctx.fillRect(38, 52, 6, 4);

    tctx.fillStyle = '#3B3154';
    tctx.fillRect(14, 12, 4, 4);
    tctx.fillRect(44, 44, 4, 4);
  } else if (arenaId === 'columns') {
    // CURSED PUMPKIN PATCH: Dark autumn soil, dead leaves & withered grass
    tctx.fillStyle = '#1C130E';
    tctx.fillRect(0, 0, 64, 64);

    // Soil furrows
    tctx.fillStyle = '#261A13';
    tctx.fillRect(0, 4, 64, 12);
    tctx.fillRect(0, 36, 64, 12);

    // Pixel autumn leaves & pumpkin vines
    tctx.fillStyle = '#365314';
    tctx.fillRect(8, 20, 8, 4);
    tctx.fillRect(42, 52, 10, 4);

    tctx.fillStyle = '#9A3412';
    tctx.fillRect(24, 10, 4, 4);
    tctx.fillRect(52, 28, 4, 4);
    tctx.fillRect(14, 48, 4, 4);
  } else {
    // INFERNAL CRYPT: Catacomb obsidian stone & glowing crimson cracks
    tctx.fillStyle = '#180D12';
    tctx.fillRect(0, 0, 64, 64);

    tctx.fillStyle = '#24131B';
    tctx.fillRect(2, 2, 60, 28);
    tctx.fillRect(2, 34, 28, 28);
    tctx.fillRect(34, 34, 28, 28);

    // Glowing blood/hellfire cracks
    tctx.fillStyle = '#450A0A';
    tctx.fillRect(0, 30, 64, 4);
    tctx.fillRect(30, 34, 4, 30);

    tctx.fillStyle = '#7F1D1D';
    tctx.fillRect(16, 14, 4, 4);
    tctx.fillRect(46, 46, 4, 4);
  }

  const pattern = ctx.createPattern(tile, 'repeat');
  patternCache.set(arenaId, pattern);
  return pattern;
}

// ============================================================================
// 16-BIT HALLOWEEN PROPS & OBSTACLE RENDERER
// ============================================================================
export function drawPixelHalloweenObstacle(
  ctx: CanvasRenderingContext2D,
  obs: ObstacleRect,
  arenaId: ArenaId,
  elapsedSeconds: number
) {
  const extrude = 18;
  const x = Math.round(obs.x);
  const y = Math.round(obs.y);
  const w = Math.round(obs.w);
  const h = Math.round(obs.h);

  ctx.save();
  // Pixelated drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(x + 6, y + 6, w, h);

  if (obs.destructible) {
    // Boarded Coffin / Haunted Wooden Barricade
    ctx.fillStyle = '#291811';
    ctx.fillRect(x, y - extrude, w, h + extrude);
    ctx.fillStyle = '#452719';
    ctx.fillRect(x, y - extrude, w, h);

    // Pixel planks & nails
    ctx.fillStyle = '#78350F';
    for (let py = y - extrude + 6; py < y + h - extrude; py += 12) {
      ctx.fillRect(x + 4, py, w - 8, 6);
    }
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(x + 8, y - extrude + 8, 4, 4);
    ctx.fillRect(x + w - 12, y - extrude + 8, 4, 4);

    ctx.strokeStyle = '#09070F';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y - extrude, w, h + extrude);
  } else if (obs.kind === 'crate') {
    // Jack-o'-Lantern Pumpkin Harvest Cache / Coffin Crate
    ctx.fillStyle = '#2E160B';
    ctx.fillRect(x, y - extrude, w, h + extrude);
    ctx.fillStyle = '#431E0F';
    ctx.fillRect(x, y - extrude, w, h);

    ctx.strokeStyle = '#09070F';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y - extrude, w, h + extrude);

    // Draw carved 16-bit Jack-o'-Lantern sitting on top of the crate
    const cx = Math.round(x + w / 2);
    const cy = Math.round(y + h / 2 - extrude);
    const flicker = Math.floor(elapsedSeconds * 6) % 2 === 0 ? '#FDE047' : '#FB923C';

    // Pumpkin body
    ctx.fillStyle = '#09070F';
    ctx.fillRect(cx - 16, cy - 14, 32, 26);
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(cx - 14, cy - 12, 28, 22);
    ctx.fillStyle = '#F97316';
    ctx.fillRect(cx - 10, cy - 12, 20, 22);
    // Stem
    ctx.fillStyle = '#15803D';
    ctx.fillRect(cx - 3, cy - 18, 6, 6);
    // Glowing eyes & grin
    ctx.fillStyle = flicker;
    ctx.fillRect(cx - 9, cy - 7, 5, 5);
    ctx.fillRect(cx + 4, cy - 7, 5, 5);
    ctx.fillRect(cx - 8, cy + 2, 16, 4);
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(cx - 4, cy + 2, 3, 2);
    ctx.fillRect(cx + 2, cy + 2, 3, 2);
  } else if (obs.kind === 'pillar') {
    // Carved Granite R.I.P. Tombstone Monument
    ctx.fillStyle = '#1E1B2E';
    ctx.fillRect(x, y - extrude, w, h + extrude);
    ctx.fillStyle = '#332E4C';
    ctx.fillRect(x, y - extrude, w, h);

    // Stepped top arch effect
    ctx.fillStyle = '#474066';
    ctx.fillRect(x + 6, y - extrude + 4, w - 12, 8);

    // Engraved Cross / R.I.P. motif
    const cx = Math.round(x + w / 2);
    const cy = Math.round(y + h / 2 - extrude);
    ctx.fillStyle = '#09070F';
    ctx.fillRect(cx - 3, cy - 16, 6, 26);
    ctx.fillRect(cx - 11, cy - 8, 22, 6);

    // Moss patches at bottom of tombstone
    ctx.fillStyle = '#15803D';
    ctx.fillRect(x + 4, y + h - 8, 16, 8);
    ctx.fillRect(x + w - 22, y + h - 6, 16, 6);

    // Flickering graveyard candle on the corner
    const glow = Math.floor(elapsedSeconds * 8) % 2 === 0 ? '#FEF08A' : '#F97316';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(x + 10, y - extrude + 8, 4, 8);
    ctx.fillStyle = glow;
    ctx.fillRect(x + 10, y - extrude + 4, 4, 4);

    ctx.strokeStyle = '#09070F';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y - extrude, w, h + extrude);
  } else {
    // Haunted Crypt Stone Wall with Wrought-Iron Fence Spikes
    const sideColor = arenaId === 'hell' ? '#260E14' : arenaId === 'columns' ? '#271710' : '#1A162B';
    const topColor = arenaId === 'hell' ? '#3F1621' : arenaId === 'columns' ? '#3E2519' : '#2D2647';

    ctx.fillStyle = sideColor;
    ctx.fillRect(x, y - extrude, w, h + extrude);
    ctx.fillStyle = topColor;
    ctx.fillRect(x, y - extrude, w, h);

    // Pixel brick pattern
    ctx.fillStyle = 'rgba(9, 7, 15, 0.45)';
    for (let bx = x + 16; bx < x + w - 8; bx += 24) {
      ctx.fillRect(bx, y - extrude, 3, h);
    }
    ctx.fillRect(x, Math.round(y - extrude + h / 2), w, 3);

    // Wrought-iron pixel spikes along top edge
    ctx.fillStyle = '#94A3B8';
    for (let sx = x + 10; sx < x + w - 10; sx += 18) {
      ctx.fillRect(sx, y - extrude - 6, 4, 8);
    }

    ctx.strokeStyle = '#09070F';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y - extrude, w, h + extrude);
  }

  ctx.restore();
}
