// 2D 플랫포머 물리 및 피코파크 핵심 스택킹(머리 위 올라타기 탑 쌓기) 엔진

export const GRAVITY = 0.65;
export const MOVE_SPEED = 4.5;
export const JUMP_FORCE = -13.5; // 기존 -12.5에서 시원하고 경쾌하게 상향 (-13.5 = 약 140px 도약)
export const PLAYER_SIZE = 36;

export class PhysicsEngine {
  // 플랫폼 및 타일과의 충돌 처리
  static updatePlayer(player, platforms, input, deltaTime = 1) {
    // 플레이어 크기 보장 (NaN 방지)
    player.width = player.width || PLAYER_SIZE;
    player.height = player.height || PLAYER_SIZE;

    // 1. 수평 이동 입력 처리
    if (input.left) {
      player.vx = -MOVE_SPEED;
      player.facing = -1;
    } else if (input.right) {
      player.vx = MOVE_SPEED;
      player.facing = 1;
    } else {
      player.vx *= 0.7; // 감속 마찰
      if (Math.abs(player.vx) < 0.2) player.vx = 0;
    }

    // 2. 점프 입력 처리
    if (input.jump && player.isGrounded) {
      player.vy = JUMP_FORCE;
      player.isGrounded = false;
      player.jumpRequested = true;
    }

    // 3. 중력 적용
    player.vy += GRAVITY;
    if (player.vy > 18) player.vy = 18; // 낙하 종단 속도 제한

    // 4. 수평 충돌 체크
    player.x += player.vx;
    platforms.forEach(plat => {
      if (this.checkAABB(player, plat)) {
        if (player.vx > 0) {
          player.x = plat.x - player.width;
          player.vx = 0;
        } else if (player.vx < 0) {
          player.x = plat.x + plat.width;
          player.vx = 0;
        }
      }
    });

    // 5. 수직 충돌 체크
    player.y += player.vy;
    player.isGrounded = false;

    platforms.forEach(plat => {
      if (this.checkAABB(player, plat)) {
        if (player.vy > 0) {
          // 바닥 착지
          player.y = plat.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
        } else if (player.vy < 0) {
          // 천장 충돌
          player.y = plat.y + plat.height;
          player.vy = 0;
        }
      }
    });

    // 6. 화면 좌우 경계 제한 (1280 x 720)
    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }
    if (player.x + player.width > 1280) {
      player.x = 1280 - player.width;
      player.vx = 0;
    }

    // 7. 절대 바닥 관통 차단 (바닥 y=640 뚫림 방지)
    const floorLimit = 640 - player.height;
    if (player.y > floorLimit) {
      player.y = floorLimit;
      player.vy = 0;
      player.isGrounded = true;
    }
  }

  // 플레이어 간 상하 스택킹(머리 위 올라타기) 및 좌우 충돌 연산
  static resolvePlayerStacking(playerList) {
    // 모든 플레이어의 스택 상태 초기화 및 크기 보장
    playerList.forEach(p => {
      p.width = p.width || PLAYER_SIZE;
      p.height = p.height || PLAYER_SIZE;
      p.isStackedUnder = false;
      p.isStackedAbove = false;
    });

    // Y 좌표 기준 아래에 있는 플레이어부터 정렬하여 연산
    const sorted = [...playerList].sort((a, b) => b.y - a.y);

    for (let i = 0; i < sorted.length; i++) {
      const lower = sorted[i];

      for (let j = 0; j < sorted.length; j++) {
        if (i === j) continue;
        const upper = sorted[j];

        // upper가 lower보다 위에 있고 수평으로 충분히 겹치는가?
        const horizontalOverlap = (upper.x + upper.width > lower.x + 6) && (upper.x < lower.x + lower.width - 6);

        if (horizontalOverlap) {
          // upper의 발이 lower의 머리 근처에 닿아 하강 중인가?
          const feetY = upper.y + upper.height;
          const headY = lower.y;

          if (feetY >= headY - 6 && feetY <= headY + 14 && upper.vy >= 0) {
            // 머리 위 착지 성공!
            upper.y = headY - upper.height;
            upper.vy = 0;
            upper.isGrounded = true;

            upper.isStackedAbove = true;
            lower.isStackedUnder = true;

            // 하단 플레이어가 이동할 때 상단 플레이어도 함께 운반됨
            if (Math.abs(lower.vx) > 0.1 && Math.abs(upper.vx) < 0.1) {
              upper.x += lower.vx;
            }
          }
        }
      }
    }
  }

  // 기본 AABB 충돌 검사 (Fallback 크기 보장)
  static checkAABB(rectA, rectB) {
    const wA = rectA.width || PLAYER_SIZE;
    const hA = rectA.height || PLAYER_SIZE;
    const wB = rectB.width || 0;
    const hB = rectB.height || 0;

    return (
      rectA.x < rectB.x + wB &&
      rectA.x + wA > rectB.x &&
      rectA.y < rectB.y + hB &&
      rectA.y + hA > rectB.y
    );
  }
}
