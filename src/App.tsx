import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Crosshair,
  ShieldAlert,
  Trophy,
  BookOpen,
  X,
  Skull,
  Sparkles,
  RefreshCw,
  Users,
  Globe,
  Lock,
  Copy,
  Check,
  Send,
  Radio,
  MapPin,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Settings,
  Wrench,
  Coins,
  Gem,
  Zap,
  Shield,
  HeartPulse,
  Flame,
  Snowflake,
  Biohazard,
  ArrowUpCircle,
  Swords
} from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import {
  ARENA_DEFINITIONS,
  ELEMENTAL_BOSS_CONFIGS,
  MOBA_ITEMS,
  MOBA_ITEM_BY_ID,
  OPERATOR_CLASSES,
  OPERATOR_CLASS_LIST
} from './game/constants';
import { BoxheadEngine } from './game/Engine';
import { renderOperatorPortraitToCanvas } from './game/pixelArt';
import { progressionManager } from './game/progression';
import { multiplayerClient } from './network/multiplayerClient';
import {
  AbilitySlotKey,
  ArenaId,
  GameMode,
  GameSettings,
  HUDStateSnapshot,
  LobbyDetail,
  LobbySummary,
  MinimapData,
  MobaItemCategory,
  MobaItemId,
  OperatorClassId,
  PcControlScheme,
  PlayerHUDData,
  PlayerProfileState,
  RemoteAllyHUD,
  WeaponId
} from './types/game';

const SQUAD_COLOR_PALETTE = [
  '#38BDF8',
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#A855F7',
  '#EF4444',
  '#22D3EE',
  '#84CC16',
  '#F97316',
  '#EAB308'
];

