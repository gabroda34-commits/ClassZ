import {
  ArenaId,
  BossElement,
  EnemyType,
  LobbyChatMessage,
  LobbyDetail,
  LobbySummary,
  OperatorClassId,
  TacticalPingKind,
  WeaponId
} from '../types/game';

export type NetworkPlayerAction =
  | {
      kind: 'beam';
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
      weaponId: WeaponId;
    }
  | {
      kind: 'explosion';
      x: number;
      y: number;
      blastRadius: number;
      damage: number;
      cluster: boolean;
    }
  | {
      kind: 'placeable';
      placeableType: 'barrel' | 'fake_wall' | 'claymore' | 'charge_pack' | 'sentry_turret';
      x: number;
      y: number;
      blastRadius: number;
      damage: number;
    }
  | {
      kind: 'damage_enemy';
      enemyId: number;
      amount: number;
      knockX: number;
      knockY: number;
      weaponId?: WeaponId;
    }
  | {
      kind: 'enemy_killed';
      enemyId: number;
      x: number;
      y: number;
      isBoss: boolean;
    }
  | {
      kind: 'class_heal_burst';
      x: number;
      y: number;
      healAmount: number;
    }
  | {
      kind: 'trigger_boss';
    }
  | {
      kind: 'ping';
      id: string;
      senderName: string;
      senderColor: string;
      pingKind: TacticalPingKind;
      label: string;
      x: number;
      y: number;
    }
  | {
      kind: 'game_over';
    };

export interface RemotePlayerPacket {
  id: string;
  name: string;
  color: string;
  operatorClass?: OperatorClassId;
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
}

export interface WorldSyncPacket {
  seq: number;
  wave: number;
  isBossWave: boolean;
  combo: number;
  maxCombo: number;
  enemiesToSpawn: number;
  enemiesRemaining: number;
  enemies: {
    id: number;
    type: EnemyType;
    isBoss?: boolean;
    isMegaBoss?: boolean;
    bossElement?: BossElement;
    bossName?: string;
    bossTitle?: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    hp: number;
    maxHp: number;
    isWindingUp: boolean;
    chillTimer: number;
  }[];
  placeables: {
    id: number;
    type: 'barrel' | 'fake_wall' | 'claymore' | 'charge_pack' | 'sentry_turret';
    x: number;
    y: number;
    radius: number;
    chainTimer: number;
  }[];
  pickups: {
    id: number;
    kind: 'ammo' | 'medkit' | 'dm_weapon' | 'gold' | 'scrap' | 'xp' | 'gold_pouch';
    x: number;
    y: number;
  }[];
}

