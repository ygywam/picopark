// 피코파크 스테이지 데이터 (1280 x 720 기준)

export const STAGES = [
  // Stage 1: 탑 쌓기 (스택킹 튜토리얼)
  {
    name: "STAGE 1 · 인간 탑 쌓기",
    description: "서로의 머리 위에 올라타 높은 곳의 열쇠를 획득하고 문으로 탈출하세요!",
    spawnPoint: { x: 120, y: 580 },
    platforms: [
      // 바닥
      { x: 0, y: 640, width: 1280, height: 80 },
      // 높은 우측 절벽
      { x: 860, y: 380, width: 420, height: 260 },
      // 왼쪽 중간 디딤돌
      { x: 260, y: 520, width: 140, height: 24 }
    ],
    key: { x: 560, y: 340 }, // 혼자 점프로는 안 닿는 높은 공중 (스택킹 필수)
    door: { x: 1080, y: 316 },
    switches: [],
    bridges: [],
    pushBlocks: []
  },

  // Stage 2: 동시 발판과 거대 협동 블록
  {
    name: "STAGE 2 · 협동 발판과 밀기",
    description: "스위치를 밟아 다리를 만들고, 다 함께 힘을 합쳐 블록을 밀어내세요!",
    spawnPoint: { x: 80, y: 580 },
    platforms: [
      // 왼쪽 시작 구역 바닥
      { x: 0, y: 640, width: 440, height: 80 },
      // 오른쪽 도착 구역 바닥
      { x: 740, y: 640, width: 540, height: 80 },
      // 중앙 상단 열쇠 받침대
      { x: 540, y: 400, width: 100, height: 20 }
    ],
    // 낭떠러지 위에 생기는 스위치 연동 브릿지
    bridges: [
      { x: 440, y: 640, width: 300, height: 24, triggerSwitchId: "sw-bridge" }
    ],
    // 시작 바닥에 있는 스위치
    switches: [
      { x: 240, y: 630, targetId: "sw-bridge", width: 54 }
    ],
    // 오른쪽 길목을 막고 있는 거대 블록
    pushBlocks: [
      { x: 820, y: 568, width: 72, height: 72 }
    ],
    key: { x: 580, y: 360 },
    door: { x: 1140, y: 576 }
  },

  // Stage 3: 다층 릴레이 협동
  {
    name: "STAGE 3 · 다층 타워 협동",
    description: "팀원들과 역할을 나누어 각 층의 스위치와 열쇠를 연결하세요!",
    spawnPoint: { x: 80, y: 580 },
    platforms: [
      // 1층 바닥
      { x: 0, y: 640, width: 1280, height: 80 },
      // 2층 플랫폼
      { x: 200, y: 460, width: 560, height: 24 },
      // 3층 플랫폼
      { x: 540, y: 280, width: 600, height: 24 },
      // 좌측 수직 장애벽
      { x: 480, y: 484, width: 24, height: 156 }
    ],
    bridges: [
      { x: 760, y: 460, width: 200, height: 24, triggerSwitchId: "sw-floor3" }
    ],
    switches: [
      { x: 320, y: 450, targetId: "sw-floor3", width: 54 }
    ],
    pushBlocks: [
      { x: 620, y: 208, width: 72, height: 72 }
    ],
    key: { x: 260, y: 390 },
    door: { x: 1040, y: 216 }
  }
];
