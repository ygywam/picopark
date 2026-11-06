// 피코파크 스테이지 데이터 생성기 (인원수 비례 100% 클리어 가능 보장)

export function getStageData(stageIndex, playerCount = 1) {
  const pCount = Math.max(1, playerCount);

  switch (stageIndex) {
    // Stage 1: 인간 탑 쌓기
    case 0: {
      if (pCount === 1) {
        // [1인 플레이 튜토리얼 모드]
        return {
          name: "STAGE 1 · 1인 튜토리얼 점프",
          description: "점프하여 공중의 열쇠를 획득하고 문으로 탈출하세요!",
          spawnPoint: { x: 120, y: 604 },
          platforms: [
            // 바닥
            { x: 0, y: 640, width: 1280, height: 80 },
            // 중간 발판
            { x: 480, y: 520, width: 160, height: 24 }
          ],
          key: { x: 540, y: 440 }, // 발판을 밟거나 점프하면 닿는 높이
          door: { x: 1100, y: 576 }, // 바닥에 위치
          switches: [],
          bridges: [],
          pushBlocks: []
        };
      } else if (pCount === 2) {
        // [2인 협동 전용 모드]
        return {
          name: "STAGE 1 · 2인 협동 탑 쌓기",
          description: "친구 머리 위에 올라타 열쇠를 얻고, 스위치를 눌러 함께 절벽을 오르세요!",
          spawnPoint: { x: 120, y: 604 },
          platforms: [
            // 바닥
            { x: 0, y: 640, width: 1280, height: 80 },
            // 우측 높은 절벽 (문이 있는 곳)
            { x: 920, y: 450, width: 360, height: 190 }
          ],
          // 혼자 점프로는 절대 못 닿고, 친구 머리 위에 올라타서 점프해야 닿는 2단 높이
          key: { x: 500, y: 430 },
          door: { x: 1120, y: 386 },
          // 절벽 위 스위치: 1명이 머리를 밟고 먼저 절벽에 올라가 이 스위치를 밟아주면,
          // 아래에 남아있는 친구를 위한 도우미 계단(Bridge)이 활성화됨!
          switches: [
            { x: 960, y: 440, targetId: "sw-stairs", width: 50 }
          ],
          bridges: [
            // 아래 친구가 올라올 수 있는 중간 도우미 디딤돌
            { x: 800, y: 540, width: 100, height: 20, triggerSwitchId: "sw-stairs" }
          ],
          pushBlocks: []
        };
      } else {
        // [3인 이상 단체 협동 모드]
        return {
          name: `STAGE 1 · ${pCount}인 단체 탑 쌓기`,
          description: "친구들 머리 위에 다단으로 탑을 쌓아 열쇠를 획득하고 전원 탈출하세요!",
          spawnPoint: { x: 120, y: 604 },
          platforms: [
            { x: 0, y: 640, width: 1280, height: 80 },
            { x: 900, y: 420, width: 380, height: 220 }
          ],
          // 3단 이상 탑을 쌓아야 닿는 높은 공중
          key: { x: 500, y: 340 },
          door: { x: 1100, y: 356 },
          switches: [
            { x: 960, y: 410, targetId: "sw-stairs-multi", width: 60 }
          ],
          bridges: [
            { x: 760, y: 530, width: 120, height: 20, triggerSwitchId: "sw-stairs-multi" }
          ],
          pushBlocks: []
        };
      }
    }

    // Stage 2: 동시 발판과 거대 협동 블록
    case 1: {
      const pushReq = pCount === 1 ? 1 : Math.max(1, Math.min(3, Math.floor(pCount * 0.5)));

      return {
        name: "STAGE 2 · 협동 발판과 밀기",
        description: pCount === 1 
          ? "스위치를 밟아 다리를 만들고 블록을 밀어 탈출하세요!" 
          : "한 명이 스위치를 밟아 다리를 만들고, 다 함께 힘을 합쳐 블록을 밀어내세요!",
        spawnPoint: { x: 80, y: 604 },
        platforms: [
          // 왼쪽 시작 바닥
          { x: 0, y: 640, width: 440, height: 80 },
          // 오른쪽 도착 바닥
          { x: 740, y: 640, width: 540, height: 80 },
          // 중앙 상단 열쇠 받침대
          { x: 540, y: 460, width: 100, height: 20 }
        ],
        bridges: [
          // 낭떠러지 위 다리
          { x: 440, y: 640, width: 300, height: 24, triggerSwitchId: "sw-bridge" }
        ],
        switches: [
          // 시작 구역 스위치
          { x: 240, y: 630, targetId: "sw-bridge", width: 54 },
          // 건너간 후 밟을 수 있는 반대편 스위치 (밟으면 다리 유지)
          { x: 770, y: 630, targetId: "sw-bridge", width: 54 }
        ],
        pushBlocks: [
          { x: 860, y: 568, width: 72, height: 72, requiredPushers: pushReq }
        ],
        key: { x: 576, y: 420 },
        door: { x: 1140, y: 576 }
      };
    }

    // Stage 3: 다층 릴레이 협동
    case 2:
    default: {
      return {
        name: "STAGE 3 · 다층 타워 협동",
        description: "각 층의 스위치와 열쇠를 연결하여 최상층 문으로 전원 탈출하세요!",
        spawnPoint: { x: 80, y: 604 },
        platforms: [
          // 1층 바닥
          { x: 0, y: 640, width: 1280, height: 80 },
          // 2층 플랫폼
          { x: 180, y: 480, width: 580, height: 24 },
          // 3층 플랫폼
          { x: 560, y: 320, width: 580, height: 24 }
        ],
        bridges: [
          { x: 760, y: 480, width: 200, height: 24, triggerSwitchId: "sw-floor3" }
        ],
        switches: [
          { x: 320, y: 470, targetId: "sw-floor3", width: 54 }
        ],
        pushBlocks: [
          { x: 620, y: 248, width: 72, height: 72, requiredPushers: Math.max(1, Math.floor(pCount * 0.4)) }
        ],
        key: { x: 240, y: 420 },
        door: { x: 1040, y: 256 }
      };
    }
  }
}

export const TOTAL_STAGES = 3;
