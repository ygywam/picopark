// 피코파크 스테이지 데이터 생성기 (인원수 비례 100% 클리어 가능 보장)

export function getStageData(stageIndex, playerCount = 1) {
  const pCount = Math.max(1, playerCount);

  switch (stageIndex) {
    // Stage 1: 인간 탑 쌓기
    case 0: {
      if (pCount === 1) {
        // [1인 플레이 튜토리얼 모드 - 점프가 넉넉하게 닿도록 계단식 디딤돌 배치]
        return {
          name: "STAGE 1 · 1인 점프 튜토리얼",
          description: "계단 디딤돌을 밟고 점프하여 열쇠를 획득한 후 문으로 가세요!",
          spawnPoint: { x: 120, y: 604 },
          platforms: [
            // 바닥 (y: 640)
            { x: 0, y: 640, width: 1280, height: 80 },
            // 1단계 디딤돌 (y: 550, 바닥에서 90px - 가볍게 올라감)
            { x: 380, y: 550, width: 140, height: 24 },
            // 2단계 디딤돌 (y: 460, 1단계에서 90px)
            { x: 560, y: 460, width: 140, height: 24 }
          ],
          key: { x: 610, y: 390 }, // 2단계 디딤돌 위에서 가볍게 점프하면 획득
          door: { x: 1100, y: 576 }, // 바닥에 위치하여 즉시 탈출
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
            // 바닥 (y: 640)
            { x: 0, y: 640, width: 1280, height: 80 },
            // 우측 높은 절벽 (y: 480, 바닥에서 160px - 혼자선 못 가고 친구 머리 위에 타면 쏙 올라감)
            { x: 920, y: 480, width: 360, height: 160 }
          ],
          // 친구 머리 위에 올라타서 점프하면 딱 닿는 2단 높이
          key: { x: 500, y: 440 },
          door: { x: 1120, y: 416 },
          // 절벽 위 스위치: 1명이 머리를 밟고 먼저 올라가 밟아주면 도우미 발판이 내려옴
          switches: [
            { x: 970, y: 470, targetId: "sw-stairs", width: 50 }
          ],
          bridges: [
            // 아래 친구가 쉽게 올라올 수 있는 중간 도우미 디딤돌 (y: 560, 바닥에서 80px)
            { x: 800, y: 560, width: 100, height: 20, triggerSwitchId: "sw-stairs" }
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
            { x: 900, y: 460, width: 380, height: 180 }
          ],
          key: { x: 500, y: 360 }, // 다단 탑 높이
          door: { x: 1100, y: 396 },
          switches: [
            { x: 960, y: 450, targetId: "sw-stairs-multi", width: 60 }
          ],
          bridges: [
            { x: 760, y: 550, width: 120, height: 20, triggerSwitchId: "sw-stairs-multi" }
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
          // 중앙 상단 열쇠 받침대 (바닥에서 130px 높이로 점프 시 여유 있게 착지)
          { x: 540, y: 510, width: 120, height: 20 }
        ],
        bridges: [
          // 낭떠러지 위 다리
          { x: 440, y: 640, width: 300, height: 24, triggerSwitchId: "sw-bridge" }
        ],
        switches: [
          // 시작 구역 스위치
          { x: 240, y: 630, targetId: "sw-bridge", width: 54 },
          // 반대편 스위치
          { x: 770, y: 630, targetId: "sw-bridge", width: 54 }
        ],
        pushBlocks: [
          { x: 860, y: 568, width: 72, height: 72, requiredPushers: pushReq }
        ],
        key: { x: 586, y: 460 },
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
          // 1층 -> 2층 보조 디딤돌 (y: 560, 바닥에서 80px)
          { x: 100, y: 560, width: 100, height: 20 },
          // 2층 플랫폼 (y: 480, 디딤돌에서 80px)
          { x: 220, y: 480, width: 540, height: 24 },
          // 2층 -> 3층 보조 디딤돌 (y: 400, 2층에서 80px)
          { x: 580, y: 400, width: 100, height: 20 },
          // 3층 플랫폼 (y: 320, 보조 디딤돌에서 80px)
          { x: 700, y: 320, width: 480, height: 24 }
        ],
        bridges: [
          { x: 860, y: 480, width: 160, height: 24, triggerSwitchId: "sw-floor3" }
        ],
        switches: [
          { x: 340, y: 470, targetId: "sw-floor3", width: 54 }
        ],
        pushBlocks: [
          { x: 760, y: 248, width: 72, height: 72, requiredPushers: Math.max(1, Math.floor(pCount * 0.4)) }
        ],
        key: { x: 260, y: 420 },
        door: { x: 1100, y: 256 }
      };
    }
  }
}

export const TOTAL_STAGES = 3;