type Listener = () => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;

  public connected: boolean = false;
  public clientId: string = '';
  public playerName: string = 'BAMBO';
  public playerColor: string = '#38BDF8';
  public operatorClass: OperatorClassId = 'marksman';
  public publicLobbies: LobbySummary[] = [];
  public currentRoom: LobbyDetail | null = null;
  public lastError: string | null = null;

  private listeners: Set<Listener> = new Set();

  // Engine hooks for low-latency gameplay streaming
  public onMatchStarted: ((room: LobbyDetail, startOnBossWave: boolean) => void) | null = null;
  public onRemotePlayerState: ((packet: RemotePlayerPacket) => void) | null = null;
  public onRemotePlayerAction: ((playerId: string, action: NetworkPlayerAction) => void) | null = null;
  public onWorldSync: ((sync: WorldSyncPacket) => void) | null = null;
  public onPlayerLeft: ((playerId: string) => void) | null = null;

  constructor() {
    try {
      const savedId = sessionStorage.getItem('boxhead_mp_client_id');
      if (savedId) {
        this.clientId = savedId;
      } else {
        this.clientId = `p_${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem('boxhead_mp_client_id', this.clientId);
      }
      const savedName = localStorage.getItem('boxhead_mp_name');
      if (savedName) this.playerName = savedName;
      const savedColor = localStorage.getItem('boxhead_mp_color');
      if (savedColor) this.playerColor = savedColor;
    } catch {
      this.clientId = `p_${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?clientId=${encodeURIComponent(this.clientId)}`;

    try {
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      socket.onopen = () => {
        this.connected = true;
        this.lastError = null;
        // Automatically rejoin active room after any temporary network drop so host/enemies stay synced!
        if (this.currentRoom?.code) {
          this.send({
            type: 'room:rejoin',
            code: this.currentRoom.code,
            playerName: this.playerName,
            playerColor: this.playerColor,
            operatorClass: this.operatorClass
          });
        }
        this.notify();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch {
          // Ignore malformed message
        }
      };

      socket.onclose = () => {
        this.connected = false;
        this.notify();
        if (this.reconnectTimer === null) {
          this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 1500);
        }
      };

      socket.onerror = () => {
        // Handled by onclose
      };
    } catch {
      // Ignore connection error in offline environments
    }
  }

  private handleServerMessage(msg: any) {
    switch (msg.type) {
      case 'welcome': {
        if (msg.clientId) {
          this.clientId = msg.clientId;
          try {
            sessionStorage.setItem('boxhead_mp_client_id', this.clientId);
          } catch {
            // Ignore
          }
        }
        this.publicLobbies = msg.lobbies || [];
        this.notify();
        break;
      }
      case 'lobbies:list': {
        this.publicLobbies = msg.lobbies || [];
        this.notify();
        break;
      }
      case 'room:joined': {
        this.clientId = msg.clientId || this.clientId;
        const wasAlreadyInRoom = this.currentRoom?.code === msg.room?.code;
        this.currentRoom = msg.room;
        this.lastError = null;
        this.notify();
        // If joining a match already in progress (Drop-In Co-op!), launch directly into the game
        if (!wasAlreadyInRoom && this.currentRoom && this.currentRoom.status === 'IN_GAME' && this.onMatchStarted) {
          this.onMatchStarted(this.currentRoom, false);
        }
        if (msg.lastWorldSync && this.onWorldSync) {
          this.onWorldSync(msg.lastWorldSync as WorldSyncPacket);
        }
        break;
      }
      case 'room:updated': {
        this.currentRoom = msg.room;
        if (msg.leftPlayerId && this.onPlayerLeft) {
          this.onPlayerLeft(msg.leftPlayerId);
        }
        this.notify();
        break;
      }
      case 'room:left': {
        this.currentRoom = null;
        this.notify();
        break;
      }
      case 'chat:message': {
        if (this.currentRoom && msg.message) {
          this.currentRoom = {
            ...this.currentRoom,
            chat: [...this.currentRoom.chat.slice(-30), msg.message as LobbyChatMessage]
          };
          this.notify();
        }
        break;
      }
      case 'match:started': {
        this.currentRoom = msg.room;
        this.notify();
        if (this.currentRoom && this.onMatchStarted) {
          this.onMatchStarted(this.currentRoom, !!msg.startOnBossWave);
        }
        break;
      }
      case 'player:state': {
        if (this.onRemotePlayerState) {
          this.onRemotePlayerState(msg as RemotePlayerPacket);
        }
        break;
      }
      case 'player:action': {
        if (this.onRemotePlayerAction && msg.playerId && msg.action) {
          this.onRemotePlayerAction(msg.playerId, msg.action as NetworkPlayerAction);
        }
        break;
      }
      case 'world:sync': {
        if (this.onWorldSync) {
          this.onWorldSync(msg as WorldSyncPacket);
        }
        break;
      }
      case 'error': {
        this.lastError = msg.message || 'Multiplayer error';
        this.notify();
        break;
      }
    }
  }

  public setPlayerProfile(name: string, color: string, operatorClass?: OperatorClassId) {
    this.playerName = name.trim().slice(0, 16).toUpperCase() || 'BAMBO';
    this.playerColor = color;
    if (operatorClass) this.operatorClass = operatorClass;
    try {
      localStorage.setItem('boxhead_mp_name', this.playerName);
      localStorage.setItem('boxhead_mp_color', this.playerColor);
    } catch {
      // Ignore storage error
    }
    this.notify();
  }

  public refreshLobbies() {
    this.send({ type: 'lobbies:refresh' });
  }

  public quickMatchmake(arenaId: ArenaId) {
    this.lastError = null;
    this.send({
      type: 'matchmake:quick',
      playerName: this.playerName,
      playerColor: this.playerColor,
      operatorClass: this.operatorClass,
      arenaId
    });
  }

  public createLobby(roomName: string, isPrivate: boolean, arenaId: ArenaId) {
    this.lastError = null;
    this.send({
      type: 'room:create',
      roomName,
      isPrivate,
      arenaId,
      playerName: this.playerName,
      playerColor: this.playerColor,
      operatorClass: this.operatorClass
    });
  }

  public joinLobbyByCode(code: string) {
    this.lastError = null;
    this.send({
      type: 'room:join',
      code: code.trim().toUpperCase(),
      playerName: this.playerName,
      playerColor: this.playerColor,
      operatorClass: this.operatorClass
    });
  }

  public leaveLobby() {
    this.send({ type: 'room:leave' });
    this.currentRoom = null;
    this.notify();
  }

  public updateRoomConfig(arenaId: ArenaId, isPrivate: boolean) {
    this.send({
      type: 'room:config',
      arenaId,
      isPrivate
    });
  }

  public toggleReady(ready: boolean) {
    this.send({
      type: 'player:ready',
      ready
    });
  }

  public sendChat(text: string) {
    this.send({
      type: 'chat:send',
      text
    });
  }

  public startMatch(startOnBossWave: boolean = false) {
    this.send({
      type: 'match:start',
      startOnBossWave
    });
  }

  public isHost(): boolean {
    if (!this.currentRoom) return false;
    const me = this.currentRoom.members.find((m) => m.id === this.clientId);
    if (me) return !!me.isHost;
    // Fallback if clientId is first member
    return this.currentRoom.members[0]?.name === this.playerName && !!this.currentRoom.members[0]?.isHost;
  }

  public sendPlayerState(state: Omit<RemotePlayerPacket, 'id' | 'name' | 'color'>) {
    this.send({
      type: 'player:state',
      ...state
    });
  }

  public sendPlayerAction(action: NetworkPlayerAction) {
    this.send({
      type: 'player:action',
      action
    });
  }

  public sendWorldSync(sync: WorldSyncPacket) {
    this.send({
      type: 'world:sync',
      ...sync
    });
  }

  private send(payload: unknown) {
    this.connect();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      const socket = this.ws;
      const onOpen = () => {
        socket.send(JSON.stringify(payload));
        socket.removeEventListener('open', onOpen);
      };
      socket.addEventListener('open', onOpen);
    }
  }

  public subscribe(listener: Listener): () => void {
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

export const multiplayerClient = new MultiplayerClient();
