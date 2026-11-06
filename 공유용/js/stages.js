// 피코파크 50개 대규모 협동 스테이지 데이터베이스 (인원수별 맞춤형 스테이지 풀)

// 카테고리 정의
export const STAGE_CATEGORIES = [
  { id: "cat-2p", title: "👥 2인 듀오 챌린지 (1~10)", min: 2, max: 2 },
  { id: "cat-3p", title: "🔺 3인 삼총사 챌린지 (11~20)", min: 3, max: 3 },
  { id: "cat-4p", title: "🔷 4인 스쿼드 챌린지 (21~30)", min: 4, max: 4 },
  { id: "cat-group", title: "⭐ 5~6인 모둠 챌린지 (31~40)", min: 5, max: 6 },
  { id: "cat-class", title: "🏆 8~30인 학급 올스타 단체 챌린지 (41~50)", min: 8, max: 30 }
];

export function getStageData(stageIndex, playerCount = 1, difficulty = "NORMAL") {
  const pCount = Math.max(1, playerCount);
  const idx = Math.max(0, Math.min(49, stageIndex));

  // 1인 접속 시 1인 튜토리얼 자동 적용
  if (pCount === 1 && idx === 0) {
    return {
      id: 0,
      name: "STAGE 1 · 1인 점프 튜토리얼",
      category: "1인 모드",
      requiredPlayers: 1,
      description: "계단 디딤돌을 밟고 점프하여 열쇠를 획득한 후 문으로 가세요!",
      spawnPoint: { x: 120, y: 604 },
      ropeEnabled: false,
      platforms: [
        { x: 0, y: 640, width: 1280, height: 80 },
        { x: 380, y: 550, width: 140, height: 24 },
        { x: 560, y: 460, width: 140, height: 24 }
      ],
      key: { x: 610, y: 390 },
      door: { x: 1100, y: 576 },
      switches: [],
      bridges: [],
      pushBlocks: []
    };
  }

  // 50개 스테이지 정의
  return STAGE_DATABASE[idx](pCount, difficulty);
}

