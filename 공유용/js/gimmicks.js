// 피코파크 협동 기믹 관리 및 인원수 비례 동적 스케일링 (Dynamic Scaling)

export class GimmickManager {
  constructor() {
    this.key = null;
    this.switches = [];
    this.pushBlocks = [];
    this.door = null;
    this.bridges = [];
    this.doorUnlocked = false;
    this.stageCleared = false;
  }

  // 스테이지 데이터로부터 기믹 초기화 및 인원수에 맞춘 동적 조정
  initGimmicks(stageData, playerCount = 1) {
    this.stageCleared = false;
    this.doorUnlocked = false;

    // 1. 열쇠 초기화 (인원수 비례 높이 자동 조절)
    this.key = {
      x: stageData.key.x,
      // 2명 이하일 때는 2단 탑 높이로 맞춰 닿을 수 있게 낮춤
      y: playerCount <= 2 ? stageData.key.y + 40 : stageData.key.y,
      width: 28,
      height: 28,
      isCollected: false,
      holderId: null
    };

    // 2. 동시 발판 스위치 초기화
    this.switches = (stageData.switches || []).map(sw => ({
      x: sw.x,
      y: sw.y,
      width: sw.width || 48,
      height: 12,
      isPressed: false,
      targetId: sw.targetId
    }));

    // 3. 거대 협동 블록 초기화 (필요 추진 인원수 동적 계산)
    // 2명이면 1명, 인원이 많아지면 최대 3~5명 협동 요구
    const reqPushers = Math.max(1, Math.min(4, Math.ceil(playerCount * 0.4)));
    this.pushBlocks = (stageData.pushBlocks || []).map(pb => ({
      x: pb.x,
      y: pb.y,
      width: pb.width || 72,
      height: pb.height || 72,
      vx: 0,
      vy: 0,
      requiredPushers: reqPushers
    }));

    // 4. 연동 브릿지/문
    this.bridges = (stageData.bridges || []).map(br => ({
      x: br.x,
      y: br.y,
      width: br.width,
      height: br.height,
      isActive: false,
      triggerSwitchId: br.triggerSwitchId
    }));

    // 5. 탈출 문
    this.door = {
      x: stageData.door.x,
      y: stageData.door.y,
      width: 48,
      height: 64,
      enteredPlayers: new Set()
    };
  }

  // 매 프레임 기믹 상호작용 업데이트
  update(players, platforms, sound) {
    if (this.stageCleared) return;

    const playerList = Array.from(players.values());

    // 1. 스위치 눌림 상태 업데이트
    this.switches.forEach(sw => {
      let pressedNow = false;
      playerList.forEach(p => {
        // 플레이어 발이 스위치 상단과 겹치는지 검사
        if (
          p.x + p.width > sw.x &&
          p.x < sw.x + sw.width &&
          p.y + p.height >= sw.y - 4 &&
          p.y + p.height <= sw.y + sw.height + 4
        ) {
          pressedNow = true;
        }
      });

      if (pressedNow && !sw.isPressed && sound) {
        sound.playSwitch();
      }
      sw.isPressed = pressedNow;
    });

    // 스위치와 브릿지(움직이는 발판/문) 연동
    this.bridges.forEach(br => {
      const relatedSwitch = this.switches.find(s => s.targetId === br.triggerSwitchId);
      br.isActive = relatedSwitch ? relatedSwitch.isPressed : false;
    });

    // 2. 거대 협동 블록 밀기 업데이트
    this.pushBlocks.forEach(block => {
      let leftPushers = 0;
      let rightPushers = 0;

      playerList.forEach(p => {
        const isYAligned = p.y + p.height > block.y && p.y < block.y + block.height;
        if (isYAligned) {
          // 왼쪽에서 오른쪽으로 미는 중
          if (p.x + p.width >= block.x - 4 && p.x + p.width <= block.x + 8 && p.vx > 0) {
            leftPushers++;
          }
          // 오른쪽에서 왼쪽으로 미는 중
          if (p.x <= block.x + block.width + 4 && p.x >= block.x + block.width - 8 && p.vx < 0) {
            rightPushers++;
          }
        }
      });

      // 요구 인원수 충족 시에만 블록 이동
      if (leftPushers >= block.requiredPushers) {
        block.x += 1.8;
      } else if (rightPushers >= block.requiredPushers) {
        block.x -= 1.8;
      }

      // 블록과 일반 플랫폼 간 충돌
      platforms.forEach(plat => {
        if (block.x + block.width > plat.x && block.x < plat.x + plat.width &&
            block.y + block.height > plat.y && block.y < plat.y + plat.height) {
          if (leftPushers >= block.requiredPushers) block.x = plat.x - block.width;
          if (rightPushers >= block.requiredPushers) block.x = plat.x + plat.width;
        }
      });
    });

    // 3. 열쇠 획득 및 꼬리 추종 업데이트
    if (!this.key.isCollected) {
      playerList.forEach(p => {
        if (
          p.x < this.key.x + this.key.width &&
          p.x + p.width > this.key.x &&
          p.y < this.key.y + this.key.height &&
          p.y + p.height > this.key.y
        ) {
          this.key.isCollected = true;
          this.key.holderId = p.id;
          if (sound) sound.playKeyCollect();
        }
      });
    } else {
      // 열쇠를 가진 플레이어 뒤를 부드럽게 추종
      const holder = players.get(this.key.holderId);
      if (holder) {
        const targetX = holder.facing === 1 ? holder.x - 24 : holder.x + holder.width + 6;
        const targetY = holder.y + 4 + Math.sin(Date.now() / 150) * 4;
        this.key.x += (targetX - this.key.x) * 0.2;
        this.key.y += (targetY - this.key.y) * 0.2;

        // 열쇠를 가진 플레이어가 문에 도달하면 문 개방!
        if (
          !this.doorUnlocked &&
          holder.x + holder.width > this.door.x &&
          holder.x < this.door.x + this.door.width &&
          holder.y + holder.height > this.door.y &&
          holder.y < this.door.y + this.door.height
        ) {
          this.doorUnlocked = true;
          if (sound) sound.playSwitch();
        }
      }
    }

    // 4. 문 도착 및 전원 탈출 체크
    if (this.doorUnlocked) {
      this.door.enteredPlayers.clear();
      playerList.forEach(p => {
        if (
          p.x + p.width > this.door.x &&
          p.x < this.door.x + this.door.width &&
          p.y + p.height > this.door.y &&
          p.y < this.door.y + this.door.height
        ) {
          this.door.enteredPlayers.add(p.id);
        }
      });

      // 모든 플레이어가 문 안으로 들어왔을 때 스테이지 클리어!
      if (playerList.length > 0 && this.door.enteredPlayers.size >= playerList.length) {
        this.stageCleared = true;
        if (sound) sound.playStageClear();
      }
    }
  }

