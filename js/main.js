// 피코파크 웹 멀티플레이어 - 메인 애플리케이션 (50개 스테이지 & 선수 선발/교체 시스템 탑재)

import { network } from "./network.js";
import { input } from "./input.js";
import { sound } from "./audio.js";
import { PlayerRenderer } from "./player.js";
import { PhysicsEngine } from "./physics.js";
import { GimmickManager } from "./gimmicks.js";
import { getStageData, getAllStageSummaries, STAGE_CATEGORIES, TOTAL_STAGES } from "./stages.js";
import { IntroAnimation } from "./intro.js";

class PicoParkApp {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    
    this.currentStageIndex = 0;
    this.currentDifficulty = "NORMAL";
    this.gimmickManager = new GimmickManager();
    this.lastWrongKeyAlert = null;

    // 가짜 단어 열쇠 문 거부 시 알림 이벤트
    this.gimmickManager.onWrongKey = (word) => {
      this.lastWrongKeyAlert = word;
      this.showToast(`❌ [${word}] 단어는 빈칸에 맞지 않습니다! (말씀을 다시 확인하세요)`);
    };

    this.currentStage = null;

    this.gameState = "LOBBY"; // LOBBY, ROOM, PLAYING, CLEARED, ALL_CLEARED
    this.clearTimer = 0;
    
    // 출전 선수 관리: Set<playerId> (비어있으면 전원 출전)
    this.playMode = "ALL"; // "ALL" | "SELECT"
    this.selectedPlayerIds = new Set();
    this.activePlayerIds = new Set();

    // 부유하는 응원 이모지 파티클
    this.cheerParticles = [];

    // 모바일 조작 모드: 'GAMEPAD' | 'SCREEN'
    this.mobilePlayMode = "GAMEPAD";
    this.isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    this.isInvitedViaQR = false;

