// 피코파크 웹 멀티플레이어 - WebRTC P2P 통신 모듈
// 외부 서버 없이 브라우저 간 직접 연결(Peer-to-Peer DataChannel)

// 30가지 겹치지 않는 선명하고 예쁜 파스텔/비비드 색상 팔레트
export const PLAYER_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#fb7185", "#38bdf8", "#4ade80",
  "#facc15", "#fb923c", "#f472b6", "#c084fc", "#818cf8",
  "#60a5fa", "#34d399", "#a3e635", "#e879f9", "#2dd4bf"
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
      this.isHost = true;
      this.myNickname = nickname || "방장";
      this.roomCode = this.generateRoomCode();
      const peerId = `pico-${this.roomCode}`;

      // @ts-ignore (PeerJS는 index.html에서 로드됨)
      this.peer = new window.Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
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
        console.error("PeerJS 에러:", err);
        if (this.onError) this.onError(err);
        reject(err);
      });
    });
  }

  // 게스트 연결 처리 (호스트 측)
  handleGuestConnection(conn) {
    conn.on("open", () => {
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
    });
  }

  // 게스트로부터 받은 메시지 처리 (호스트 측)
  handleMessageFromGuest(conn, data) {
    switch (data.type) {
      case "join_req": {
        // 중복되지 않는 색상 자동 할당
        const usedColors = new Set(Array.from(this.players.values()).map(p => p.color));
        const assignedColor = PLAYER_COLORS.find(c => !usedColors.has(c)) || PLAYER_COLORS[this.players.size % PLAYER_COLORS.length];
        
        const playerInfo = {
          id: conn.peer,
          nickname: data.nickname || `참가자${this.players.size + 1}`,
          color: assignedColor,
          isHost: false,
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
    }
  }

  // 방 참가하기 (게스트)
  joinRoom(roomCode, nickname) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.roomCode = roomCode.trim().toUpperCase();
      this.myNickname = nickname || "플레이어";
      const hostPeerId = `pico-${this.roomCode}`;

      // @ts-ignore
      this.peer = new window.Peer(null, {
        debug: 1,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" }
          ]
        }
      });

      this.peer.on("open", (id) => {
        this.myId = id;
        // 호스트에게 연결 시도
        this.hostConnection = this.peer.connect(hostPeerId, { reliable: true });

        this.hostConnection.on("open", () => {
          // 입장 요청 전송
          this.hostConnection.send({
            type: "join_req",
            nickname: this.myNickname
          });
        });

        this.hostConnection.on("data", (data) => {
          this.handleMessageFromHost(data, resolve, reject);
        });

        this.hostConnection.on("close", () => {
          if (this.onError) this.onError(new Error("방장과의 연결이 끊어졌습니다."));
        });
      });

      this.peer.on("error", (err) => {
        console.error("참가 실패 에러:", err);
        if (this.onError) this.onError(err);
        reject(err);
      });
    });
  }

  // 호스트로부터 받은 메시지 처리 (게스트 측)
  handleMessageFromHost(data, resolve, reject) {
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

  // 게임 시작 신호 전송 (호스트 전용)
  startGame() {
    if (!this.isHost) return;
    const payload = {
      type: "game_start",
      stage: 1,
      playerCount: this.players.size
    };
    this.guestConnections.forEach(g => {
      if (g.conn.open) g.conn.send(payload);
    });
    if (this.onGameStart) this.onGameStart(payload);
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