  // 기믹 렌더링
  draw(ctx) {
    // 1. 발판 스위치 그리기
    this.switches.forEach(sw => {
      ctx.fillStyle = sw.isPressed ? "#10b981" : "#f59e0b";
      const h = sw.isPressed ? 4 : 8;
      const y = sw.isPressed ? sw.y + 4 : sw.y;
      ctx.fillRect(sw.x, y, sw.width, h);

      ctx.fillStyle = "#334155";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("STEP", sw.x + sw.width / 2, sw.y - 2);
    });

    // 2. 브릿지/가동 벽 그리기
    this.bridges.forEach(br => {
      if (br.isActive) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.85)";
        ctx.fillRect(br.x, br.y, br.width, br.height);
        ctx.strokeStyle = "#059669";
        ctx.strokeRect(br.x, br.y, br.width, br.height);
      } else {
        // 비활성 점선 표시
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(br.x, br.y, br.width, br.height);
        ctx.setLineDash([]);
      }
    });

    // 3. 거대 협동 블록 그리기
    this.pushBlocks.forEach(pb => {
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(pb.x, pb.y, pb.width, pb.height);
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(pb.x, pb.y, pb.width, pb.height);

      // 필요 인원 안내 문구
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`👥 ${pb.requiredPushers}명`, pb.x + pb.width / 2, pb.y + pb.height / 2 + 5);
    });

    // 4. 탈출 문 그리기
    ctx.fillStyle = this.doorUnlocked ? "#22c55e" : "#64748b";
    ctx.fillRect(this.door.x, this.door.y, this.door.width, this.door.height);
    // 문 프레임 및 문손잡이
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.door.x, this.door.y, this.door.width, this.door.height);

    ctx.fillStyle = this.doorUnlocked ? "#ffffff" : "#fbbf24";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.doorUnlocked ? "OPEN" : "LOCK", this.door.x + this.door.width / 2, this.door.y - 6);

    // 5. 황금 열쇠 그리기
    const k = this.key;
    const bob = Math.sin(Date.now() / 180) * 3;
    ctx.save();
    ctx.translate(k.x + k.width / 2, k.y + k.height / 2 + bob);

    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 2;

    // 열쇠 머리
    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -4, 3, 0, Math.PI * 2);
    ctx.fill();

    // 열쇠 몸체와 이빨
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 14);
    ctx.moveTo(0, 10);
    ctx.lineTo(4, 10);
    ctx.moveTo(0, 14);
    ctx.lineTo(4, 14);
    ctx.stroke();

    ctx.restore();
  }
}
