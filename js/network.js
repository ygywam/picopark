// 피코파크 웹 멀티플레이어 - WebRTC P2P 통신 모듈
// 외부 서버 없이 브라우저 간 직접 연결(Peer-to-Peer DataChannel)
// 모바일 LTE/5G 및 학교 방화벽 통과를 위한 글로벌 무료 TURN 릴레이 풀 내장

// 30가지 겹치지 않는 선명하고 예쁜 파스텔/비비드 색상 팔레트
export const PLAYER_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#fb7185", "#38bdf8", "#4ade80",
  "#facc15", "#fb923c", "#f472b6", "#c084fc", "#818cf8",
  "#60a5fa", "#34d399", "#a3e635", "#e879f9", "#2dd4bf"
];

// 고속 STUN 및 방화벽/Symmetric NAT 통과를 위한 오픈릴레이 무료 TURN 서버 풀
export const DEFAULT_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:openrelay.metered.ca:80" },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp"
    ],
    username: "openrelay",
    credential: "openrelay"
  }
];

class NetworkManager {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.roomCode = null;
    this.myId = null;
    this.myNickname = "플레이어";
    this.myColor = PLAYER_COLORS[0];
    
    // 호스트일 때 관리하는 게스트 연결 목록: Map<peerId, { conn, nickname, color, state }>
    this.guestConnections = new Map();
    
    // 게스트일 때 호스트와의 연결
    this.hostConnection = null;
    
    // 전체 참가자 목록 (호스트 포함): Map<id, { id, nickname, color, isHost, x, y, vx, vy, isGrounded, facing }
    this.players = new Map();

    // 브로커 시그널링 세션 유지용 하트비트 타이머
    this.heartbeatTimer = null;

