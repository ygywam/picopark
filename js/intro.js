// 피코파크 플레이 연출 오프닝 인트로 애니메이션 엔진
// 실제 인게임 캐릭터 렌더러와 밧줄 물리, 스택 탑 쌓기, 열쇠 획득, 문 탈출 시연 루프

import { PlayerRenderer } from "./player.js";
import { PhysicsEngine } from "./physics.js";

export class IntroAnimation {
  constructor(canvasId, guideTextId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.guideText = document.getElementById(guideTextId);

    this.isRunning = false;
    this.frame = 0;
    this.animId = null;

    // 4마리의 귀여운 데모 피코들
    this.players = [
      { id: "demo-1", x: 40, y: 264, width: 36, height: 36, color: "#ef4444", nickname: "빨강이", facing: 1, isStackedUnder: false, isStackedAbove: false },
      { id: "demo-2", x: -20, y: 264, width: 36, height: 36, color: "#3b82f6", nickname: "파랑이", facing: 1, isStackedUnder: false, isStackedAbove: false },
      { id: "demo-3", x: -80, y: 264, width: 36, height: 36, color: "#eab308", nickname: "노랑이", facing: 1, isStackedUnder: false, isStackedAbove: false },
      { id: "demo-4", x: -140, y: 264, width: 36, height: 36, color: "#10b981", nickname: "초록이", facing: 1, isStackedUnder: false, isStackedAbove: false }
    ];

    // 황금 열쇠
    this.key = {
      x: 410,
      y: 110,
      width: 28,
      height: 28,
      isCollected: false,
      holderId: null
    };

    // 탈출 문
    this.door = {
      x: 720,
      y: 236,
      width: 54,
      height: 64,
      isOpen: false
    };

    // 꽃가루 파티클
    this.confetti = [];
  }

  // 애니메이션 시작
  start() {
    if (!this.canvas || !this.ctx) return;
    this.isRunning = true;
    this.frame = 0;
    this.resetScene();
    this.loop();
  }

  // 애니메이션 정지
  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  // 씬 상태 초기화
  resetScene() {
    this.players[0].x = 60;
    this.players[0].y = 264;
    this.players[0].facing = 1;
    this.players[0].isStackedUnder = false;
    this.players[0].isStackedAbove = false;

    this.players[1].x = 0;
    this.players[1].y = 264;
    this.players[1].facing = 1;
    this.players[1].isStackedUnder = false;
    this.players[1].isStackedAbove = false;

    this.players[2].x = -60;
    this.players[2].y = 264;
    this.players[2].facing = 1;
    this.players[2].isStackedUnder = false;
    this.players[2].isStackedAbove = false;

    this.players[3].x = -120;
    this.players[3].y = 264;
    this.players[3].facing = 1;
    this.players[3].isStackedUnder = false;
    this.players[3].isStackedAbove = false;

    this.key.x = 410;
    this.key.y = 110;
    this.key.isCollected = false;
    this.key.holderId = null;

    this.door.isOpen = false;
    this.confetti = [];
  }

  // 메인 루프
  loop() {
    if (!this.isRunning) return;

    this.update();
    this.draw();

    this.frame++;
    if (this.frame > 420) {
      this.frame = 0;
      this.resetScene();
    }

    this.animId = requestAnimationFrame(this.loop.bind(this));
  }