    this.initDOM();
    this.populate50StagesDropdown();
    this.initNetworkCallbacks();
    this.checkUrlRoomParam();
    this.initOrientationHandler();
  }

  // 50개 스테이지를 카테고리별 optgroup으로 드롭다운에 채움
  populate50StagesDropdown() {
    const select = document.getElementById("select-start-stage");
    if (!select) return;
    select.innerHTML = "";

    const summaries = getAllStageSummaries();
    
    STAGE_CATEGORIES.forEach(cat => {
      const group = document.createElement("optgroup");
      group.label = cat.title;

      const items = summaries.filter(s => {
        if (cat.id === "cat-2p") return s.index >= 0 && s.index < 10;
        if (cat.id === "cat-3p") return s.index >= 10 && s.index < 20;
        if (cat.id === "cat-4p") return s.index >= 20 && s.index < 30;
        if (cat.id === "cat-group") return s.index >= 30 && s.index < 40;
        if (cat.id === "cat-class") return s.index >= 40 && s.index < 50;
        if (cat.id === "cat-commandments") return s.index >= 50 && s.index < 60;
        return false;
      });

      items.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.index;
        const ropeTag = item.ropeEnabled ? " 🪢[밧줄]" : "";
        opt.textContent = `[${item.requiredPlayers}인] ${item.name}${ropeTag}`;
        if (item.index === 3) opt.selected = true; // 기본 4단계 밧줄 번지
        group.appendChild(opt);
      });

      select.appendChild(group);
    });

    this.updateRequiredCountLabel();
  }

  // 현재 선택된 스테이지의 필요 인원 라벨 갱신
  updateRequiredCountLabel() {
    const select = document.getElementById("select-start-stage");
    const countSpan = document.getElementById("text-req-count");
    if (!select || !countSpan) return;

    const summaries = getAllStageSummaries();
    const curIdx = parseInt(select.value, 10) || 0;
    const stageInfo = summaries[curIdx] || summaries[0];
    countSpan.textContent = stageInfo.requiredPlayers;
  }

  // 인트로 화면 초기화 및 표시 여부 판별 (QR 스캔 학생은 직행)
  initIntro() {
    const isHideIntro = localStorage.getItem("pico_hide_intro") === "true";
    const params = new URLSearchParams(window.location.search);
    const hasRoomParam = !!params.get("room");

    // QR 코드로 초대받아 들어온 학생은 인트로를 건너뛰고 곧바로 닉네임 입력 로비로 직행!
    if (!isHideIntro && !hasRoomParam) {
      if (this.screenIntro) this.screenIntro.classList.remove("hidden");
      if (this.screenLobby) this.screenLobby.classList.add("hidden");
      if (this.introAnim) this.introAnim.start();
    } else {
      if (this.screenIntro) this.screenIntro.classList.add("hidden");
      if (this.screenLobby) this.screenLobby.classList.remove("hidden");
    }

    // 게임 시작하기 버튼
    if (this.btnIntroStart) {
      this.btnIntroStart.addEventListener("click", () => {
        const shouldHide = this.chkIntroHide && this.chkIntroHide.checked;
        this.closeIntro(shouldHide);
      });
    }

    // 건너뛰기 버튼
    if (this.btnIntroSkip) {
      this.btnIntroSkip.addEventListener("click", () => {
        const shouldHide = this.chkIntroHide && this.chkIntroHide.checked;
        this.closeIntro(shouldHide);
      });
    }

    // 다시 보지 않기 버튼
    if (this.btnIntroDontShow) {
      this.btnIntroDontShow.addEventListener("click", () => {
        this.closeIntro(true);
      });
    }

    // 로비의 오프닝 인트로 다시보기 버튼
    if (this.btnReopenIntro) {
      this.btnReopenIntro.addEventListener("click", () => {
        localStorage.removeItem("pico_hide_intro");
        if (this.chkIntroHide) this.chkIntroHide.checked = false;
        if (this.screenLobby) this.screenLobby.classList.add("hidden");
        if (this.screenIntro) this.screenIntro.classList.remove("hidden");
        if (this.introAnim) this.introAnim.start();
      });
    }
  }

  // 인트로 닫고 메인 로비 진입
  closeIntro(saveHide = false) {
    if (saveHide) {
      localStorage.setItem("pico_hide_intro", "true");
      this.showToast("다음 접속부터 인트로가 자동으로 건너뛰어집니다.");
    }
    if (this.introAnim) this.introAnim.stop();
    if (this.screenIntro) this.screenIntro.classList.add("hidden");
    if (this.screenLobby) this.screenLobby.classList.remove("hidden");

    // 배경음악 자동 시작 활성화
    sound.ensureStarted();
    if (this.textBgmTheme) {
      this.textBgmTheme.textContent = `🎵 ${sound.getCurrentTheme().name}`;
    }
  }

  // DOM 요소 및 이벤트 리스너 바인딩
  initDOM() {
    this.screenLobby = document.getElementById("screen-lobby");
    this.screenRoom = document.getElementById("screen-room");
    this.screenGame = document.getElementById("screen-game");
    this.screenGamepad = document.getElementById("screen-gamepad");
    this.screenSpectator = document.getElementById("screen-spectator");

    // 오프닝 인트로 화면 및 조작 버튼
    this.screenIntro = document.getElementById("screen-intro");
    this.btnIntroStart = document.getElementById("btn-intro-start");
    this.btnIntroSkip = document.getElementById("btn-intro-skip");
    this.btnIntroDontShow = document.getElementById("btn-intro-dontshow");
    this.chkIntroHide = document.getElementById("chk-intro-hide");
    this.btnReopenIntro = document.getElementById("btn-reopen-intro");

    this.introAnim = new IntroAnimation("intro-canvas", "text-intro-guide");
    this.initIntro();

    this.inputNickname = document.getElementById("input-nickname");
    this.inputRoomCode = document.getElementById("input-room-code");
    this.btnCreateRoom = document.getElementById("btn-create-room");
    this.btnJoinRoom = document.getElementById("btn-join-room");
    this.btnStartGame = document.getElementById("btn-start-game");
    this.guestWaitingText = document.getElementById("guest-waiting-text");

    // 방장 50개 스테이지 & 선수 선발 제어
    this.hostStageSettings = document.getElementById("host-stage-settings");
    this.selectStartStage = document.getElementById("select-start-stage");
    this.selectDifficulty = document.getElementById("select-difficulty");
    this.btnRandomStage = document.getElementById("btn-random-stage");
    this.modeAllPlayers = document.getElementById("mode-all-players");
    this.modeSelectPlayers = document.getElementById("mode-select-players");
    this.btnAutoPickPlayers = document.getElementById("btn-auto-pick-players");

    // 인게임 상단 방장 제어 툴
    this.hostGameControls = document.getElementById("host-game-controls");
    this.btnChangePlayers = document.getElementById("btn-change-players");
    this.btnRestartStage = document.getElementById("btn-restart-stage");
    this.btnSkipStage = document.getElementById("btn-skip-stage");

    // QR 전용 분기 요소
    this.lobbyNormalActions = document.getElementById("lobby-normal-actions");
    this.lobbyQrActions = document.getElementById("lobby-qr-actions");
    this.btnQrJoinRoom = document.getElementById("btn-qr-join-room");
    this.qrInvitedBadge = document.getElementById("qr-invited-badge");
    this.textInvitedCode = document.getElementById("text-invited-code");
    this.lobbyDescText = document.getElementById("lobby-desc-text");

    this.badgeRoomCode = document.getElementById("badge-room-code");
    this.textRoomCode = document.getElementById("text-room-code");
    this.textPlayerCount = document.getElementById("text-player-count");
    this.lobbyPlayerGrid = document.getElementById("lobby-player-grid");
    this.qrCodeContainer = document.getElementById("qr-code-img");

    this.headerRoomChip = document.getElementById("header-room-chip");
    this.headerRoomCode = document.getElementById("header-room-code");
    this.btnBgmTheme = document.getElementById("btn-bgm-theme");
    this.textBgmTheme = document.getElementById("text-bgm-theme");
    this.btnVolDown = document.getElementById("btn-vol-down");
    this.textVolLevel = document.getElementById("text-vol-level");
    this.btnVolUp = document.getElementById("btn-vol-up");
    this.btnSoundToggle = document.getElementById("btn-sound-toggle");
    this.toastBox = document.getElementById("toast-box");

    // 모바일 모드 토글
    this.mobileModeBar = document.getElementById("mobile-mode-bar");
    this.btnModeGamepad = document.getElementById("btn-mode-gamepad");
    this.btnModeScreen = document.getElementById("btn-mode-screen");
    this.mobileControls = document.getElementById("mobile-controls");

    this.btnModeGamepad.addEventListener("click", () => this.setMobilePlayMode("GAMEPAD"));
    this.btnModeScreen.addEventListener("click", () => this.setMobilePlayMode("SCREEN"));

    // 스테이지 드롭다운 변경 시
    this.selectStartStage.addEventListener("change", () => {
      this.updateRequiredCountLabel();
      if (this.playMode === "SELECT") {
        this.autoPickPlayers();
      }
    });

    // 🎲 럭키 랜덤 스테이지 뽑기 버튼
    this.btnRandomStage.addEventListener("click", () => {
      const summaries = getAllStageSummaries();
      const pCount = Math.max(1, network.players.size);
      
      // 현재 인원수로 도전 가능한 적합 스테이지 후보 필터링
      let candidates = summaries.filter(s => s.requiredPlayers <= pCount);
      if (candidates.length === 0) candidates = summaries;

      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      this.selectStartStage.value = picked.index;
      this.updateRequiredCountLabel();

      if (this.playMode === "SELECT") {
        this.autoPickPlayers();
      }
      this.showToast(`🎲 랜덤 당첨: ${picked.name}! (필요: ${picked.requiredPlayers}명)`);
    });

    // 출전 방식 라디오 토글
    const handleModeChange = () => {
      this.playMode = this.modeSelectPlayers.checked ? "SELECT" : "ALL";
      if (this.playMode === "SELECT") {
        this.btnAutoPickPlayers.classList.remove("hidden");
        this.autoPickPlayers();
      } else {
        this.btnAutoPickPlayers.classList.add("hidden");
        this.selectedPlayerIds.clear();
        this.renderLobbyPlayers(Array.from(network.players.values()));
      }
    };
    this.modeAllPlayers.addEventListener("change", handleModeChange);
    this.modeSelectPlayers.addEventListener("change", handleModeChange);

    // 대표 선수 랜덤 추첨 버튼
    this.btnAutoPickPlayers.addEventListener("click", () => {
      this.autoPickPlayers();
      this.showToast("🎲 대표 선수가 무작위로 추첨되었습니다!");
    });

    // 방 만들기 클릭
    this.btnCreateRoom.addEventListener("click", async () => {
      sound.ensureStarted();
      const nickname = this.inputNickname.value.trim() || "선생님";
      this.btnCreateRoom.disabled = true;
      this.showToast("교실 방을 개설하고 있습니다...");

      try {
        const { roomCode } = await network.createRoom(nickname);
        this.onRoomReady(roomCode, true);
      } catch (err) {
        this.btnCreateRoom.disabled = false;
        this.showToast("방 생성 실패: " + err.message);
      }
    });

    // 방 참가하기
    this.btnJoinRoom.addEventListener("click", () => {
      sound.ensureStarted();
      this.doJoinRoom(this.inputRoomCode.value.trim().toUpperCase(), this.btnJoinRoom);
    });
    this.btnQrJoinRoom.addEventListener("click", () => {
      sound.ensureStarted();
      this.doJoinRoom(this.invitedRoomCode, this.btnQrJoinRoom);
    });

    // 닉네임 입력란 Enter 키 입력 시 즉시 입장
    this.inputNickname.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sound.ensureStarted();
        if (this.isInvitedViaQR) {
          this.doJoinRoom(this.invitedRoomCode, this.btnQrJoinRoom);
        } else {
          this.doJoinRoom(this.inputRoomCode.value.trim().toUpperCase(), this.btnJoinRoom);
        }
      }
    });

    // 방 코드 입력란 Enter 키 입력 시 즉시 입장
    this.inputRoomCode.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sound.ensureStarted();
        this.doJoinRoom(this.inputRoomCode.value.trim().toUpperCase(), this.btnJoinRoom);
      }
    });

    // 초대 코드 복사
    const copyRoomCode = () => {
      if (!network.roomCode) return;
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${network.roomCode}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast(`초대 링크가 복사되었습니다!`);
      });
    };
    this.badgeRoomCode.addEventListener("click", copyRoomCode);
    this.headerRoomChip.addEventListener("click", copyRoomCode);

    // BGM 테마 수동 변경 버튼
    if (this.btnBgmTheme) {
      this.btnBgmTheme.addEventListener("click", () => {
        sound.ensureStarted();
        const theme = sound.nextTheme();
        if (this.textBgmTheme) this.textBgmTheme.textContent = `🎵 ${theme.name}`;
        this.showToast(`음악 테마: ${theme.name} (${theme.description})`);
      });
    }

    // 음량 작게 버튼
    if (this.btnVolDown) {
      this.btnVolDown.addEventListener("click", () => {
        sound.ensureStarted();
        const vol = sound.changeVolume(-0.1);
        if (this.textVolLevel) this.textVolLevel.textContent = `${vol}%`;
        if (this.btnSoundToggle) this.btnSoundToggle.textContent = sound.isMuted ? "🔇" : "🔊";
      });
    }

    // 음량 크게 버튼
    if (this.btnVolUp) {
      this.btnVolUp.addEventListener("click", () => {
        sound.ensureStarted();
        const vol = sound.changeVolume(0.1);
        if (this.textVolLevel) this.textVolLevel.textContent = `${vol}%`;
        if (this.btnSoundToggle) this.btnSoundToggle.textContent = sound.isMuted ? "🔇" : "🔊";
      });
    }

    // 사운드 음소거 토글
    this.btnSoundToggle.addEventListener("click", () => {
      sound.ensureStarted();
      const isMuted = sound.toggleMute();
      this.btnSoundToggle.textContent = isMuted ? "🔇" : "🔊";
      if (this.textVolLevel) this.textVolLevel.textContent = `${sound.getVolumePercent()}%`;
      this.showToast(isMuted ? "음소거 활성화" : "소리 켜짐");
    });

    // 브라우저 최초 인터랙션 시 자동 재생 활성화
    const unlockAudio = () => {
      sound.ensureStarted();
      if (this.textBgmTheme) {
        this.textBgmTheme.textContent = `🎵 ${sound.getCurrentTheme().name}`;
      }
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });

    // 게임 시작 버튼
    this.btnStartGame.addEventListener("click", () => {
      const stageIdx = parseInt(this.selectStartStage.value, 10) || 0;
      const difficulty = this.selectDifficulty.value || "NORMAL";
      
      const activeIds = this.playMode === "SELECT" 
        ? Array.from(this.selectedPlayerIds) 
        : Array.from(network.players.keys());

      network.startGame(stageIdx, difficulty, activeIds);
    });

    // 🔄 선수 교체(체인지) 버튼
    this.btnChangePlayers.addEventListener("click", () => {
      if (!network.isHost) return;
      this.rotateBenchPlayers();
    });

    // 인게임 재시작 및 스킵
    this.btnRestartStage.addEventListener("click", () => {
      if (network.isHost) {
        this.loadStage(this.currentStageIndex, this.currentDifficulty);
        this.showToast("스테이지를 다시 시작합니다!");
      }
    });
    this.btnSkipStage.addEventListener("click", () => {
      if (network.isHost) {
        this.loadStage(this.currentStageIndex + 1, this.currentDifficulty);
        this.showToast("다음 스테이지로 이동했습니다!");
      }
    });

    // 벤치 응원 버튼들 바인딩
    document.querySelectorAll(".btn-cheer").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const emoji = btn.getAttribute("data-emoji") || "👏";
        network.sendCheer(emoji);
        btn.classList.add("pulse");
        setTimeout(() => btn.classList.remove("pulse"), 200);
      });
    });

    // 응원 이모지 수신 리스너 (캔버스에 띄움)
    network.onCheerReceived = (emoji, nickname) => {
      this.spawnCheerParticle(emoji, nickname);
    };
  }

  // 대표 선수 자동 추첨 (필요 인원수만큼)
  autoPickPlayers() {
    const allIds = Array.from(network.players.keys());
    const summaries = getAllStageSummaries();
    const curIdx = parseInt(this.selectStartStage.value, 10) || 0;
    const req = summaries[curIdx] ? summaries[curIdx].requiredPlayers : 2;

    this.selectedPlayerIds.clear();
    // 셔플 후 앞에서부터 req개 선발
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    shuffled.slice(0, Math.min(req, allIds.length)).forEach(id => {
      this.selectedPlayerIds.add(id);
    });

    this.renderLobbyPlayers(Array.from(network.players.values()));
  }

  // 🔄 벤치 학생과 출전 선수 바통 터치 (교체)
  rotateBenchPlayers() {
    const allIds = Array.from(network.players.keys());
    if (allIds.length <= this.activePlayerIds.size) {
      this.showToast("대기 중인 벤치 학생이 없습니다 (전원 출전 중)");
      return;
    }

    const summaries = getAllStageSummaries();
    const stageInfo = summaries[this.currentStageIndex] || { requiredPlayers: 2 };
    const req = stageInfo.requiredPlayers;

    // 현재 출전하지 않고 있는 벤치 플레이어들 찾기
    const benchIds = allIds.filter(id => !this.activePlayerIds.has(id));
    const newActives = new Set();

    // 벤치 학생들을 우선 선발
    benchIds.slice(0, req).forEach(id => newActives.add(id));

    // 그래도 자리가 남으면 기존 선수 중 일부 유지
    if (newActives.size < req) {
      allIds.forEach(id => {
        if (newActives.size < req) newActives.add(id);
      });
    }

    this.activePlayerIds = newActives;
    this.selectedPlayerIds = new Set(newActives);

    // 새 출전 명단으로 스테이지 재시작 브로드캐스트
    network.startGame(this.currentStageIndex, this.currentDifficulty, Array.from(newActives));
    this.showToast("🔄 선수 교체 완료! 새로운 대표팀이 출전합니다!");
  }

  // 응원 이모지 생성
  spawnCheerParticle(emoji, nickname) {
    this.cheerParticles.push({
      emoji: emoji,
      name: nickname,
      x: 100 + Math.random() * (this.canvas.width - 200),
      y: this.canvas.height - 40,
      vy: -3.5 - Math.random() * 2,
      vx: (Math.random() - 0.5) * 1.5,
      alpha: 1.0,
      scale: 1.0 + Math.random() * 0.4
    });
  }

  // 실제 입장 로직 (방탄 코드 확인 및 에러 메시지 상세화)
  async doJoinRoom(targetCode, btnElement) {
    const nickname = (this.inputNickname.value || "").trim() || `학생${Math.floor(Math.random() * 89 + 10)}`;

    // 타겟 코드 우선순위: 넘겨받은 코드 -> this.invitedRoomCode -> URL searchParams -> input-room-code
    let roomCode = targetCode || this.invitedRoomCode;
    if (!roomCode || roomCode.length < 4) {
      const params = new URLSearchParams(window.location.search);
      roomCode = params.get("room") || (this.inputRoomCode ? this.inputRoomCode.value : "");
    }
    roomCode = (roomCode || "").trim().toUpperCase();

    if (!roomCode || roomCode.length < 4) {
      this.showToast("올바른 6자리 방 코드가 필요합니다.");
      if (btnElement) btnElement.disabled = false;
      return;
    }

    if (btnElement) {
      btnElement.disabled = true;
      btnElement.dataset.origText = btnElement.textContent;
      btnElement.textContent = "연결 중...";
    }
    this.showToast(`선생님 방(${roomCode})에 연결하고 있습니다...`);

    try {
      const { roomCode: code } = await network.joinRoom(roomCode, nickname);
      this.onRoomReady(code, false);
      this.showToast(`🎉 입장 성공! [${nickname}]님 환영합니다.`);
    } catch (err) {
      console.error("입장 실패 상세 로그:", err);
      if (btnElement) {
        btnElement.disabled = false;
        if (btnElement.dataset.origText) btnElement.textContent = btnElement.dataset.origText;
      }
      this.showToast(`❌ ${err.message || "입장 실패: 방 코드를 확인해 주세요."}`);
    }
  }

  // URL 쿼리스트링(?room=CODE) 자동 감지
  checkUrlRoomParam() {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");

    if (roomParam) {
      this.isInvitedViaQR = true;
      this.invitedRoomCode = roomParam.trim().toUpperCase();

      if (this.inputRoomCode) this.inputRoomCode.value = this.invitedRoomCode;
      if (this.lobbyNormalActions) this.lobbyNormalActions.classList.add("hidden");
      if (this.lobbyQrActions) this.lobbyQrActions.classList.remove("hidden");
      if (this.qrInvitedBadge) this.qrInvitedBadge.classList.remove("hidden");
      if (this.textInvitedCode) this.textInvitedCode.textContent = this.invitedRoomCode;
      if (this.lobbyDescText) this.lobbyDescText.textContent = "선생님 방에 연결되었습니다! 닉네임을 적고 입장하세요.";

      if (this.inputNickname) {
        this.inputNickname.placeholder = "내 이름 입력 (예: 김철수)";
        setTimeout(() => this.inputNickname.focus(), 300);
      }

      this.showToast(`QR 초대로 연결되었습니다! (방 코드: ${this.invitedRoomCode})`);
    }
  }

  // 가로/세로 화면 회전 안내 핸들러
  initOrientationHandler() {
    this.landscapeWarning = document.getElementById("landscape-warning");
    
    this.checkOrientation = () => {
      if (this.gameState === "LOBBY") {
        this.landscapeWarning.classList.add("hidden");
        return;
      }

      if (this.isTouchDevice) {
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isPortrait) {
          this.landscapeWarning.classList.remove("hidden");
        } else {
          this.landscapeWarning.classList.add("hidden");
        }
      }
    };

    window.addEventListener("resize", this.checkOrientation);
    window.addEventListener("orientationchange", this.checkOrientation);
    this.checkOrientation();
  }

  // 모바일 플레이 모드 설정
  setMobilePlayMode(mode) {
    this.mobilePlayMode = mode;
    if (mode === "GAMEPAD") {
      this.btnModeGamepad.classList.add("active");
      this.btnModeScreen.classList.remove("active");
    } else {
      this.btnModeScreen.classList.add("active");
      this.btnModeGamepad.classList.remove("active");
    }
    this.applyPlayModeUI();
  }

  applyPlayModeUI() {
    if (this.gameState !== "PLAYING") return;

    // 내가 벤치(관전) 플레이어인지 확인
    const isBench = this.activePlayerIds.size > 0 && !this.activePlayerIds.has(network.myId);

    if (isBench && this.isTouchDevice) {
      // 벤치 학생은 응원 오버레이 활성화
      this.screenGame.classList.add("hidden");
      this.screenGamepad.classList.add("hidden");
      this.screenSpectator.classList.remove("hidden");
      this.mobileControls.classList.add("hidden");
      return;
    } else {
      this.screenSpectator.classList.add("hidden");
    }

    if (this.isTouchDevice && this.mobilePlayMode === "GAMEPAD") {
      this.screenGame.classList.add("hidden");
      this.screenGamepad.classList.remove("hidden");
      this.mobileControls.classList.add("hidden");
    } else {
      this.screenGame.classList.remove("hidden");
      this.screenGamepad.classList.add("hidden");
      if (this.isTouchDevice) {
        this.mobileControls.classList.remove("hidden");
      }
    }
  }

  // 방 입장 완료 시 화면 전환
  onRoomReady(roomCode, isHost) {
    this.gameState = "ROOM";
    this.screenLobby.classList.add("hidden");
    this.screenRoom.classList.remove("hidden");

    this.textRoomCode.textContent = roomCode;
    this.headerRoomCode.textContent = roomCode;
    this.headerRoomChip.classList.remove("hidden");

    if (this.checkOrientation) {
      this.checkOrientation();
    }

    if (isHost) {
      this.btnStartGame.classList.remove("hidden");
      this.hostStageSettings.classList.remove("hidden");
      this.hostGameControls.classList.remove("hidden");
      this.guestWaitingText.classList.add("hidden");
      this.renderRoomQRCode(roomCode);
    } else {
      this.btnStartGame.classList.add("hidden");
      this.hostStageSettings.classList.add("hidden");
      this.hostGameControls.classList.add("hidden");
      this.guestWaitingText.classList.remove("hidden");
      
      const qrWrapper = document.querySelector(".qr-box-wrapper");
      if (qrWrapper) qrWrapper.style.display = "none";

      if (this.isTouchDevice) {
        this.mobileModeBar.classList.remove("hidden");
        this.showToast("기기를 가로로 쥐고 게임패드로 조작할 준비를 하세요!");
      }
    }
  }

  // 프로젝터용 초대 QR 코드 렌더링
  renderRoomQRCode(roomCode) {
    if (!this.qrCodeContainer) return;
    this.qrCodeContainer.innerHTML = "";

    const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

    if (window.QRCode) {
      new window.QRCode(this.qrCodeContainer, {
        text: joinUrl,
        width: 140,
        height: 140,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
  }

  // 네트워크 이벤트 콜백 등록
  initNetworkCallbacks() {
    network.onLobbyUpdate = (players) => {
      this.textPlayerCount.textContent = players.length;
      this.renderLobbyPlayers(players);
    };

    network.onGameStart = (data) => {
      this.currentDifficulty = data.difficulty || "NORMAL";
      if (data.activePlayerIds && data.activePlayerIds.length > 0) {
        this.activePlayerIds = new Set(data.activePlayerIds);
      } else {
        this.activePlayerIds = new Set(network.players.keys());
      }

      this.loadStage(data.stageIndex !== undefined ? data.stageIndex : 0, this.currentDifficulty);
      this.gameState = "PLAYING";
      this.screenRoom.classList.add("hidden");
      this.applyPlayModeUI();
      this.showToast("게임 시작! 다 함께 협동하여 문으로 탈출하세요!");

      requestAnimationFrame(this.gameLoop.bind(this));
    };

    network.onStateSync = (data) => {
      if (!network.isHost) {
        if (data.activePlayerIds) {
          this.activePlayerIds = new Set(data.activePlayerIds);
          this.applyPlayModeUI();
        }

        data.players.forEach(remoteP => {
          if (network.players.has(remoteP.id)) {
            const localP = network.players.get(remoteP.id);
            if (remoteP.id === network.myId) {
              if (Math.hypot(remoteP.x - localP.x, remoteP.y - localP.y) > 45) {
                localP.x = remoteP.x;
                localP.y = remoteP.y;
              }
            } else {
              localP.x += (remoteP.x - localP.x) * 0.45;
              localP.y += (remoteP.y - localP.y) * 0.45;
              localP.vx = remoteP.vx;
              localP.vy = remoteP.vy;
              localP.facing = remoteP.facing;
              localP.isStackedUnder = remoteP.isStackedUnder;
              localP.isStackedAbove = remoteP.isStackedAbove;
            }
          }
        });

        if (data.gimmicks) {
          Object.assign(this.gimmickManager.key, data.gimmicks.key);
          this.gimmickManager.doorUnlocked = data.gimmicks.doorUnlocked;
          this.gimmickManager.stageCleared = data.gimmicks.stageCleared;

          // 단어 열쇠 / 복수 열쇠 동기화
          if (data.gimmicks.keys && this.gimmickManager.keys) {
            data.gimmicks.keys.forEach((rk, i) => {
              if (this.gimmickManager.keys[i]) {
                Object.assign(this.gimmickManager.keys[i], rk);
              }
            });
          }

          // 가짜 열쇠 거부 알림 수신
          if (data.gimmicks.wrongKeyAlert) {
            this.showToast(`❌ [${data.gimmicks.wrongKeyAlert}] 단어는 빈칸에 맞지 않습니다! (말씀을 다시 확인하세요)`);
          }

          if (data.gimmicks.bridges) {
            data.gimmicks.bridges.forEach((br, i) => {
              if (this.gimmickManager.bridges[i]) {
                this.gimmickManager.bridges[i].isActive = br.isActive;
              }
            });
          }

          if (data.gimmicks.switches) {
            data.gimmicks.switches.forEach((sw, i) => {
              if (this.gimmickManager.switches[i]) {
                this.gimmickManager.switches[i].isPressed = sw.isPressed;
              }
            });
          }

          if (data.gimmicks.pushBlocks) {
            data.gimmicks.pushBlocks.forEach((pb, i) => {
              if (this.gimmickManager.pushBlocks[i]) {
                this.gimmickManager.pushBlocks[i].x = pb.x;
              }
            });
          }
        }

        if (data.stageIndex !== undefined && data.stageIndex !== this.currentStageIndex) {
          this.loadStage(data.stageIndex, data.difficulty || this.currentDifficulty);
        }
      }
    };

    network.onError = (err) => {
      this.showToast(err.message);
    };
  }

  // 대기실 참가자 그리드 렌더링 (출전/벤치 상태 카드 반영)
  renderLobbyPlayers(players) {
    this.lobbyPlayerGrid.innerHTML = "";
    players.forEach(p => {
      const card = document.createElement("div");
      const isSelected = this.playMode === "ALL" || this.selectedPlayerIds.has(p.id);

      card.className = "player-card" + 
        (p.id === network.myId ? " is-me" : "") +
        (isSelected ? " is-selected" : " is-bench");

      // 출전/벤치 뱃지
      if (this.playMode === "SELECT") {
        const badge = document.createElement("span");
        badge.className = isSelected ? "player-badge-active" : "player-badge-bench";
        badge.textContent = isSelected ? "출전" : "벤치";
        card.appendChild(badge);

        // 방장일 경우 클릭하여 출전 토글 가능
        if (network.isHost) {
          card.style.cursor = "pointer";
          card.title = "클릭하여 출전/벤치 토글";
          card.addEventListener("click", () => {
            if (this.selectedPlayerIds.has(p.id)) {
              this.selectedPlayerIds.delete(p.id);
            } else {
              this.selectedPlayerIds.add(p.id);
            }
            this.renderLobbyPlayers(players);
          });
        }
      }

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
  loadStage(index, difficulty = "NORMAL") {
    this.currentStageIndex = index;
    this.currentDifficulty = difficulty;

    // 단계별 분위기에 맞춰 탐험 BGM 테마 자동 전환
    sound.onStageChange(this.currentStageIndex);
    if (this.textBgmTheme) {
      this.textBgmTheme.textContent = `🎵 ${sound.getCurrentTheme().name}`;
    }

    if (this.currentStageIndex >= TOTAL_STAGES) {
      this.gameState = "ALL_CLEARED";
      return;
    }

    // 출전 인원수 계산
    const activeCount = this.activePlayerIds.size > 0 
      ? this.activePlayerIds.size 
      : Math.max(1, network.players.size);

    this.currentStage = getStageData(this.currentStageIndex, activeCount, this.currentDifficulty);
    this.gimmickManager.initGimmicks(this.currentStage, activeCount);

    // 출전 선수들만 스폰 위치에 배치 (비출전 선수는 화면 밖 대기)
    let offsetIdx = 0;
    network.players.forEach(p => {
      const isPlayerActive = this.activePlayerIds.size === 0 || this.activePlayerIds.has(p.id);

      p.width = 36;
      p.height = 36;
      if (isPlayerActive) {
        p.x = this.currentStage.spawnPoint.x + (offsetIdx * 38);
        p.y = this.currentStage.spawnPoint.y;
        offsetIdx++;
      } else {
        // 벤치 선수는 대기 좌표
        p.x = -200;
        p.y = -200;
      }
      p.vx = 0;
      p.vy = 0;
      p.isGrounded = true;
      p.isStackedAbove = false;
      p.isStackedUnder = false;
    });

    this.clearTimer = 0;
  }

  // 메인 게임 루프
  gameLoop() {
    this.update();
    if (!this.screenGame.classList.contains("hidden")) {
      this.draw();
    }
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // 상태 업데이트
  update() {
    if (this.gameState !== "PLAYING") return;

    const myPlayer = network.players.get(network.myId);
    const keyInput = input.getState();
    
    // 출전 선수들만 필터링
    const activePlayerList = Array.from(network.players.values()).filter(p => 
      this.activePlayerIds.size === 0 || this.activePlayerIds.has(p.id)
    );

    const allPlatforms = [
      ...this.currentStage.platforms,
      ...this.gimmickManager.getActivePlatforms()
    ];

    // 1. 내 캐릭터 물리 업데이트 (내가 출전 선수일 때만 조작)
    const amIActive = this.activePlayerIds.size === 0 || this.activePlayerIds.has(network.myId);
    if (myPlayer && amIActive) {
      PhysicsEngine.updatePlayer(myPlayer, allPlatforms, keyInput);
    }

    // 2. 머리 위 스택킹 판정 (출전 선수들끼리)
    PhysicsEngine.resolvePlayerStacking(activePlayerList);

    // 3. 밧줄(로프) 물리 연산
    if (this.currentStage && this.currentStage.ropeEnabled && activePlayerList.length >= 2) {
      PhysicsEngine.resolveRopePhysics(activePlayerList, { restLength: 150 });
    }

    // 4. 내 입력 및 위치 전송
    if (myPlayer) {
      network.sendLocalInput({
        x: myPlayer.x,
        y: myPlayer.y,
        vx: myPlayer.vx,
        vy: myPlayer.vy,
        isGrounded: myPlayer.isGrounded,
        facing: myPlayer.facing,
        isStackedAbove: myPlayer.isStackedAbove,
        isStackedUnder: myPlayer.isStackedUnder
      });
    }

    // 5. 호스트 권위 물리 연산 및 기믹 동기화
    if (network.isHost) {
      // 출전 선수들 기준으로 기믹 업데이트
      const activeMap = new Map();
      activePlayerList.forEach(p => activeMap.set(p.id, p));
      this.gimmickManager.update(activeMap, allPlatforms, sound);

      if (this.gimmickManager.stageCleared) {
        this.clearTimer++;
        if (this.clearTimer > 90) {
          this.loadStage(this.currentStageIndex + 1, this.currentDifficulty);
        }
      }

      network.broadcastGameState({
        stageIndex: this.currentStageIndex,
        difficulty: this.currentDifficulty,
        activePlayerIds: Array.from(this.activePlayerIds),
        players: activePlayerList.map(p => ({
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
          keys: this.gimmickManager.keys.map(k => ({
            id: k.id,
            x: k.x,
            y: k.y,
            word: k.word,
            isCorrect: k.isCorrect,
            isCollected: k.isCollected,
            holderId: k.holderId
          })),
          wrongKeyAlert: this.lastWrongKeyAlert || null,
          doorUnlocked: this.gimmickManager.doorUnlocked,
          stageCleared: this.gimmickManager.stageCleared,
          bridges: this.gimmickManager.bridges.map(br => ({ isActive: br.isActive })),
          switches: this.gimmickManager.switches.map(sw => ({ isPressed: sw.isPressed })),
          pushBlocks: this.gimmickManager.pushBlocks.map(b => ({ x: b.x, y: b.y }))
        }
      });
      this.lastWrongKeyAlert = null; // 1회 브로드캐스트 후 리셋
    }

    // 응원 이모지 파티클 애니메이션
    this.updateCheerParticles();
  }

  // 응원 파티클 업데이트
  updateCheerParticles() {
    for (let i = this.cheerParticles.length - 1; i >= 0; i--) {
      const p = this.cheerParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.015;
      if (p.alpha <= 0) {
        this.cheerParticles.splice(i, 1);
      }
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

    // 1. 그리드 배경
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
      ctx.fillStyle = "#64748b";
      ctx.fillRect(plat.x, plat.y, plat.width, 6);
      ctx.fillStyle = "#334155";
    });

    // 3. 기믹 오브젝트 그리기
    this.gimmickManager.draw(ctx);

    // 4. 밧줄 그리기 (출전 선수들끼리)
    const activePlayerList = Array.from(network.players.values()).filter(p => 
      this.activePlayerIds.size === 0 || this.activePlayerIds.has(p.id)
    );

    if (this.currentStage.ropeEnabled && activePlayerList.length >= 2) {
      PhysicsEngine.drawRopes(ctx, activePlayerList, 150);
    }

    // 5. 출전 선수 캐릭터 그리기
    const sortedPlayers = [...activePlayerList].sort((a, b) => a.y - b.y);
    sortedPlayers.forEach(p => {
      PlayerRenderer.draw(ctx, p, p.id === network.myId);
    });

    // 6. 응원 이모지 파티클 그리기
    this.drawCheerParticles(ctx);

    // 7. 상단 HUD 렌더링
    this.drawHUD(ctx, activePlayerList.length);

    // 8. 스테이지 클리어 연출
    if (this.gimmickManager.stageCleared) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.font = "bold 44px sans-serif";
      ctx.fillStyle = "#047857";
      ctx.textAlign = "center";

      if (this.currentStage.isCommandment && this.currentStage.commandment) {
        ctx.fillText(`🎉 ${this.currentStage.commandment.title} 석판 획득! 🎉`, this.canvas.width / 2, this.canvas.height / 2 - 10);
        ctx.font = "bold 22px sans-serif";
        ctx.fillStyle = "#065f46";
        ctx.fillText(`"${this.currentStage.commandment.fullVerse}"`, this.canvas.width / 2, this.canvas.height / 2 + 35);
      } else {
        ctx.fillText("🎉 STAGE CLEAR! 🎉", this.canvas.width / 2, this.canvas.height / 2 - 10);
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "#065f46";
        ctx.fillText("모두가 문 안으로 무사히 탈출했습니다!", this.canvas.width / 2, this.canvas.height / 2 + 35);
      }
    }
  }

  // 응원 이모지 렌더링
  drawCheerParticles(ctx) {
    this.cheerParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.font = `${28 * p.scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(p.emoji, p.x, p.y);

      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#4f46e5";
      ctx.fillText(p.name, p.x, p.y + 16);
      ctx.restore();
    });
  }

  // 상단 HUD 렌더링 (십계명 특별 스테이지 및 일반 스테이지 맞춤형)
  drawHUD(ctx, activeCount) {
    const isCmd = this.currentStage.isCommandment && this.currentStage.commandment;

    if (isCmd) {
      const cmd = this.currentStage.commandment;
      // 십계명 전용 상단 성경 말씀 HUD
      ctx.save();
      // 상단 성경 말씀 배너 박스
      ctx.fillStyle = "rgba(254, 252, 232, 0.95)"; // 부드러운 양피지빛
      ctx.strokeStyle = this.gimmickManager.doorUnlocked ? "#ca8a04" : "#cbd5e1";
      ctx.lineWidth = 2;
      const bannerW = this.canvas.width - 48;
      const bannerH = 68;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(24, 12, bannerW, bannerH, 10);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(24, 12, bannerW, bannerH);
        ctx.strokeRect(24, 12, bannerW, bannerH);
      }

      // 좌측 계명 배지 및 성경 출처
      ctx.font = "bold 17px sans-serif";
      ctx.fillStyle = "#854d0e";
      ctx.textAlign = "left";
      ctx.fillText(`📜 [${cmd.title}] 출애굽기 20장`, 40, 38);

      // 말씀 구절 (문 열림 여부에 따른 빈칸 vs 완성 단어)
      ctx.font = "bold 15px sans-serif";
      if (this.gimmickManager.doorUnlocked) {
        ctx.fillStyle = "#15803d";
        ctx.fillText(`✨ "${cmd.fullVerse}" (${cmd.scripture}) - 말씀 열쇠 잠금 해제!`, 40, 62);
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillText(`🔍 "${cmd.blankVerse}" (${cmd.scripture})`, 40, 62);
      }

      // 우측 상단 진행도 및 탈출 현황
      ctx.textAlign = "right";
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#b45309";
      ctx.fillText(`📜 십계명 석판: ${cmd.number} / 10 수집`, this.canvas.width - 40, 38);

      const entered = this.gimmickManager.door.enteredPlayers ? this.gimmickManager.door.enteredPlayers.size : 0;
      ctx.font = "bold 14px sans-serif";
      ctx.fillStyle = this.gimmickManager.doorUnlocked ? "#15803d" : "#64748b";
      ctx.fillText(`🚪 문 탈출: ${entered} / ${activeCount}명 (최소 5인 협동)`, this.canvas.width - 40, 62);

      ctx.restore();
    } else {
      // 일반 스테이지 HUD
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      const diffTag = this.currentDifficulty === "EASY" ? " [쉬움]" : this.currentDifficulty === "HARD" ? " [매운맛]" : "";
      const reqTag = `[${this.currentStage.requiredPlayers}인 추천]`;
      ctx.fillText(`${reqTag} ${this.currentStage.name}${diffTag}`, 24, 38);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(this.currentStage.description, 24, 62);

      const entered = this.gimmickManager.door.enteredPlayers ? this.gimmickManager.door.enteredPlayers.size : 0;
      ctx.textAlign = "right";
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = this.gimmickManager.doorUnlocked ? "#10b981" : "#475569";
      ctx.fillText(`🚪 탈출 현황: ${entered} / ${activeCount}명 (총 접속 ${network.players.size}명)`, this.canvas.width - 24, 38);

      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("A/D (이동) · Space (점프) · 벤치는 스마트폰으로 응원!", this.canvas.width - 24, 62);
    }
  }

  // 전 스테이지 완료 엔딩 화면 (십계명 특별 완성판 vs 50개 일반 올클리어)
  drawEndingScreen(ctx) {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentStageIndex >= 50) {
      // 📜 십계명 석판 완성 엔딩
      ctx.save();

      // 타이틀
      ctx.fillStyle = "#b45309";
      ctx.font = "bold 44px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📜 십계명 두 석판 완성! 📜", this.canvas.width / 2, 70);

      ctx.fillStyle = "#475569";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("최소 5명 이상의 피코들이 믿음과 협동으로 제1~10계명의 말씀을 모두 모았습니다! (출애굽기 20장)", this.canvas.width / 2, 105);

      // 두 석판(Tablets of Stone) 그리기
      const tabletW = 540;
      const tabletH = 500;
      const t1x = this.canvas.width / 2 - tabletW - 20;
      const t2x = this.canvas.width / 2 + 20;
      const ty = 140;

      // 석판 배경 함수
      const drawTablet = (x, y, w, h, title, items) => {
        ctx.fillStyle = "#fefce8";
        ctx.strokeStyle = "#ca8a04";
        ctx.lineWidth = 3;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, [30, 30, 16, 16]);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
        }

        // 석판 제목
        ctx.fillStyle = "#92400e";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(title, x + w / 2, y + 42);

        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 40, y + 54);
        ctx.lineTo(x + w - 40, y + 54);
        ctx.stroke();

        // 계명 목록
        items.forEach((item, idx) => {
          const itemY = y + 95 + (idx * 76);
          ctx.textAlign = "left";
          ctx.font = "bold 16px sans-serif";
          ctx.fillStyle = "#854d0e";
          ctx.fillText(item.num, x + 30, itemY);

          ctx.font = "14px sans-serif";
          ctx.fillStyle = "#1e293b";
          ctx.fillText(item.text, x + 30, itemY + 22);

          ctx.font = "12px sans-serif";
          ctx.fillStyle = "#b45309";
          ctx.fillText(`열쇠 단어: [ ${item.keyWord} ] · ${item.ref}`, x + 30, itemY + 42);
        });
      };

      // 좌측 석판: 제1~5계명 (하나님과 부모님을 향한 계명)
      drawTablet(t1x, ty, tabletW, tabletH, "첫 번째 석판 (제1 ~ 5계명)", [
        { num: "제1계명", text: "너는 나 외에는 다른 신들을 네게 두지 말라", keyWord: "신들", ref: "출 20:3" },
        { num: "제2계명", text: "너를 위하여 새긴 우상을 만들지 말라", keyWord: "우상", ref: "출 20:4" },
        { num: "제3계명", text: "여호와의 이름을 망령되게 부르지 말라", keyWord: "이름", ref: "출 20:7" },
        { num: "제4계명", text: "안식일을 기억하여 거룩하게 지키라", keyWord: "안식일", ref: "출 20:8" },
        { num: "제5계명", text: "네 부모를 공경하라", keyWord: "부모", ref: "출 20:12" }
      ]);

      // 우측 석판: 제6~10계명 (이웃을 향한 사랑의 계명)
      drawTablet(t2x, ty, tabletW, tabletH, "두 번째 석판 (제6 ~ 10계명)", [
        { num: "제6계명", text: "살인하지 말라", keyWord: "살인", ref: "출 20:13" },
        { num: "제7계명", text: "간음하지 말라", keyWord: "간음", ref: "출 20:14" },
        { num: "제8계명", text: "도둑질하지 말라", keyWord: "도둑질", ref: "출 20:15" },
        { num: "제9계명", text: "네 이웃에 대하여 거짓 증거하지 말라", keyWord: "거짓 증거", ref: "출 20:16" },
        { num: "제10계명", text: "네 이웃의 소유를 탐내지 말라", keyWord: "탐내지", ref: "출 20:17" }
      ]);

      ctx.restore();
    } else {
      // 일반 50개 스테이지 엔딩
      ctx.fillStyle = "#4f46e5";
      ctx.font = "bold 52px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏆 ALL 50 STAGES CLEARED! 🏆", this.canvas.width / 2, this.canvas.height / 2 - 40);

      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("우리 반 모두가 50개 스테이지의 대기록을 완성했습니다!", this.canvas.width / 2, this.canvas.height / 2 + 20);

      ctx.fillStyle = "#64748b";
      ctx.font = "16px sans-serif";
      ctx.fillText("최고의 팀워크를 보여준 학생들에게 박수를 보냅니다.", this.canvas.width / 2, this.canvas.height / 2 + 65);
    }
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
