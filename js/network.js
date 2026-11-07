// 피코파크 웹 멀티플레이어 - WebRTC P2P 통신 모듈
// 외부 서버 없이 브라우저 간 직접 연결(Peer-to-Peer DataChannel)
// 시간 제한 타이머 없이 모든 학생이 끝까지 안정적으로 입장하도록 보장

// 30가지 겹치지 않는 선명하고 예쁜 파스텔/비비드 색상 팔레트
export const PLAYER_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#fb7185", "#38bdf8", "#4ade80",
  "#facc15", "#fb923c", "#f472b6", "#c084fc", "#818cf8",
  "#60a5fa", "#34d399", "#a3e635", "#e879f9", "#2dd4bf"
];

// 검증된 고속 공개 STUN 서버 풀
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" }
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

  // 방 만들기 (호스트)
  createRoom(nickname) {
    return new Promise((resolve, reject) => {
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
          iceServers: ICE_SERVERS
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

        resolve({ roomCode: this.roomCode, myId: this.myId });
        if (this.onLobbyUpdate) this.onLobbyUpdate(Array.from(this.players.values()));
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
    const bindGuestEvents = () => {
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
        console.warn("게스트 연결 알림:", err);
        this.removeGuest(conn.peer);
      });
    };

    if (conn.open) {
      bindGuestEvents();
    } else {
      conn.on("open", bindGuestEvents);
    }
  }

  // 게스트로부터 받은 메시지 처리 (호스트 측)
  handleMessageFromGuest(conn, data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case "join_req": {
        // 이미 등록된 게스트라면 환영 응답 재전송 (재시도 패킷 방어)
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
        if (this.players.has(conn.peer)) {
          const p = this.players.get(conn.peer);
          Object.assign(p, data.state);
        }
        break;
      }

      case "player_cheer": {
        if (this.onCheerReceived) {
          this.onCheerReceived(data.emoji, data.nickname);
        }
        break;
      }
    }
  }

  // 방 참가하기 (게스트 - 시간 제한 타이머 없이 끝까지 대기 & 응답 올 때까지 재시도)
  joinRoom(roomCode, nickname, onProgress = null) {
    return new Promise((resolve, reject) => {
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

      if (onProgress) onProgress("선생님 방에 연결하고 있습니다...");

      // @ts-ignore
      this.peer = new window.Peer(null, {
        debug: 1,
        config: {
          iceServers: ICE_SERVERS
        }
      });

      this.peer.on("open", (id) => {
        if (isFinished) return;
        this.myId = id;

        if (onProgress) onProgress(`선생님 방(${this.roomCode})에 입장 요청 중...`);

        // 호스트에게 연결 시도
        this.hostConnection = this.peer.connect(hostPeerId, { reliable: true });

        const sendJoinReq = () => {
          if (this.hostConnection && this.hostConnection.open) {
            this.hostConnection.send({
              type: "join_req",
              nickname: this.myNickname
            });
          }
        };

        const onConnected = () => {
          sendJoinReq();

          // 방장의 환영 응답(join_res)이 올 때까지 2초마다 가볍게 재전송 (패킷 유실 완벽 방지)
          if (retryTimer) clearInterval(retryTimer);
          retryTimer = setInterval(() => {
            if (isFinished) {
              if (retryTimer) clearInterval(retryTimer);
              return;
            }
            sendJoinReq();
          }, 2000);
        };

        if (this.hostConnection.open) {
          onConnected();
        } else {
          this.hostConnection.on("open", onConnected);
        }

        this.hostConnection.on("data", (data) => {
          if (!isFinished && data.type === "join_res") {
            if (retryTimer) clearInterval(retryTimer);
            isFinished = true;
          }
          this.handleMessageFromHost(data, resolve, reject);
        });

        this.hostConnection.on("close", () => {
          if (!isFinished) {
            if (retryTimer) clearInterval(retryTimer);
            isFinished = true;
            reject(new Error("선생님 방과의 연결이 닫혔습니다. 다시 시도해 주세요."));
          } else {
            if (this.onError) this.onError(new Error("선생님 방과의 연결이 끊어졌습니다."));
          }
        });
      });

      this.peer.on("error", (err) => {
        console.error("PeerJS 참가 에러:", err);
        if (!isFinished) {
          if (retryTimer) clearInterval(retryTimer);
          isFinished = true;
          let msg = "방에 입장할 수 없습니다.";
          if (err.type === "peer-unavailable") {
            msg = `선생님 방(${this.roomCode})을 찾을 수 없습니다. 칠판의 코드를 확인해 주세요.`;
          } else if (err.message) {
            msg = `입장 실패: ${err.message}`;
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