const BOOT_TIPS = [
  'PC League of Legends Controls: Right-Click ground to move, Right-Click undead to lock & auto-attack, and cast [Q][W][E] toward your cursor!',
  'Choose from 5 distinct Halloween Hero Archetypes: Crypt Reaper (Melee), Witch Hunter (Ranged), Grave Warden (Tank), Plague Alchemist (Healer), and Necro-Warlock (Mage).',
  'Equip up to 6 Cursed MOBA Items in the Item Shop—granting lifesteal, immolation auras, chain lightning, frost slows, and regenerating wraith shields.',
  'Primary attacks have unlimited uses governed by your Attack Speed—no weapon switching or reloading required!',
  'On mobile or touch devices, ClassZ automatically switches to a Mobile MOBA UI with a left analog joystick and right radial Q/W/E/R skill wheel.'
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BoxheadEngine | null>(null);

  const [profile, setProfile] = useState<PlayerProfileState>(() => ({ ...progressionManager.profile }));
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...progressionManager.settings }));

  const [mode, setMode] = useState<GameMode>('single');
  const [arenaId, setArenaId] = useState<ArenaId>('boxy');
  const [showArmoryModal, setShowArmoryModal] = useState<boolean>(false);
  const [itemCategoryFilter, setItemCategoryFilter] = useState<MobaItemCategory | 'all' | 'abilities'>('all');
  const [armoryFeedback, setArmoryFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<'gameplay' | 'accessibility' | 'graphics' | 'sound'>('gameplay');

  const [showBestiaryModal, setShowBestiaryModal] = useState<boolean>(false);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState<boolean>(false);

  // Main Home Screen Menu State (0: START SURVIVAL, 1: LOAD GAME, 2: THE SWARM, 3: ARSENAL, 4: OPTIONS, 5: QUIT)
  const [activeMenuIdx, setActiveMenuIdx] = useState<number>(0);
  const [showSurvivalModal, setShowSurvivalModal] = useState<boolean>(false);
  const [showLoadGameModal, setShowLoadGameModal] = useState<boolean>(false);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [saveCodeInput, setSaveCodeInput] = useState<string>('');
  const [saveCodeFeedback, setSaveCodeFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Intro Loading Screen State
  const [bootProgress, setBootProgress] = useState<number>(0);
  const [bootTipIndex] = useState<number>(() => Math.floor(Math.random() * BOOT_TIPS.length));

  // Multiplayer Lobby State
  const [wsConnected, setWsConnected] = useState<boolean>(multiplayerClient.connected);
  const [publicLobbies, setPublicLobbies] = useState<LobbySummary[]>(multiplayerClient.publicLobbies);
  const [currentRoom, setCurrentRoom] = useState<LobbyDetail | null>(multiplayerClient.currentRoom);
  const [mpError, setMpError] = useState<string | null>(multiplayerClient.lastError);

  const [callsign, setCallsign] = useState<string>(multiplayerClient.playerName);
  const [headbandColor, setHeadbandColor] = useState<string>(multiplayerClient.playerColor);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [newLobbyName, setNewLobbyName] = useState<string>('ALPHA COVEN');
  const [newLobbyPrivate, setNewLobbyPrivate] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const [touchControls, setTouchControls] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia?.('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        window.innerWidth < 1024
      );
    }
    return false;
  });

  const [hud, setHud] = useState<HUDStateSnapshot | null>(null);

  // Subscribe to persistent profile & settings changes
  useEffect(() => {
    return progressionManager.subscribe(() => {
      setProfile({
        ...progressionManager.profile,
        currencies: { ...progressionManager.profile.currencies },
        items: { ...progressionManager.profile.items },
        equippedItems: [...progressionManager.profile.equippedItems],
        heroAbilityLevels: { ...progressionManager.profile.heroAbilityLevels }
      });
      setSettings({ ...progressionManager.settings });
    });
  }, []);

  // Boot loading bar animation
  useEffect(() => {
    const start = performance.now();
    const duration = 1250;
    let raf = 0;
    const step = (now: number) => {
      const pct = Math.min(100, Math.round(((now - start) / duration) * 100));
      setBootProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          engineRef.current?.setScreen('TITLE_MENU');
        }, 180);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Automatically enable Mobile MOBA UI on touch or mobile viewport
  useEffect(() => {
    const onFirstTouch = () => {
      setTouchControls(true);
    };
    const onResize = () => {
      if (window.innerWidth < 1024 || window.matchMedia?.('(pointer: coarse)').matches) {
        setTouchControls(true);
      }
    };
    window.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onFirstTouch);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    multiplayerClient.connect();
    const unsub = multiplayerClient.subscribe(() => {
      setWsConnected(multiplayerClient.connected);
      setPublicLobbies([...multiplayerClient.publicLobbies]);
      setCurrentRoom(multiplayerClient.currentRoom ? { ...multiplayerClient.currentRoom } : null);
      setMpError(multiplayerClient.lastError);
    });

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setMode('online_coop');
      setShowMultiplayerModal(true);
      setJoinCodeInput(roomParam.toUpperCase());
      setTimeout(() => {
        multiplayerClient.joinLobbyByCode(roomParam);
      }, 350);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new BoxheadEngine(canvas, (snapshot) => {
      setHud(snapshot);
      if (snapshot.screen === 'PLAYING') {
        setShowMultiplayerModal(false);
      }
    });
    engineRef.current = engine;
    engine.startLoop();

    return () => {
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setConfig(mode, arenaId, settings.friendlyFire, settings.mouseAim);
  }, [mode, arenaId, settings.friendlyFire, settings.mouseAim]);

  const handleToggleMute = () => {
    const nextMuted = !settings.muted;
    progressionManager.updateSettings({ muted: nextMuted });
    soundEngine.setMuted(nextMuted);
  };

  const handleUpdateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    progressionManager.updateSettings({ [key]: value });
  };

  const handleSelectOperatorClass = (classId: OperatorClassId) => {
    soundEngine.playUIClick();
    progressionManager.selectOperatorClass(classId);
    engineRef.current?.refreshPlayerArmoryLoadout();
  };

  const handleSetPcControlScheme = (scheme: PcControlScheme) => {
    soundEngine.playUIClick();
    progressionManager.setPcControlScheme(scheme);
  };

  const handleStartMatch = (startOnBossWave: boolean = false) => {
    soundEngine.playUIClick();
    setShowSurvivalModal(false);
    setShowLoadGameModal(false);
    if (mode === 'online_coop') {
      setShowMultiplayerModal(true);
      return;
    }
    engineRef.current?.startNewGame(mode, arenaId, startOnBossWave);
  };

  const handleMenuAction = (index: number) => {
    soundEngine.playUIClick();
    setActiveMenuIdx(index);
    if (index === 0) {
      setShowSurvivalModal(true);
    } else if (index === 1) {
      setSaveCodeInput(progressionManager.exportSaveCode());
      setShowLoadGameModal(true);
    } else if (index === 2) {
      setShowBestiaryModal(true);
    } else if (index === 3) {
      setItemCategoryFilter('all');
      setShowArmoryModal(true);
    } else if (index === 4) {
      setShowSettingsModal(true);
    } else if (index === 5) {
      setShowQuitModal(true);
    }
  };

  const handleCopySaveCode = () => {
    const code = progressionManager.exportSaveCode();
    setSaveCodeInput(code);
    navigator.clipboard?.writeText(code);
    soundEngine.playUIClick();
    setSaveCodeFeedback({ text: 'ClassZ Save Code copied to clipboard!', ok: true });
    setTimeout(() => setSaveCodeFeedback(null), 2600);
  };

  const handleImportSaveCode = () => {
    const res = progressionManager.importSaveCode(saveCodeInput);
    if (res.ok) {
      soundEngine.playLevelUp();
      engineRef.current?.refreshPlayerArmoryLoadout();
      setSaveCodeFeedback({ text: 'Hunter Profile & Loadout restored!', ok: true });
    } else {
      soundEngine.playReloadStart();
      setSaveCodeFeedback({ text: res.reason || 'Invalid Save Code', ok: false });
    }
    setTimeout(() => setSaveCodeFeedback(null), 2800);
  };

  const handleResetProfile = () => {
    soundEngine.playReloadStart();
    progressionManager.resetProfile();
    engineRef.current?.refreshPlayerArmoryLoadout();
    setShowQuitModal(false);
    setShowLoadGameModal(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!hud || hud.screen !== 'TITLE_MENU' || bootProgress < 100) return;
      const anyModalOpen =
        showSurvivalModal ||
        showLoadGameModal ||
        showBestiaryModal ||
        showArmoryModal ||
        showSettingsModal ||
        showMultiplayerModal ||
        showQuitModal;

      if (e.key === 'Escape' && anyModalOpen) {
        soundEngine.playUIClick();
        setShowSurvivalModal(false);
        setShowLoadGameModal(false);
        setShowBestiaryModal(false);
        setShowArmoryModal(false);
        setShowSettingsModal(false);
        setShowMultiplayerModal(false);
        setShowQuitModal(false);
        return;
      }

      if (anyModalOpen) return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        soundEngine.playUIClick();
        setActiveMenuIdx((prev) => (prev + 5) % 6);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        soundEngine.playUIClick();
        setActiveMenuIdx((prev) => (prev + 1) % 6);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleMenuAction(activeMenuIdx);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    hud,
    bootProgress,
    activeMenuIdx,
    showSurvivalModal,
    showLoadGameModal,
    showBestiaryModal,
    showArmoryModal,
    showSettingsModal,
    showMultiplayerModal,
    showQuitModal
  ]);

  const handleCopyRoomCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    multiplayerClient.sendChat(chatInput);
    setChatInput('');
  };

  const handleUnlockItem = (itemId: MobaItemId) => {
    const res = progressionManager.unlockItem(itemId);
    if (res.ok) {
      soundEngine.playLevelUp();
      engineRef.current?.refreshPlayerArmoryLoadout();
      setArmoryFeedback({ text: 'Cursed Item forged & equipped to your 6-slot loadout!', ok: true });
    } else {
      soundEngine.playReloadStart();
      setArmoryFeedback({ text: res.reason || 'Cannot unlock item', ok: false });
    }
    setTimeout(() => setArmoryFeedback(null), 2600);
  };

  const handleUpgradeItem = (itemId: MobaItemId) => {
    const res = progressionManager.upgradeItem(itemId);
    if (res.ok) {
      soundEngine.playReloadComplete();
      engineRef.current?.refreshPlayerArmoryLoadout();
      setArmoryFeedback({ text: 'Cursed Item upgraded!', ok: true });
    } else {
      soundEngine.playReloadStart();
      setArmoryFeedback({ text: res.reason || 'Cannot upgrade item', ok: false });
    }
    setTimeout(() => setArmoryFeedback(null), 2600);
  };

  const handleToggleEquipItem = (itemId: MobaItemId) => {
    const res = progressionManager.toggleEquipItem(itemId);
    if (res.ok) {
      soundEngine.playUIClick();
      engineRef.current?.refreshPlayerArmoryLoadout();
      setArmoryFeedback({ text: '6-Slot Item Inventory updated!', ok: true });
    } else {
      soundEngine.playReloadStart();
      setArmoryFeedback({ text: res.reason || 'Cannot equip item', ok: false });
    }
    setTimeout(() => setArmoryFeedback(null), 2600);
  };

  const handleUpgradeHeroAbility = (slotIdx: 0 | 1 | 2 | 3) => {
    const res = progressionManager.upgradeHeroAbility(profile.selectedClass, slotIdx);
    if (res.ok) {
      soundEngine.playLevelUp();
      engineRef.current?.refreshPlayerArmoryLoadout();
      setArmoryFeedback({ text: 'Hero Ability upgraded!', ok: true });
    } else {
      soundEngine.playReloadStart();
      setArmoryFeedback({ text: res.reason || 'Cannot upgrade ability', ok: false });
    }
    setTimeout(() => setArmoryFeedback(null), 2600);
  };

  const highScoreRecord = BoxheadEngine.getHighScore(mode, arenaId);
  const currentOpClass = OPERATOR_CLASSES[profile.selectedClass] || OPERATOR_CLASSES.reaper;
  const currentHeroStats = progressionManager.computeHeroCombatStats(profile.selectedClass);

  // Colorblind filter CSS mapping
  const colorblindFilter =
    settings.colorblindMode === 'protanopia'
      ? 'saturate(1.15) hue-rotate(-18deg) contrast(1.08)'
      : settings.colorblindMode === 'deuteranopia'
      ? 'saturate(1.2) hue-rotate(22deg) contrast(1.08)'
      : settings.colorblindMode === 'tritanopia'
      ? 'saturate(1.15) hue-rotate(-45deg) contrast(1.1)'
      : 'none';

  const uiScaleClass =
    settings.uiScale === 'compact' ? 'text-[92%]' : settings.uiScale === 'large' ? 'text-[108%]' : 'text-[100%]';

  const unlockedItemCount = Object.values(profile.items).filter((a) => a.unlocked).length;

  return (
    <div
      className={`fixed inset-0 w-screen h-dvh bg-[#0D0B14] text-[#F8FAFC] select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] ${uiScaleClass}`}
      style={{ filter: colorblindFilter }}
    >
      {/* Fullscreen Adaptive 16-Bit Pixel-Art Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* ================================================================= */}
      {/* 0. INTRO LOADING SCREEN (CLASSZ: 16-BIT HALLOWEEN MOBA RPG)       */}
      {/* ================================================================= */}
      {(!hud || hud.screen === 'LOADING' || bootProgress < 100) && (
        <div className="absolute inset-0 z-50 bg-[#08090F] flex flex-col items-center justify-end overflow-hidden">
          <img
            src="/assets/aistudio/image_4663bf94.png"
            alt="ClassZ Title Backdrop"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090F]/90 via-transparent to-[#08090F]/35 pointer-events-none" />

          <div className="relative z-10 w-full max-w-lg mx-auto mb-6 sm:mb-8 px-4">
            <div className="bg-[#181715]/95 border-2 border-[#616755] shadow-[0_0_30px_rgba(0,0,0,0.85)] p-3.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-200 mb-1.5">
                <span className="uppercase tracking-wider text-emerald-400 font-bold">
                  LOADING CLASSZ SURVIVAL ENGINE...
                </span>
                <span className="text-amber-400 font-bold tabular-nums">{bootProgress}%</span>
              </div>
              <div className="w-full h-3 bg-[#090A08] border border-[#4A4E40] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-150"
                  style={{ width: `${bootProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 mt-2 text-left leading-relaxed font-mono">
                <span className="text-amber-400 font-bold uppercase mr-1.5">TIP:</span>
                {BOOT_TIPS[bootTipIndex]}
              </p>

              {bootProgress >= 100 && (
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    engineRef.current?.setScreen('TITLE_MENU');
                  }}
                  className="mt-3 w-full py-2.5 bg-[#5C6350] hover:bg-[#6E7660] border-2 border-[#FF2A4B] shadow-[0_0_12px_rgba(255,42,75,0.55)] text-white font-['Oswald',sans-serif] text-base font-bold uppercase tracking-widest transition cursor-pointer"
                >
                  PRESS [START] TO DEFEND
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. COMPACT TOP-CORNER NOTIFICATION BANNER (NEVER CENTERED)        */}
      {/* ================================================================= */}
      {hud && hud.recentBanner && hud.screen !== 'TITLE_MENU' && hud.screen !== 'LOADING' && (
        <div
          className={`fixed z-40 pointer-events-none transition-all duration-200 ${
            settings.notificationPosition === 'top-left'
              ? 'top-14 sm:top-16 left-2.5 sm:left-4'
              : 'top-14 sm:top-16 right-2.5 sm:right-4'
          }`}
        >
          <div className="max-w-[205px] sm:max-w-[260px] bg-[#161224]/95 border-2 border-[#3B3154] pixel-panel px-2.5 py-1.5">
            <div
              className="font-['Oswald',sans-serif] text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate"
              style={{ color: hud.recentBanner.color }}
            >
              {hud.recentBanner.title}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-300 leading-tight truncate mt-0.5">
              {hud.recentBanner.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. ACTIVE GAMEPLAY HUD OVERLAY (LOL PC HUD + MOBILE MOBA UI)      */}
      {/* ================================================================= */}
      {hud &&
        (hud.screen === 'PLAYING' ||
          hud.screen === 'PAUSED' ||
          hud.screen === 'WAVE_DRAFT' ||
          hud.screen === 'REVIVE_PROMPT') && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-3">
            {/* TOP TACTICAL SCOREBOARD, MINIMAP & WAVE BAR */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                {/* Top-Left: On Mobile MOBA UI show Radar Minimap + Hero Mini-Bar; on Desktop show Hero Status */}
                <div className="flex items-start gap-2 pointer-events-auto">
                  {touchControls ? (
                    <TacticalMinimap
                      minimap={hud.minimap}
                      compact
                      onPingWorld={(wx, wy, kind) => engineRef.current?.sendTacticalPingAtWorld(wx, wy, kind)}
                      onTriggerQuickPing={() => engineRef.current?.triggerPlayerPing()}
                    />
                  ) : (
                    <PlayerStatusCard
                      player={hud.p1}
                      label={`${hud.p1.className.toUpperCase()} (${hud.p1.archetype})`}
                      accent={hud.p1.classColor}
                      showFrags={hud.mode === 'deathmatch'}
                      compact={hud.isPortrait}
                    />
                  )}
                </div>

                {/* Center Wave, Scoreboard & Blood-Moon Combo Cluster */}
                <div className="flex flex-col items-center bg-[#161224]/95 border-2 border-[#3B3154] pixel-panel px-2.5 sm:px-4 py-1.5 min-w-[145px] sm:min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <span className="font-['Oswald',sans-serif] text-[10px] sm:text-xs tracking-widest uppercase text-orange-400 font-bold">
                      {hud.mode === 'deathmatch' ? 'CRYPT DUEL' : `NIGHT WAVE ${hud.wave}`}
                    </span>
                    {hud.mode !== 'deathmatch' && (
                      <span
                        className={`text-[10px] sm:text-xs font-mono font-bold tabular-nums ${
                          hud.isBossWave ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                        }`}
                      >
                        · {hud.enemiesRemaining} ZOMBIES
                      </span>
                    )}
                  </div>

                  {hud.mode !== 'deathmatch' && !hud.isBossWave && (
                    <div className="text-[9px] font-mono text-purple-300/80 uppercase tracking-wider">
                      Next Raid Boss: Wave {hud.nextBossWave}
                    </div>
                  )}

                  {/* Blood-Moon Combo & Attack Speed Overdrive */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-['JetBrains_Mono',monospace] text-sm sm:text-base font-bold tabular-nums text-orange-400">
                      {hud.combo}x STREAK
                    </span>
                    {hud.overdriveBonusPct > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400 font-bold tabular-nums">
                        +{hud.overdriveBonusPct}% ASPD
                      </span>
                    )}
                  </div>

                  {/* Live Currencies */}
                  <div className="w-full flex items-center justify-center gap-2.5 mt-1 pt-1 border-t border-[#3B3154] text-[10px] font-mono tabular-nums">
                    <span className="flex items-center gap-0.5 text-amber-400" title="Gold Coins">
                      <Coins className="w-3 h-3" /> {hud.currencies.gold}
                    </span>
                    <span className="flex items-center gap-0.5 text-emerald-400" title="Cursed Scrap">
                      <Wrench className="w-3 h-3" /> {hud.currencies.scrap}
                    </span>
                    <span className="flex items-center gap-0.5 text-purple-400" title="Soul Gems">
                      <Gem className="w-3 h-3" /> {hud.currencies.gems}
                    </span>
                  </div>
                </div>

                {/* Top-Right: P2 Status + Item Shop / Bestiary / Settings / Radar */}
                <div className="flex items-start gap-1.5 sm:gap-2">
                  {hud.p2 && (
                    <PlayerStatusCard
                      player={hud.p2}
                      label={`P2 · ${hud.p2.className}`}
                      accent="#4ADE80"
                      showFrags={hud.mode === 'deathmatch'}
                      compact={hud.isPortrait}
                    />
                  )}

                  <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
                    <div className="flex items-center gap-1 bg-[#161224]/95 border-2 border-[#3B3154] pixel-panel p-1">
                      <button
                        onClick={() => {
                          setItemCategoryFilter('abilities');
                          setShowArmoryModal(true);
                        }}
                        className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400 text-purple-200 font-mono text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1"
                        title="View & Upgrade Hero Skills ([Q][W][E][R])"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">SKILLS</span>
                      </button>
                      <button
                        onClick={() => {
                          setItemCategoryFilter('all');
                          setShowArmoryModal(true);
                        }}
                        className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/35 border border-orange-400 text-orange-300 font-mono text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1"
                        title="Cursed Item Shop & Ability Altar"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ITEMS</span>
                      </button>
                      <button
                        onClick={() => setShowBestiaryModal(true)}
                        className="p-1.5 hover:bg-[#2A2240] text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                        title="Zombie Bestiary"
                      >
                        <Skull className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-1.5 hover:bg-[#2A2240] text-slate-300 hover:text-white transition cursor-pointer"
                        title="Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleToggleMute}
                        className="p-1.5 hover:bg-[#2A2240] text-slate-300 hover:text-white transition cursor-pointer"
                        title={settings.muted ? 'Unmute Audio' : 'Mute Audio'}
                      >
                        {settings.muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => engineRef.current?.togglePause()}
                        className="p-1.5 hover:bg-[#2A2240] text-slate-300 hover:text-white transition cursor-pointer"
                        title="Pause (ESC)"
                      >
                        {hud.screen === 'PAUSED' ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Desktop Crypt Radar Minimap */}
                    {!touchControls && (
                      <div className="hidden sm:block">
                        <TacticalMinimap
                          minimap={hud.minimap}
                          onPingWorld={(wx, wy, kind) => engineRef.current?.sendTacticalPingAtWorld(wx, wy, kind)}
                          onTriggerQuickPing={() => engineRef.current?.triggerPlayerPing()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2-TIER BOSS HEALTH BAR: WAVE-END WARDEN BOSS vs. 5-WAVE CATACLYSMIC MEGA RAID BOSS */}
              {hud.boss && (
                <div
                  className={`mx-auto w-full max-w-2xl bg-[#161224]/95 border-2 pixel-panel px-3.5 py-2 ${
                    hud.boss.isMegaBoss
                      ? 'border-red-500 shadow-[0_0_24px_rgba(239,68,68,0.45)]'
                      : 'border-orange-500/85'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] sm:text-xs font-['Oswald',sans-serif] tracking-wider uppercase mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 font-mono text-[9px] font-bold border ${
                          hud.boss.isMegaBoss
                            ? 'bg-red-500/25 border-red-400 text-red-200'
                            : 'bg-orange-500/20 border-orange-400 text-orange-200'
                        }`}
                      >
                        {hud.boss.isMegaBoss ? `★ 5-WAVE MEGA RAID BOSS · PHASE ${hud.boss.phase}/3` : 'WAVE END BOSS'}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-sm" style={{ color: hud.boss.elementColor }}>
                        <Skull className="w-4 h-4" />
                        {hud.boss.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-200 tabular-nums">
                      <span className="text-orange-300">{hud.boss.scaledPlayers}P SCALED</span>
                      <span className="font-bold text-white">
                        {hud.boss.hp.toLocaleString()} / {hud.boss.maxHp.toLocaleString()} HP
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-[#09070F] overflow-hidden border border-[#3B3154] relative">
                    <div
                      className="h-full transition-all duration-150"
                      style={{
                        width: `${Math.max(0, Math.min(100, (hud.boss.hp / hud.boss.maxHp) * 100))}%`,
                        backgroundColor: hud.boss.isMegaBoss ? '#EF4444' : hud.boss.elementColor
                      }}
                    />
                    {hud.boss.isMegaBoss && (
                      <>
                        <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-white/40 pointer-events-none" />
                        <div className="absolute top-0 bottom-0 left-[65%] w-0.5 bg-white/40 pointer-events-none" />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ONLINE SQUAD ROSTER STRIP */}
              {hud.mode === 'online_coop' && hud.remoteAllies.length > 0 && (
                <OnlineSquadStrip allies={hud.remoteAllies} />
              )}
            </div>

            {/* AUTOMATIC TYPICAL MOBILE MOBA UI OVERLAY (Joystick + Radial Attack & Q/W/E/R Wheel) */}
            {touchControls && hud.screen === 'PLAYING' && (
              <MobileMobaControlsOverlay
                p1={hud.p1}
                onMove={(vx, vy) => engineRef.current?.setTouchMoveVector(vx, vy)}
                onAimFire={(angle, firing) => engineRef.current?.setTouchAimAndFire(angle, firing)}
                onTriggerAbility={(slot, aimAngle) => {
                  const slotIdx: 0 | 1 | 2 | 3 = slot === 'Q' ? 0 : slot === 'W' ? 1 : slot === 'E' ? 2 : 3;
                  engineRef.current?.triggerHeroAbility(1, slotIdx, aimAngle);
                }}
                onPing={() => engineRef.current?.triggerPlayerPing()}
                onOpenShop={() => setShowArmoryModal(true)}
              />
            )}

            {/* BOTTOM-CENTER LEAGUE OF LEGENDS PC MOBA HUD BAR (Or Compact Mobile Status Bar) */}
            <div className="flex flex-col items-center gap-1 pointer-events-auto">
              {hud.activePerks.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1 max-w-3xl">
                  {hud.activePerks.map((perk) => (
                    <div
                      key={perk.id}
                      className="px-2 py-0.5 bg-[#161224]/95 border text-[9px] font-mono uppercase tracking-wider flex items-center gap-1"
                      style={{ borderColor: perk.color, color: perk.color }}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{perk.name}</span>
                      {perk.stacks > 1 && <span className="text-white font-bold">x{perk.stacks}</span>}
                    </div>
                  ))}
                </div>
              )}

              {!touchControls ? (
                <LeaguePcBottomHudBar
                  p1={hud.p1}
                  onToggleControlScheme={() =>
                    handleSetPcControlScheme(profile.pcControlScheme === 'lol_mouse' ? 'wasd' : 'lol_mouse')
                  }
                  onTriggerAbility={(slot) => {
                    const slotIdx: 0 | 1 | 2 | 3 = slot === 'Q' ? 0 : slot === 'W' ? 1 : slot === 'E' ? 2 : 3;
                    engineRef.current?.triggerHeroAbility(1, slotIdx);
                  }}
                  onOpenShop={() => setShowArmoryModal(true)}
                />
              ) : (
                /* Compact bottom-center HP + 6-Item strip on Mobile MOBA UI so corners stay clear for thumbs */
                <div className="bg-[#161224]/90 border-2 border-[#3B3154] pixel-panel px-2.5 py-1 flex items-center gap-2 max-w-[68vw]">
                  <div className="min-w-[95px]">
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-white font-bold truncate">{hud.p1.className}</span>
                      <span className="text-emerald-400 tabular-nums">
                        {hud.p1.hp}/{hud.p1.maxHp}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#09070F] border border-[#3B3154] overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-emerald-400 transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, (hud.p1.hp / hud.p1.maxHp) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                      const item = hud.p1.equippedItems[slotIdx];
                      return (
                        <button
                          key={slotIdx}
                          type="button"
                          onClick={() => setShowArmoryModal(true)}
                          className="w-6 h-6 bg-[#09070F] border flex items-center justify-center text-[8px] font-mono font-bold"
                          style={{ borderColor: item ? item.color : '#3B3154', color: item ? item.color : '#475569' }}
                        >
                          {item ? item.shortName.slice(0, 2) : slotIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* ================================================================= */}
      {/* 3. CLASSZ MAIN HOME SCREEN (TITLE_MENU)                           */}
      {/* ================================================================= */}
      {hud && hud.screen === 'TITLE_MENU' && bootProgress >= 100 && (
        <ClassZHomeScene
          activeMenuIdx={activeMenuIdx}
          onHoverMenu={(idx) => {
            if (idx !== activeMenuIdx) {
              soundEngine.playUIClick();
              setActiveMenuIdx(idx);
            }
          }}
          onSelectMenu={(idx) => handleMenuAction(idx)}
          onPressStartPrompt={() => handleMenuAction(0)}
        />
      )}

      {/* ================================================================= */}
      {/* 3A. START SURVIVAL MODAL (EXACT 3-COLUMN PIXEL UI DESIGN)         */}
      {/* ================================================================= */}
      {showSurvivalModal && (
        <PixelHazardModal
          maxWidthClass="max-w-7xl"
          subtitle="START SURVIVAL - SELECT HERO CLASS, SKILLS & SECTOR"
          title={`DEPLOY TO DEFEND: ${currentOpClass.name} (${currentOpClass.archetype})`}
          onClose={() => setShowSurvivalModal(false)}
          headerRight={
            <div className="flex items-center gap-2.5 bg-[#0E100C] border-2 border-[#3E4335] px-3 py-1 font-mono text-xs tabular-nums">
              <div className="flex items-center gap-1.5">
                <span className="text-red-400 font-bold">RANK {profile.accountRank}</span>
                <span className="px-1.5 py-0.5 bg-[#991B1B] border border-[#F87171] text-white font-bold text-[10px] leading-none shadow-[0_2px_0_#450A0A]">
                  {profile.accountRank}
                </span>
              </div>
              <span className="text-[#3E4335]">|</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold" title="Gold Coins">
                <Coins className="w-3.5 h-3.5" /> {profile.currencies.gold.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold" title="Cursed Scrap">
                <Wrench className="w-3.5 h-3.5" /> {profile.currencies.scrap.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-bold" title="Soul Gems">
                <Gem className="w-3.5 h-3.5" /> {profile.currencies.gems.toLocaleString()}
              </span>
            </div>
          }
        >
          {/* 3-COLUMN MAIN DEPLOYMENT GRID (Matches image_951c4606.png) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* ============================================================= */}
            {/* COLUMN 1 (LEFT 5 COLS): 1. SELECT HERO ARCHETYPE + QWER GRID  */}
            {/* ============================================================= */}
            <div className="lg:col-span-5 bg-[#141612] border-2 border-[#4A4F3E] p-3 flex flex-col justify-between gap-3 relative shadow-[inset_0_0_0_2px_#0A0B09]">
              {/* Top-Right Red Indicator Light */}
              <span className="w-3 h-1 bg-[#FF2A4B] shadow-[0_0_6px_#FF2A4B] absolute top-2.5 right-3" />

              <div>
                <div className="mb-2.5 pr-6">
                  <div className="font-['Oswald',sans-serif] text-sm sm:text-base font-bold uppercase text-white tracking-wider">
                    1. SELECT HERO ARCHETYPE
                  </div>
                  <div className="text-xs text-slate-200 mt-0.5 font-medium">
                    Unique Signature Archetype: [Q][W][E][R] (Melee · Ranged · Tank · Healer · Mage)
                  </div>
                </div>

                {/* 5 Tall Vertical Hero Cards with Full-Body Pixel Art & Neon-Green Active Glow */}
                <div className="grid grid-cols-5 gap-1.5">
                  {OPERATOR_CLASS_LIST.map((op) => {
                    const active = profile.selectedClass === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => handleSelectOperatorClass(op.id)}
                        className={`p-1.5 flex flex-col items-center justify-between text-center cursor-pointer transition relative ${
                          active
                            ? 'bg-[#1D3824] border-2 border-[#4ADE80] shadow-[0_0_16px_rgba(74,222,128,0.65),inset_0_0_0_1px_#86EFAC]'
                            : 'bg-[#1B1E18] border-2 border-[#3E4335] hover:border-[#6E765F]'
                        }`}
                      >
                        <div className="w-full">
                          <div
                            className="font-['Oswald',sans-serif] text-[11px] sm:text-xs font-bold uppercase leading-tight"
                            style={{ color: active ? '#86EFAC' : op.color }}
                          >
                            {op.name}
                          </div>
                          <div className="text-[10px] font-mono font-semibold uppercase text-amber-300 mt-0.5">
                            {op.archetype.replace(' USER', '')}
                          </div>
                        </div>

                        {/* Full-Body Pixel Art Hero Illustration */}
                        <div className="my-1.5 relative flex items-center justify-center w-full py-1.5 bg-[#0D0F0C] border border-[#2C3026]">
                          <FullBodyHeroPixelArt classId={op.id} color={op.color} size={52} />
                          {active && (
                            <span className="absolute -bottom-1.5 px-1.5 py-0.5 bg-[#16A34A] border border-[#86EFAC] text-[9px] font-mono font-bold uppercase text-white leading-none">
                              active
                            </span>
                          )}
                        </div>

                        <div className="w-full pt-1 border-t border-[#2E3227] text-[10px] font-medium text-slate-100 leading-tight truncate">
                          {op.signatureWeaponName}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Unlimited Signature Attack + Green UPGRADE SKILLS Button + 2x2 QWER Grid */}
                <div className="mt-3 bg-[#1A1D17] border-2 border-[#393D32] p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-[180px]">
                      <div className="text-[11px] font-mono uppercase text-[#4ADE80] font-bold tracking-wider">
                        UNLIMITED SIGNATURE ATTACK
                      </div>
                      <div className="font-['Oswald',sans-serif] font-bold text-base uppercase text-white mt-0.5">
                        {currentOpClass.signatureWeaponName}
                      </div>
                      <p className="text-xs text-slate-100 leading-relaxed mt-0.5">
                        {currentOpClass.signatureWeaponDesc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSurvivalModal(false);
                        setItemCategoryFilter('abilities');
                        setShowArmoryModal(true);
                      }}
                      className="px-3.5 py-2 bg-[#22C55E] hover:bg-[#4ADE80] border-2 border-[#86EFAC] shadow-[0_3px_0_#064E3B,0_0_12px_rgba(34,197,94,0.45)] text-[#04140A] font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer shrink-0"
                    >
                      UPGRADE SKILLS
                    </button>
                  </div>

                  {/* 2x2 Grid of [Q] [W] [E] [R] Hero Skills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentOpClass.abilities.map((ab, idx) => {
                      const lv = profile.heroAbilityLevels[profile.selectedClass]?.[idx] || 1;
                      const effCd = ab.isPassive
                        ? 0
                        : Math.max(1.5, Number((ab.baseCooldown * (1 - (lv - 1) * 0.08)).toFixed(1)));
                      return (
                        <div
                          key={ab.id}
                          className="bg-[#11130F] border-2 p-2.5 flex flex-col justify-between"
                          style={{ borderColor: ab.color }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span
                                className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border"
                                style={{ borderColor: ab.color, color: ab.color, backgroundColor: '#090A08' }}
                              >
                                [{ab.slot}] {ab.isPassive ? 'INNATE PASSIVE' : `${effCd}S COOLDOWN`}
                              </span>
                              <span className="text-[10px] font-mono text-amber-300 font-bold">
                                LV.{lv}/5 (+{lv * 18}% PWR)
                              </span>
                            </div>
                            <div className="font-['Oswald',sans-serif] text-sm font-bold uppercase text-white mt-1.5 tracking-wide">
                              {ab.name}
                            </div>
                            <p className="text-xs text-slate-100 mt-1 leading-relaxed break-words">
                              {ab.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* COLUMN 2 (CENTER 4 COLS): CONTROLS, MODE, SECTOR & BOSS CTA   */}
            {/* ============================================================= */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              {/* 2. PC CONTROL SCHEME (Visual Keyboard Keycap Diagram) */}
              <div className="bg-[#141612] border-2 border-[#4A4F3E] p-3 relative shadow-[inset_0_0_0_2px_#0A0B09]">
                <span className="w-3 h-1 bg-[#FF2A4B] shadow-[0_0_6px_#FF2A4B] absolute top-2.5 right-3" />
                <div className="font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase text-white tracking-wider mb-2">
                  2. PC CONTROL SCHEME
                </div>

                <div className="flex flex-col items-center justify-center py-1 gap-1.5">
                  {/* Top Arrow / Mode Switcher Key */}
                  <button
                    type="button"
                    onClick={() =>
                      handleSetPcControlScheme(profile.pcControlScheme === 'wasd' ? 'lol_mouse' : 'wasd')
                    }
                    className="w-8 h-7 bg-[#262A21] border-2 border-[#6E765F] shadow-[0_2px_0_#080907] flex items-center justify-center text-emerald-400 font-mono text-xs font-bold cursor-pointer hover:brightness-110"
                    title="Click to toggle WASD vs LoL Mouse"
                  >
                    ↑
                  </button>
                  {/* W S D Keycaps */}
                  <div className="flex items-center gap-1.5">
                    {(['W', 'S', 'D'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleSetPcControlScheme('wasd')}
                        className={`w-8 h-7 border-2 shadow-[0_2px_0_#080907] flex items-center justify-center font-mono text-xs font-bold cursor-pointer ${
                          profile.pcControlScheme === 'wasd'
                            ? 'bg-[#363B2E] border-[#8A9478] text-white'
                            : 'bg-[#1A1D16] border-[#3E4335] text-slate-400'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  {/* Bottom Action Keycap Bar: [WASD] + [LMB] + [QWER] vs [LOL RMB] */}
                  <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() => handleSetPcControlScheme('wasd')}
                      className={`px-2 py-1 border-2 font-mono text-[10px] font-bold uppercase cursor-pointer ${
                        profile.pcControlScheme === 'wasd'
                          ? 'bg-[#2C3126] border-[#4ADE80] text-white'
                          : 'bg-[#171914] border-[#3E4335] text-slate-400'
                      }`}
                    >
                      WASD
                    </button>
                    <span className="text-xs font-mono text-slate-400">+</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSetPcControlScheme(profile.pcControlScheme === 'wasd' ? 'lol_mouse' : 'wasd')
                      }
                      className={`px-2 py-1 border-2 font-mono text-[10px] font-bold uppercase cursor-pointer ${
                        profile.pcControlScheme === 'lol_mouse'
                          ? 'bg-[#2C3126] border-[#4ADE80] text-emerald-300'
                          : 'bg-[#262A21] border-[#6E765F] text-white'
                      }`}
                    >
                      {profile.pcControlScheme === 'lol_mouse' ? 'RMB MOVE' : 'LMB'}
                    </button>
                    <span className="text-xs font-mono text-slate-400">+</span>
                    <span className="px-2 py-1 bg-[#262A21] border-2 border-[#6E765F] font-mono text-[10px] font-bold text-white">
                      QWER
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. SELECT GAME MODE */}
              <div className="bg-[#141612] border-2 border-[#4A4F3E] p-3 relative shadow-[inset_0_0_0_2px_#0A0B09]">
                <span className="w-3 h-1 bg-[#FF2A4B] shadow-[0_0_6px_#FF2A4B] absolute top-2.5 right-3" />
                <div className="font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase text-white tracking-wider mb-2">
                  3. SELECT GAME MODE
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'single', title: 'SOLO', sub: 'CAMPAIGN', tag: '(1P)' },
                      { id: 'coop', title: 'CO-OP', sub: 'LOCAL', tag: '(2P)' },
                      { id: 'online_coop', title: 'COVEN', sub: 'ONLINE', tag: '(10P)' },
                      { id: 'deathmatch', title: 'DUEL', sub: 'PVP', tag: '(2P)' }
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setMode(item.id);
                        if (item.id === 'online_coop') {
                          setShowSurvivalModal(false);
                          setShowMultiplayerModal(true);
                        }
                      }}
                      className={`py-2.5 px-1.5 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                        mode === item.id ? 'pixel-btn-red-active' : 'pixel-card hover:brightness-110'
                      }`}
                    >
                      <div className="font-['Oswald',sans-serif] text-xs font-bold uppercase text-white">
                        {item.title}
                      </div>
                      <div className="text-[9px] font-mono uppercase text-slate-200 mt-0.5">{item.sub}</div>
                      <div className="text-[9px] font-mono text-amber-300 mt-0.5">{item.tag}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. SELECT DEFENSE SECTOR (With 16-Bit Pixel Art Scene Thumbnails) */}
              <div className="bg-[#141612] border-2 border-[#4A4F3E] p-3 relative shadow-[inset_0_0_0_2px_#0A0B09]">
                <span className="w-3 h-1 bg-[#FF2A4B] shadow-[0_0_6px_#FF2A4B] absolute top-2.5 right-3" />
                <div className="font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase text-white tracking-wider mb-2">
                  4. SELECT DEFENSE SECTOR
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'boxy' as ArenaId, title: 'HAUNTED', badge: '', diff: 'Standard' },
                      { id: 'columns' as ArenaId, title: 'CURSED PUMPKIN', badge: '', diff: 'Tactical' },
                      { id: 'hell' as ArenaId, title: 'INFERNAL', badge: 'NIGHTMARE', diff: 'Nightmare' }
                    ] as const
                  ).map((sec) => {
                    const selected = arenaId === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setArenaId(sec.id)}
                        className={`p-2 text-center transition cursor-pointer flex flex-col items-center justify-between ${
                          selected ? 'pixel-btn-red-active' : 'pixel-card hover:brightness-110'
                        }`}
                      >
                        <div className="min-h-[28px] flex flex-col items-center justify-center">
                          <span className="font-['Oswald',sans-serif] text-[10px] font-bold uppercase text-white leading-tight">
                            {sec.title}
                          </span>
                          {sec.badge && (
                            <span className="text-[8px] font-mono uppercase text-red-400 font-bold leading-none mt-0.5">
                              {sec.badge}
                            </span>
                          )}
                        </div>

                        <div className="my-1.5 w-full border border-[#3E4335] bg-[#090A08] overflow-hidden flex items-center justify-center">
                          <SectorPixelThumbnail arenaId={sec.id} />
                        </div>

                        <span className="text-[10px] font-mono text-slate-200">{sec.diff}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Deploy Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleStartMatch(false)}
                  className="w-full py-3 px-4 bg-[#22C55E] hover:bg-[#4ADE80] border-2 border-[#86EFAC] shadow-[0_3px_0_#064E3B,0_0_16px_rgba(34,197,94,0.5)] text-[#051209] font-['Oswald',sans-serif] text-sm font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>
                    {mode === 'online_coop'
                      ? 'OPEN 10P COVEN LOBBY'
                      : `START SURVIVAL (${currentOpClass.name})`}
                  </span>
                </button>

                {mode !== 'deathmatch' && (
                  <button
                    type="button"
                    onClick={() => handleStartMatch(true)}
                    className="w-full py-2.5 px-4 pixel-btn-red-active text-white font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>DEPLOY DIRECTLY TO WAVE 5 MEGA BOSS</span>
                  </button>
                )}
              </div>
            </div>

            {/* ============================================================= */}
            {/* COLUMN 3 (RIGHT 3 COLS): EQUIPPED ARSENAL & 2-TIER BOSS INTEL */}
            {/* ============================================================= */}
            <div className="lg:col-span-3 flex flex-col justify-between gap-3">
              {/* Top Panel: PASSIVE RELICS · EQUIPPED ARSENAL (3 / 6) */}
              <div className="bg-[#141612] border-2 border-[#4A4F3E] p-3 relative shadow-[inset_0_0_0_2px_#0A0B09] space-y-2.5">
                <span className="w-3 h-1 bg-[#FF2A4B] shadow-[0_0_6px_#FF2A4B] absolute top-2.5 right-3" />
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-slate-300 font-semibold">
                    PASSIVE RELICS
                  </div>
                  <div className="font-['Oswald',sans-serif] text-base font-bold uppercase text-white mt-0.5 whitespace-nowrap">
                    EQUIPPED ARSENAL ({profile.equippedItems.length} / 6)
                  </div>
                </div>

                {/* 6-Slot Item Inventory Preview with Pixel-Art Relic Icons */}
                <div className="grid grid-cols-6 gap-1">
                  {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                    const itemId = profile.equippedItems[slotIdx];
                    const def = itemId ? MOBA_ITEM_BY_ID[itemId] : null;
                    const st = itemId ? profile.items[itemId] : null;
                    return (
                      <button
                        key={slotIdx}
                        type="button"
                        onClick={() => {
                          setShowSurvivalModal(false);
                          setShowArmoryModal(true);
                        }}
                        className="aspect-square bg-[#0D0F0C] border-2 flex flex-col items-center justify-between p-1 cursor-pointer hover:brightness-110 transition"
                        style={{ borderColor: def ? def.color : '#2E3227' }}
                        title={def ? `${def.name} (Lv.${st?.upgradeLevel || 1}): ${def.passiveDesc}` : 'Empty Item Slot'}
                      >
                        {def && itemId ? (
                          <>
                            <div className="flex-1 flex items-center justify-center">
                              <ItemPixelIcon itemId={itemId} color={def.color} size={22} />
                            </div>
                            <span className="font-mono text-[9px] font-bold uppercase text-white truncate max-w-full leading-none">
                              {def.shortName.slice(0, 5)}
                            </span>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">EMPTY</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowSurvivalModal(false);
                    setShowArmoryModal(true);
                  }}
                  className="w-full py-2.5 pixel-btn-olive font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer"
                >
                  OPEN ARSENAL
                </button>
              </div>

              {/* Bottom Panel: TWO-TIER BOSS THREAT PROTOCOL */}
              <div className="bg-[#141612] border-2 border-[#4A4F3E] p-3 relative shadow-[inset_0_0_0_2px_#0A0B09] flex-1 flex flex-col justify-between space-y-2">
                <span className="w-3 h-1 bg-[#FF2A4B] shadow-[0_0_6px_#FF2A4B] absolute top-2.5 right-3" />
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold">
                    TWO-TIER BOSS THREAT PROTOCOL
                  </div>
                  <p className="text-xs text-slate-100 leading-relaxed mt-1">
                    <span className="text-amber-300 font-bold">Every Wave End:</span> Armored Undead Warden Boss spawns at the end of every wave.
                  </p>
                </div>

                <div className="space-y-1.5">
                  {ELEMENTAL_BOSS_CONFIGS.map((cfg, i) => (
                    <div
                      key={cfg.element}
                      className="bg-[#1B1E18] border-2 border-[#32362B] px-2.5 py-2 flex items-center justify-between gap-2"
                    >
                      <span
                        className="font-['Oswald',sans-serif] text-xs font-bold uppercase leading-tight"
                        style={{ color: cfg.color }}
                      >
                        WAVE {(i + 1) * 5}: {cfg.name}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0 font-mono text-xs font-bold">
                        <span style={{ color: '#EF4444' }}>↓</span>
                        <span style={{ color: cfg.color }}>↓</span>
                        <span className="text-slate-500">↓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 3B. LOAD GAME MODAL (MATCHES image_f57232f3.png)                  */}
      {/* ================================================================= */}
      {showLoadGameModal && (
        <PixelHazardModal
          maxWidthClass="max-w-3xl"
          subtitle="LOCAL STORAGE AUTO-SAVE & SAVE CODE BACKUP"
          title="LOAD SAVED SURVIVAL PROFILE"
          onClose={() => setShowLoadGameModal(false)}
        >
          {/* Active Saved Profile Card */}
          <div className="pixel-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-14 h-14 bg-[#0B0C0A] border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: currentOpClass.color }}
              >
                <HeroPixelPortrait classId={currentOpClass.id} color={currentOpClass.color} size={48} />
              </div>
              <div>
                <div className="flex flex-col items-start gap-1">
                  <span className="px-2 py-0.5 bg-[#0E1E14] border-2 border-emerald-400 text-emerald-300 font-mono text-[10px] font-bold uppercase">
                    SLOT 1 - AUTO-SAVED
                  </span>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    HUNTER RANK {profile.accountRank} ({profile.accountXp}/{profile.accountXpToNext} XP)
                  </span>
                </div>
                <div className="font-['Oswald',sans-serif] text-base sm:text-lg font-bold uppercase text-white mt-1 leading-snug">
                  {currentOpClass.name} - {currentOpClass.signatureWeaponName}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 font-mono text-xs tabular-nums">
                  <span className="text-amber-400 font-bold">{profile.currencies.gold.toLocaleString()} Gold</span>
                  <span className="text-emerald-400 font-bold">{profile.currencies.scrap.toLocaleString()} Scrap</span>
                  <span className="text-purple-400 font-bold">{profile.currencies.gems.toLocaleString()} Gems</span>
                </div>
                <div className="text-xs text-slate-200 mt-1">
                  {profile.equippedItems.length}/6 Arsenal Items · Skills Lv.
                  {(profile.heroAbilityLevels[profile.selectedClass] || [1, 1, 1, 1]).join('/')}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => handleStartMatch(false)}
                className="px-5 py-2.5 pixel-btn-red-active font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                RESUME SURVIVAL (WAVE 1)
              </button>
              <button
                type="button"
                onClick={() => handleStartMatch(true)}
                className="px-5 py-2 pixel-btn-olive text-white font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                LOAD WAVE 5 BOSS CHECKPOINT
              </button>
            </div>
          </div>

          {/* Sector High Scores & Best Waves */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-2">
              SAVED SECTOR RECORDS (CLICK SECTOR TO SELECT):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {Object.values(ARENA_DEFINITIONS).map((arena) => {
                const rec = BoxheadEngine.getHighScore('single', arena.id);
                const selected = arenaId === arena.id;
                return (
                  <button
                    key={arena.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playUIClick();
                      setArenaId(arena.id);
                    }}
                    className={`text-left p-3 transition cursor-pointer ${
                      selected ? 'pixel-btn-red-active' : 'pixel-card hover:brightness-110'
                    }`}
                  >
                    <div
                      className="font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase"
                      style={{ color: selected ? '#FF4D6A' : '#FFFFFF' }}
                    >
                      {arena.name}
                    </div>
                    <div className="text-xs font-mono text-amber-300 mt-1 tabular-nums">
                      High Score: {rec.highScore.toLocaleString()}
                    </div>
                    <div className="text-xs font-mono text-emerald-400 tabular-nums">
                      Best Wave: Wave {rec.maxWave}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Code Export / Import */}
          <div className="pixel-subpanel p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                EXPORT / IMPORT CLASSZ SAVE CODE
              </span>
              <button
                type="button"
                onClick={handleCopySaveCode}
                className="px-3 py-1.5 pixel-btn-olive font-mono text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> COPY SAVE CODE
              </button>
            </div>
            <textarea
              value={saveCodeInput}
              onChange={(e) => setSaveCodeInput(e.target.value)}
              rows={3}
              placeholder="Paste your ClassZ Save Code here to restore Hunter Rank, Gold, Items & Skill Levels..."
              className="w-full p-2.5 bg-[#090A08] border-2 border-[#4A4F3E] text-xs font-mono text-emerald-300 focus:outline-none focus:border-amber-400"
            />
            {saveCodeFeedback && (
              <div
                className={`px-3 py-1.5 text-xs font-mono border-2 ${
                  saveCodeFeedback.ok
                    ? 'bg-[#0E1E14] border-emerald-400 text-emerald-300'
                    : 'bg-[#241014] border-red-400 text-red-300'
                }`}
              >
                {saveCodeFeedback.text}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleImportSaveCode}
                className="px-4 py-2 pixel-btn-red-active font-mono text-xs font-bold uppercase cursor-pointer"
              >
                LOAD SAVE CODE
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoadGameModal(false);
                  setShowSurvivalModal(true);
                }}
                className="px-4 py-2 pixel-btn-olive font-mono text-xs font-bold uppercase cursor-pointer"
              >
                CHANGE HERO CLASS & SKILLS
              </button>
            </div>
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 3C. QUIT / COMMAND EXIT MODAL                                     */}
      {/* ================================================================= */}
      {showQuitModal && (
        <PixelHazardModal
          maxWidthClass="max-w-md"
          subtitle="COMMAND TERMINAL · EXIT PROTOCOL"
          title="ABANDON DEFENSE POST?"
          onClose={() => setShowQuitModal(false)}
        >
          <div className="pixel-subpanel p-4 text-center space-y-4">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Your Hunter Rank ({profile.accountRank}), {profile.currencies.gold.toLocaleString()} Gold, Equipped Arsenal, and Hero Skill Levels are automatically saved in local storage.
            </p>
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUIClick();
                  setShowQuitModal(false);
                }}
                className="w-full py-3 pixel-btn-red-active font-['Oswald',sans-serif] text-sm font-bold uppercase tracking-wider cursor-pointer"
              >
                STAY & DEFEND (RETURN TO MENU)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUIClick();
                  setShowQuitModal(false);
                  engineRef.current?.setScreen('LOADING');
                }}
                className="w-full py-2.5 pixel-btn-olive font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                RETURN TO BOOT SCREEN
              </button>
              <button
                type="button"
                onClick={handleResetProfile}
                className="w-full py-2 bg-[#2B1216] hover:bg-[#3D181E] border-2 border-red-500 text-red-300 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                RESET SAVE DATA TO DEFAULT
              </button>
            </div>
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 4. ARSENAL: CURSED ITEM SHOP & HERO ABILITIES (image_6ec1db3d.png)*/}
      {/* ================================================================= */}
      {showArmoryModal && (
        <PixelHazardModal
          maxWidthClass="max-w-5xl"
          subtitle={`CLASSZ HERO: ${currentOpClass.name} (${currentOpClass.archetype}) · SIGNATURE WEAPON: ${currentOpClass.signatureWeaponName}`}
          title="ARSENAL - CURSED ITEM SHOP & HERO ABILITIES"
          onClose={() => setShowArmoryModal(false)}
          headerRight={
            <div className="flex items-center gap-2.5 pixel-subpanel px-3 py-1.5 font-mono text-xs tabular-nums">
              <span className="text-amber-300 font-bold">RANK {profile.accountRank}</span>
              <span className="text-[#4F5544]">|</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold" title="Gold Coins">
                <Coins className="w-3.5 h-3.5" /> {profile.currencies.gold.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold" title="Cursed Scrap">
                <Wrench className="w-3.5 h-3.5" /> {profile.currencies.scrap.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-bold" title="Soul Gems">
                <Gem className="w-3.5 h-3.5" /> {profile.currencies.gems.toLocaleString()}
              </span>
            </div>
          }
        >
          {/* Quick 5-Hero Archetype Switcher inside Arsenal (Neon-Green Active Frame) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {OPERATOR_CLASS_LIST.map((op) => {
              const active = profile.selectedClass === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => handleSelectOperatorClass(op.id)}
                  className={`p-2 flex items-center gap-2 text-left cursor-pointer transition ${
                    active
                      ? 'bg-[#1D3824] border-2 border-[#4ADE80] shadow-[0_0_16px_rgba(74,222,128,0.65),inset_0_0_0_1px_#86EFAC]'
                      : 'pixel-card opacity-85 hover:opacity-100'
                  }`}
                >
                  <div
                    className="w-8 h-8 bg-[#0B0C0A] border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: active ? '#4ADE80' : op.color }}
                  >
                    <HeroPixelPortrait classId={op.id} color={op.color} size={28} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-['Oswald',sans-serif] text-xs font-bold uppercase text-white truncate">
                      {op.name}
                    </div>
                    <div
                      className="text-[9px] font-mono uppercase truncate"
                      style={{ color: active ? '#86EFAC' : op.color }}
                    >
                      ({op.archetype.replace(' USER', '')})
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 6-Slot Equipped Item Inventory Strip + Stats Row (Matches image_6ec1db3d.png) */}
          <div className="pixel-subpanel p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                6-SLOT INVENTORY ({profile.equippedItems.length}/6):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                  const itemId = profile.equippedItems[slotIdx];
                  const def = itemId ? MOBA_ITEM_BY_ID[itemId] : null;
                  const st = itemId ? profile.items[itemId] : null;
                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      onClick={() => itemId && handleToggleEquipItem(itemId)}
                      className="px-2.5 py-1 bg-[#141612] border-2 text-xs font-mono flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                      style={{ borderColor: def ? def.color : '#3E4335', color: def ? def.color : '#64748B' }}
                      title={def ? `Click to unequip ${def.name}` : 'Empty Slot'}
                    >
                      <span className="font-bold">{def ? def.shortName : `SLOT ${slotIdx + 1}`}</span>
                      {def && <span className="text-[10px] text-white">Lv.{st?.upgradeLevel || 1}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs tabular-nums">
              <span className="text-emerald-400 font-bold">{currentHeroStats.maxHp} HP</span>
              <span className="text-orange-400 font-bold">{currentHeroStats.attackDamage} AD</span>
              <span className="text-purple-400 font-bold">{currentHeroStats.abilityPower} AP</span>
              <span className="text-cyan-400 font-bold">{currentHeroStats.attackSpeed}/s AS</span>
              <span className="text-sky-400 font-bold">{Math.round(currentHeroStats.armorReduction * 100)}% ARMOR</span>
            </div>
          </div>

          {/* Category Filter Tabs + Hero Skills Subtitle Row (Matches image_6ec1db3d.png) */}
          <div className="space-y-2 pb-2 border-b-2 border-[#393D32]">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: `ALL CURSED ITEMS (${MOBA_ITEMS.length})` },
                  { id: 'OFFENSE', label: 'OFFENSE & CRIT' },
                  { id: 'MAGIC', label: 'ELDRITCH & AP' },
                  { id: 'DEFENSE', label: 'TANK & THORNS' },
                  { id: 'UTILITY', label: 'SPEED & REGEN' }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setItemCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                    itemCategoryFilter === tab.id ? 'pixel-btn-red-active font-bold' : 'pixel-btn-olive'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setItemCategoryFilter(itemCategoryFilter === 'abilities' ? 'all' : 'abilities')
                }
                className={`text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition ${
                  itemCategoryFilter === 'abilities'
                    ? 'text-[#4ADE80] underline'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                {currentOpClass.name} [Q][W][E][R] SKILLS {itemCategoryFilter === 'abilities' ? '(ACTIVE VIEW)' : '→ CLICK TO UPGRADE SKILLS'}
              </button>
            </div>
          </div>

          {armoryFeedback && (
            <div
              className={`px-3 py-1.5 text-xs font-mono border-2 ${
                armoryFeedback.ok
                  ? 'bg-[#0E1E14] border-emerald-400 text-emerald-300'
                  : 'bg-[#241014] border-red-400 text-red-300'
              }`}
            >
              {armoryFeedback.text}
            </div>
          )}

          {itemCategoryFilter === 'abilities' ? (
            /* HERO ABILITY ALTAR (Upgrade Q, W, E, R to Lv.5) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentOpClass.abilities.map((ab, idx) => {
                const slotIdx = idx as 0 | 1 | 2 | 3;
                const lv = profile.heroAbilityLevels[profile.selectedClass]?.[slotIdx] || 1;
                const cost = progressionManager.getHeroAbilityUpgradeCost(profile.selectedClass, slotIdx);
                const canAfford = lv < 5 && progressionManager.canAfford(cost);

                return (
                  <div
                    key={ab.id}
                    className="p-4 pixel-card flex flex-col justify-between"
                    style={{ borderColor: ab.color }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="px-2 py-0.5 font-mono text-xs font-bold uppercase border-2"
                          style={{ borderColor: ab.color, color: ab.color, backgroundColor: '#0A0B09' }}
                        >
                          [{ab.slot}] {ab.isPassive ? 'INNATE PASSIVE TRAIT' : `ACTIVE SKILL · ${ab.baseCooldown}S CD`}
                        </span>
                        <span className="px-2 py-0.5 bg-[#0B0C0A] border-2 border-amber-400 text-amber-300 font-mono text-xs font-bold">
                          LV.{lv}/5
                        </span>
                      </div>
                      <h3 className="font-['Oswald',sans-serif] text-base sm:text-lg font-bold uppercase text-white mt-2">
                        {ab.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">{ab.description}</p>
                      <div className="mt-3 pt-2 border-t-2 border-[#2D3127] text-xs font-mono text-emerald-400">
                        Level Bonus: +{lv * 18}% Skill Power & -{(lv - 1) * 8}% Cooldown
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t-2 border-[#2D3127]">
                      {lv < 5 ? (
                        <button
                          type="button"
                          onClick={() => handleUpgradeHeroAbility(slotIdx)}
                          disabled={!canAfford}
                          className={`w-full py-2.5 px-3 font-mono text-xs font-bold uppercase flex items-center justify-between transition cursor-pointer ${
                            canAfford
                              ? 'pixel-btn-red-active'
                              : 'pixel-subpanel text-slate-500 cursor-not-allowed opacity-70'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <ArrowUpCircle className="w-4 h-4" /> RANK UP [{ab.slot}] TO LV.{lv + 1}
                          </span>
                          <span className="flex items-center gap-2 tabular-nums text-amber-300">
                            <span>{cost.gold}G</span>
                            <span>{cost.scrap}S</span>
                            {cost.gems > 0 && <span>{cost.gems} GEM</span>}
                          </span>
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 bg-[#0E1E14] border-2 border-emerald-400 text-emerald-300 font-mono text-xs font-bold uppercase text-center">
                          ★ MAX RANK (LV.5 MASTERED)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* CURSED MOBA ITEMS GRID WITH 16-BIT PIXEL ART RELIC ICONS (Matches image_6ec1db3d.png) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MOBA_ITEMS.filter(
                (item) => itemCategoryFilter === 'all' || item.category === itemCategoryFilter
              ).map((item) => {
                const state = profile.items[item.id] || { unlocked: false, upgradeLevel: 1 };
                const isEquipped = profile.equippedItems.includes(item.id);
                const upgradeCost = progressionManager.getItemUpgradeCost(item.id);
                const canUnlock = !state.unlocked && progressionManager.canAfford(item.unlockCost);
                const canUpgrade = state.unlocked && state.upgradeLevel < 5 && progressionManager.canAfford(upgradeCost);
                const scale = 1 + (state.upgradeLevel - 1) * 0.22;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 flex flex-col justify-between transition ${
                      isEquipped
                        ? 'pixel-card border-[#D97706]'
                        : state.unlocked
                        ? 'pixel-card'
                        : 'pixel-subpanel opacity-95'
                    }`}
                  >
                    <div>
                      {/* Top Header: Pixel-Art Relic Icon + Item Title + Level/Equipped Badge */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className="w-11 h-11 bg-[#0B0C0A] border-2 flex items-center justify-center shrink-0"
                            style={{ borderColor: item.color }}
                          >
                            <ItemPixelIcon itemId={item.id} color={item.color} size={36} />
                          </div>
                          <div className="min-w-0">
                            <span
                              className="font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase leading-tight block break-words"
                              style={{ color: item.color }}
                            >
                              {item.name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0 flex flex-col items-end gap-1">
                          {state.unlocked ? (
                            <>
                              <span className="px-2 py-0.5 bg-[#0B0C0A] border-2 border-amber-400 text-amber-300 text-[10px] font-bold">
                                Lv.{state.upgradeLevel}/5
                              </span>
                              {isEquipped && (
                                <span className="text-emerald-400 font-mono text-[9px] uppercase font-bold">
                                  EQUIPPED
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#0B0C0A] border-2 border-[#4A4F3E] text-slate-400 text-[10px]">
                              LOCKED
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-amber-200/90 uppercase mt-2">
                        {item.category} RELIC - PASSIVE: {item.passiveName}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-snug">{item.passiveDesc}</p>

                      {/* Item Stat Bonuses */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t-2 border-[#2D3127] text-[10px] font-mono">
                        {item.stats.bonusHp && (
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-[#3A3E32] text-emerald-400">
                            +{Math.round(item.stats.bonusHp * scale)} HP
                          </span>
                        )}
                        {item.stats.attackDamagePct && (
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-[#3A3E32] text-orange-400">
                            +{Math.round(item.stats.attackDamagePct * scale)}% AD
                          </span>
                        )}
                        {item.stats.abilityPowerPct && (
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-[#3A3E32] text-purple-400">
                            +{Math.round(item.stats.abilityPowerPct * scale)}% AP
                          </span>
                        )}
                        {item.stats.attackSpeedPct && (
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-[#3A3E32] text-cyan-400">
                            +{Math.round(item.stats.attackSpeedPct * scale)}% ASPD
                          </span>
                        )}
                        {item.stats.moveSpeedPct && (
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-[#3A3E32] text-amber-300">
                            +{Math.round(item.stats.moveSpeedPct * scale)}% SPD
                          </span>
                        )}
                        {item.stats.armorPct && (
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-[#3A3E32] text-sky-400">
                            +{Math.round(item.stats.armorPct * scale)}% ARMOR
                          </span>
                        )}
                        {item.stats.cooldownHastePct && (
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-[#3A3E32] text-pink-400">
                            +{Math.round(item.stats.cooldownHastePct * scale)}% CDR
                          </span>
                        )}
                        {item.stats.lifestealPct && (
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-[#3A3E32] text-rose-400">
                            +{Math.round(item.stats.lifestealPct * scale)}% VAMP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unlock, Equip/Unequip, and Upgrade Actions */}
                    <div className="mt-3 pt-2.5 border-t-2 border-[#2D3127] flex flex-col gap-1.5">
                      {!state.unlocked ? (
                        <button
                          type="button"
                          onClick={() => handleUnlockItem(item.id)}
                          disabled={!canUnlock}
                          className={`w-full py-2 px-3 font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition cursor-pointer ${
                            canUnlock
                              ? 'pixel-btn-olive border-[#86EFAC]'
                              : 'pixel-btn-olive opacity-75 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-white">FORGE ITEM -</span>
                          <span className="flex items-center gap-1.5 tabular-nums">
                            {item.unlockCost.gold > 0 && <span className="text-amber-300">{item.unlockCost.gold}G</span>}
                            {item.unlockCost.scrap > 0 && <span className="text-emerald-300">{item.unlockCost.scrap}S</span>}
                            {item.unlockCost.gems > 0 && <span className="text-purple-300">{item.unlockCost.gems}GEMS</span>}
                          </span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleEquipItem(item.id)}
                            className="py-2 px-2 font-mono text-[11px] font-bold uppercase cursor-pointer transition pixel-btn-red-active text-center"
                          >
                            {isEquipped ? 'UNEQUIP' : 'EQUIP'}
                          </button>

                          {state.upgradeLevel < 5 ? (
                            <button
                              type="button"
                              onClick={() => handleUpgradeItem(item.id)}
                              disabled={!canUpgrade}
                              className={`py-2 px-2 font-mono text-[11px] font-bold uppercase cursor-pointer transition text-center ${
                                canUpgrade
                                  ? 'pixel-btn-olive text-white'
                                  : 'pixel-btn-olive opacity-70 cursor-not-allowed'
                              }`}
                            >
                              LV.{state.upgradeLevel + 1} - {upgradeCost.gold}G
                            </button>
                          ) : (
                            <div className="py-2 px-2 bg-[#0E1E14] border-2 border-emerald-400 text-emerald-300 font-mono text-[10px] font-bold uppercase text-center">
                              MAX LV.5
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 5. 4-TAB HALLOWEEN SETTINGS MODAL                                 */}
      {/* ================================================================= */}
      {showSettingsModal && (
        <PixelHazardModal
          maxWidthClass="max-w-2xl"
          subtitle="SYSTEM CONFIGURATION · AUDIO, CONTROLS & PIXEL CRT"
          title="OPTIONS · COMMAND TERMINAL SETTINGS"
          onClose={() => setShowSettingsModal(false)}
        >
          {/* 4 Settings Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pixel-subpanel p-1.5">
            {(['gameplay', 'accessibility', 'graphics', 'sound'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSettingsTab(tab)}
                className={`py-2 font-['Oswald',sans-serif] text-xs uppercase tracking-wider transition cursor-pointer ${
                  settingsTab === tab ? 'pixel-btn-red-active font-bold' : 'pixel-btn-olive'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-3 text-sm">
            {settingsTab === 'gameplay' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pixel-card p-3.5">
                  <div>
                    <div className="font-bold text-white uppercase font-mono text-xs">PC Movement & Control Scheme</div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Choose League of Legends Right-Click Move/Attack or WASD Movement. [Q][W][E] always Smart Cast at cursor.
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetPcControlScheme('lol_mouse')}
                      className={`px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                        profile.pcControlScheme === 'lol_mouse' ? 'pixel-btn-red-active font-bold' : 'pixel-btn-olive'
                      }`}
                    >
                      LoL Mouse (RMB)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPcControlScheme('wasd')}
                      className={`px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                        profile.pcControlScheme === 'wasd' ? 'pixel-btn-red-active font-bold' : 'pixel-btn-olive'
                      }`}
                    >
                      WASD Move
                    </button>
                  </div>
                </div>
                <SettingToggleRow
                  title="P1 Mouse Cursor Aiming"
                  desc="Aim primary attacks and Q/W/E abilities directly toward the mouse cursor on PC."
                  checked={settings.mouseAim}
                  onChange={(v) => handleUpdateSetting('mouseAim', v)}
                />
                <div className="flex items-center justify-between pixel-card p-3.5 gap-3">
                  <div>
                    <div className="font-bold text-white uppercase font-mono text-xs">Compact Notification Corner</div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Keep wave, boss, and blood-moon alerts out of the center of your screen.
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {(['top-right', 'top-left'] as const).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handleUpdateSetting('notificationPosition', pos)}
                        className={`px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                          settings.notificationPosition === pos ? 'pixel-btn-red-active font-bold' : 'pixel-btn-olive'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
                <SettingToggleRow
                  title="Co-op Friendly Fire"
                  desc="Allow player projectiles and pumpkin blasts to damage teammates in 2P Co-op."
                  checked={settings.friendlyFire}
                  onChange={(v) => handleUpdateSetting('friendlyFire', v)}
                />
              </>
            )}

            {settingsTab === 'accessibility' && (
              <>
                <div className="flex items-center justify-between pixel-card p-3.5 gap-3">
                  <div>
                    <div className="font-bold text-white uppercase font-mono text-xs">Colorblind Filter Mode</div>
                    <div className="text-xs text-slate-300 mt-0.5">Adjusts palette contrast for elemental telegraphs.</div>
                  </div>
                  <select
                    value={settings.colorblindMode}
                    onChange={(e) => handleUpdateSetting('colorblindMode', e.target.value as any)}
                    className="bg-[#0B0C0A] border-2 border-[#616755] px-3 py-1.5 text-xs font-mono uppercase text-white"
                  >
                    <option value="none">None</option>
                    <option value="protanopia">Protanopia</option>
                    <option value="deuteranopia">Deuteranopia</option>
                    <option value="tritanopia">Tritanopia</option>
                  </select>
                </div>

                <div className="pixel-card p-3.5">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-bold text-white uppercase font-mono text-xs">Screen Shake Intensity</span>
                    <span className="font-mono text-xs text-amber-400 tabular-nums">
                      {settings.screenShakeIntensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.screenShakeIntensity}
                    onChange={(e) => handleUpdateSetting('screenShakeIntensity', Number(e.target.value))}
                    className="w-full accent-[#FF2A4B] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pixel-card p-3.5 gap-3">
                  <div>
                    <div className="font-bold text-white uppercase font-mono text-xs">HUD Scale</div>
                    <div className="text-xs text-slate-300 mt-0.5">Adjusts HUD text and scoreboard sizing.</div>
                  </div>
                  <div className="flex gap-1.5">
                    {(['compact', 'normal', 'large'] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => handleUpdateSetting('uiScale', sc)}
                        className={`px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                          settings.uiScale === sc ? 'pixel-btn-red-active font-bold' : 'pixel-btn-olive'
                        }`}
                      >
                        {sc}
                      </button>
                    ))}
                  </div>
                </div>

                <SettingToggleRow
                  title="High-Contrast Zombie Outlines"
                  desc="Renders bright threat rings around Elite Zombies and Raid Bosses."
                  checked={settings.highContrastOutlines}
                  onChange={(v) => handleUpdateSetting('highContrastOutlines', v)}
                />
                <SettingToggleRow
                  title="Reduced Motion"
                  desc="Disables camera recoil kicks and rapid screen-flash effects."
                  checked={settings.reducedMotion}
                  onChange={(v) => handleUpdateSetting('reducedMotion', v)}
                />
              </>
            )}

            {settingsTab === 'graphics' && (
              <>
                <div className="flex items-center justify-between pixel-card p-3.5 gap-3">
                  <div>
                    <div className="font-bold text-white uppercase font-mono text-xs">16-Bit Particle Density</div>
                    <div className="text-xs text-slate-300 mt-0.5">Controls pumpkin embers, muzzle smoke, and bone debris.</div>
                  </div>
                  <div className="flex gap-1.5">
                    {(['low', 'medium', 'high'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleUpdateSetting('particleDensity', d)}
                        className={`px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                          settings.particleDensity === d ? 'pixel-btn-red-active font-bold' : 'pixel-btn-olive'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <SettingToggleRow
                  title="Persistent Floor Blood & Scorch Decals"
                  desc="Render zombie ichor splatters and blast craters across the graveyard floor."
                  checked={settings.bloodDecals}
                  onChange={(v) => handleUpdateSetting('bloodDecals', v)}
                />
                <SettingToggleRow
                  title="Dynamic Lantern & Boss Glow"
                  desc="Enable radial lighting on jack-o'-lanterns, ectoplasm, and boss attacks."
                  checked={settings.dynamicGlow}
                  onChange={(v) => handleUpdateSetting('dynamicGlow', v)}
                />
                <SettingToggleRow
                  title="Floating Damage & Loot Numbers"
                  desc="Display per-hit damage popups and elemental weakness indicators."
                  checked={settings.floatingDamageNumbers}
                  onChange={(v) => handleUpdateSetting('floatingDamageNumbers', v)}
                />
              </>
            )}

            {settingsTab === 'sound' && (
              <>
                <SettingToggleRow
                  title="Master Audio Mute"
                  desc="Silence all synthesized sound effects and background music."
                  checked={settings.muted}
                  onChange={(v) => handleUpdateSetting('muted', v)}
                />

                <div className="pixel-card p-3.5">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-bold text-white uppercase font-mono text-xs">Background Music (BGM) Volume</span>
                    <span className="font-mono text-xs text-amber-400 tabular-nums">{settings.musicVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.musicVolume}
                    onChange={(e) => handleUpdateSetting('musicVolume', Number(e.target.value))}
                    className="w-full accent-[#FF2A4B] cursor-pointer"
                  />
                </div>

                <div className="pixel-card p-3.5">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-bold text-white uppercase font-mono text-xs">Combat SFX Volume</span>
                    <span className="font-mono text-xs text-emerald-400 tabular-nums">{settings.sfxVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.sfxVolume}
                    onChange={(e) => handleUpdateSetting('sfxVolume', Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pixel-card p-3.5 gap-3">
                  <div>
                    <div className="font-bold text-white uppercase font-mono text-xs">Procedural Chiptune Synth Style</div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Dynamic 16-step Web Audio sequencer adapts to Menu, Horde, and Boss waves.
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {(['industrial', 'synthwave', 'off'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateSetting('bgmStyle', st)}
                        className={`px-3 py-1.5 font-mono text-xs uppercase cursor-pointer ${
                          settings.bgmStyle === st ? 'pixel-btn-red-active font-bold' : 'pixel-btn-olive'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 6. NECRO-ELIXIR RESURRECTION MODAL (REVIVE_PROMPT)                */}
      {/* ================================================================= */}
      {hud && hud.screen === 'REVIVE_PROMPT' && hud.reviveOffer && (
        <PixelHazardModal
          maxWidthClass="max-w-md"
          subtitle={`HUNTER FALLEN · NIGHT WAVE ${hud.wave}`}
          title="NECRO-ELIXIR RESURRECTION"
          onClose={() => engineRef.current?.declineRevive()}
        >
          <div className="pixel-subpanel p-5 text-center space-y-4">
            <div className="w-14 h-14 bg-[#241014] border-2 border-red-500 flex items-center justify-center mx-auto">
              <HeartPulse className="w-8 h-8 text-red-400 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              Unseal forbidden alchemist phials to rise at 100% HP, reset cooldowns, and unleash a Banshee shockwave!
            </p>

            {/* Countdown Timer */}
            <div className="my-2 font-['Oswald',sans-serif] text-4xl font-bold text-red-400 tabular-nums">
              {hud.reviveOffer.secondsRemaining}S
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  engineRef.current?.purchaseRevive('gold');
                }}
                disabled={!hud.reviveOffer.canAffordGold}
                className={`w-full py-3 px-4 font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-between transition cursor-pointer ${
                  hud.reviveOffer.canAffordGold
                    ? 'pixel-btn-red-active'
                    : 'pixel-card text-slate-500 cursor-not-allowed opacity-70'
                }`}
              >
                <span>RISE WITH GOLD</span>
                <span className="font-mono text-xs tabular-nums text-amber-300">
                  {hud.reviveOffer.goldCost}G (HAVE {hud.currencies.gold})
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  engineRef.current?.purchaseRevive('gems');
                }}
                disabled={!hud.reviveOffer.canAffordGems}
                className={`w-full py-3 px-4 font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-between transition cursor-pointer ${
                  hud.reviveOffer.canAffordGems
                    ? 'pixel-btn-olive text-purple-200'
                    : 'pixel-card text-slate-500 cursor-not-allowed opacity-70'
                }`}
              >
                <span>RISE WITH GEMS</span>
                <span className="font-mono text-xs tabular-nums text-purple-300">
                  {hud.reviveOffer.gemCost} GEMS (HAVE {hud.currencies.gems})
                </span>
              </button>

              <button
                type="button"
                onClick={() => engineRef.current?.declineRevive()}
                className="w-full py-2.5 px-4 pixel-btn-olive font-mono text-xs uppercase tracking-wider transition cursor-pointer mt-2"
              >
                ACCEPT FATE & VIEW SCOREBOARD
              </button>
            </div>
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 7. BLOOD-MOON COVEN ALTAR (WAVE_DRAFT MODAL)                      */}
      {/* ================================================================= */}
      {hud && hud.screen === 'WAVE_DRAFT' && (
        <PixelHazardModal
          maxWidthClass="max-w-4xl"
          subtitle={`NIGHT WAVE ${hud.wave} SURVIVED · CHOOSE A COVEN BOON`}
          title="BLOOD-MOON ALTAR BLESSINGS"
          headerRight={
            <button
              type="button"
              onClick={() => engineRef.current?.rerollDraftChoices()}
              disabled={hud.rerollsLeft <= 0}
              className={`flex items-center gap-2 px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                hud.rerollsLeft > 0
                  ? 'pixel-btn-olive text-amber-300'
                  : 'pixel-subpanel text-slate-600 cursor-not-allowed opacity-70'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REROLL ({hud.rerollsLeft})</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hud.draftChoices.map((perk, idx) => (
              <button
                key={perk.id}
                type="button"
                onClick={() => engineRef.current?.selectRoguelikePerk(perk.id)}
                className="group text-left pixel-card hover:brightness-110 p-4 transition-all duration-150 flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
                style={{ borderColor: perk.color }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border"
                      style={{ backgroundColor: '#0B0C0A', borderColor: perk.color, color: perk.color }}
                    >
                      {perk.category} · {perk.rarity}
                    </span>
                    <span className="font-mono text-xs text-amber-300">[{idx + 1}]</span>
                  </div>
                  <h3 className="font-['Oswald',sans-serif] text-base sm:text-lg font-bold uppercase tracking-wide text-white group-hover:text-amber-300 transition">
                    {perk.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed">{perk.description}</p>
                </div>

                <div className="mt-4 pt-2.5 border-t-2 border-[#2D3127] flex items-center justify-between">
                  <span className="font-mono text-xs font-bold" style={{ color: perk.color }}>
                    {perk.statSummary}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 group-hover:text-white">
                    CLAIM →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 8. HAUNTED CRYPT PAUSE MODAL (WITH FULL IN-GAME SKILL DETAILS)    */}
      {/* ================================================================= */}
      {hud && hud.screen === 'PAUSED' && (
        <PixelHazardModal
          maxWidthClass="max-w-4xl"
          subtitle={`NIGHT HUNT PAUSED · WAVE ${hud.wave} · ${hud.p1.score.toLocaleString()} PTS`}
          title={`${hud.p1.className} (${hud.p1.archetype}) — HERO SKILLS & LOADOUT`}
          onClose={() => engineRef.current?.togglePause()}
          headerRight={
            <button
              type="button"
              onClick={() => engineRef.current?.togglePause()}
              className="px-4 py-2 pixel-btn-red-active font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" /> RESUME GAME
            </button>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT 8 COLS: Full Uncropped Signature Attack & [Q][W][E][R] Skill Guide */}
            <div className="lg:col-span-8 space-y-3 text-left">
              {/* Unlimited Signature Primary Attack Card */}
              <div className="pixel-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase font-bold text-amber-400">
                    UNLIMITED SIGNATURE ATTACK: {currentOpClass.signatureWeaponName} (∞)
                  </span>
                  <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                    <span className="text-emerald-400 font-bold">
                      {Math.ceil(hud.p1.hp)}/{Math.ceil(hud.p1.maxHp)} HP
                    </span>
                    <span className="text-orange-400 font-bold">{hud.p1.attackDamage} AD</span>
                    <span className="text-purple-400 font-bold">{hud.p1.abilityPower} AP</span>
                    <span className="text-cyan-400 font-bold">{hud.p1.attacksPerSecond.toFixed(2)}/s AS</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                  {currentOpClass.signatureWeaponDesc}
                </p>
              </div>

              {/* All 4 Hero Abilities ([Q] [W] [E] Active + [R] Passive) — Full Uncropped Details */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                  HERO SKILLS ([Q] [W] [E] ACTIVE · [R] INNATE PASSIVE)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setItemCategoryFilter('abilities');
                    setShowArmoryModal(true);
                  }}
                  className="text-xs font-mono text-emerald-400 hover:underline cursor-pointer"
                >
                  OPEN FULL ABILITY ALTAR →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentOpClass.abilities.map((ab, idx) => {
                  const slotIdx = idx as 0 | 1 | 2 | 3;
                  const lv = profile.heroAbilityLevels[profile.selectedClass]?.[slotIdx] || 1;
                  const hudAb = hud.p1.abilities[idx];
                  const effCd = ab.isPassive
                    ? 0
                    : hudAb?.maxCooldown || Math.max(1.5, Number((ab.baseCooldown * (1 - (lv - 1) * 0.08)).toFixed(1)));
                  const cost = progressionManager.getHeroAbilityUpgradeCost(profile.selectedClass, slotIdx);
                  const canAfford = lv < 5 && progressionManager.canAfford(cost);

                  return (
                    <div
                      key={ab.id}
                      className="pixel-subpanel p-3 flex flex-col justify-between"
                      style={{ borderColor: ab.color }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span
                            className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border-2"
                            style={{ borderColor: ab.color, color: ab.color, backgroundColor: '#0A0B09' }}
                          >
                            [{ab.slot}] {ab.isPassive ? 'INNATE PASSIVE' : `ACTIVE · ${effCd}S CD`}
                          </span>
                          <span className="px-1.5 py-0.5 bg-[#0B0C0A] border border-amber-400 text-amber-300 font-mono text-[10px] font-bold">
                            LV.{lv}/5 (+{lv * 18}% PWR)
                          </span>
                        </div>
                        <h3 className="font-['Oswald',sans-serif] text-sm font-bold uppercase text-white mt-1.5">
                          {ab.name}
                        </h3>
                        <p className="text-xs text-slate-200 mt-1 leading-relaxed break-words">
                          {ab.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t-2 border-[#2D3127] flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-emerald-400">
                          {ab.isPassive ? 'Always Active' : `Smart Cast Key: [${ab.slot}]`}
                        </span>
                        {lv < 5 ? (
                          <button
                            type="button"
                            onClick={() => handleUpgradeHeroAbility(slotIdx)}
                            disabled={!canAfford}
                            className={`px-2 py-1 font-mono text-[10px] font-bold uppercase transition cursor-pointer ${
                              canAfford
                                ? 'pixel-btn-red-active'
                                : 'pixel-card text-slate-500 cursor-not-allowed opacity-70'
                            }`}
                          >
                            RANK UP ({cost.gold}G / {cost.scrap}S)
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-amber-300 font-bold">★ MAX LV.5</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT 4 COLS: Equipped Items & Pause Menu Actions */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-3">
              {/* Equipped 6-Slot Items Summary */}
              <div className="pixel-subpanel p-3 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                    EQUIPPED ITEMS ({hud.p1.equippedItems.length}/6)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setItemCategoryFilter('all');
                      setShowArmoryModal(true);
                    }}
                    className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                  >
                    EDIT LOADOUT
                  </button>
                </div>
                {hud.p1.equippedItems.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2">
                    No Cursed Items equipped yet. Open the Arsenal to forge items!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[185px] overflow-y-auto pr-1">
                    {hud.p1.equippedItems.map((it) => (
                      <div key={it.id} className="pixel-card p-2">
                        <div className="flex items-center justify-between text-xs font-bold font-mono">
                          <span style={{ color: it.color }}>{it.name}</span>
                          <span className="text-[10px] text-amber-300">Lv.{it.level}</span>
                        </div>
                        <div className="text-xs text-slate-200 mt-0.5 leading-snug">{it.passiveSummary}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pause Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => engineRef.current?.togglePause()}
                  className="w-full py-2.5 pixel-btn-red-active font-['Oswald',sans-serif] text-sm font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" /> RESUME ZOMBIE HUNT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemCategoryFilter('abilities');
                    setShowArmoryModal(true);
                  }}
                  className="w-full py-2 pixel-btn-olive text-purple-200 font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> HERO SKILLS & ABILITY ALTAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemCategoryFilter('all');
                    setShowArmoryModal(true);
                  }}
                  className="w-full py-2 pixel-btn-olive text-amber-300 font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wrench className="w-4 h-4" /> ARSENAL ITEM SHOP
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full py-2 pixel-btn-olive font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" /> OPTIONS & SETTINGS
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.startNewGame(hud.mode, hud.arenaId)}
                  className="w-full py-2 pixel-btn-olive font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> RESTART SECTOR
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.returnToTitle()}
                  className="w-full py-2 pixel-subpanel hover:brightness-125 text-slate-200 font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  RETURN TO MAIN MENU
                </button>
              </div>
            </div>
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 9. HALLOWEEN CRYPT SCOREBOARD / GAME OVER MODAL                   */}
      {/* ================================================================= */}
      {hud && hud.screen === 'GAME_OVER' && (
        <PixelHazardModal
          maxWidthClass="max-w-xl"
          subtitle="16-BIT SURVIVAL SCOREBOARD · AFTER-ACTION REPORT"
          title={hud.winnerText || 'SECTOR OVERRUN'}
          onClose={() => engineRef.current?.returnToTitle()}
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-[#0B0C0A] border-2 border-amber-400 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-3 gap-2.5 pixel-subpanel p-3.5 font-mono">
              <div>
                <div className="text-[10px] text-amber-300 uppercase">TOP SCORE</div>
                <div className="text-base sm:text-lg font-bold text-white tabular-nums">
                  {Math.max(hud.p1.score, hud.p2?.score ?? 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-amber-300 uppercase">BLOOD STREAK</div>
                <div className="text-base sm:text-lg font-bold text-orange-400 tabular-nums">{hud.maxCombo}x</div>
              </div>
              <div>
                <div className="text-[10px] text-amber-300 uppercase">NIGHT WAVE</div>
                <div className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">WAVE {hud.wave}</div>
              </div>
            </div>

            {/* Detailed Hunter Scoreboard Table */}
            <div className="pixel-card text-left font-mono text-xs">
              <div className="grid grid-cols-12 px-3 py-2 border-b-2 border-[#2D3127] text-[10px] uppercase text-amber-300 font-bold">
                <span className="col-span-5">HUNTER CLASS</span>
                <span className="col-span-3 text-right">LEVEL</span>
                <span className="col-span-4 text-right">SCORE / FRAGS</span>
              </div>
              <div className="grid grid-cols-12 px-3 py-2.5 items-center border-b border-[#2D3127]">
                <div className="col-span-5 flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 bg-orange-400 shrink-0" />
                  <span className="font-bold text-white truncate">P1 · {hud.p1.className}</span>
                </div>
                <div className="col-span-3 text-right text-amber-300 tabular-nums">Lv.{hud.p1.inMatchLevel}</div>
                <div className="col-span-4 text-right font-bold text-emerald-400 tabular-nums">
                  {hud.mode === 'deathmatch' ? `${hud.p1.frags} FRAGS` : `${hud.p1.score.toLocaleString()} PTS`}
                </div>
              </div>
              {hud.p2 && (
                <div className="grid grid-cols-12 px-3 py-2.5 items-center">
                  <div className="col-span-5 flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 bg-emerald-400 shrink-0" />
                    <span className="font-bold text-white truncate">P2 · {hud.p2.className}</span>
                  </div>
                  <div className="col-span-3 text-right text-amber-300 tabular-nums">Lv.{hud.p2.inMatchLevel}</div>
                  <div className="col-span-4 text-right font-bold text-emerald-400 tabular-nums">
                    {hud.mode === 'deathmatch' ? `${hud.p2.frags} FRAGS` : `${hud.p2.score.toLocaleString()} PTS`}
                  </div>
                </div>
              )}
            </div>

            {/* Session Earned Loot */}
            <div className="pixel-subpanel p-3">
              <div className="text-[10px] font-mono uppercase text-amber-300 mb-1.5">
                LOOT EXTRACTED (AUTO-SAVED TO HUNTER PROFILE)
              </div>
              <div className="flex flex-wrap items-center justify-center gap-5 font-mono text-xs sm:text-sm font-bold tabular-nums">
                <span className="text-amber-400">+{hud.sessionEarned.gold} GOLD</span>
                <span className="text-emerald-400">+{hud.sessionEarned.scrap} SCRAP</span>
                <span className="text-purple-400">+{hud.sessionEarned.gems} GEMS</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => engineRef.current?.startNewGame(hud.mode, hud.arenaId)}
                className="flex-1 py-3 pixel-btn-red-active font-['Oswald',sans-serif] text-sm font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> HUNT AGAIN
              </button>
              <button
                type="button"
                onClick={() => setShowArmoryModal(true)}
                className="flex-1 py-3 pixel-btn-olive text-emerald-300 font-['Oswald',sans-serif] text-sm font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="w-4 h-4" /> ARSENAL
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.returnToTitle()}
                className="py-3 px-4 pixel-btn-olive font-['Oswald',sans-serif] text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 10. THE SWARM: ZOMBIE BESTIARY, 2-TIER BOSS INTEL & CO-OP LOBBY   */}
      {/* ================================================================= */}
      {showBestiaryModal && (
        <PixelHazardModal
          maxWidthClass="max-w-4xl"
          subtitle="EVERY WAVE ENDS WITH A WARDEN BOSS · EVERY 5TH WAVE UNLEASHES A 3-PHASE MEGA RAID BOSS"
          title="THE SWARM · UNDEAD BESTIARY & 2-TIER BOSS INTEL"
          onClose={() => setShowBestiaryModal(false)}
          headerRight={
            <button
              type="button"
              onClick={() => {
                setShowBestiaryModal(false);
                setMode('online_coop');
                setShowMultiplayerModal(true);
              }}
              className="px-3 py-1.5 pixel-btn-olive text-amber-300 font-mono text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" /> 10P COVEN ONLINE LOBBY
            </button>
          }
        >
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2 font-bold">
              STANDARD ZOMBIE HORDE (WAVES 1+ · DROPS XP ORBS & GOLD COINS)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-4">
              {[
                {
                  name: 'Graveyard Shambler',
                  tag: 'Wave 1+',
                  color: '#4ADE80',
                  move: 'Staggered Lurch + Blood-Scent Surge',
                  ability: 'Infectious Bite slows hunter movement on hit'
                },
                {
                  name: 'Feral Ghoul Zombie',
                  tag: 'Wave 1+',
                  color: '#FB7185',
                  move: 'Evasive Zig-Zag Stalking Weave',
                  ability: 'Shadow Pounce Dash (3.1x speed lunge attack)'
                },
                {
                  name: 'Bile-Rot Spitter Zombie',
                  tag: 'Wave 2+',
                  color: '#A3E635',
                  move: 'Skirmisher Kiting & Mid-Range Strafe',
                  ability: 'Alternates Single Acid Glob & 3-Way Toxic Volley'
                },
                {
                  name: 'Deadeye Skeleton Zombie',
                  tag: 'Wave 3+',
                  color: '#E2E8F0',
                  move: 'Long-Range Orbit & Recoil Backstep',
                  ability: 'Crimson Laser-Sight Lock-On + Bone-Piercer Shot'
                },
                {
                  name: 'Tombstone Riot Zombie',
                  tag: 'Wave 2+',
                  color: '#60A5FA',
                  move: 'Armored Headstone Phalanx (-45% Frontal Dmg)',
                  ability: 'Tombstone Bull-Charge + Gravestone Tremor Slam'
                },
                {
                  name: "Jack-o'-Bomber Zombie",
                  tag: 'Wave 2+',
                  color: '#F97316',
                  move: 'Accelerating Manic Fuse Sprint',
                  ability: 'Proximity Lit-Fuse Ignition + Cluster Pumpkin Blast'
                },
                {
                  name: 'Necro-Witch Zombie',
                  tag: 'Wave 3+',
                  color: '#34D399',
                  move: 'Backline Coven Orbit & Retreat',
                  ability: 'Blood-Pact Heal (+45 HP) & +32% Undead Frenzy Buff'
                },
                {
                  name: 'Franken-Crusher Tank',
                  tag: 'Wave 4+',
                  color: '#94A3B8',
                  move: 'Unstoppable Barricade-Smashing Juggernaut',
                  ability: '155px Seismic Ground-Pound Shockwave & Slow'
                },
                {
                  name: 'Franken-Volt Gargoyle',
                  tag: 'Wave 3+',
                  color: '#38BDF8',
                  move: 'Galvanic Flank Stride',
                  ability: 'Predictive Lead-Aimed Tesla Orb + Shock-Leap EMP Slam'
                },
                {
                  name: 'Pumpkin Arch-Fiend Zombie',
                  tag: 'Wave 4+',
                  color: '#EF4444',
                  move: 'Wraith Glide + Lateral Shadow-Blink Teleport',
                  ability: "3-Way Blazing Hellfire Jack-o'-Lantern Fan"
                }
              ].map((m) => (
                <div key={m.name} className="pixel-card p-3">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-['Oswald',sans-serif] text-xs font-bold uppercase" style={{ color: m.color }}>
                      {m.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">{m.tag}</span>
                  </div>
                  <div className="text-xs font-mono text-emerald-300 mt-1">Move: {m.move}</div>
                  <div className="text-xs text-slate-200 mt-0.5">Ability: {m.ability}</div>
                </div>
              ))}
            </div>

            <div className="text-xs font-mono uppercase tracking-wider text-red-400 mb-2 font-bold">
              EVERY-5-WAVE CATACLYSMIC ELEMENTAL RAID BOSSES
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ELEMENTAL_BOSS_CONFIGS.map((cfg, idx) => (
                <div key={cfg.element} className="pixel-subpanel p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase" style={{ color: cfg.color }}>
                      Wave {(idx + 1) * 5}: {cfg.name}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300">{cfg.elementLabel}</span>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mt-1">{cfg.weaknessText}</div>
                  <div className="text-xs font-mono text-rose-400 mt-0.5">{cfg.resistanceText}</div>
                </div>
              ))}
            </div>
          </div>
        </PixelHazardModal>
      )}

      {/* ================================================================= */}
      {/* 11. 10-PLAYER ONLINE COVEN CO-OP LOBBY MODAL                      */}
      {/* ================================================================= */}
      {showMultiplayerModal && (
        <PixelHazardModal
          maxWidthClass="max-w-4xl"
          subtitle="SYNCHRONIZED ZOMBIE HORDES · PLAYER-SCALED 5-WAVE RAID BOSSES · INSTANT ROOM CODES"
          title="10-PLAYER ONLINE COVEN CO-OP LOBBY"
          onClose={() => setShowMultiplayerModal(false)}
          headerRight={
            <span
              className={`px-2.5 py-1 text-[10px] font-mono uppercase border-2 ${
                wsConnected
                  ? 'bg-[#0E1E14] text-emerald-300 border-emerald-400'
                  : 'bg-[#241014] text-red-300 border-red-400'
              }`}
            >
              {wsConnected ? 'ONLINE READY' : 'RECONNECTING...'}
            </span>
          }
        >
          {mpError && (
            <div className="px-4 py-2.5 bg-[#241014] border-2 border-red-500 text-red-300 text-xs font-mono flex items-center justify-between">
              <span>{mpError}</span>
              <button
                type="button"
                onClick={() => {
                  multiplayerClient.lastError = null;
                  setMpError(null);
                }}
                className="text-red-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!currentRoom ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 space-y-3.5">
                <div className="pixel-subpanel p-3.5 space-y-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                    1. HUNTER IDENTITY
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">CALLSIGN</label>
                    <input
                      type="text"
                      maxLength={16}
                      value={callsign}
                      onChange={(e) => {
                        setCallsign(e.target.value);
                        multiplayerClient.setPlayerProfile(e.target.value, headbandColor, profile.selectedClass);
                      }}
                      className="w-full px-3 py-2 bg-[#090A08] border-2 border-[#4A4F3E] text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">CLOAK TRIM COLOR</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SQUAD_COLOR_PALETTE.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setHeadbandColor(c);
                            multiplayerClient.setPlayerProfile(callsign, c, profile.selectedClass);
                          }}
                          className={`w-6 h-6 border-2 transition cursor-pointer ${
                            headbandColor === c ? 'border-white scale-110' : 'border-black opacity-80'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pixel-subpanel p-3.5 space-y-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    2. HOST COVEN ROOM
                  </div>
                  <input
                    type="text"
                    maxLength={24}
                    value={newLobbyName}
                    onChange={(e) => setNewLobbyName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090A08] border-2 border-[#4A4F3E] text-xs font-mono text-white"
                    placeholder="Coven Room Name"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewLobbyPrivate(false)}
                      className={`py-2 px-3 text-xs font-mono uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                        !newLobbyPrivate ? 'pixel-btn-red-active' : 'pixel-btn-olive'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" /> PUBLIC
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewLobbyPrivate(true)}
                      className={`py-2 px-3 text-xs font-mono uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                        newLobbyPrivate ? 'pixel-btn-red-active' : 'pixel-btn-olive'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" /> PRIVATE
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => multiplayerClient.createLobby(newLobbyName, newLobbyPrivate, arenaId)}
                    className="w-full py-2.5 pixel-btn-red-active font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    HOST NEW 10P COVEN ROOM
                  </button>
                </div>

                <div className="pixel-subpanel p-3.5 space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                    3. JOIN BY ROOM CODE
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="CODE"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-[#090A08] border-2 border-[#4A4F3E] text-xs font-mono uppercase tracking-widest text-white"
                    />
                    <button
                      type="button"
                      onClick={() => multiplayerClient.joinLobbyByCode(joinCodeInput)}
                      className="px-4 py-2 pixel-btn-olive font-mono text-xs uppercase cursor-pointer"
                    >
                      JOIN
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 pixel-subpanel p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-[#2D3127] pb-2.5 mb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                      PUBLIC COVEN LOBBIES ({publicLobbies.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => multiplayerClient.refreshLobbies()}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> REFRESH
                    </button>
                  </div>

                  {publicLobbies.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 font-mono text-xs">
                      No public covens active. Host a new 10P room on the left!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[340px] overflow-y-auto">
                      {publicLobbies.map((lobby) => (
                        <div
                          key={lobby.code}
                          className="flex items-center justify-between pixel-card p-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-['Oswald',sans-serif] text-sm font-bold uppercase text-white">
                                {lobby.name}
                              </span>
                              <span className="font-mono text-[10px] text-amber-300">#{lobby.code}</span>
                            </div>
                            <div className="text-xs text-slate-300 mt-0.5">
                              Host: {lobby.hostName} · Night Wave {lobby.wave}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-slate-200 tabular-nums">
                              {lobby.playerCount}/{lobby.maxPlayers}
                            </span>
                            <button
                              type="button"
                              onClick={() => multiplayerClient.joinLobbyByCode(lobby.code)}
                              className="px-3.5 py-1.5 pixel-btn-red-active font-['Oswald',sans-serif] text-xs font-bold uppercase cursor-pointer"
                            >
                              JOIN
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 pixel-subpanel p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#2D3127] pb-3 mb-3">
                    <div>
                      <span className="font-['Oswald',sans-serif] text-lg font-bold uppercase text-white">
                        {currentRoom.name}
                      </span>
                      <div className="text-xs text-slate-300">
                        Hunters: {currentRoom.playerCount} / {currentRoom.maxPlayers}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyRoomCode(currentRoom.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 pixel-btn-olive text-amber-300 font-mono text-xs cursor-pointer"
                    >
                      <span>CODE: {currentRoom.code}</span>
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto">
                    {currentRoom.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between pixel-card px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 shrink-0 border border-black" style={{ backgroundColor: m.color }} />
                          <span className="font-mono text-xs font-bold text-white truncate">{m.name}</span>
                          {m.isHost && <span className="text-[9px] font-mono text-amber-400">HOST</span>}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">READY</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t-2 border-[#2D3127]">
                  <button
                    type="button"
                    onClick={() => multiplayerClient.leaveLobby()}
                    className="px-4 py-2 pixel-btn-olive font-mono text-xs uppercase cursor-pointer"
                  >
                    LEAVE COVEN
                  </button>

                  {multiplayerClient.isHost() && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => engineRef.current?.startOnlineCoopGame(currentRoom, true)}
                        className="px-4 py-2 pixel-btn-olive text-red-200 font-['Oswald',sans-serif] text-xs font-bold uppercase cursor-pointer"
                      >
                        LAUNCH WAVE 5 BOSS
                      </button>
                      <button
                        type="button"
                        onClick={() => engineRef.current?.startOnlineCoopGame(currentRoom, false)}
                        className="px-5 py-2 pixel-btn-red-active font-['Oswald',sans-serif] text-xs sm:text-sm font-bold uppercase cursor-pointer"
                      >
                        LAUNCH NIGHT HUNT
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Squad Chat */}
              <div className="lg:col-span-5 pixel-subpanel p-4 flex flex-col justify-between h-[340px]">
                <div className="text-xs font-mono uppercase tracking-wider text-amber-400 border-b-2 border-[#2D3127] pb-2 font-bold">
                  COVEN COMMS
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 my-2 pr-1">
                  {currentRoom.chat.map((msg) => (
                    <div key={msg.id} className="text-xs font-mono">
                      <span className="font-bold" style={{ color: msg.senderColor }}>
                        {msg.senderName}:{' '}
                      </span>
                      <span className="text-slate-200">{msg.text}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Transmit message..."
                    className="flex-1 px-3 py-2 bg-[#090A08] border-2 border-[#4A4F3E] text-xs font-mono text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 pixel-btn-red-active cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </PixelHazardModal>
      )}
    </div>
  );
}

/**
 * 16-Bit Industrial Pixel-Art Modal Frame matching the CLASSZ Main Menu Panel in image_4663bf94.png:
 * - Top glowing Red Siren Beacon (left) and Amber Siren Beacon (right)
 * - Top & bottom diagonal Yellow-and-Black Hazard Caution Stripes
 * - 4 Bolted Steel Corner Brackets with pixel rivets
 * - Recessed dark steel interior with hard pixel bevels
 */
function PixelHazardModal({
  title,
  subtitle,
  maxWidthClass = 'max-w-5xl',
  headerRight,
  onClose,
  children
}: {
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  headerRight?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-[#050604]/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5 z-50">
      <div className={`relative w-full ${maxWidthClass} pt-5 max-h-[95dvh] flex flex-col`}>
        {/* Top Left Red Siren Beacon & Top Right Amber Siren Beacon */}
        <div className="pointer-events-none flex items-end justify-between px-8 sm:px-12 -mb-1 z-20">
          {/* Red Siren Beacon */}
          <div className="flex flex-col items-center">
            <div className="w-6 h-5 bg-[#FF2A4B] border-2 border-[#080907] shadow-[0_0_18px_rgba(255,42,75,0.9)] relative">
              <div className="w-1.5 h-3 bg-white/80 absolute top-0.5 left-1" />
            </div>
            <div className="w-9 h-2 bg-[#4A4E40] border-2 border-[#080907]" />
          </div>

          {/* Amber Siren Beacon */}
          <div className="flex flex-col items-center">
            <div className="w-6 h-5 bg-[#F59E0B] border-2 border-[#080907] shadow-[0_0_18px_rgba(245,158,11,0.9)] relative">
              <div className="w-1.5 h-3 bg-white/80 absolute top-0.5 left-1" />
            </div>
            <div className="w-9 h-2 bg-[#4A4E40] border-2 border-[#080907]" />
          </div>
        </div>

        {/* Main Riveted Industrial Steel Box */}
        <div className="relative pixel-panel flex flex-col max-h-[90dvh] overflow-hidden">
          {/* Top Hazard Caution Stripe + Corner Rivet Plates */}
          <div className="relative h-4 pixel-hazard-stripe shrink-0 flex items-center justify-between">
            <div className="w-6 h-full bg-[#5C6350] border-r-2 border-[#080907] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#1B1D17] block" />
            </div>
            <div className="w-6 h-full bg-[#5C6350] border-l-2 border-[#080907] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#1B1D17] block" />
            </div>
          </div>

          {/* Modal Header Bar */}
          <div className="px-4 sm:px-6 py-3 bg-[#171914] border-b-4 border-[#090A08] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="min-w-0 flex-1">
              {subtitle && (
                <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold truncate">
                  {subtitle}
                </div>
              )}
              <h2 className="font-['Oswald',sans-serif] text-base sm:text-xl font-bold uppercase text-white tracking-wider truncate mt-0.5">
                {title}
              </h2>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {headerRight}
              {onClose && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUIClick();
                    onClose();
                  }}
                  className="px-2.5 py-1.5 pixel-btn-olive text-white font-mono text-xs font-bold uppercase cursor-pointer flex items-center justify-center"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Scrollable Pixel Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 bg-[#1B1D17]">
            {children}
          </div>

          {/* Bottom Hazard Caution Stripe + Corner Rivet Plates */}
          <div className="relative h-4 pixel-hazard-stripe shrink-0 flex items-center justify-between">
            <div className="w-6 h-full bg-[#5C6350] border-r-2 border-[#080907] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#1B1D17] block" />
            </div>
            <div className="w-6 h-full bg-[#5C6350] border-l-2 border-[#080907] flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-[#1B1D17] block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggleRow({
  title,
  desc,
  checked,
  onChange
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pixel-card p-3.5">
      <div>
        <div className="font-bold text-white uppercase font-mono text-xs">{title}</div>
        <div className="text-xs text-slate-300 mt-0.5">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`px-3.5 py-1.5 font-mono text-xs font-bold uppercase transition cursor-pointer shrink-0 ${
          checked ? 'pixel-btn-red-active' : 'pixel-btn-olive text-slate-300'
        }`}
      >
        {checked ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

function HeroPixelPortrait({
  classId,
  color,
  size = 40
}: {
  classId: OperatorClassId;
  color: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (canvasRef.current) {
      renderOperatorPortraitToCanvas(canvasRef.current, classId, color);
    }
  }, [classId, color, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="block"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  );
}

function FullBodyHeroPixelArt({
  classId,
  color,
  size = 68
}: {
  classId: OperatorClassId;
  color: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grid = 24;
    const scale = canvas.width / grid;
    const px = (x: number, y: number, w: number, h: number, fill: string) => {
      ctx.fillStyle = fill;
      ctx.fillRect(Math.floor(x * scale), Math.floor(y * scale), Math.ceil(w * scale), Math.ceil(h * scale));
    };

    // Ground shadow
    px(5, 20, 14, 2, 'rgba(0,0,0,0.55)');

    if (classId === 'reaper') {
      // Crypt Reaper: Crimson Hooded Cloak + Glowing Red Eyes + Giant Silver Crescent Scythe
      px(7, 3, 9, 7, '#7F1D1D'); // hood outer
      px(8, 4, 7, 5, '#450A0A'); // hood inner
      px(9, 5, 5, 4, '#090A0F'); // shadow face
      px(9, 6, 2, 1, '#F87171'); // left glowing eye
      px(12, 6, 2, 1, '#F87171'); // right glowing eye
      // Tattered crimson cloak & dark plate torso
      px(6, 10, 11, 7, '#991B1B');
      px(8, 10, 7, 6, '#1F2937');
      px(9, 11, 5, 2, '#EF4444'); // chest rune
      // Boots
      px(8, 17, 3, 4, '#111827');
      px(12, 17, 3, 4, '#111827');
      // Giant Cursed Scythe (shaft + wide curved silver/cyan blade)
      px(16, 4, 2, 17, '#78350F'); // pole
      px(10, 2, 11, 2, '#E2E8F0'); // scythe upper blade
      px(18, 4, 4, 3, '#94A3B8'); // blade curve
      px(20, 7, 2, 3, '#EF4444'); // blood tip
    } else if (classId === 'marksman') {
      // Witch Hunter: Pointed Orange/Brown Witch-Hunter Hat + Trenchcoat + Heavy Crossbow
      px(6, 4, 12, 2, '#7C2D12'); // hat brim
      px(8, 1, 8, 3, '#9A3412'); // hat cone
      px(8, 3, 8, 1, '#F97316'); // orange hat buckle band
      px(8, 6, 8, 4, '#FDBA74'); // face
      px(7, 6, 2, 5, '#EA580C'); // hair left
      px(15, 6, 2, 5, '#EA580C'); // hair right
      px(9, 7, 2, 1, '#1E293B'); // eye
      px(13, 7, 2, 1, '#1E293B'); // eye
      // Coat
      px(7, 10, 10, 7, '#431407');
      px(9, 10, 6, 6, '#7C2D12');
      px(10, 12, 4, 1, '#FACC15'); // belt buckle
      // Boots
      px(8, 17, 3, 4, '#27272A');
      px(13, 17, 3, 4, '#27272A');
      // Heavy Silver Crossbow held forward
      px(13, 11, 9, 2, '#A16207'); // stock
      px(18, 8, 2, 8, '#E2E8F0'); // bow prod
      px(20, 11, 3, 1, '#38BDF8'); // silver bolt tip
    } else if (classId === 'vanguard') {
      // Grave Warden: Golden/Bronze horned knight helm + heavy plate armor + Double-Headed Crypt Maul
      px(7, 3, 10, 7, '#CA8A04'); // gold helm
      px(8, 4, 8, 5, '#EAB308'); // helm faceguard
      px(9, 6, 6, 2, '#090A0F'); // visor slit
      px(10, 6, 2, 1, '#FEF08A'); // visor glow
      px(13, 6, 2, 1, '#FEF08A');
      // Heavy Pauldrons & Plate
      px(5, 10, 14, 4, '#713F12');
      px(7, 10, 10, 7, '#3F3F46');
      px(9, 11, 6, 4, '#CA8A04'); // gold chest emblem
      // Greaves
      px(8, 17, 3, 4, '#52525B');
      px(13, 17, 3, 4, '#52525B');
      // Gargoyle Crypt Maul
      px(17, 6, 2, 15, '#78350F'); // handle
      px(14, 4, 8, 5, '#94A3B8'); // heavy hammer head
      px(15, 5, 6, 3, '#E2E8F0');
    } else if (classId === 'medic') {
      // Plague Alchemist: Emerald Hood + Plague Mask Goggles + Glowing Venom Syringe Launcher
      px(7, 3, 10, 7, '#14532D'); // hood
      px(8, 5, 8, 5, '#1F2937'); // mask
      px(9, 6, 2, 2, '#4ADE80'); // left green lens
      px(13, 6, 2, 2, '#4ADE80'); // right green lens
      px(11, 7, 2, 3, '#374151'); // plague beak
      // Alchemist coat & belt vials
      px(7, 10, 10, 7, '#166534');
      px(9, 11, 6, 5, '#15803D');
      px(9, 13, 2, 2, '#86EFAC'); // potion vial
      px(12, 13, 2, 2, '#4ADE80');
      // Boots
      px(8, 17, 3, 4, '#111827');
      px(13, 17, 3, 4, '#111827');
      // Diagonal Giant Glowing Green Syringe Launcher
      px(13, 11, 6, 3, '#22C55E'); // glass chamber
      px(14, 12, 4, 1, '#BBF7D0'); // bright fluid core
      px(19, 9, 3, 2, '#94A3B8'); // syringe nozzle
      px(21, 8, 2, 1, '#4ADE80'); // needle tip
    } else {
      // Necro-Warlock: Dark Cowl + Pale Face + Purple Robes + Eldritch Skull Staff
      px(7, 3, 10, 7, '#3B0764'); // dark hood
      px(8, 5, 8, 5, '#E2E8F0'); // pale face
      px(9, 6, 2, 2, '#A855F7'); // glowing violet eye
      px(13, 6, 2, 2, '#A855F7');
      // Necromancer Robes
      px(7, 10, 10, 8, '#4C1D95');
      px(9, 10, 6, 8, '#6D28D9');
      px(10, 11, 4, 2, '#C084FC'); // arcane clasp
      // Boots
      px(8, 18, 3, 3, '#1E1B4B');
      px(13, 18, 3, 3, '#1E1B4B');
      // Eldritch Skull Staff with purple flame
      px(17, 6, 2, 15, '#581C87'); // staff shaft
      px(16, 3, 4, 4, '#F1F5F9'); // skull head
      px(15, 1, 6, 3, '#D946EF'); // eldritch flame aura
      px(17, 2, 2, 2, '#F5D0FE');
    }
  }, [classId, color, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="block"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  );
}

function SectorPixelThumbnail({ arenaId }: { arenaId: ArenaId }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (arenaId === 'boxy') {
      // HAUNTED GRAVEYARD: Eerie teal-blue night sky, full moon, iron crypt & gravestones
      ctx.fillStyle = '#0F1E26';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1B3B48';
      ctx.fillRect(0, 8, w, 16);
      // Moon
      ctx.fillStyle = '#A7F3D0';
      ctx.fillRect(46, 4, 8, 8);
      // Crypt Mausoleum
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 10, 22, 18);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(6, 8, 26, 3);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(14, 15, 4, 6); // glowing window
      ctx.fillRect(21, 15, 4, 6);
      // Gravestones
      ctx.fillStyle = '#64748B';
      ctx.fillRect(36, 19, 6, 9);
      ctx.fillRect(48, 21, 5, 7);
      // Ground mist
      ctx.fillStyle = '#0D9488';
      ctx.fillRect(0, 27, w, 4);
      ctx.fillStyle = '#090D10';
      ctx.fillRect(0, 31, w, 5);
    } else if (arenaId === 'columns') {
      // CURSED PUMPKIN PATCH: Dark autumn sky, glowing carved Jack-o'-Lantern & wooden fence
      ctx.fillStyle = '#18120B';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#292014';
      ctx.fillRect(0, 16, w, 20);
      // Fence posts
      ctx.fillStyle = '#451A03';
      for (let x = 4; x < w; x += 12) {
        ctx.fillRect(x, 14, 3, 14);
      }
      ctx.fillRect(0, 18, w, 2);
      // Giant Glowing Pumpkin in center
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(20, 11, 22, 17);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(23, 12, 16, 15);
      // Stem
      ctx.fillStyle = '#15803D';
      ctx.fillRect(29, 8, 4, 3);
      // Glowing eyes & grin
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(25, 15, 4, 3);
      ctx.fillRect(33, 15, 4, 3);
      ctx.fillRect(25, 21, 12, 3);
      // Grass foreground
      ctx.fillStyle = '#14532D';
      ctx.fillRect(0, 28, w, 8);
    } else {
      // INFERNAL NIGHTMARE: Hellfire orange-red sky, jagged obsidian spires & molten lava river
      ctx.fillStyle = '#2A0808';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#7F1D1D';
      ctx.fillRect(0, 6, w, 14);
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(0, 14, w, 8);
      // Obsidian fortress silhouette
      ctx.fillStyle = '#09070F';
      ctx.fillRect(6, 8, 12, 18);
      ctx.fillRect(10, 4, 4, 4);
      ctx.fillRect(38, 10, 16, 16);
      ctx.fillRect(43, 6, 6, 4);
      // Molten lava river at bottom
      ctx.fillStyle = '#F97316';
      ctx.fillRect(0, 25, w, 11);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(8, 27, 24, 4);
      ctx.fillRect(38, 29, 18, 3);
    }
  }, [arenaId]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={36}
      className="w-full h-full block object-cover"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

function ItemPixelIcon({
  itemId,
  color,
  size = 28
}: {
  itemId: MobaItemId;
  color: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const g = 16;
    const s = canvas.width / g;
    const px = (x: number, y: number, w: number, h: number, fill: string) => {
      ctx.fillStyle = fill;
      ctx.fillRect(Math.floor(x * s), Math.floor(y * s), Math.ceil(w * s), Math.ceil(h * s));
    };

    if (itemId === 'hellfire_cloak') {
      // Sunfire / Jack-o'-Lantern Hellfire Emblem
      px(5, 5, 6, 6, '#F97316');
      px(6, 6, 4, 4, '#FACC15');
      // Sun rays
      px(7, 1, 2, 3, '#FACC15');
      px(7, 12, 2, 3, '#FACC15');
      px(1, 7, 3, 2, '#FACC15');
      px(12, 7, 3, 2, '#FACC15');
      px(3, 3, 2, 2, '#F97316');
      px(11, 3, 2, 2, '#F97316');
      px(3, 11, 2, 2, '#F97316');
      px(11, 11, 2, 2, '#F97316');
    } else if (itemId === 'wraith_striders') {
      // Winged Spectral Boots
      px(6, 3, 5, 8, '#38BDF8');
      px(7, 4, 3, 6, '#BAE6FD');
      px(4, 10, 9, 3, '#0284C7');
      px(3, 12, 10, 2, '#E0F2FE'); // sole
      px(11, 4, 3, 3, '#7DD3FC'); // wing
    } else if (itemId === 'vampire_fang') {
      // Twin Crimson Vampire Fangs dripping blood
      px(3, 3, 4, 3, '#991B1B');
      px(9, 3, 4, 3, '#991B1B');
      px(4, 5, 3, 6, '#F87171');
      px(9, 5, 3, 6, '#F87171');
      px(5, 6, 2, 4, '#FEE2E2');
      px(10, 6, 2, 4, '#FEE2E2');
      px(5, 12, 2, 2, '#EF4444'); // blood drop
      px(10, 12, 2, 2, '#EF4444');
    } else if (itemId === 'capacitor_coil') {
      // Frankenstein's Galvanic Tesla Coil
      px(6, 2, 4, 12, '#0284C7');
      px(4, 4, 8, 2, '#38BDF8');
      px(4, 8, 8, 2, '#38BDF8');
      px(7, 3, 2, 10, '#E0F2FE');
      px(2, 2, 2, 2, '#FACC15'); // spark
      px(12, 6, 2, 2, '#FACC15');
    } else if (itemId === 'necronomicon_tome') {
      // Purple Grimoire Book
      px(3, 2, 10, 12, '#6B21A8');
      px(4, 3, 8, 10, '#9333EA');
      px(6, 5, 4, 4, '#E9D5FF'); // skull sigil on cover
      px(3, 12, 10, 2, '#FDE047'); // pages edge
    } else if (itemId === 'gargoyle_plate') {
      // Heavy Stone/Steel Chestplate
      px(2, 3, 12, 4, '#94A3B8');
      px(4, 7, 8, 6, '#64748B');
      px(6, 5, 4, 6, '#E2E8F0');
      px(7, 7, 2, 3, '#FACC15');
    } else if (itemId === 'frost_shard') {
      // Cyan Ice Crystal
      px(7, 1, 2, 14, '#67E8F9');
      px(5, 4, 6, 8, '#06B6D4');
      px(6, 5, 4, 6, '#CFFAFE');
    } else if (itemId === 'soul_reaver') {
      // Crimson Soul Scythe Blade
      px(3, 3, 10, 3, '#F43F5E');
      px(4, 4, 8, 2, '#FFE4E6');
      px(10, 6, 2, 8, '#881337');
    } else if (itemId === 'philosopher_chalice') {
      // Emerald Elixir Chalice
      px(4, 3, 8, 5, '#FACC15');
      px(5, 2, 6, 2, '#4ADE80'); // glowing green brew
      px(7, 8, 2, 4, '#CA8A04');
      px(5, 12, 6, 2, '#EAB308');
    } else {
      // Morrigan's Golden Hourglass
      px(4, 2, 8, 2, '#D97706');
      px(4, 12, 8, 2, '#D97706');
      px(5, 4, 6, 3, '#FDE047');
      px(7, 7, 2, 2, '#FEF08A');
      px(5, 9, 6, 3, '#F59E0B');
    }
  }, [itemId, color, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="block"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  );
}

function PlayerStatusCard({
  player,
  label,
  accent,
  showFrags,
  compact
}: {
  player: PlayerHUDData;
  label: string;
  accent: string;
  showFrags: boolean;
  compact: boolean;
}) {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (player.shieldHp / Math.max(1, player.maxHp)) * 100));
  const xpPercent = Math.max(0, Math.min(100, (player.inMatchXp / Math.max(1, player.inMatchXpToNext)) * 100));

  return (
    <div
      className={`bg-[#161224]/95 border-2 border-[#3B3154] pixel-panel px-2.5 py-1.5 pointer-events-auto ${
        compact ? 'min-w-[155px] max-w-[195px]' : 'min-w-[215px] sm:min-w-[255px]'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1.5 truncate">
          <div
            className="w-7 h-7 bg-[#09070F] border flex items-center justify-center shrink-0"
            style={{ borderColor: player.classColor }}
          >
            <HeroPixelPortrait classId={player.operatorClass} color={player.classColor} size={26} />
          </div>
          <span
            className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border"
            style={{
              backgroundColor: `${player.classColor}22`,
              borderColor: player.classColor,
              color: player.classColor
            }}
          >
            {label}
          </span>
          <span className="font-mono text-[10px] font-bold text-orange-300 tabular-nums">
            Lv.{player.inMatchLevel}
          </span>
          <span className="font-['Oswald',sans-serif] text-xs font-bold uppercase text-white truncate">
            {player.className}
          </span>
        </div>
        <span
          className="font-['JetBrains_Mono',monospace] text-xs font-bold tabular-nums shrink-0"
          style={{ color: accent }}
        >
          {showFrags ? `${player.frags} FRAGS` : `${player.score.toLocaleString()} PTS`}
        </span>
      </div>

      {/* 16-Bit Pixel Health + Shield Bar */}
      <div className="w-full h-3 bg-[#09070F] overflow-hidden border border-[#3B3154] mb-1 relative">
        <div
          className="h-full transition-all duration-150"
          style={{
            width: `${hpPercent}%`,
            backgroundColor: hpPercent > 50 ? '#4ADE80' : hpPercent > 25 ? '#F97316' : '#EF4444'
          }}
        />
        {shieldPercent > 0 && (
          <div
            className="h-full bg-sky-300/85 absolute top-0 left-0 pointer-events-none"
            style={{ width: `${Math.min(100, shieldPercent)}%` }}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-white drop-shadow">
          {Math.ceil(player.hp)}/{Math.ceil(player.maxHp)} HP
          {player.shieldHp > 0 ? ` (+${Math.ceil(player.shieldHp)})` : ''}
        </div>
      </div>

      {/* In-Match XP Bar */}
      <div className="w-full h-1 bg-[#09070F] overflow-hidden mb-1">
        <div className="h-full bg-purple-400 transition-all duration-150" style={{ width: `${xpPercent}%` }} />
      </div>

      {/* Signature Weapon & Combat Stats Strip */}
      <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
        <span className="truncate font-bold" style={{ color: player.primaryAttackColor }}>
          {player.primaryAttackName} (∞)
        </span>
        <div className="flex items-center gap-1.5 text-slate-300 shrink-0 tabular-nums">
          <span className="text-orange-300">AD {player.attackDamage}</span>
          <span className="text-purple-300">AP {player.abilityPower}</span>
          <span className="text-emerald-300">{player.attacksPerSecond.toFixed(1)}/s</span>
        </div>
      </div>
    </div>
  );
}

function OnlineSquadStrip({ allies }: { allies: RemoteAllyHUD[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allies.map((ally) => {
        const pct = Math.max(0, Math.min(100, (ally.hp / Math.max(1, ally.maxHp)) * 100));
        return (
          <div
            key={ally.id}
            className="bg-[#161224]/90 border border-[#3B3154] px-2 py-1 flex items-center gap-2 min-w-[115px]"
          >
            <span className="w-2 h-2 shrink-0" style={{ backgroundColor: ally.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
                <span className="text-white font-bold truncate">{ally.name}</span>
                <span className="text-orange-300 tabular-nums">{ally.kills}K</span>
              </div>
              <div className="w-full h-1 bg-[#09070F] overflow-hidden mt-0.5">
                <div
                  className="h-full"
                  style={{ width: `${pct}%`, backgroundColor: ally.alive ? ally.color : '#64748B' }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TacticalMinimap({
  minimap,
  onPingWorld,
  onTriggerQuickPing,
  compact
}: {
  minimap: MinimapData;
  onPingWorld: (wx: number, wy: number, kind?: 'RALLY' | 'ENEMY' | 'SUPPLY') => void;
  onTriggerQuickPing: () => void;
  compact?: boolean;
}) {
  const mapW = compact ? 104 : 132;
  const mapH = Math.round((minimap.worldHeight / Math.max(1, minimap.worldWidth)) * mapW);
  const scaleX = mapW / Math.max(1, minimap.worldWidth);
  const scaleY = mapH / Math.max(1, minimap.worldHeight);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const wx = ((e.clientX - rect.left) / rect.width) * minimap.worldWidth;
    const wy = ((e.clientY - rect.top) / rect.height) * minimap.worldHeight;
    onPingWorld(wx, wy);
  };

  return (
    <div className="bg-[#161224]/95 border-2 border-[#3B3154] pixel-panel p-1.5 select-none">
      <div className="flex items-center justify-between gap-1 mb-1 px-0.5">
        <span className="text-[9px] font-mono uppercase tracking-wider text-orange-300 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5 text-orange-400" /> RADAR
        </span>
        <button
          type="button"
          onClick={onTriggerQuickPing}
          className="px-1.5 py-0.5 bg-orange-500/20 hover:bg-orange-500/35 border border-orange-500/50 text-orange-300 font-mono text-[8px] uppercase cursor-pointer"
        >
          [G] Ping
        </button>
      </div>

      <div
        onClick={handleClick}
        style={{ width: mapW, height: Math.max(60, Math.min(140, mapH)) }}
        className="relative bg-[#09070F] border border-[#3B3154] overflow-hidden cursor-crosshair"
      >
        {minimap.enemies.map((e, i) => (
          <div
            key={`e-${i}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${
              e.isBoss ? 'w-2.5 h-2.5 bg-orange-400 animate-ping' : 'w-1.5 h-1.5 bg-emerald-400'
            }`}
            style={{ left: e.x * scaleX, top: e.y * scaleY }}
          />
        ))}
        {minimap.players.map((p) =>
          p.alive ? (
            <div
              key={p.id}
              className="absolute w-2 h-2 border border-white -translate-x-1/2 -translate-y-1/2"
              style={{ left: p.x * scaleX, top: p.y * scaleY, backgroundColor: p.color }}
            />
          ) : null
        )}
      </div>
    </div>
  );
}

/**
 * League of Legends PC Bottom-Center HUD Bar
 * Features:
 * - Left: Hero Class Portrait + AD / AP / ASPD / Armor / MoveSpeed Stats
 * - Center: Signature Primary Attack + [Q] [W] [E] Active Abilities + [R] Innate Passive + HP/Shield Bar & XP Bar
 * - Right: 6-Slot Cursed MOBA Item Inventory + Quick LoL Mouse / WASD Control Toggle
 */
function LeaguePcBottomHudBar({
  p1,
  onTriggerAbility,
  onOpenShop,
  onToggleControlScheme
}: {
  p1: PlayerHUDData;
  onTriggerAbility: (slot: AbilitySlotKey) => void;
  onOpenShop: () => void;
  onToggleControlScheme: () => void;
}) {
  const [hoveredSlot, setHoveredSlot] = useState<AbilitySlotKey | 'ATK' | null>(null);
  const hpPercent = Math.max(0, Math.min(100, (p1.hp / Math.max(1, p1.maxHp)) * 100));
  const shieldPercent = Math.max(0, Math.min(100, (p1.shieldHp / Math.max(1, p1.maxHp)) * 100));
  const xpPercent = Math.max(0, Math.min(100, (p1.inMatchXp / Math.max(1, p1.inMatchXpToNext)) * 100));

  const hoveredAbility = hoveredSlot && hoveredSlot !== 'ATK' ? p1.abilities.find((a) => a.slot === hoveredSlot) : null;
  const heroDef = OPERATOR_CLASS_LIST.find((op) => op.name === p1.className) || OPERATOR_CLASSES.vanguard;

  return (
    <div className="fixed inset-x-0 bottom-2 flex flex-col items-center pointer-events-none z-20 px-3">
      {/* Floating Full-Detail Skill Tooltip Card Above Bottom HUD */}
      {hoveredSlot === 'ATK' && (
        <div className="mb-2 w-full max-w-md bg-[#0D0B14]/95 border-2 border-orange-400 pixel-panel p-3 pointer-events-none shadow-[0_0_25px_rgba(0,0,0,0.9)] text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border border-orange-400 text-orange-300 bg-orange-500/20">
              UNLIMITED PRIMARY ATTACK (∞)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {p1.attacksPerSecond.toFixed(2)} Attacks/sec · {p1.attackDamage} AD
            </span>
          </div>
          <div className="font-['Oswald',sans-serif] text-sm font-bold uppercase text-white mt-1">
            {p1.primaryAttackName}
          </div>
          <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
            {heroDef.signatureWeaponDesc}
          </p>
        </div>
      )}

      {hoveredAbility && (
        <div
          className="mb-2 w-full max-w-md bg-[#0D0B14]/95 border-2 pixel-panel p-3 pointer-events-none shadow-[0_0_25px_rgba(0,0,0,0.9)] text-left"
          style={{ borderColor: hoveredAbility.color }}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border"
              style={{
                borderColor: hoveredAbility.color,
                color: hoveredAbility.color,
                backgroundColor: `${hoveredAbility.color}22`
              }}
            >
              [{hoveredAbility.slot}] {hoveredAbility.kind === 'PASSIVE' ? 'INNATE PASSIVE' : `ACTIVE · ${hoveredAbility.maxCooldown}s CD`}
            </span>
            <span className="text-[10px] font-mono text-orange-300 font-bold">
              Lv.{hoveredAbility.level}/{hoveredAbility.maxLevel} (+{hoveredAbility.level * 18}% Power)
            </span>
          </div>
          <div className="font-['Oswald',sans-serif] text-sm font-bold uppercase text-white mt-1">
            {hoveredAbility.name}
          </div>
          <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
            {hoveredAbility.description}
          </p>
        </div>
      )}

      <div className="bg-[#161224]/95 border-2 border-[#3B3154] pixel-panel px-3 py-2 flex items-center gap-3 pointer-events-auto shadow-[0_0_30px_rgba(0,0,0,0.85)] max-w-full">
        {/* Left: Hero Portrait & Core MOBA Stats */}
        <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-[#3B3154]">
          <div
            className="w-12 h-12 bg-[#09070F] border-2 flex flex-col items-center justify-center relative shrink-0 overflow-hidden"
            style={{ borderColor: p1.classColor }}
          >
            <HeroPixelPortrait classId={p1.operatorClass} color={p1.classColor} size={42} />
            <span className="absolute bottom-0 right-0.5 font-mono text-[9px] font-bold text-white bg-[#09070F]/85 px-1 tabular-nums">
              Lv.{p1.inMatchLevel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono tabular-nums">
            <div className="text-orange-300">
              AD: <span className="font-bold text-white">{p1.attackDamage}</span>
            </div>
            <div className="text-purple-300">
              AP: <span className="font-bold text-white">{p1.abilityPower}</span>
            </div>
            <div className="text-emerald-300">
              AS: <span className="font-bold text-white">{p1.attacksPerSecond.toFixed(2)}/s</span>
            </div>
            <div className="text-sky-300">
              ARM: <span className="font-bold text-white">{p1.armor}%</span>
            </div>
          </div>
        </div>

        {/* Center: Primary Attack + [Q] [W] [E] [R] Ability Bar + HP/Shield & XP Bars */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            {/* Unlimited Signature Primary Attack Slot */}
            <div
              onMouseEnter={() => setHoveredSlot('ATK')}
              onMouseLeave={() => setHoveredSlot(null)}
              className="w-12 h-12 bg-[#09070F] border-2 flex flex-col items-center justify-between p-1 relative select-none cursor-help"
              style={{ borderColor: p1.primaryAttackColor }}
              title={`${p1.primaryAttackName}: Unlimited Primary Attack (${p1.attacksPerSecond.toFixed(2)}/s)`}
            >
              <div className="flex items-center justify-between w-full text-[8px] font-mono">
                <span className="font-bold text-orange-300">ATK</span>
                <span className="text-emerald-400">∞</span>
              </div>
              <Swords className="w-4 h-4" style={{ color: p1.primaryAttackColor }} />
              <span className="text-[8px] font-mono text-slate-300 truncate max-w-full">
                {p1.primaryAttackName.split(' ')[0]}
              </span>
              {p1.primaryCooldownProgress < 1 && (
                <div
                  className="absolute inset-x-0 bottom-0 bg-white/15 pointer-events-none"
                  style={{ height: `${Math.round((1 - p1.primaryCooldownProgress) * 100)}%` }}
                />
              )}
            </div>

            {/* 4 Hero Ability Slots: [Q] [W] [E] Active + [R] Passive */}
            {p1.abilities.map((ab) => {
              const isPassive = ab.kind === 'PASSIVE';
              const onCooldown = !isPassive && ab.cooldownRemaining > 0;
              const cdPct =
                onCooldown && ab.maxCooldown > 0
                  ? Math.min(100, Math.round((ab.cooldownRemaining / ab.maxCooldown) * 100))
                  : 0;

              return (
                <button
                  key={ab.id}
                  type="button"
                  onMouseEnter={() => setHoveredSlot(ab.slot)}
                  onMouseLeave={() => setHoveredSlot(null)}
                  onClick={() => !isPassive && onTriggerAbility(ab.slot)}
                  title={`[${ab.slot}] ${ab.name} (Lv.${ab.level}/${ab.maxLevel}) — ${ab.description}`}
                  className={`w-12 h-12 bg-[#09070F] border-2 flex flex-col items-center justify-between p-1 relative overflow-hidden transition select-none ${
                    isPassive
                      ? 'cursor-help opacity-95'
                      : onCooldown
                      ? 'border-[#3B3154] opacity-75 cursor-not-allowed'
                      : 'hover:scale-105 cursor-pointer'
                  }`}
                  style={{
                    borderColor: onCooldown ? '#3B3154' : ab.color
                  }}
                >
                  {/* Cooldown Sweep Overlay */}
                  {onCooldown && (
                    <div
                      className="absolute inset-x-0 bottom-0 bg-[#09070F]/85 pointer-events-none flex items-center justify-center"
                      style={{ height: `${cdPct}%` }}
                    />
                  )}

                  <div className="flex items-center justify-between w-full text-[9px] font-mono z-10">
                    <span
                      className="px-1 font-bold"
                      style={{
                        backgroundColor: isPassive ? '#A855F733' : `${ab.color}33`,
                        color: isPassive ? '#D8B4FE' : ab.color
                      }}
                    >
                      {ab.slot}
                    </span>
                    <span className="text-[8px] text-slate-400">
                      {isPassive ? 'PAS' : `${Math.round(ab.maxCooldown)}s`}
                    </span>
                  </div>

                  <div className="z-10 font-['Oswald',sans-serif] text-[10px] font-bold uppercase text-white truncate max-w-full leading-tight">
                    {onCooldown ? (
                      <span className="font-mono text-xs text-orange-300 tabular-nums">
                        {ab.cooldownRemaining.toFixed(1)}s
                      </span>
                    ) : (
                      ab.name.split(' ')[0]
                    )}
                  </div>

                  {/* Ability Level Pips (Lv.1 - Lv.5) */}
                  <div className="flex items-center gap-0.5 z-10">
                    {Array.from({ length: ab.maxLevel }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1"
                        style={{
                          backgroundColor: i < ab.level ? ab.color : '#231D38'
                        }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom HP + Shield Bar & XP Bar (League style under QWER) */}
          <div className="space-y-1">
            <div className="w-full h-3.5 bg-[#09070F] border border-[#3B3154] relative overflow-hidden">
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${hpPercent}%`,
                  backgroundColor: hpPercent > 50 ? '#22C55E' : hpPercent > 25 ? '#F97316' : '#EF4444'
                }}
              />
              {shieldPercent > 0 && (
                <div
                  className="h-full bg-sky-300/80 absolute top-0 left-0 pointer-events-none"
                  style={{ width: `${Math.min(100, shieldPercent)}%` }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] font-mono font-bold text-white drop-shadow">
                <span>
                  {Math.ceil(p1.hp)} / {Math.ceil(p1.maxHp)} HP
                  {p1.shieldHp > 0 ? ` (+${Math.ceil(p1.shieldHp)} SHIELD)` : ''}
                </span>
                <span className="text-emerald-300">{p1.className}</span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-[#09070F] border border-[#3B3154] relative overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-150"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: 6-Slot Cursed MOBA Item Inventory (2x3 Grid) + Control Mode Toggle */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#3B3154]">
          <div>
            <div className="flex items-center justify-between text-[8px] font-mono uppercase text-orange-300 mb-1">
              <span>ITEMS ({p1.equippedItems.length}/6)</span>
              <button
                type="button"
                onClick={onOpenShop}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                SHOP
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 6 }).map((_, idx) => {
                const item = p1.equippedItems[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={onOpenShop}
                    title={
                      item
                        ? `${item.name} (Lv.${item.level}) — ${item.passiveSummary}`
                        : `Empty Item Slot #${idx + 1} (Click to open Cursed Item Shop)`
                    }
                    className="w-7 h-7 bg-[#09070F] border flex flex-col items-center justify-center relative cursor-pointer hover:border-orange-400 transition"
                    style={{ borderColor: item ? item.color : '#3B3154' }}
                  >
                    {item ? (
                      <>
                        <span
                          className="font-mono text-[8px] font-bold leading-none"
                          style={{ color: item.color }}
                        >
                          {item.shortName.slice(0, 3)}
                        </span>
                        <span className="font-mono text-[7px] text-white leading-none mt-0.5">
                          L{item.level}
                        </span>
                      </>
                    ) : (
                      <span className="text-[8px] font-mono text-slate-600">{idx + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick LoL Mouse / WASD Control Mode Toggle */}
          <div className="hidden md:flex flex-col gap-1">
            <button
              type="button"
              onClick={onToggleControlScheme}
              className={`px-2 py-1 border font-mono text-[9px] uppercase cursor-pointer transition ${
                p1.pcControlScheme === 'lol_mouse'
                  ? 'bg-orange-500/20 border-orange-400 text-orange-300 font-bold'
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
              }`}
              title="Toggle between League of Legends Right-Click Movement and WASD Movement"
            >
              {p1.pcControlScheme === 'lol_mouse' ? 'RMB: LoL Move' : 'Move: WASD'}
            </button>
            <div className="text-[8px] font-mono text-slate-400 text-center">
              [Q][W][E] Cursor Cast
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Typical Mobile MOBA UI Overlay (Wild Rift / Mobile Legends / Honor of Kings style)
 * - Bottom-Left: 360-degree floating virtual analog movement joystick
 * - Bottom-Center: Compact 6-Slot Equipped MOBA Item Strip
 * - Bottom-Right: Radial Combat Wheel with Large Primary Attack Button surrounded in a
 *   semi-circular arc (180°, 135°, 90°, 45°) by circular Q, W, E active skill buttons + R passive badge.
 *   Supports both quick-tap auto-aim and press-and-drag directional vector aiming!
 */
function MobileMobaControlsOverlay({
  p1,
  onMove,
  onAimFire,
  onTriggerAbility,
  onPing,
  onOpenShop
}: {
  p1: PlayerHUDData;
  onMove: (vx: number, vy: number) => void;
  onAimFire: (angle: number | null, firing: boolean) => void;
  onTriggerAbility: (slot: AbilitySlotKey, aimAngle?: number | null) => void;
  onPing: () => void;
  onOpenShop: () => void;
}) {
  const leftStickRef = useRef<HTMLDivElement | null>(null);
  const attackBtnRef = useRef<HTMLButtonElement | null>(null);
  const [leftKnob, setLeftKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [attackActive, setAttackActive] = useState(false);
  const [skillDrag, setSkillDrag] = useState<{
    slot: AbilitySlotKey;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
  } | null>(null);

  const maxRadius = 44;

  const updateLeftStick = (clientX: number, clientY: number) => {
    const el = leftStickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(maxRadius, dist);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;
    setLeftKnob({ x: kx, y: ky });
    if (dist > 6) {
      onMove(kx / maxRadius, ky / maxRadius);
    } else {
      onMove(0, 0);
    }
  };

  const resetLeftStick = () => {
    setLeftKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const handleAttackTouch = (clientX: number, clientY: number) => {
    const el = attackBtnRef.current;
    if (!el) {
      onAimFire(null, true);
      return;
    }
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    setAttackActive(true);
    if (dist > 14) {
      onAimFire(Math.atan2(dy, dx), true);
    } else {
      onAimFire(null, true);
    }
  };

  const stopAttackTouch = () => {
    setAttackActive(false);
    onAimFire(null, false);
  };

  // Semi-circular arc positions around the bottom-right Primary Attack anchor
  // Angles in degrees: Q = 185° (left), W = 140° (top-left), E = 95° (top), R = 50° (top-right passive badge)
  const arcAnglesDeg: Record<AbilitySlotKey, number> = {
    Q: 185,
    W: 140,
    E: 95,
    R: 50
  };
  const arcRadius = 96;

  return (
    <div className="fixed inset-x-0 bottom-3 px-3 flex items-end justify-between pointer-events-none z-30 select-none">
      {/* Bottom-Left: 360° Floating Virtual Analog Joystick */}
      <div className="flex flex-col items-start gap-2 pointer-events-auto">
        <div
          ref={leftStickRef}
          onTouchStart={(e) => {
            const t = e.targetTouches[0];
            if (t) updateLeftStick(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            const t = e.targetTouches[0];
            if (t) updateLeftStick(t.clientX, t.clientY);
          }}
          onTouchEnd={resetLeftStick}
          onTouchCancel={resetLeftStick}
          className="w-32 h-32 rounded-full bg-[#161224]/75 border-2 border-[#3B3154] backdrop-blur-sm relative flex items-center justify-center touch-none shadow-[0_0_25px_rgba(0,0,0,0.75)]"
        >
          <div className="w-16 h-16 rounded-full border border-purple-400/25 pointer-events-none" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-purple-300/70 absolute bottom-2 pointer-events-none">
            MOVE
          </span>
          <div
            style={{ transform: `translate(${leftKnob.x}px, ${leftKnob.y}px)` }}
            className="w-12 h-12 rounded-full bg-orange-500/90 border-2 border-white shadow-lg absolute pointer-events-none"
          />
        </div>
      </div>

      {/* Bottom-Center: Compact 6-Slot Equipped MOBA Items + Shop Button */}
      <div className="flex items-center gap-1 bg-[#161224]/90 border border-[#3B3154] px-2 py-1 pointer-events-auto mb-1">
        {Array.from({ length: 6 }).map((_, idx) => {
          const item = p1.equippedItems[idx];
          return (
            <button
              key={idx}
              type="button"
              onClick={onOpenShop}
              className="w-6 h-6 bg-[#09070F] border flex items-center justify-center text-[8px] font-mono font-bold"
              style={{ borderColor: item ? item.color : '#3B3154', color: item ? item.color : '#475569' }}
            >
              {item ? item.shortName.slice(0, 2) : idx + 1}
            </button>
          );
        })}
      </div>

      {/* Bottom-Right: Typical Mobile MOBA Radial Combat Wheel */}
      <div className="relative w-48 h-48 pointer-events-auto touch-none">
        {/* Quick Tactical Ping Button */}
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            onPing();
          }}
          onClick={onPing}
          className="absolute top-0 right-1 px-2.5 py-1 rounded-full bg-[#161224]/90 border border-orange-400/60 text-orange-300 font-mono text-[9px] uppercase shadow"
        >
          PING
        </button>

        {/* Semi-Circular Arc Skill Buttons: [Q] (185°), [W] (140°), [E] (95°), [R] Passive (50°) */}
        {p1.abilities.map((ab) => {
          const deg = arcAnglesDeg[ab.slot];
          const rad = (deg * Math.PI) / 180;
          // Anchor center is bottom-right at (right: 44px, bottom: 44px) -> in 192x192 container: cx = 144, cy = 144
          const cx = 140 + Math.cos(rad) * arcRadius;
          const cy = 140 - Math.sin(rad) * arcRadius;
          const isPassive = ab.kind === 'PASSIVE';
          const onCooldown = !isPassive && ab.cooldownRemaining > 0;
          const isDraggingThis = skillDrag?.slot === ab.slot;

          return (
            <div
              key={ab.id}
              style={{
                left: `${cx}px`,
                top: `${cy}px`
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (isPassive || onCooldown) return;
                  const t = e.targetTouches[0];
                  if (t) {
                    setSkillDrag({
                      slot: ab.slot,
                      startX: t.clientX,
                      startY: t.clientY,
                      dx: 0,
                      dy: 0
                    });
                  }
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  if (!skillDrag || skillDrag.slot !== ab.slot) return;
                  const t = e.targetTouches[0];
                  if (t) {
                    setSkillDrag({
                      ...skillDrag,
                      dx: t.clientX - skillDrag.startX,
                      dy: t.clientY - skillDrag.startY
                    });
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  if (isPassive || onCooldown) return;
                  if (skillDrag && skillDrag.slot === ab.slot) {
                    const dist = Math.hypot(skillDrag.dx, skillDrag.dy);
                    const aimAngle = dist > 14 ? Math.atan2(skillDrag.dy, skillDrag.dx) : null;
                    onTriggerAbility(ab.slot, aimAngle);
                    setSkillDrag(null);
                  } else {
                    onTriggerAbility(ab.slot, null);
                  }
                }}
                onClick={() => {
                  if (!isPassive && !onCooldown) onTriggerAbility(ab.slot, null);
                }}
                className={`rounded-full flex flex-col items-center justify-center relative overflow-hidden shadow-lg transition-transform ${
                  isPassive ? 'w-11 h-11 border-2' : 'w-14 h-14 border-2 active:scale-95'
                }`}
                style={{
                  backgroundColor: onCooldown ? '#09070FE6' : '#161224E6',
                  borderColor: onCooldown ? '#475569' : ab.color
                }}
              >
                {/* Radial Cooldown Overlay */}
                {onCooldown && (
                  <div className="absolute inset-0 bg-[#09070F]/80 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-orange-300 tabular-nums">
                      {ab.cooldownRemaining.toFixed(1)}
                    </span>
                  </div>
                )}

                <span
                  className="font-mono text-[10px] font-bold leading-none"
                  style={{ color: ab.color }}
                >
                  {ab.slot}
                </span>
                <span className="font-['Oswald',sans-serif] text-[9px] font-bold uppercase text-white truncate max-w-[44px] leading-tight mt-0.5">
                  {ab.name.split(' ')[0]}
                </span>

                {/* Level Pips */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  {Array.from({ length: ab.maxLevel }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: i < ab.level ? ab.color : '#334155' }}
                    />
                  ))}
                </div>
              </button>

              {/* Drag Aim Indicator Knob */}
              {isDraggingThis && (
                <div
                  style={{
                    transform: `translate(${Math.max(-36, Math.min(36, skillDrag.dx))}px, ${Math.max(
                      -36,
                      Math.min(36, skillDrag.dy)
                    )}px)`
                  }}
                  className="w-6 h-6 rounded-full bg-white/80 border-2 border-orange-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                />
              )}
            </div>
          );
        })}

        {/* Primary Attack Anchor Button (Bottom-Right Corner of Radial Wheel) */}
        <button
          ref={attackBtnRef}
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            const t = e.targetTouches[0];
            if (t) handleAttackTouch(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const t = e.targetTouches[0];
            if (t) handleAttackTouch(t.clientX, t.clientY);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopAttackTouch();
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            stopAttackTouch();
          }}
          style={{
            left: '140px',
            top: '140px',
            borderColor: attackActive ? '#FFFFFF' : p1.primaryAttackColor
          }}
          className={`w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 flex flex-col items-center justify-center absolute shadow-[0_0_25px_rgba(249,115,22,0.5)] transition-transform ${
            attackActive ? 'bg-orange-500 scale-95 text-[#09070F]' : 'bg-[#161224]/95 text-white'
          }`}
        >
          <Swords
            className="w-7 h-7"
            style={{ color: attackActive ? '#09070F' : p1.primaryAttackColor }}
          />
          <span className="font-['Oswald',sans-serif] text-[10px] font-bold uppercase tracking-wider mt-0.5">
            ATTACK
          </span>
        </button>
      </div>
    </div>
  );
}

const HOME_MENU_ITEMS = [
  { index: 0, label: 'START SURVIVAL' },
  { index: 1, label: 'LOAD GAME' },
  { index: 2, label: 'THE SWARM' },
  { index: 3, label: 'ARSENAL' },
  { index: 4, label: 'OPTIONS' },
  { index: 5, label: 'QUIT' }
] as const;

function ClassZHomeScene({
  activeMenuIdx,
  onHoverMenu,
  onSelectMenu,
  onPressStartPrompt
}: {
  activeMenuIdx: number;
  onHoverMenu: (idx: number) => void;
  onSelectMenu: (idx: number) => void;
  onPressStartPrompt: () => void;
}) {
  const sceneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  useEffect(() => {
    const img = new Image();
    img.src = '/assets/aistudio/classz_home_hd.jpg';
    img.onload = () => {
      bgImgRef.current = img;
      setImgLoaded(true);
    };
  }, []);

  useEffect(() => {
    const canvas = sceneCanvasRef.current;
    const img = bgImgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render at native 2K QHD (2048x1144, exact 2x coordinate space of 1024x572)
    const S = 2;
    const sx = img.naturalWidth / 1024;
    const sy = img.naturalHeight / 572;

    const copyRegion = (
      srcX: number,
      srcY: number,
      srcW: number,
      srcH: number,
      dstX: number,
      dstY: number,
      dstW = srcW,
      dstH = srcH
    ) => {
      ctx.drawImage(
        img,
        srcX * sx,
        srcY * sy,
        srcW * sx,
        srcH * sy,
        dstX * S,
        dstY * S,
        dstW * S,
        dstH * S
      );
    };

    let rafId = 0;
    const renderFrame = (now: number) => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, 1024 * S, 572 * S);
      ctx.drawImage(img, 0, 0, 1024 * S, 572 * S);

      // If a button other than START SURVIVAL (index 0) is hovered/selected,
      // seamlessly deactivate Button 0's red glow and draw a crisp HD Red Neon Glow + chainsaw on activeMenuIdx
      if (activeMenuIdx !== 0) {
        // 1. Replace Button 0's button box only (x=781..967, y=215..260) using Button 1's clean olive-grey box
        copyRegion(781, 261, 186, 45, 781, 215);
        // 2. Erase only the small 19px-tall chainsaw tip (x=967..1000, y=228..247) using the clean rivet-free metal bar slice at y=250
        copyRegion(967, 250, 33, 20, 967, 228);
        // 3. Tile clean olive-grey button face across Button 0's interior before restoring its text
        for (let dx = 800; dx < 952; dx += 20) {
          const w = Math.min(20, 952 - dx);
          copyRegion(801, 273, w, 20, dx, 227, w, 20);
        }
        // 4. Stamp Button 0's crisp "START SURVIVAL" label back onto the clean olive-grey plate
        copyRegion(801, 228, 152, 17, 801, 228);

        // 5. Draw a razor-sharp 2K HD Red Neon Glow border directly around activeMenuIdx's button box
        // (Zero rectangular background stamping -> preserves metal rivets and zombie hands!)
        const btnX = 787 * S;
        const btnY = (220 + activeMenuIdx * 46) * S;
        const btnW = 176 * S;
        const btnH = 35 * S;

        ctx.save();
        ctx.shadowColor = 'rgba(255, 38, 72, 0.95)';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#FF2A4B';
        ctx.lineWidth = 4.5;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#FF99AA';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(btnX + 2, btnY + 2, btnW - 4, btnH - 4);
        ctx.restore();

        // 6. Stamp ONLY the tight chainsaw selector sprite (x=948..997, y=229..245) onto the right edge of activeMenuIdx
        copyRegion(948, 229, 49, 17, 948, 229 + activeMenuIdx * 46);

        // 7. Keep the two zombie hands gripping the bottom edge when QUIT (index 5) is highlighted
        if (activeMenuIdx === 5) {
          copyRegion(812, 473, 27, 40, 812, 473);
          copyRegion(930, 467, 29, 46, 930, 467);
        }
      }

      // Subtle living siren beacon & fire glow pulse
      const redPulse = 0.5 + 0.5 * Math.sin(now * 0.007);
      const amberPulse = 0.5 + 0.5 * Math.cos(now * 0.007);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Left Red Siren Beacon (x=799, y=161)
      const redGrad = ctx.createRadialGradient(799 * S, 161 * S, 2 * S, 799 * S, 161 * S, 28 * S);
      redGrad.addColorStop(0, `rgba(255, 60, 60, ${0.42 * redPulse})`);
      redGrad.addColorStop(1, 'rgba(255, 60, 60, 0)');
      ctx.fillStyle = redGrad;
      ctx.beginPath();
      ctx.arc(799 * S, 161 * S, 28 * S, 0, Math.PI * 2);
      ctx.fill();

      // Right Amber Siren Beacon (x=953, y=161)
      const amberGrad = ctx.createRadialGradient(953 * S, 161 * S, 2 * S, 953 * S, 161 * S, 28 * S);
      amberGrad.addColorStop(0, `rgba(255, 190, 40, ${0.42 * amberPulse})`);
      amberGrad.addColorStop(1, 'rgba(255, 190, 40, 0)');
      ctx.fillStyle = amberGrad;
      ctx.beginPath();
      ctx.arc(953 * S, 161 * S, 28 * S, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [activeMenuIdx, imgLoaded]);

  return (
    <div className="absolute inset-0 z-20 bg-[#08090F] flex items-center justify-center overflow-hidden select-none">
      {/* Full-Viewport High-Definition 2K Main Design Stage (No blurry sidebars) */}
      <div className="relative w-full h-full">
        {/* Fallback static HD image until canvas is ready */}
        <img
          src="/assets/aistudio/classz_home_hd.jpg"
          alt="ClassZ Main Menu"
          referrerPolicy="no-referrer"
          className="w-full h-full block pointer-events-none"
        />

        {/* Dynamic 2K High-Definition Canvas */}
        <canvas
          ref={sceneCanvasRef}
          width={2048}
          height={1144}
          className="absolute inset-0 w-full h-full block pointer-events-none"
        />

        {/* 6 Interactive Industrial Menu Button Hitboxes */}
        {HOME_MENU_ITEMS.map((item) => {
          const topPct = ((219 + item.index * 46) / 572) * 100;
          const heightPct = (38 / 572) * 100;
          const leftPct = (786 / 1024) * 100;
          const widthPct = (218 / 1024) * 100;
          return (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              onMouseEnter={() => onHoverMenu(item.index)}
              onFocus={() => onHoverMenu(item.index)}
              onClick={() => onSelectMenu(item.index)}
              style={{
                top: `${topPct}%`,
                height: `${heightPct}%`,
                left: `${leftPct}%`,
                width: `${widthPct}%`
              }}
              className="absolute z-10 bg-transparent cursor-pointer focus:outline-none"
            />
          );
        })}

        {/* Interactive Bottom "PRESS [START] TO DEFEND" Button Hitbox */}
        <button
          type="button"
          aria-label="Press Start to Defend"
          onClick={onPressStartPrompt}
          style={{
            left: '36.5%',
            width: '28%',
            top: '93.5%',
            height: '5.5%'
          }}
          className="absolute z-10 bg-transparent hover:bg-white/5 border border-transparent hover:border-emerald-400/50 transition cursor-pointer focus:outline-none"
          title="Click or press [Enter] to Start Survival"
        />
      </div>
    </div>
  );
}


