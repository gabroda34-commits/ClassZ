import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MAX_PARTY_SIZE = 10;

interface PartyMember {
  id: string;
  name: string;
  color: string;
  operatorClass: string;
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
  weaponId: string;
  score: number;
  kills: number;
  droneCount: number;
  ws: WebSocket;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderColor: string;
  text: string;
  timestamp: number;
}

interface GameRoom {
  code: string;
  name: string;
  isPrivate: boolean;
  arenaId: 'boxy' | 'columns' | 'hell';
  status: 'WAITING' | 'IN_GAME';
  wave: number;
  createdAt: number;
  members: Map<string, PartyMember>;
  chat: ChatMessage[];
  lastWorldSync: any | null;
}

const rooms = new Map<string, GameRoom>();

const SQUAD_COLORS = [
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

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function serializeRoomSummary(room: GameRoom) {
  let hostName = 'Unknown';
  for (const m of room.members.values()) {
    if (m.isHost) {
      hostName = m.name;
      break;
    }
  }
  return {
    code: room.code,
    name: room.name,
    isPrivate: room.isPrivate,
    arenaId: room.arenaId,
    status: room.status,
    wave: room.wave,
    playerCount: room.members.size,
    maxPlayers: MAX_PARTY_SIZE,
    hostName
  };
}

function serializeRoomDetail(room: GameRoom) {
  return {
    ...serializeRoomSummary(room),
    members: Array.from(room.members.values()).map((m) => ({
      id: m.id,
      name: m.name,
      color: m.color,
      operatorClass: m.operatorClass,
      ready: m.ready,
      isHost: m.isHost,
      x: m.x,
      y: m.y,
      vx: m.vx,
      vy: m.vy,
      angle: m.angle,
      hp: m.hp,
      maxHp: m.maxHp,
      alive: m.alive,
      weaponId: m.weaponId,
      score: m.score,
      kills: m.kills,
      droneCount: m.droneCount
    })),
    chat: room.chat.slice(-25)
  };
}

function broadcastToRoom(room: GameRoom, payload: unknown, excludeId?: string) {
  const data = JSON.stringify(payload);
  for (const member of room.members.values()) {
    if (excludeId && member.id === excludeId) continue;
    if (member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(data);
    }
  }
}

function getPublicLobbyList() {
  const list = [];
  for (const room of rooms.values()) {
    if (!room.isPrivate && room.members.size > 0) {
      list.push(serializeRoomSummary(room));
    }
  }
  return list.sort((a, b) => b.playerCount - a.playerCount);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  app.get('/api/lobbies', (_req, res) => {
    res.json({ lobbies: getPublicLobbyList() });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    const urlObj = new URL(req.url || '/ws', 'http://localhost');
    const requestedId = urlObj.searchParams.get('clientId');
    const clientId =
      requestedId && /^p_[a-z0-9_]{4,20}$/i.test(requestedId)
        ? requestedId
        : `p_${Math.random().toString(36).slice(2, 10)}`;

    let currentRoomCode: string | null = null;

    const send = (payload: unknown) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    };

    const broadcastPublicLobbies = () => {
      const lobbies = getPublicLobbyList();
      const msg = JSON.stringify({ type: 'lobbies:list', lobbies });
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      }
    };

    const leaveCurrentRoom = (explicitLeave: boolean = false) => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      currentRoomCode = null;
      if (!room) return;

      const departing = room.members.get(clientId);
      // Ignore stale socket close if a newer socket already re-bound this clientId
      if (!explicitLeave && departing && departing.ws !== ws) {
        return;
      }

      room.members.delete(clientId);

      if (room.members.size === 0) {
        rooms.delete(room.code);
      } else {
        // Ensure at least one member is Host
        let anyHost = false;
        for (const m of room.members.values()) {
          if (m.isHost) {
            anyHost = true;
            break;
          }
        }
        if (!anyHost) {
          const nextHost = room.members.values().next().value as PartyMember | undefined;
          if (nextHost) {
            nextHost.isHost = true;
            nextHost.ready = true;
          }
        }
        broadcastToRoom(room, {
          type: 'room:updated',
          room: serializeRoomDetail(room),
          leftPlayerId: clientId
        });
      }
      broadcastPublicLobbies();
    };

    const joinRoomInstance = (
      room: GameRoom,
      playerName: string,
      preferredColor?: string,
      operatorClass?: string,
      isRejoin: boolean = false
    ) => {
      const existingMember = room.members.get(clientId);
      if (!existingMember && room.members.size >= MAX_PARTY_SIZE) {
        send({ type: 'error', message: `Lobby ${room.code} is full (10/10 players).` });
        return;
      }

      if (currentRoomCode && currentRoomCode !== room.code) {
        leaveCurrentRoom(true);
      }
      currentRoomCode = room.code;

      const usedColors = new Set(
        Array.from(room.members.values())
          .filter((m) => m.id !== clientId)
          .map((m) => m.color)
      );
      const assignedColor =
        preferredColor && !usedColors.has(preferredColor)
          ? preferredColor
          : existingMember?.color ||
            SQUAD_COLORS.find((c) => !usedColors.has(c)) ||
            SQUAD_COLORS[room.members.size % SQUAD_COLORS.length];

      let hasExistingHost = false;
      for (const m of room.members.values()) {
        if (m.id !== clientId && m.isHost) {
          hasExistingHost = true;
          break;
        }
      }
      const isHost = existingMember ? existingMember.isHost || !hasExistingHost : !hasExistingHost;

      const spawnAngle = (room.members.size / MAX_PARTY_SIZE) * Math.PI * 2;
      const spawnX = existingMember ? existingMember.x : Math.round(1200 + Math.cos(spawnAngle) * 110);
      const spawnY = existingMember ? existingMember.y : Math.round(900 + Math.sin(spawnAngle) * 110);

      const member: PartyMember = {
        id: clientId,
        name: (playerName || existingMember?.name || 'OPERATOR').slice(0, 16).toUpperCase(),
        color: assignedColor,
        operatorClass: operatorClass || existingMember?.operatorClass || 'marksman',
        ready: existingMember ? existingMember.ready : isHost,
        isHost,
        x: spawnX,
        y: spawnY,
        vx: existingMember?.vx || 0,
        vy: existingMember?.vy || 0,
        angle: existingMember?.angle || 0,
        hp: existingMember?.hp ?? 100,
        maxHp: existingMember?.maxHp ?? 100,
        alive: existingMember?.alive ?? true,
        weaponId: existingMember?.weaponId || 'pistol',
        score: existingMember?.score || 0,
        kills: existingMember?.kills || 0,
        droneCount: existingMember?.droneCount || 0,
        ws
      };

      room.members.set(clientId, member);

      if (!isRejoin && !existingMember) {
        room.chat.push({
          id: `sys_${Date.now()}_${Math.random()}`,
          senderName: 'SYSTEM',
          senderColor: '#F59E0B',
          text: `${member.name} joined the squad (${room.members.size}/${MAX_PARTY_SIZE}).`,
          timestamp: Date.now()
        });
      }

      send({
        type: 'room:joined',
        clientId,
        room: serializeRoomDetail(room),
        lastWorldSync: room.lastWorldSync
      });

      broadcastToRoom(
        room,
        {
          type: 'room:updated',
          room: serializeRoomDetail(room)
        },
        clientId
      );

      broadcastPublicLobbies();
    };

    send({
      type: 'welcome',
      clientId,
      lobbies: getPublicLobbyList()
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'lobbies:refresh': {
            send({ type: 'lobbies:list', lobbies: getPublicLobbyList() });
            break;
          }

          case 'room:create': {
            const code = generateRoomCode();
            const arenaId = ['boxy', 'columns', 'hell'].includes(msg.arenaId) ? msg.arenaId : 'boxy';
            const room: GameRoom = {
              code,
              name: (msg.roomName || `${msg.playerName || 'SQUAD'}'S SECTOR`).slice(0, 28).toUpperCase(),
              isPrivate: !!msg.isPrivate,
              arenaId,
              status: 'WAITING',
              wave: 1,
              createdAt: Date.now(),
              members: new Map(),
              chat: [],
              lastWorldSync: null
            };
            rooms.set(code, room);
            joinRoomInstance(room, msg.playerName, msg.playerColor, msg.operatorClass, false);
            break;
          }

          case 'room:join': {
            const code = String(msg.code || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (!room) {
              send({ type: 'error', message: `No lobby found with code "${code}".` });
              return;
            }
            joinRoomInstance(room, msg.playerName, msg.playerColor, msg.operatorClass, false);
            break;
          }

          case 'room:rejoin': {
            const code = String(msg.code || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (room) {
              joinRoomInstance(room, msg.playerName, msg.playerColor, msg.operatorClass, true);
            }
            break;
          }

          case 'matchmake:quick': {
            let bestRoom: GameRoom | null = null;
            for (const room of rooms.values()) {
              if (!room.isPrivate && room.members.size < MAX_PARTY_SIZE) {
                if (!bestRoom || (room.status === 'WAITING' && bestRoom.status !== 'WAITING')) {
                  bestRoom = room;
                }
              }
            }

            if (!bestRoom) {
              const code = generateRoomCode();
              const arenaId = ['boxy', 'columns', 'hell'].includes(msg.arenaId) ? msg.arenaId : 'boxy';
              bestRoom = {
                code,
                name: `PUBLIC STRIKE FORCE #${code.slice(0, 3)}`,
                isPrivate: false,
                arenaId,
                status: 'WAITING',
                wave: 1,
                createdAt: Date.now(),
                members: new Map(),
                chat: [],
                lastWorldSync: null
              };
              rooms.set(code, bestRoom);
            }

            joinRoomInstance(bestRoom, msg.playerName, msg.playerColor, msg.operatorClass, false);
            break;
          }

          case 'room:leave': {
            leaveCurrentRoom(true);
            send({ type: 'room:left' });
            break;
          }

          case 'room:config': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            const member = room?.members.get(clientId);
            if (!room || !member || !member.isHost) return;

            if (['boxy', 'columns', 'hell'].includes(msg.arenaId)) {
              room.arenaId = msg.arenaId;
            }
            if (typeof msg.isPrivate === 'boolean') {
              room.isPrivate = msg.isPrivate;
            }
            broadcastToRoom(room, {
              type: 'room:updated',
              room: serializeRoomDetail(room)
            });
            broadcastPublicLobbies();
            break;
          }

          case 'player:ready': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            const member = room?.members.get(clientId);
            if (!room || !member) return;
            member.ready = !!msg.ready;
            broadcastToRoom(room, {
              type: 'room:updated',
              room: serializeRoomDetail(room)
            });
            break;
          }

          case 'chat:send': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            const member = room?.members.get(clientId);
            if (!room || !member) return;
            const text = String(msg.text || '').trim().slice(0, 140);
            if (!text) return;

            const chatMsg: ChatMessage = {
              id: `c_${Date.now()}_${Math.random()}`,
              senderName: member.name,
              senderColor: member.color,
              text,
              timestamp: Date.now()
            };
            room.chat.push(chatMsg);
            if (room.chat.length > 40) room.chat.shift();

            broadcastToRoom(room, {
              type: 'chat:message',
              message: chatMsg
            });
            break;
          }

          case 'match:start': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            const member = room?.members.get(clientId);
            if (!room || !member || !member.isHost) return;

            room.status = 'IN_GAME';
            room.wave = msg.startOnBossWave ? 5 : 1;
            room.lastWorldSync = null;

            broadcastToRoom(room, {
              type: 'match:started',
              room: serializeRoomDetail(room),
              startOnBossWave: !!msg.startOnBossWave
            });
            broadcastPublicLobbies();
            break;
          }

          case 'player:state': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            const member = room?.members.get(clientId);
            if (!room || !member) return;

            member.x = Number(msg.x) || member.x;
            member.y = Number(msg.y) || member.y;
            member.vx = Number(msg.vx) || 0;
            member.vy = Number(msg.vy) || 0;
            member.angle = Number(msg.angle) || 0;
            member.hp = Number(msg.hp) ?? member.hp;
            member.maxHp = Number(msg.maxHp) || 100;
            member.alive = Boolean(msg.alive);
            member.weaponId = String(msg.weaponId || 'pistol');
            member.score = Number(msg.score) || 0;
            member.kills = Number(msg.kills) || 0;
            member.droneCount = Number(msg.droneCount) || 0;
            if (msg.operatorClass) member.operatorClass = String(msg.operatorClass);

            broadcastToRoom(
              room,
              {
                type: 'player:state',
                id: clientId,
                name: member.name,
                color: member.color,
                operatorClass: member.operatorClass,
                x: member.x,
                y: member.y,
                vx: member.vx,
                vy: member.vy,
                angle: member.angle,
                hp: member.hp,
                maxHp: member.maxHp,
                alive: member.alive,
                weaponId: member.weaponId,
                score: member.score,
                kills: member.kills,
                droneCount: member.droneCount
              },
              clientId
            );
            break;
          }

          case 'player:action': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            broadcastToRoom(
              room,
              {
                type: 'player:action',
                playerId: clientId,
                action: msg.action
              },
              clientId
            );
            break;
          }

          case 'world:sync': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            const member = room?.members.get(clientId);
            if (!room || !member) return;

            // Ensure room has a host; if sender is host, accept & cache authoritative world sync
            if (!member.isHost) {
              let anyHostOpen = false;
              for (const m of room.members.values()) {
                if (m.isHost && m.ws.readyState === WebSocket.OPEN) {
                  anyHostOpen = true;
                  break;
                }
              }
              if (!anyHostOpen) {
                member.isHost = true;
              } else {
                return;
              }
            }

            if (typeof msg.wave === 'number' && msg.wave !== room.wave) {
              room.wave = msg.wave;
              broadcastPublicLobbies();
            }

            const syncPayload = {
              type: 'world:sync',
              seq: Number(msg.seq) || Date.now(),
              wave: msg.wave,
              isBossWave: msg.isBossWave,
              combo: msg.combo,
              maxCombo: msg.maxCombo,
              enemiesToSpawn: msg.enemiesToSpawn,
              enemiesRemaining: msg.enemiesRemaining,
              enemies: msg.enemies,
              placeables: msg.placeables,
              pickups: msg.pickups
            };
            room.lastWorldSync = syncPayload;

            broadcastToRoom(room, syncPayload, clientId);
            break;
          }
        }
      } catch {
        // Ignore malformed JSON frames
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom(false);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Boxhead 10-Player Co-op Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