// 50개 스테이지 빌더 함수 배열
const STAGE_DATABASE = [
  // ==================== [CATEGORY 1: 2인 듀오 챌린지 1~10] ====================
  // Stage 1
  (p) => ({
    id: 0,
    name: "STAGE 1 · 2인 협동 탑 쌓기",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "친구 머리 위에 올라타 열쇠를 얻고, 스위치를 눌러 함께 절벽을 오르세요!",
    spawnPoint: { x: 120, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 920, y: 480, width: 360, height: 160 }
    ],
    key: { x: 500, y: 440 },
    door: { x: 1120, y: 416 },
    switches: [{ x: 970, y: 470, targetId: "sw-stairs", width: 50 }],
    bridges: [{ x: 800, y: 560, width: 100, height: 20, triggerSwitchId: "sw-stairs" }],
    pushBlocks: []
  }),

  // Stage 2
  (p) => ({
    id: 1,
    name: "STAGE 2 · 스위치 다리 릴레이",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "한 명이 스위치를 밟아 다리를 만들고, 건너간 친구가 반대편 스위치를 밟아주세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 420, height: 80 },
      { x: 760, y: 640, width: 520, height: 80 },
      { x: 550, y: 490, width: 120, height: 20 }
    ],
    bridges: [{ x: 420, y: 640, width: 340, height: 24, triggerSwitchId: "sw-bridge" }],
    switches: [
      { x: 260, y: 630, targetId: "sw-bridge", width: 54 },
      { x: 800, y: 630, targetId: "sw-bridge", width: 54 }
    ],
    pushBlocks: [],
    key: { x: 596, y: 440 },
    door: { x: 1140, y: 576 }
  }),

  // Stage 3
  (p) => ({
    id: 2,
    name: "STAGE 3 · 거대 블록과 디딤돌",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "함께 힘을 합쳐 거대 블록을 밀어 낭떠러지를 메우고 높은 문으로 올라가세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 500, height: 80 },
      { x: 780, y: 640, width: 500, height: 80 },
      { x: 1050, y: 460, width: 230, height: 180 }
    ],
    pushBlocks: [{ x: 380, y: 568, width: 72, height: 72, requiredPushers: 2 }],
    bridges: [],
    switches: [],
    key: { x: 620, y: 480 },
    door: { x: 1160, y: 396 }
  }),

  // Stage 4
  (p) => ({
    id: 3,
    name: "STAGE 4 · 밧줄 번지점프",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "한 명이 절벽 위에서 밧줄을 쥐고 버티는 동안, 친구가 절벽 아래로 매달려 열쇠를 낚아채세요!",
    spawnPoint: { x: 120, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 440, height: 260 },
      { x: 840, y: 460, width: 440, height: 260 }
    ],
    bridges: [{ x: 440, y: 460, width: 400, height: 24, triggerSwitchId: "sw-rope-bridge" }],
    switches: [{ x: 320, y: 450, targetId: "sw-rope-bridge", width: 54 }],
    pushBlocks: [],
    key: { x: 580, y: 580 },
    door: { x: 1140, y: 396 }
  }),

  // Stage 5
  (p) => ({
    id: 4,
    name: "STAGE 5 · 동력 엘리베이터",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "스위치를 밟아 엘리베이터를 작동시키고 2층으로 친구를 올려보내세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 600, height: 80 },
      { x: 680, y: 420, width: 600, height: 300 }
    ],
    bridges: [{ x: 500, y: 520, width: 120, height: 24, triggerSwitchId: "sw-lift" }],
    switches: [
      { x: 280, y: 630, targetId: "sw-lift", width: 54 },
      { x: 740, y: 410, targetId: "sw-lift", width: 54 }
    ],
    pushBlocks: [],
    key: { x: 840, y: 360 },
    door: { x: 1140, y: 356 }
  }),

  // Stage 6
  (p) => ({
    id: 5,
    name: "STAGE 6 · 슈퍼 스택킹 점프",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "서로 머리 위에 올라타 더 높은 곳의 스위치와 열쇠를 연결하세요!",
    spawnPoint: { x: 100, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 960, y: 480, width: 320, height: 160 }
    ],
    key: { x: 520, y: 440 },
    door: { x: 1140, y: 416 },
    switches: [{ x: 1000, y: 470, targetId: "sw-s6-step", width: 50 }],
    bridges: [{ x: 820, y: 560, width: 100, height: 20, triggerSwitchId: "sw-s6-step" }],
    pushBlocks: []
  }),

  // Stage 7
  (p) => ({
    id: 6,
    name: "STAGE 7 · 징검다리 타이밍",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "낙하 위험이 있는 좁은 징검다리를 호흡을 맞춰 차례로 건너세요!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 220, height: 80 },
      { x: 300, y: 600, width: 80, height: 20 },
      { x: 460, y: 540, width: 80, height: 20 },
      { x: 620, y: 480, width: 80, height: 20 },
      { x: 780, y: 540, width: 80, height: 20 },
      { x: 940, y: 640, width: 340, height: 80 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 650, y: 420 },
    door: { x: 1140, y: 576 }
  }),

  // Stage 8
  (p) => ({
    id: 7,
    name: "STAGE 8 · 2인 3각 밧줄 런",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "둘이 밧줄로 묶여 있습니다! 뒤처지지 않도록 구령에 맞춰 동시에 점프하세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 640, width: 320, height: 80 },
      { x: 420, y: 640, width: 200, height: 80 },
      { x: 720, y: 640, width: 200, height: 80 },
      { x: 1000, y: 640, width: 280, height: 80 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 500, y: 560 },
    door: { x: 1140, y: 576 }
  }),

  // Stage 9
  (p) => ({
    id: 8,
    name: "STAGE 9 · 다단 블록 장벽",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "무거운 거대 블록을 함께 밀어 계단을 만들고 높은 문으로 가세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 920, y: 400, width: 360, height: 240 }
    ],
    pushBlocks: [
      { x: 400, y: 568, width: 72, height: 72, requiredPushers: 2 },
      { x: 600, y: 568, width: 72, height: 72, requiredPushers: 2 }
    ],
    bridges: [],
    switches: [],
    key: { x: 620, y: 460 },
    door: { x: 1120, y: 336 }
  }),

  // Stage 10
  (p) => ({
    id: 9,
    name: "STAGE 10 · 2인 마스터 타워",
    category: "2인 듀오",
    requiredPlayers: 2,
    description: "스택킹과 밧줄 번지, 동시 스위치로 2인 마스터 타워를 탈출하세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 140, y: 480, width: 440, height: 24 },
      { x: 680, y: 320, width: 600, height: 24 }
    ],
    bridges: [{ x: 580, y: 480, width: 100, height: 24, triggerSwitchId: "sw-tower-2p" }],
    switches: [{ x: 260, y: 470, targetId: "sw-tower-2p", width: 54 }],
    pushBlocks: [{ x: 800, y: 248, width: 72, height: 72, requiredPushers: 2 }],
    key: { x: 480, y: 410 },
    door: { x: 1140, y: 256 }
  }),

  // ==================== [CATEGORY 2: 3인 삼총사 챌린지 11~20] ====================
  // Stage 11
  (p) => ({
    id: 10,
    name: "STAGE 11 · 3단 인간 사다리",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "세 명이 3단으로 탑을 쌓아올려 공중 높은 곳의 열쇠를 획득하세요!",
    spawnPoint: { x: 120, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 920, y: 460, width: 360, height: 180 }
    ],
    key: { x: 520, y: 360 }, // 3단 탑 높이
    door: { x: 1120, y: 396 },
    switches: [{ x: 960, y: 450, targetId: "sw-3p-1", width: 54 }],
    bridges: [{ x: 800, y: 550, width: 120, height: 20, triggerSwitchId: "sw-3p-1" }],
    pushBlocks: []
  }),

  // Stage 12
  (p) => ({
    id: 11,
    name: "STAGE 12 · 3색 삼각 스위치",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "세 명이 각자 다른 위치의 발판을 동시에 밟고 있어야 탈출 문이 열립니다!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 300, y: 500, width: 140, height: 20 },
      { x: 600, y: 400, width: 140, height: 20 }
    ],
    switches: [
      { x: 140, y: 630, targetId: "sw-tri-all", width: 50 },
      { x: 340, y: 490, targetId: "sw-tri-all", width: 50 },
      { x: 640, y: 390, targetId: "sw-tri-all", width: 50 }
    ],
    bridges: [{ x: 900, y: 500, width: 160, height: 24, triggerSwitchId: "sw-tri-all" }],
    pushBlocks: [],
    key: { x: 670, y: 340 },
    door: { x: 1120, y: 576 }
  }),

  // Stage 13
  (p) => ({
    id: 12,
    name: "STAGE 13 · 3인 밧줄 절벽 번지",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "둘이서 절벽 위를 꽉 잡고 버티며, 한 명을 깊은 계곡 아래로 내려보내세요!",
    spawnPoint: { x: 100, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 400, height: 260 },
      { x: 880, y: 460, width: 400, height: 260 }
    ],
    bridges: [{ x: 400, y: 460, width: 480, height: 24, triggerSwitchId: "sw-rope-3p" }],
    switches: [{ x: 260, y: 450, targetId: "sw-rope-3p", width: 54 }],
    pushBlocks: [],
    key: { x: 640, y: 600 },
    door: { x: 1140, y: 396 }
  }),

  // Stage 14
  (p) => ({
    id: 13,
    name: "STAGE 14 · 3인 협동 블록 밀기",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "혼자서는 절대 못 미는 육중한 바위를 세 명이 동시에 달라붙어 밀어내세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 960, y: 440, width: 320, height: 200 }
    ],
    pushBlocks: [{ x: 480, y: 568, width: 90, height: 72, requiredPushers: 3 }],
    bridges: [],
    switches: [],
    key: { x: 740, y: 500 },
    door: { x: 1140, y: 376 }
  }),

  // Stage 15
  (p) => ({
    id: 14,
    name: "STAGE 15 · 3단 릴레이 엘리베이터",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "1층, 2층, 3층에서 각자 스위치를 이어받아 친구들을 위로 올려보내세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 460, height: 80 },
      { x: 380, y: 500, width: 300, height: 24 },
      { x: 680, y: 360, width: 600, height: 360 }
    ],
    bridges: [
      { x: 240, y: 560, width: 100, height: 20, triggerSwitchId: "sw-3p-lift1" },
      { x: 540, y: 420, width: 100, height: 20, triggerSwitchId: "sw-3p-lift2" }
    ],
    switches: [
      { x: 100, y: 630, targetId: "sw-3p-lift1", width: 50 },
      { x: 420, y: 490, targetId: "sw-3p-lift2", width: 50 }
    ],
    pushBlocks: [],
    key: { x: 800, y: 300 },
    door: { x: 1140, y: 296 }
  }),

  // Stage 16~20 (3인 추가 챌린지)
  (p) => ({
    id: 15,
    name: "STAGE 16 · 3인 징검다리 호흡",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "세 명이 줄지어 좁은 징검다리를 낙하 없이 건너 문으로 도달하세요!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 200, height: 80 },
      { x: 260, y: 580, width: 80, height: 20 },
      { x: 420, y: 520, width: 80, height: 20 },
      { x: 580, y: 460, width: 80, height: 20 },
      { x: 740, y: 520, width: 80, height: 20 },
      { x: 900, y: 640, width: 380, height: 80 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 620, y: 400 },
    door: { x: 1140, y: 576 }
  }),

  (p) => ({
    id: 16,
    name: "STAGE 17 · 3인 밧줄 뜀뛰기",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "셋이 하나의 밧줄로 묶여 있습니다! 동시에 도약하지 않으면 모두 끌려갑니다!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 640, width: 300, height: 80 },
      { x: 400, y: 640, width: 220, height: 80 },
      { x: 720, y: 640, width: 220, height: 80 },
      { x: 1020, y: 640, width: 260, height: 80 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 510, y: 560 },
    door: { x: 1140, y: 576 }
  }),

  (p) => ({
    id: 17,
    name: "STAGE 18 · 3층 지그재그 타워",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "각 층의 디딤돌을 밟고 지그재그로 오르며 최상단의 열쇠를 가져오세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 200, y: 500, width: 440, height: 20 },
      { x: 640, y: 380, width: 440, height: 20 }
    ],
    bridges: [{ x: 480, y: 560, width: 100, height: 20, triggerSwitchId: "sw-3p-zig" }],
    switches: [{ x: 240, y: 490, targetId: "sw-3p-zig", width: 50 }],
    pushBlocks: [],
    key: { x: 720, y: 320 },
    door: { x: 1000, y: 316 }
  }),

  (p) => ({
    id: 18,
    name: "STAGE 19 · 3방향 게이트 미션",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "두 명이 좌우 스위치를 지키는 동안, 가운데 친구가 열쇠를 얻어 문을 여세요!",
    spawnPoint: { x: 100, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 440, y: 480, width: 400, height: 24 }
    ],
    switches: [
      { x: 160, y: 630, targetId: "sw-3p-gate", width: 54 },
      { x: 1060, y: 630, targetId: "sw-3p-gate", width: 54 }
    ],
    bridges: [{ x: 560, y: 540, width: 160, height: 20, triggerSwitchId: "sw-3p-gate" }],
    pushBlocks: [],
    key: { x: 640, y: 420 },
    door: { x: 1140, y: 576 }
  }),

  (p) => ({
    id: 19,
    name: "STAGE 20 · 3인 트라이앵글 마스터",
    category: "3인 삼총사",
    requiredPlayers: 3,
    description: "스택킹과 로프, 스위치를 모두 동원하여 3인 최종 관문을 돌파하세요!",
    spawnPoint: { x: 80, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 380, height: 260 },
      { x: 500, y: 640, width: 340, height: 80 },
      { x: 920, y: 460, width: 360, height: 260 }
    ],
    bridges: [{ x: 380, y: 460, width: 540, height: 24, triggerSwitchId: "sw-tri-master" }],
    switches: [{ x: 620, y: 630, targetId: "sw-tri-master", width: 54 }],
    pushBlocks: [],
    key: { x: 670, y: 570 },
    door: { x: 1140, y: 396 }
  }),

  // ==================== [CATEGORY 3: 4인 스쿼드 챌린지 21~30] ====================
  // Stage 21
  (p) => ({
    id: 20,
    name: "STAGE 21 · 4단 피라미드 탑",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "네 명이 머리 위에 차례로 올라타 4단 피라미드를 만들어 천장의 열쇠를 따세요!",
    spawnPoint: { x: 120, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 900, y: 440, width: 380, height: 200 }
    ],
    key: { x: 520, y: 320 }, // 4단 탑 높이
    door: { x: 1120, y: 376 },
    switches: [{ x: 960, y: 430, targetId: "sw-4p-step", width: 60 }],
    bridges: [{ x: 760, y: 540, width: 120, height: 20, triggerSwitchId: "sw-4p-step" }],
    pushBlocks: []
  }),

  // Stage 22
  (p) => ({
    id: 21,
    name: "STAGE 22 · 4방향 동시 스위치",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "네 명 전원이 각자의 스위치 위에 동시에 올라서야만 중앙 문이 열립니다!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 220, y: 500, width: 120, height: 20 },
      { x: 480, y: 400, width: 120, height: 20 },
      { x: 740, y: 500, width: 120, height: 20 }
    ],
    switches: [
      { x: 100, y: 630, targetId: "sw-4p-all", width: 50 },
      { x: 260, y: 490, targetId: "sw-4p-all", width: 50 },
      { x: 520, y: 390, targetId: "sw-4p-all", width: 50 },
      { x: 780, y: 490, targetId: "sw-4p-all", width: 50 }
    ],
    bridges: [{ x: 920, y: 520, width: 160, height: 24, triggerSwitchId: "sw-4p-all" }],
    pushBlocks: [],
    key: { x: 540, y: 340 },
    door: { x: 1140, y: 576 }
  }),

  // Stage 23
  (p) => ({
    id: 22,
    name: "STAGE 23 · 4인 초대형 블록 밀기",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "무게 4배의 거대 장벽 블록! 4명 전원이 어깨를 맞대고 밀어야 움직입니다!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 960, y: 420, width: 320, height: 220 }
    ],
    pushBlocks: [{ x: 440, y: 548, width: 110, height: 92, requiredPushers: 4 }],
    bridges: [],
    switches: [],
    key: { x: 740, y: 480 },
    door: { x: 1140, y: 356 }
  }),

  // Stage 24
  (p) => ({
    id: 23,
    name: "STAGE 24 · 4인 더블 로프 번지",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "둘이 지탱하고 둘이 매달려 협곡 아래의 열쇠를 이어받으세요!",
    spawnPoint: { x: 100, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 420, height: 260 },
      { x: 860, y: 460, width: 420, height: 260 }
    ],
    bridges: [{ x: 420, y: 460, width: 440, height: 24, triggerSwitchId: "sw-rope-4p" }],
    switches: [{ x: 260, y: 450, targetId: "sw-rope-4p", width: 60 }],
    pushBlocks: [],
    key: { x: 640, y: 620 },
    door: { x: 1140, y: 396 }
  }),

  // Stage 25~30 (4인 추가 챌린지)
  (p) => ({
    id: 24,
    name: "STAGE 25 · 4인 연속 승강기",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "4층 타워의 각 층 스위치를 순서대로 눌러 전원 최상층으로 이동하세요!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 300, height: 80 },
      { x: 240, y: 520, width: 280, height: 20 },
      { x: 500, y: 400, width: 280, height: 20 },
      { x: 760, y: 280, width: 520, height: 380 }
    ],
    bridges: [
      { x: 160, y: 570, width: 90, height: 20, triggerSwitchId: "sw-4p-lift" },
      { x: 420, y: 450, width: 90, height: 20, triggerSwitchId: "sw-4p-lift" }
    ],
    switches: [{ x: 80, y: 630, targetId: "sw-4p-lift", width: 50 }],
    pushBlocks: [],
    key: { x: 860, y: 220 },
    door: { x: 1140, y: 216 }
  }),

  (p) => ({
    id: 25,
    name: "STAGE 26 · 4인 계단형 스택킹",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "두 명씩 짝지어 계단을 만들고 높은 장벽을 차례차례 넘으세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 540, y: 480, width: 40, height: 160 },
      { x: 920, y: 380, width: 360, height: 260 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 640, y: 420 },
    door: { x: 1120, y: 316 }
  }),

  (p) => ({
    id: 26,
    name: "STAGE 27 · 4인 밧줄 4인 4각 런",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "넷이서 밧줄로 연결되어 달립니다! 호흡이 맞지 않으면 절벽으로 떨어집니다!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 640, width: 260, height: 80 },
      { x: 360, y: 640, width: 200, height: 80 },
      { x: 660, y: 640, width: 200, height: 80 },
      { x: 960, y: 640, width: 320, height: 80 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 560, y: 560 },
    door: { x: 1140, y: 576 }
  }),

  (p) => ({
    id: 27,
    name: "STAGE 28 · 4인 복합 게이트웨이",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "스위치 2개와 밀기 블록 2개를 동시에 해결해야 문이 열립니다!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 880, y: 480, width: 400, height: 160 }
    ],
    switches: [
      { x: 200, y: 630, targetId: "sw-4p-gate1", width: 50 },
      { x: 350, y: 630, targetId: "sw-4p-gate2", width: 50 }
    ],
    bridges: [{ x: 740, y: 560, width: 120, height: 20, triggerSwitchId: "sw-4p-gate1" }],
    pushBlocks: [{ x: 500, y: 568, width: 72, height: 72, requiredPushers: 2 }],
    key: { x: 620, y: 500 },
    door: { x: 1140, y: 416 }
  }),

  (p) => ({
    id: 28,
    name: "STAGE 29 · 4인 더블 타워 점프",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "좌우 두 개의 타워로 2명씩 나뉘어 올라가 양쪽 스위치를 밟으세요!",
    spawnPoint: { x: 100, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 180, y: 460, width: 260, height: 20 },
      { x: 840, y: 460, width: 260, height: 20 }
    ],
    switches: [
      { x: 260, y: 450, targetId: "sw-4p-dtower", width: 50 },
      { x: 920, y: 450, targetId: "sw-4p-dtower", width: 50 }
    ],
    bridges: [{ x: 520, y: 500, width: 240, height: 20, triggerSwitchId: "sw-4p-dtower" }],
    pushBlocks: [],
    key: { x: 640, y: 440 },
    door: { x: 1140, y: 576 }
  }),

  (p) => ({
    id: 29,
    name: "STAGE 30 · 4인 쿼드러플 마스터",
    category: "4인 스쿼드",
    requiredPlayers: 4,
    description: "4인의 완벽한 호흡으로 마스터 스테이지의 모든 장애물을 돌파하세요!",
    spawnPoint: { x: 80, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 340, height: 260 },
      { x: 440, y: 640, width: 400, height: 80 },
      { x: 940, y: 460, width: 340, height: 260 }
    ],
    bridges: [{ x: 340, y: 460, width: 600, height: 24, triggerSwitchId: "sw-4p-master" }],
    switches: [{ x: 620, y: 630, targetId: "sw-4p-master", width: 60 }],
    pushBlocks: [{ x: 500, y: 568, width: 80, height: 72, requiredPushers: 3 }],
    key: { x: 640, y: 520 },
    door: { x: 1140, y: 396 }
  }),

  // ==================== [CATEGORY 4: 5~6인 모둠 챌린지 31~40] ====================
  // Stage 31
  (p) => ({
    id: 30,
    name: "STAGE 31 · 5인 인간 성벽",
    category: "5~6인 모둠",
    requiredPlayers: 5,
    description: "모둠원 5명이 한마음으로 5단 탑을 쌓아 하늘 끝에 걸린 열쇠를 따내세요!",
    spawnPoint: { x: 120, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 920, y: 400, width: 360, height: 240 }
    ],
    key: { x: 540, y: 280 }, // 5단 탑 높이
    door: { x: 1120, y: 336 },
    switches: [{ x: 980, y: 390, targetId: "sw-5p-step", width: 60 }],
    bridges: [{ x: 780, y: 520, width: 120, height: 20, triggerSwitchId: "sw-5p-step" }],
    pushBlocks: []
  }),

  // Stage 32
  (p) => ({
    id: 31,
    name: "STAGE 32 · 5인 스위치 오케스트라",
    category: "5~6인 모둠",
    requiredPlayers: 5,
    description: "5개의 스위치 발판에 전원이 한 명씩 동시에 올라서야 성문이 열립니다!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 180, y: 520, width: 100, height: 20 },
      { x: 380, y: 440, width: 100, height: 20 },
      { x: 580, y: 360, width: 100, height: 20 },
      { x: 780, y: 440, width: 100, height: 20 }
    ],
    switches: [
      { x: 80, y: 630, targetId: "sw-5p-all", width: 44 },
      { x: 210, y: 510, targetId: "sw-5p-all", width: 44 },
      { x: 410, y: 430, targetId: "sw-5p-all", width: 44 },
      { x: 610, y: 350, targetId: "sw-5p-all", width: 44 },
      { x: 810, y: 430, targetId: "sw-5p-all", width: 44 }
    ],
    bridges: [{ x: 980, y: 500, width: 160, height: 24, triggerSwitchId: "sw-5p-all" }],
    pushBlocks: [],
    key: { x: 630, y: 300 },
    door: { x: 1140, y: 576 }
  }),

  // Stage 33
  (p) => ({
    id: 32,
    name: "STAGE 33 · 5인 거대 철문 밀기",
    category: "5~6인 모둠",
    requiredPlayers: 5,
    description: "모둠원 5명이 전원 달라붙어야만 비로소 서서히 밀려나는 초대형 철문 블록!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 960, y: 420, width: 320, height: 220 }
    ],
    pushBlocks: [{ x: 460, y: 528, width: 130, height: 112, requiredPushers: 5 }],
    bridges: [],
    switches: [],
    key: { x: 760, y: 480 },
    door: { x: 1140, y: 356 }
  }),

  // Stage 34
  (p) => ({
    id: 33,
    name: "STAGE 34 · 5인 로프 인간 체인",
    category: "5~6인 모둠",
    requiredPlayers: 5,
    description: "5명이 사슬처럼 밧줄로 묶여 절벽 아래로 차례차례 매달려 내려갑니다!",
    spawnPoint: { x: 100, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 420, height: 260 },
      { x: 860, y: 460, width: 420, height: 260 }
    ],
    bridges: [{ x: 420, y: 460, width: 440, height: 24, triggerSwitchId: "sw-rope-5p" }],
    switches: [{ x: 260, y: 450, targetId: "sw-rope-5p", width: 60 }],
    pushBlocks: [],
    key: { x: 640, y: 620 },
    door: { x: 1140, y: 396 }
  }),

  // Stage 35
  (p) => ({
    id: 34,
    name: "STAGE 35 · 6인 분할 더블 스쿼드",
    category: "5~6인 모둠",
    requiredPlayers: 6,
    description: "3명씩 두 팀으로 나뉘어 상단과 하단의 스위치를 교차 조작하세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 200, y: 460, width: 500, height: 20 },
      { x: 740, y: 460, width: 540, height: 20 }
    ],
    switches: [
      { x: 300, y: 450, targetId: "sw-6p-squad", width: 50 },
      { x: 840, y: 450, targetId: "sw-6p-squad", width: 50 }
    ],
    bridges: [{ x: 560, y: 540, width: 160, height: 20, triggerSwitchId: "sw-6p-squad" }],
    pushBlocks: [],
    key: { x: 640, y: 380 },
    door: { x: 1140, y: 396 }
  }),

  // Stage 36~40 (6인 추가 챌린지)
  (p) => ({
    id: 35,
    name: "STAGE 36 · 6인 3층 복합 타워",
    category: "5~6인 모둠",
    requiredPlayers: 6,
    description: "층마다 2명씩 배치되어 스위치를 열어주고 최상층 문으로 전원 집결하세요!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 340, height: 80 },
      { x: 300, y: 500, width: 340, height: 20 },
      { x: 600, y: 360, width: 680, height: 20 }
    ],
    bridges: [
      { x: 200, y: 560, width: 90, height: 20, triggerSwitchId: "sw-6p-t1" },
      { x: 500, y: 420, width: 90, height: 20, triggerSwitchId: "sw-6p-t2" }
    ],
    switches: [
      { x: 100, y: 630, targetId: "sw-6p-t1", width: 50 },
      { x: 400, y: 490, targetId: "sw-6p-t2", width: 50 }
    ],
    pushBlocks: [],
    key: { x: 760, y: 300 },
    door: { x: 1140, y: 296 }
  }),

  (p) => ({
    id: 36,
    name: "STAGE 37 · 6인 다단계 스위치 퍼즐",
    category: "5~6인 모둠",
    requiredPlayers: 6,
    description: "순서대로 스위치를 밟아 계단을 하나씩 완성하여 전원 탈출하세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 920, y: 420, width: 360, height: 220 }
    ],
    switches: [
      { x: 200, y: 630, targetId: "sw-6p-step1", width: 44 },
      { x: 360, y: 630, targetId: "sw-6p-step2", width: 44 },
      { x: 520, y: 630, targetId: "sw-6p-step3", width: 44 }
    ],
    bridges: [
      { x: 680, y: 560, width: 80, height: 20, triggerSwitchId: "sw-6p-step1" },
      { x: 780, y: 500, width: 80, height: 20, triggerSwitchId: "sw-6p-step2" }
    ],
    pushBlocks: [],
    key: { x: 840, y: 440 },
    door: { x: 1140, y: 356 }
  }),

  (p) => ({
    id: 37,
    name: "STAGE 38 · 6인 슈퍼 로프 런",
    category: "5~6인 모둠",
    requiredPlayers: 6,
    description: "6명이 하나의 긴 밧줄로 연결되었습니다! '하나 둘 셋!' 구령에 맞춰 전진!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 640, width: 240, height: 80 },
      { x: 340, y: 640, width: 200, height: 80 },
      { x: 640, y: 640, width: 200, height: 80 },
      { x: 940, y: 640, width: 340, height: 80 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 500, y: 560 },
    door: { x: 1140, y: 576 }
  }),

  (p) => ({
    id: 38,
    name: "STAGE 39 · 6인 메가 블록 장벽",
    category: "5~6인 모둠",
    requiredPlayers: 6,
    description: "두 개의 거대 블록을 각각 3명씩 나누어 밀어 길을 개척하세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 940, y: 380, width: 340, height: 260 }
    ],
    pushBlocks: [
      { x: 360, y: 568, width: 72, height: 72, requiredPushers: 3 },
      { x: 580, y: 568, width: 72, height: 72, requiredPushers: 3 }
    ],
    bridges: [],
    switches: [],
    key: { x: 740, y: 460 },
    door: { x: 1140, y: 316 }
  }),

  (p) => ({
    id: 39,
    name: "STAGE 40 · 6인 모둠 대탈출",
    category: "5~6인 모둠",
    requiredPlayers: 6,
    description: "스택킹, 밧줄, 스위치가 총동원된 6인 모둠 최종 졸업 시험!",
    spawnPoint: { x: 80, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 360, height: 260 },
      { x: 440, y: 640, width: 400, height: 80 },
      { x: 920, y: 460, width: 360, height: 260 }
    ],
    bridges: [{ x: 360, y: 460, width: 560, height: 24, triggerSwitchId: "sw-6p-final" }],
    switches: [{ x: 620, y: 630, targetId: "sw-6p-final", width: 60 }],
    pushBlocks: [{ x: 520, y: 568, width: 80, height: 72, requiredPushers: 4 }],
    key: { x: 660, y: 520 },
    door: { x: 1140, y: 396 }
  }),

  // ==================== [CATEGORY 5: 8~30인 학급 올스타 단체 챌린지 41~50] ====================
  // Stage 41
  (p) => ({
    id: 40,
    name: "STAGE 41 · 학급 전원 인간 피라미드",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "반 전체가 바닥부터 다단으로 층층이 탑을 쌓아 구름 위 열쇠에 도달하세요!",
    spawnPoint: { x: 120, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 920, y: 360, width: 360, height: 280 }
    ],
    key: { x: 540, y: 220 }, // 웅장한 다단 탑 높이
    door: { x: 1120, y: 296 },
    switches: [{ x: 980, y: 350, targetId: "sw-all-1", width: 60 }],
    bridges: [{ x: 780, y: 480, width: 120, height: 20, triggerSwitchId: "sw-all-1" }],
    pushBlocks: []
  }),

  // Stage 42
  (p) => ({
    id: 41,
    name: "STAGE 42 · 학급 전원 동시 발판",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "화면 가득 펼쳐진 모든 스위치에 팀원들이 한 명씩 올라서야 메가 게이트가 열립니다!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 140, y: 520, width: 90, height: 20 },
      { x: 300, y: 440, width: 90, height: 20 },
      { x: 460, y: 360, width: 90, height: 20 },
      { x: 620, y: 360, width: 90, height: 20 },
      { x: 780, y: 440, width: 90, height: 20 }
    ],
    switches: [
      { x: 60, y: 630, targetId: "sw-all-gate", width: 44 },
      { x: 160, y: 510, targetId: "sw-all-gate", width: 44 },
      { x: 320, y: 430, targetId: "sw-all-gate", width: 44 },
      { x: 480, y: 350, targetId: "sw-all-gate", width: 44 },
      { x: 800, y: 430, targetId: "sw-all-gate", width: 44 }
    ],
    bridges: [{ x: 960, y: 500, width: 180, height: 24, triggerSwitchId: "sw-all-gate" }],
    pushBlocks: [],
    key: { x: 550, y: 300 },
    door: { x: 1140, y: 576 }
  }),

  // Stage 43
  (p) => ({
    id: 42,
    name: "STAGE 43 · 학급 메가 밧줄 체인",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "학급 전원이 하나의 거대한 밧줄로 연결되었습니다! 전원 일사불란하게 전진!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 640, width: 260, height: 80 },
      { x: 360, y: 640, width: 240, height: 80 },
      { x: 680, y: 640, width: 240, height: 80 },
      { x: 1000, y: 640, width: 280, height: 80 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 520, y: 560 },
    door: { x: 1140, y: 576 }
  }),

  // Stage 44
  (p) => ({
    id: 43,
    name: "STAGE 44 · 학급 총력전 메가 블록",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "반 전체가 한꺼번에 달려들어 밀어야 움직이는 거대한 전설의 골리앗 블록!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 980, y: 380, width: 300, height: 260 }
    ],
    pushBlocks: [{ x: 440, y: 508, width: 150, height: 132, requiredPushers: Math.max(4, Math.floor(p * 0.6)) }],
    bridges: [],
    switches: [],
    key: { x: 760, y: 440 },
    door: { x: 1140, y: 316 }
  }),

  // Stage 45~50 (학급 올스타 피날레)
  (p) => ({
    id: 44,
    name: "STAGE 45 · 4단 대형 타워",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "각 층마다 인원을 분배하여 릴레이로 문을 열고 최상단으로 집결하세요!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 180, y: 500, width: 300, height: 20 },
      { x: 440, y: 380, width: 300, height: 20 },
      { x: 720, y: 260, width: 560, height: 380 }
    ],
    bridges: [
      { x: 120, y: 560, width: 60, height: 20, triggerSwitchId: "sw-all-t1" },
      { x: 380, y: 440, width: 60, height: 20, triggerSwitchId: "sw-all-t2" }
    ],
    switches: [
      { x: 80, y: 630, targetId: "sw-all-t1", width: 44 },
      { x: 240, y: 490, targetId: "sw-all-t2", width: 44 }
    ],
    pushBlocks: [],
    key: { x: 840, y: 200 },
    door: { x: 1140, y: 196 }
  }),

  (p) => ({
    id: 45,
    name: "STAGE 46 · 학급 대행진 징검다리",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "서로를 밀쳐 떨어뜨리지 않고 차례대로 안전하게 징검다리를 건너세요!",
    spawnPoint: { x: 60, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 240, height: 80 },
      { x: 320, y: 580, width: 100, height: 20 },
      { x: 500, y: 520, width: 100, height: 20 },
      { x: 680, y: 460, width: 100, height: 20 },
      { x: 860, y: 540, width: 100, height: 20 },
      { x: 1040, y: 640, width: 240, height: 80 }
    ],
    bridges: [],
    switches: [],
    pushBlocks: [],
    key: { x: 730, y: 400 },
    door: { x: 1140, y: 576 }
  }),

  (p) => ({
    id: 46,
    name: "STAGE 47 · 학급 단체 번지 릴레이",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "반 친구들이 밧줄을 쥐고 버티는 동안 용감한 대표가 계곡 아래로 뛰어내립니다!",
    spawnPoint: { x: 100, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 460, height: 260 },
      { x: 880, y: 460, width: 400, height: 260 }
    ],
    bridges: [{ x: 460, y: 460, width: 420, height: 24, triggerSwitchId: "sw-all-rope" }],
    switches: [{ x: 300, y: 450, targetId: "sw-all-rope", width: 60 }],
    pushBlocks: [],
    key: { x: 650, y: 620 },
    door: { x: 1140, y: 396 }
  }),

  (p) => ({
    id: 47,
    name: "STAGE 48 · 학급 양방향 협공",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "반을 반으로 나누어 양쪽 요새를 공략하고 중앙의 메가 브릿지를 여세요!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 180, y: 460, width: 340, height: 20 },
      { x: 760, y: 460, width: 340, height: 20 }
    ],
    switches: [
      { x: 260, y: 450, targetId: "sw-all-dual", width: 50 },
      { x: 860, y: 450, targetId: "sw-all-dual", width: 50 }
    ],
    bridges: [{ x: 520, y: 520, width: 240, height: 20, triggerSwitchId: "sw-all-dual" }],
    pushBlocks: [],
    key: { x: 640, y: 460 },
    door: { x: 1140, y: 576 }
  }),

  (p) => ({
    id: 48,
    name: "STAGE 49 · 최후의 결전 게이트",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "4개의 스위치와 2개의 거대 블록을 완벽하게 처리해야 탈출 문이 열립니다!",
    spawnPoint: { x: 80, y: 604 },
    ropeEnabled: false,
    platforms: [
      { x: 0, y: 640, width: 1280, height: 80 },
      { x: 920, y: 420, width: 360, height: 220 }
    ],
    switches: [
      { x: 140, y: 630, targetId: "sw-all-final", width: 44 },
      { x: 240, y: 630, targetId: "sw-all-final", width: 44 }
    ],
    pushBlocks: [
      { x: 440, y: 568, width: 80, height: 72, requiredPushers: Math.max(3, Math.floor(p * 0.4)) },
      { x: 680, y: 568, width: 80, height: 72, requiredPushers: Math.max(3, Math.floor(p * 0.4)) }
    ],
    bridges: [{ x: 820, y: 520, width: 100, height: 20, triggerSwitchId: "sw-all-final" }],
    key: { x: 740, y: 480 },
    door: { x: 1140, y: 356 }
  }),

  (p) => ({
    id: 49,
    name: "STAGE 50 · 그랜드 마스터 피코파크 (FINAL)",
    category: "학급 올스타",
    requiredPlayers: Math.min(8, p),
    description: "스택킹, 밧줄 번지, 메가 블록, 전원 스위치! 반 전체가 하나 되는 전설의 피날레!",
    spawnPoint: { x: 80, y: 424 },
    ropeEnabled: true,
    platforms: [
      { x: 0, y: 460, width: 340, height: 260 },
      { x: 420, y: 640, width: 440, height: 80 },
      { x: 940, y: 460, width: 340, height: 260 }
    ],
    bridges: [{ x: 340, y: 460, width: 600, height: 24, triggerSwitchId: "sw-grand-final" }],
    switches: [{ x: 640, y: 630, targetId: "sw-grand-final", width: 70 }],
    pushBlocks: [{ x: 500, y: 548, width: 100, height: 92, requiredPushers: Math.max(4, Math.floor(p * 0.5)) }],
    key: { x: 640, y: 500 },
    door: { x: 1140, y: 396 }
  })
];

export const TOTAL_STAGES = STAGE_DATABASE.length; // 50개!

// 50개 전체 스테이지 요약 메타데이터 반환 (드롭다운 UI용)
export function getAllStageSummaries() {
  return STAGE_DATABASE.map((fn, idx) => {
    const data = fn(2, "NORMAL");
    return {
      index: idx,
      id: idx + 1,
      name: data.name,
      category: data.category,
      requiredPlayers: data.requiredPlayers,
      ropeEnabled: data.ropeEnabled
    };
  });
}