  // 매 프레임 위치 및 연출 상태 업데이트
  update() {
    const f = this.frame;
    const p1 = this.players[0];
    const p2 = this.players[1];
    const p3 = this.players[2];
    const p4 = this.players[3];

    // ============================================================
    // Phase 1 (0~100): 친구들이 모여 탑 쌓을 위치로 달리기
    // ============================================================
    if (f <= 100) {
      if (this.guideText) {
        this.guideText.textContent = "🏃 1단계: 친구들이 모여 협동을 준비합니다!";
      }

      // 목표 위치: 380, 340, 300, 260
      p1.x += (380 - p1.x) * 0.08;
      p2.x += (340 - p2.x) * 0.08;
      p3.x += (300 - p3.x) * 0.08;
      p4.x += (260 - p4.x) * 0.08;

      // 통통 튀는 발걸음 모션
      p1.y = 264 - Math.abs(Math.sin(f * 0.25)) * 6;
      p2.y = 264 - Math.abs(Math.sin((f + 5) * 0.25)) * 6;
      p3.y = 264 - Math.abs(Math.sin((f + 10) * 0.25)) * 6;
      p4.y = 264 - Math.abs(Math.sin((f + 15) * 0.25)) * 6;
    }

    // ============================================================
    // Phase 2 (101~220): 4단 인간 탑 쌓기 & 꼭대기 점프 열쇠 획득!
    // ============================================================
    else if (f <= 220) {
      if (this.guideText) {
        this.guideText.textContent = "🪜 2단계: 친구 머리 위에 올라타 높은 곳의 열쇠를 획득!";
      }

      // p1은 바닥 지지대
      p1.x = 410;
      p1.y = 264;
      p1.isStackedUnder = true;

      // p2 탑승 (110~140)
      if (f > 110) {
        p2.x += (410 - p2.x) * 0.12;
        p2.y += ((p1.y - 36) - p2.y) * 0.12;
        p2.isStackedUnder = true;
        p2.isStackedAbove = true;
      }

      // p3 탑승 (140~170)
      if (f > 140) {
        p3.x += (410 - p3.x) * 0.12;
        p3.y += ((p2.y - 36) - p3.y) * 0.12;
        p3.isStackedUnder = true;
        p3.isStackedAbove = true;
      }

      // p4 탑승 및 슈퍼 점프로 열쇠 터치! (170~220)
      if (f > 170 && f <= 195) {
        p4.x += (410 - p4.x) * 0.12;
        p4.y += ((p3.y - 36) - p4.y) * 0.12;
        p4.isStackedAbove = true;
      } else if (f > 195) {
        // 꼭대기에서 점프!
        const jumpProgress = (f - 195) / 25; // 0 -> 1
        p4.y = (p3.y - 36) - Math.sin(jumpProgress * Math.PI) * 50;

        // 열쇠 획득
        if (p4.y <= 135) {
          this.key.isCollected = true;
          this.key.holderId = p4.id;
        }
      }
    }

    // ============================================================
    // Phase 3 (221~340): 밧줄 연결 & 문으로 전원 협동 탈출!
    // ============================================================
    else if (f <= 340) {
      if (this.guideText) {
        this.guideText.textContent = "🪢 3단계: 밧줄로 연결되어 다 함께 탈출 문으로 들어갑니다!";
      }

      // 탑 해체 후 바닥 착지
      p1.isStackedUnder = false;
      p2.isStackedUnder = false;
      p2.isStackedAbove = false;
      p3.isStackedUnder = false;
      p3.isStackedAbove = false;
      p4.isStackedAbove = false;

      p1.y += (264 - p1.y) * 0.15;
      p2.y += (264 - p2.y) * 0.15;
      p3.y += (264 - p3.y) * 0.15;
      p4.y += (264 - p4.y) * 0.15;

      // 우측 문으로 함께 이동
      const runSpeed = 2.4;
      p4.x += runSpeed;
      p3.x += (p4.x - 45 - p3.x) * 0.15;
      p2.x += (p3.x - 45 - p2.x) * 0.15;
      p1.x += (p2.x - 45 - p1.x) * 0.15;

      // 열쇠 추종
      if (this.key.isCollected) {
        this.key.x += (p4.x - 24 - this.key.x) * 0.25;
        this.key.y += (p4.y + 4 - this.key.y) * 0.25;
      }

      // 문 개방 체크
      if (p4.x >= this.door.x - 10) {
        this.door.isOpen = true;
      }

      // 문 안으로 입장 (투명화 및 빨려 들어감)
      [p1, p2, p3, p4].forEach(p => {
        if (p.x >= this.door.x + 10) {
          p.x = this.door.x + 16;
        }
      });
    }

    // ============================================================
    // Phase 4 (341~420): STAGE CLEAR 축하 팡파레 & 꽃가루 파티클
    // ============================================================
    else {
      if (this.guideText) {
        this.guideText.textContent = "🎉 4단계: 전원 탈출 완료! 스테이지 클리어!";
      }

      // 꽃가루 파티클 생성
      if (f % 4 === 0) {
        const colors = ["#ef4444", "#3b82f6", "#eab308", "#10b981", "#a855f7", "#ec4899"];
        for (let i = 0; i < 4; i++) {
          this.confetti.push({
            x: 745 + (Math.random() * 40 - 20),
            y: 260,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 9 - 3,
            size: Math.random() * 6 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1.0,
            rot: Math.random() * Math.PI * 2
          });
        }
      }

      // 파티클 업데이트
      for (let i = this.confetti.length - 1; i >= 0; i--) {
        const c = this.confetti[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.25; // 중력
        c.alpha -= 0.02;
        if (c.alpha <= 0) {
          this.confetti.splice(i, 1);
        }
      }
    }
  }

  // 캔버스 렌더링
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. 그리드 배경 (라이트 모드)
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    // 2. 바닥 플랫폼 (블루그레이)
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 300, this.canvas.width, 60);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(0, 300, this.canvas.width, 5);

    // 3. 탈출 문
    ctx.fillStyle = this.door.isOpen ? "#22c55e" : "#64748b";
    ctx.fillRect(this.door.x, this.door.y, this.door.width, this.door.height);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.door.x, this.door.y, this.door.width, this.door.height);

    ctx.fillStyle = this.door.isOpen ? "#ffffff" : "#fbbf24";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.door.isOpen ? "OPEN" : "LOCK", this.door.x + this.door.width / 2, this.door.y - 8);

    // 4. 황금 열쇠
    const bob = Math.sin(Date.now() / 160) * 3;
    ctx.save();
    ctx.translate(this.key.x + 14, this.key.y + 14 + bob);

    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 14);
    ctx.moveTo(0, 10);
    ctx.lineTo(4, 10);
    ctx.moveTo(0, 14);
    ctx.lineTo(4, 14);
    ctx.stroke();
    ctx.restore();

    // 5. 밧줄 그리기 (Phase 3에서 밧줄 연결 연출)
    if (this.frame > 220 && this.frame <= 360) {
      PhysicsEngine.drawRopes(ctx, this.players, 80);
    }

    // 6. 4마리 피코 그리기
    const sorted = [...this.players].sort((a, b) => a.y - b.y);
    sorted.forEach(p => {
      PlayerRenderer.draw(ctx, p, p.id === "demo-4"); // 초록이에게 ME 인디케이터 표시
    });

    // 7. 꽃가루 파티클
    this.confetti.forEach(c => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.alpha);
      ctx.fillStyle = c.color;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
      ctx.restore();
    });

    // 8. Phase 4 클리어 문구
    if (this.frame > 340) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.font = "bold 34px sans-serif";
      ctx.fillStyle = "#047857";
      ctx.textAlign = "center";
      ctx.fillText("🎉 PICO PARK CLEAR! 🎉", this.canvas.width / 2, 80);

      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#065f46";
      ctx.fillText("친구 머리 위에 올라타고 밧줄로 연결되어 문으로 탈출하세요!", this.canvas.width / 2, 115);
    }
  }
}