    // 이벤트 리스너 콜백
    this.onLobbyUpdate = null;
    this.onGameStart = null;
    this.onStateSync = null;
    this.onError = null;
    this.onCheerReceived = null;
  }

  // 6자리 난수 방 코드 생성
  generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // 시그널링 브로커 연결 유지용 하트비트 시작
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.peer && !this.peer.destroyed) {
        if (this.peer.disconnected) {
          console.warn("[Network] Peer disconnected from broker, attempting reconnect...");
          this.peer.reconnect();
        }
      }
    }, 15000);
  }

  // 하트비트 중단
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 방 만들기 (호스트)
  createRoom(nickname) {
    return new Promise((resolve, reject) => {
      this.stopHeartbeat();
      // 기존 연결 정리
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      this.isHost = true;
      this.myNickname = nickname || "선생님";
      this.roomCode = this.generateRoomCode();
      const peerId = `pico-${this.roomCode}`;

      // @ts-ignore (PeerJS는 index.html에서 로드됨)
      this.peer = new window.Peer(peerId, {
        debug: 1,
        config: {
          iceServers: DEFAULT_ICE_SERVERS
        }
      });

      this.peer.on("open", (id) => {
        this.myId = id;
        this.myColor = PLAYER_COLORS[0];
        this.players.set(this.myId, {
          id: this.myId,
          nickname: this.myNickname,
          color: this.myColor,
          isHost: true,
          width: 36,
          height: 36,
          x: 100,
          y: 450,
          vx: 0,
          vy: 0,
          isGrounded: false,
          facing: 1
        });

        this.startHeartbeat();
        resolve({ roomCode: this.roomCode, myId: this.myId });
        if (this.onLobbyUpdate) this.onLobbyUpdate(Array.from(this.players.values()));
      });

      // 시그널링 서버 연결 끊김 시 자동 재연결
      this.peer.on("disconnected", () => {
        console.warn("[Network] Host disconnected from signaling broker. Auto-reconnecting...");
        if (this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
      });

      // 게스트 접속 수신
      this.peer.on("connection", (conn) => {
        this.handleGuestConnection(conn);
      });

      this.peer.on("error", (err) => {
        console.error("PeerJS 호스트 에러:", err);
        if (this.onError) this.onError(err);
        reject(err);
      });
    });
  }

  // 게스트 연결 처리 (호스트 측 - 즉시/대기 연결 양방향 보장)
  handleGuestConnection(conn) {
    const setupGuest = () => {
      // 30인 초과 여부 확인
      if (this.players.size >= 32) {
        conn.send({ type: "error", message: "방 정원(30명)이 가득 찼습니다." });
        conn.close();
        return;
      }

      conn.on("data", (data) => {
        this.handleMessageFromGuest(conn, data);
      });

      conn.on("close", () => {
        this.removeGuest(conn.peer);
      });

      conn.on("error", (err) => {
        console.warn("게스트 연결 경고:", err);
        this.removeGuest(conn.peer);
      });
    };

    // PeerJS 레이스 컨디션 방지: 이미 open 상태인 경우 즉시 리스너 바인딩
    if (conn.open) {
      setupGuest();
    } else {
      conn.on("open", setupGuest);
    }
  }

  // 게스트로부터 받은 메시지 처리 (호스트 측)
  handleMessageFromGuest(conn, data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case "join_req": {
        // 이미 등록된 게스트라면 중복 처리 방지하고 환영 응답 재전송
        if (this.players.has(conn.peer)) {
          const existing = this.players.get(conn.peer);
          conn.send({
            type: "join_res",
            success: true,
            myId: conn.peer,
            assignedColor: existing.color,
            roomCode: this.roomCode
          });
          this.broadcastLobbyUpdate();
          return;
        }

        // 중복되지 않는 색상 자동 할당
        const usedColors = new Set(Array.from(this.players.values()).map(p => p.color));
        const assignedColor = PLAYER_COLORS.find(c => !usedColors.has(c)) || PLAYER_COLORS[this.players.size % PLAYER_COLORS.length];
        
        const playerInfo = {
          id: conn.peer,
          nickname: data.nickname || `참가자${this.players.size + 1}`,
          color: assignedColor,
          isHost: false,
          width: 36,
          height: 36,
          x: 100 + (this.players.size * 35),
          y: 450,
          vx: 0,
          vy: 0,
          isGrounded: false,
          facing: 1
        };

        this.guestConnections.set(conn.peer, { conn, ...playerInfo });
        this.players.set(conn.peer, playerInfo);

        // 환영 응답 전송
        conn.send({
          type: "join_res",
          success: true,
          myId: conn.peer,
          assignedColor,
          roomCode: this.roomCode
        });

        // 전체에게 로비 갱신 전송
        this.broadcastLobbyUpdate();
        break;
      }

      case "player_input": {
        // 게스트의 입력/위치 업데이트
        if (this.players.has(conn.peer)) {
          const p = this.players.get(conn.peer);
          Object.assign(p, data.state);
        }
        break;
      }

      case "player_cheer": {
        // 벤치 학생의 응원 이모지 수신
        if (this.onCheerReceived) {
          this.onCheerReceived(data.emoji, data.nickname);
        }
        break;
      }
    }
  }

  // 방 참가하기 (게스트 - TURN 릴레이 지원 및 단계별 핸드셰이크 재시도 보장)
  joinRoom(roomCode, nickname, onProgress = null) {
    return new Promise((resolve, reject) => {
      this.stopHeartbeat();
      // 기존 연결 정리
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      this.isHost = false;
      this.roomCode = (roomCode || "").trim().toUpperCase();
      this.myNickname = nickname || "학생";
      const hostPeerId = `pico-${this.roomCode}`;

      let isFinished = false;
      let retryTimer = null;

      // 18초 연결 타임아웃
      const timer = setTimeout(() => {
        if (!isFinished) {
          isFinished = true;
          if (retryTimer) clearInterval(retryTimer);
          reject(new Error("선생님 방과의 연결 시간이 초과되었습니다. 칠판의 초대 코드가 맞는지 확인하고 다시 시도해 주세요."));
        }
      }, 18000);

      if (onProgress) onProgress("1단계: 통신 서버에 접속하고 있습니다...");

      // @ts-ignore
      this.peer = new window.Peer(null, {
        debug: 1,
        config: {
          iceServers: DEFAULT_ICE_SERVERS
        }
      });

      this.peer.on("open", (id) => {
        if (isFinished) return;
        this.myId = id;
        this.startHeartbeat();

        if (onProgress) onProgress(`2단계: 선생님 방(${this.roomCode})을 탐색하고 있습니다...`);

        // 호스트에게 WebRTC 데이터 연결 시도
        this.hostConnection = this.peer.connect(hostPeerId, {
          reliable: true
        });

        const sendJoinReq = () => {
          if (this.hostConnection && this.hostConnection.open) {
            this.hostConnection.send({
              type: "join_req",
              nickname: this.myNickname
            });
          }
        };

        // 연결 열리면 join_req 전송 및 응답 수신할 때까지 주기적 재시도
        const setupConnection = () => {
          if (onProgress) onProgress("3단계: P2P 협동 채널을 연결하고 있습니다...");
          sendJoinReq();

          // 1.2초마다 응답 수신 확인 및 최대 5회 재시도 (패킷 유실 방지)
          let retries = 0;
          retryTimer = setInterval(() => {
            if (isFinished || retries >= 5) {
              if (retryTimer) clearInterval(retryTimer);
              return;
            }
            retries++;
            if (this.hostConnection && this.hostConnection.open) {
              sendJoinReq();
            }
          }, 1200);
        };

        if (this.hostConnection.open) {
          setupConnection();
        } else {
          this.hostConnection.on("open", setupConnection);
        }

        this.hostConnection.on("data", (data) => {
          if (!isFinished && data.type === "join_res") {
            clearTimeout(timer);
            if (retryTimer) clearInterval(retryTimer);
            isFinished = true;
          }
          this.handleMessageFromHost(data, resolve, reject);
        });

        this.hostConnection.on("error", (err) => {
          console.error("호스트 데이터채널 에러:", err);
          if (!isFinished) {
            clearTimeout(timer);
            if (retryTimer) clearInterval(retryTimer);
            isFinished = true;
            reject(new Error("선생님 방과의 P2P 채널 연결에 실패했습니다."));
          }
        });

        this.hostConnection.on("close", () => {
          if (!isFinished) {
            clearTimeout(timer);
            if (retryTimer) clearInterval(retryTimer);
            isFinished = true;
            reject(new Error("선생님 방과의 연결이 닫혔습니다."));
          } else {
            if (this.onError) this.onError(new Error("선생님 방과의 연결이 끊어졌습니다."));
          }
        });
      });

      this.peer.on("disconnected", () => {
        console.warn("[Network] Guest disconnected from broker. Reconnecting...");
        if (this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
      });

      this.peer.on("error", (err) => {
        console.error("PeerJS 참가 에러:", err);
        if (!isFinished) {
          clearTimeout(timer);
          if (retryTimer) clearInterval(retryTimer);
          isFinished = true;
          let msg = "방에 입장할 수 없습니다.";
          if (err.type === "peer-unavailable") {
            msg = `선생님 방(${this.roomCode})을 찾을 수 없습니다. 선생님이 방을 먼저 만들었는지, 코드가 맞는지 확인해 주세요.`;
          } else if (err.type === "network") {
            msg = "네트워크 연결이 불안정합니다. Wi-Fi 또는 데이터 연결을 확인해 주세요.";
          }
          reject(new Error(msg));
        }
      });
    });
  }

  // 호스트로부터 받은 메시지 처리 (게스트 측)
  handleMessageFromHost(data, resolve, reject) {
    if (!data || !data.type) return;

    switch (data.type) {
      case "join_res":
        if (data.success) {
          this.myColor = data.assignedColor;
          if (resolve) resolve({ roomCode: this.roomCode, myId: this.myId, color: this.myColor });
        } else {
          if (reject) reject(new Error(data.message || "입장에 실패했습니다."));
        }
        break;

      case "lobby_update":
        this.players.clear();
        data.players.forEach(p => this.players.set(p.id, p));
        if (this.onLobbyUpdate) this.onLobbyUpdate(data.players);
        break;

      case "game_start":
        if (this.onGameStart) this.onGameStart(data);
        break;

      case "sync_state":
        if (this.onStateSync) this.onStateSync(data);
        break;

      case "error":
        if (this.onError) this.onError(new Error(data.message));
        break;
    }
  }

  // 게스트 퇴장 처리
  removeGuest(peerId) {
    this.guestConnections.delete(peerId);
    this.players.delete(peerId);
    this.broadcastLobbyUpdate();
  }

  // 로비 플레이어 목록 브로드캐스트
  broadcastLobbyUpdate() {
    const list = Array.from(this.players.values());
    const payload = { type: "lobby_update", players: list };
    this.guestConnections.forEach(g => {
      if (g.conn.open) g.conn.send(payload);
    });
    if (this.onLobbyUpdate) this.onLobbyUpdate(list);
  }

  // 게임 시작 신호 전송 (호스트 전용 - 스테이지 및 난이도, 출전 명단 포함)
  startGame(stageIndex = 0, difficulty = "NORMAL", activePlayerIds = null) {
    if (!this.isHost) return;
    const payload = {
      type: "game_start",
      stageIndex: stageIndex,
      difficulty: difficulty,
      activePlayerIds: activePlayerIds,
      playerCount: this.players.size
    };
    this.guestConnections.forEach(g => {
      if (g.conn.open) g.conn.send(payload);
    });
    if (this.onGameStart) this.onGameStart(payload);
  }

  // 벤치 학생의 응원 전송 (게스트 -> 호스트)
  sendCheer(emoji) {
    if (this.isHost) {
      if (this.onCheerReceived) this.onCheerReceived(emoji, this.myNickname);
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: "player_cheer",
        emoji: emoji,
        nickname: this.myNickname
      });
    }
  }

  // 실시간 물리 상태 동기화 패킷 전송 (호스트 -> 게스트)
  broadcastGameState(statePayload) {
    if (!this.isHost) return;
    const payload = {
      type: "sync_state",
      ...statePayload
    };
    this.guestConnections.forEach(g => {
      if (g.conn.open) g.conn.send(payload);
    });
  }

  // 로컬 플레이어 입력 전송 (게스트 -> 호스트)
  sendLocalInput(inputState) {
    if (this.isHost) {
      if (this.players.has(this.myId)) {
        Object.assign(this.players.get(this.myId), inputState);
      }
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: "player_input",
        state: inputState
      });
    }
  }
}

export const network = new NetworkManager();
