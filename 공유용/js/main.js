// 피코파크 웹 멀티플레이어 - 메인 애플리케이션 엔트리

import { network } from "./network.js";
import { input } from "./input.js";
import { sound } from "./audio.js";
import { PlayerRenderer } from "./player.js";
import { PhysicsEngine } from "./physics.js";
import { GimmickManager } from "./gimmicks.js";
import { STAGES } from "./stages.js";

class PicoParkApp {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    
    this.currentStageIndex = 0;
    this.gimmickManager = new GimmickManager();
    this.currentStage = null;

    this.gameState = "LOBBY"; // LOBBY, ROOM, PLAYING, CLEARED, ALL_CLEARED
    this.clearTimer = 0;

    this.initDOM();
    this.initNetworkCallbacks();
  }

  // DOM 요소 및 이벤트 리스너 바인딩
  initDOM() {
    this.screenLobby = document.getElementById("screen-lobby");
    this.screenRoom = document.getElementById("screen-room");
    this.screenGame = document.getElementById("screen-game");

    this.inputNickname = document.getElementById("input-nickname");
    this.inputRoomCode = document.getElementById("input-room-code");
    this.btnCreateRoom = document.getElementById("btn-create-room");
    this.btnJoinRoom = document.getElementById("btn-join-room");
    this.btnStartGame = document.getElementById("btn-start-game");
    this.guestWaitingText = document.getElementById("guest-waiting-text");

    this.badgeRoomCode = document.getElementById("badge-room-code");
    this.textRoomCode = document.getElementById("text-room-code");
    this.textPlayerCount = document.getElementById("text-player-count");
    this.lobbyPlayerGrid = document.getElementById("lobby-player-grid");

    this.headerRoomChip = document.getElementById("header-room-chip");
    this.headerRoomCode = document.getElementById("header-room-code");
    this.btnSoundToggle = document.getElementById("btn-sound-toggle");
    this.toastBox = document.getElementById("toast-box");

    // 방 만들기 클릭
    this.btnCreateRoom.addEventListener("click", async () => {
      const nickname = this.inputNickname.value.trim() || "방장";
      this.btnCreateRoom.disabled = true;
      this.showToast("방을 개설하고 있습니다...");

      try {
        const { roomCode } = await network.createRoom(nickname);
        this.onRoomReady(roomCode, true);
      } catch (err) {
        this.btnCreateRoom.disabled = false;
        this.showToast("방 생성 실패: " + err.message);
      }
    });

    // 방 참가하기 클릭
    this.btnJoinRoom.addEventListener("click", async () => {
      const nickname = this.inputNickname.value.trim() || "플레이어";
      const roomCode = this.inputRoomCode.value.trim().toUpperCase();

      if (!roomCode || roomCode.length < 4) {
        this.showToast("올바른 6자리 방 코드를 입력하세요.");
        return;
      }

      this.btnJoinRoom.disabled = true;
      this.showToast("방에 입장하는 중입니다...");

      try {
        const { roomCode: code } = await network.joinRoom(roomCode, nickname);
        this.onRoomReady(code, false);
      } catch (err) {
        this.btnJoinRoom.disabled = false;
        this.showToast("입장 실패: 방 코드를 확인해 주세요.");
      }
    });

    // 방 코드 클릭 시 복사
    const copyRoomCode = () => {
      if (!network.roomCode) return;
      navigator.clipboard.writeText(network.roomCode).then(() => {
        this.showToast(`방 코드 [${network.roomCode}]가 복사되었습니다!`);
      });
    };
    this.badgeRoomCode.addEventListener("click", copyRoomCode);
    this.headerRoomChip.addEventListener("click", copyRoomCode);

    // 사운드 토글
    this.btnSoundToggle.addEventListener("click", () => {
      const isMuted = sound.toggleMute();
      this.btnSoundToggle.textContent = isMuted ? "🔇" : "🔊";
      this.showToast(isMuted ? "음소거 활성화" : "소리 켜짐");
    });

    // 게임 시작 버튼 (방장)
    this.btnStartGame.addEventListener("click", () => {
      network.startGame();
    });
  }

  // 방 입장 완료 시 화면 전환
  onRoomReady(roomCode, isHost) {
    this.gameState = "ROOM";
    this.screenLobby.classList.add("hidden");
    this.screenRoom.classList.remove("hidden");

    this.textRoomCode.textContent = roomCode;
    this.headerRoomCode.textContent = roomCode;
    this.headerRoomChip.classList.remove("hidden");

    if (isHost) {
      this.btnStartGame.classList.remove("hidden");
      this.guestWaitingText.classList.add("hidden");
    } else {
      this.btnStartGame.classList.add("hidden");
      this.guestWaitingText.classList.remove("hidden");
    }
  }

  // 네트워크 이벤트 콜백 등록
  initNetworkCallbacks() {
    // 로비 참가자 목록 갱신
    network.onLobbyUpdate = (players) => {
      this.textPlayerCount.textContent = players.length;
      this.renderLobbyPlayers(players);
    };

    // 게임 시작 신호 수신
    network.onGameStart = (data) => {
      this.loadStage(data.stage - 1);
      this.gameState = "PLAYING";
      this.screenRoom.classList.add("hidden");
      this.screenGame.classList.remove("hidden");
      this.showToast("게임 시작! 다 함께 협동하여 문으로 탈출하세요!");

      requestAnimationFrame(this.gameLoop.bind(this));
    };

    // 호스트로부터 상태 동기화 수신 (게스트 측)
    network.onStateSync = (data) => {
      if (!network.isHost) {
        // 플레이어 상태 반영
        data.players.forEach(remoteP => {
          if (network.players.has(remoteP.id)) {
            const localP = network.players.get(remoteP.id);
            // 내 캐릭터는 로컬 예측을 우선하되 큰 오차 보정
            if (remoteP.id === network.myId) {
              if (Math.hypot(remoteP.x - localP.x, remoteP.y - localP.y) > 40) {
                localP.x = remoteP.x;
                localP.y = remoteP.y;
              }
            } else {
              localP.x += (remoteP.x - localP.x) * 0.4;
              localP.y += (remoteP.y - localP.y) * 0.4;
              localP.vx = remoteP.vx;
              localP.vy = remoteP.vy;
              localP.facing = remoteP.facing;
              localP.isStackedUnder = remoteP.isStackedUnder;
              localP.isStackedAbove = remoteP.isStackedAbove;
            }
          }
        });

        // 기믹 상태 동기화
        if (data.gimmicks) {
          Object.assign(this.gimmickManager.key, data.gimmicks.key);
          this.gimmickManager.doorUnlocked = data.gimmicks.doorUnlocked;
          this.gimmickManager.stageCleared = data.gimmicks.stageCleared;
          if (data.gimmicks.pushBlocks) {
            data.gimmicks.pushBlocks.forEach((pb, i) => {
              if (this.gimmickManager.pushBlocks[i]) {
                this.gimmickManager.pushBlocks[i].x = pb.x;
              }
            });
          }
        }

        // 스테이지 전환 동기화
        if (data.stageIndex !== undefined && data.stageIndex !== this.currentStageIndex) {
          this.loadStage(data.stageIndex);
        }
      }
    };

    network.onError = (err) => {
      this.showToast(err.message);
    };
  }

  // 대기실 참가자 그리드 렌더링
  renderLobbyPlayers(players) {
    this.lobbyPlayerGrid.innerHTML = "";
    players.forEach(p => {
      const card = document.createElement("div");
      card.className = "player-card" + (p.id === network.myId ? " is-me" : "");

      const avatar = document.createElement("div");
      avatar.className = "player-avatar";
      avatar.style.backgroundColor = p.color;
      avatar.textContent = "🐱";

      const name = document.createElement("div");
      name.className = "player-name";
      name.textContent = p.nickname;

      if (p.isHost) {
        const crown = document.createElement("div");
        crown.className = "host-crown";
        crown.textContent = "👑";
        card.appendChild(crown);
      }

      card.appendChild(avatar);
      card.appendChild(name);
      this.lobbyPlayerGrid.appendChild(card);
    });
  }

  // 스테이지 로드
  loadStage(index) {
    this.currentStageIndex = index;
    if (this.currentStageIndex >= STAGES.length) {
      this.gameState = "ALL_CLEARED";
      return;
    }

    this.currentStage = STAGES[this.currentStageIndex];
    const playerCount = network.players.size;

    // 기믹 초기화 (인원수 비례 자동 조절 적용)
    this.gimmickManager.initGimmicks(this.currentStage, playerCount);

    // 플레이어들 스폰 위치로 리셋
    let offsetIdx = 0;
    network.players.forEach(p => {
      p.x = this.currentStage.spawnPoint.x + (offsetIdx * 28);
      p.y = this.currentStage.spawnPoint.y;
      p.vx = 0;
      p.vy = 0;
      p.isGrounded = false;
      offsetIdx++;
    });

    this.clearTimer = 0;
  }

  // 메인 게임 루프
  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // 상태 업데이트
  update() {
    if (this.gameState !== "PLAYING") return;

    const myPlayer = network.players.get(network.myId);
    const keyInput = input.getState();

    // 1. 내 캐릭터 물리 업데이트 (로컬 예측)
    if (myPlayer) {
      PhysicsEngine.updatePlayer(myPlayer, this.currentStage.platforms, keyInput);
      
      // 내 입력/좌표 상태 전송
      network.sendLocalInput({
        x: myPlayer.x,
        y: myPlayer.y,
        vx: myPlayer.vx,
        vy: myPlayer.vy,
        isGrounded: myPlayer.isGrounded,
        facing: myPlayer.facing
      });
    }

    // 2. 호스트가 수행하는 전체 물리 연산 및 기믹 동기화
    if (network.isHost) {
      const playerList = Array.from(network.players.values());

      // 플레이어 간 스택킹(머리 위 올라타기) 연산
      PhysicsEngine.resolvePlayerStacking(playerList);

      // 기믹(스위치, 열쇠, 밀기 상자, 문) 판정
      this.gimmickManager.update(network.players, this.currentStage.platforms, sound);

      // 스테이지 클리어 처리
      if (this.gimmickManager.stageCleared) {
        this.clearTimer++;
        if (this.clearTimer > 90) { // 1.5초 후 다음 스테이지로
          this.loadStage(this.currentStageIndex + 1);
        }
      }

      // 게스트들에게 전체 상태 브로드캐스트
      network.broadcastGameState({
        stageIndex: this.currentStageIndex,
        players: playerList.map(p => ({
          id: p.id,
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
          facing: p.facing,
          isStackedUnder: p.isStackedUnder,
          isStackedAbove: p.isStackedAbove
        })),
        gimmicks: {
          key: this.gimmickManager.key,
          doorUnlocked: this.gimmickManager.doorUnlocked,
          stageCleared: this.gimmickManager.stageCleared,
          pushBlocks: this.gimmickManager.pushBlocks.map(b => ({ x: b.x, y: b.y }))
        }
      });
    }
  }

  // 화면 렌더링
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameState === "ALL_CLEARED") {
      this.drawEndingScreen(ctx);
      return;
    }

    if (!this.currentStage) return;

    // 1. 부드러운 그리드 배경 (라이트 테마)
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    // 2. 플랫폼 타일 그리기
    ctx.fillStyle = "#334155";
    this.currentStage.platforms.forEach(plat => {
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      // 타일 상단 잔디/하이라이트
      ctx.fillStyle = "#64748b";
      ctx.fillRect(plat.x, plat.y, plat.width, 6);
      ctx.fillStyle = "#334155";
    });

    // 3. 기믹 오브젝트 그리기
    this.gimmickManager.draw(ctx);

    // 4. 플레이어 캐릭터들 그리기 (아래에서부터 위 순서로 그려서 스택킹 표현)
    const sortedPlayers = Array.from(network.players.values()).sort((a, b) => a.y - b.y);
    sortedPlayers.forEach(p => {
      PlayerRenderer.draw(ctx, p, p.id === network.myId);
    });

    // 5. 상단 정보 HUD 렌더링
    this.drawHUD(ctx);

    // 6. 스테이지 클리어 연출
    if (this.gimmickManager.stageCleared) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "#047857";
      ctx.textAlign = "center";
      ctx.fillText("🎉 STAGE CLEAR! 🎉", this.canvas.width / 2, this.canvas.height / 2 - 10);

      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#065f46";
      ctx.fillText("모두가 문 안으로 무사히 탈출했습니다!", this.canvas.width / 2, this.canvas.height / 2 + 35);
    }
  }

  // 상단 HUD 렌더링
  drawHUD(ctx) {
    // 스테이지 이름 및 미션 설명
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(this.currentStage.name, 24, 38);

    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(this.currentStage.description, 24, 62);

    // 참여 인원 및 문 입장 현황
    const entered = this.gimmickManager.door.enteredPlayers ? this.gimmickManager.door.enteredPlayers.size : 0;
    const total = network.players.size;
    ctx.textAlign = "right";
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = this.gimmickManager.doorUnlocked ? "#10b981" : "#475569";
    ctx.fillText(`🚪 문 탈출 현황: ${entered} / ${total}명`, this.canvas.width - 24, 38);

    // 키보드 조작 안내 가이드
    ctx.font = "13px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("조작: A/D 또는 방향키 (이동) · Space / W (점프)", this.canvas.width - 24, 62);
  }

  // 전 스테이지 완료 엔딩 화면
  drawEndingScreen(ctx) {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 52px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆 ALL STAGES CLEARED! 🏆", this.canvas.width / 2, this.canvas.height / 2 - 40);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("모든 팀원이 완벽한 팀워크로 피코파크 미션을 완수했습니다!", this.canvas.width / 2, this.canvas.height / 2 + 20);

    ctx.fillStyle = "#64748b";
    ctx.font = "16px sans-serif";
    ctx.fillText("함께 플레이해 주셔서 감사합니다.", this.canvas.width / 2, this.canvas.height / 2 + 65);
  }

  // 토스트 메시지 출력
  showToast(msg) {
    if (!this.toastBox) return;
    this.toastBox.textContent = msg;
    this.toastBox.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastBox.classList.remove("show");
    }, 2800);
  }
}

// 브라우저 로드 시 앱 초기화
window.addEventListener("DOMContentLoaded", () => {
  new PicoParkApp();
});
