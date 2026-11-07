// Web Audio API 기반 무음소 신디사이저 사운드 & BGM 시퀀서 매니저
// 외부 mp3 파일 없이 브라우저 내장 Web Audio API로 풍성한 탐험 배경음악과 효과음 실시간 합성 (학교 교내망 100% 호환)

// 음계별 주파수 테이블 (C2 ~ C6)
const NOTE_FREQS = {
  "C2": 65.41, "D2": 73.42, "E2": 82.41, "F2": 87.31, "G2": 98.00, "A2": 110.00, "B2": 123.47,
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
  "C6": 1046.50, "D6": 1174.66, "E6": 1318.51, "G6": 1567.98,
  "-": 0 // 쉼표
};

// 4가지 다채로운 탐험/모험 테마 트랙 정의 (32스텝 = 2마디, 16분음표 기준)
export const BGM_THEMES = [
  {
    id: "plains",
    name: "🌲 초원 탐험",
    description: "활기차고 상쾌한 모험의 출발 (초반 스테이지)",
    bpm: 126,
    // 멜로디 (리드 신스)
    melody: [
      "F4", "-", "A4", "C5",  "D5", "-", "C5", "-",  "A4", "-", "F4", "G4",  "A4", "C5", "A4", "-",
      "G4", "-", "A4", "Bb4", "A4", "-", "G4", "-",  "F4", "G4", "A4", "C5",  "F5", "-", "-", "-"
    ],
    // 화음 아르페지오 (맑은 삼각파)
    arp: [
      "F4", "A4", "C5", "A4", "F4", "A4", "C5", "A4",  "C4", "E4", "G4", "E4", "C4", "E4", "G4", "E4",
      "D4", "F4", "A4", "F4", "D4", "F4", "A4", "F4",  "Bb3", "D4", "F4", "D4", "Bb3", "D4", "F4", "D4"
    ],
    // 베이스 (통통 튀는 옥타브 워킹 베이스)
    bass: [
      "F2", "-", "F3", "-", "F2", "-", "F3", "-",  "C2", "-", "C3", "-", "C2", "-", "C3", "-",
      "D2", "-", "D3", "-", "D2", "-", "D3", "-",  "Bb2", "-", "Bb2", "-", "C2", "-", "C3", "-"
    ],
    // 드럼 패턴 (K: 킥, S: 스네어, H: 하이햇, -: 쉼)
    drums: [
      "K", "H", "-", "H",  "S", "H", "-", "H",  "K", "H", "K", "H",  "S", "H", "-", "H",
      "K", "H", "-", "H",  "S", "H", "-", "H",  "K", "H", "K", "H",  "S", "S", "H", "H"
    ]
  },
  {
    id: "ruins",
    name: "🏰 신비한 유적",
    description: "호기심과 미지의 비밀이 숨겨진 고대 사원 (중반/밧줄 스테이지)",
    bpm: 114,
    melody: [
      "D4", "-", "F4", "A4",  "D5", "-", "C5", "-",  "A4", "-", "F4", "-",   "G4", "A4", "G4", "-",
      "F4", "-", "D4", "F4",  "G4", "-", "A4", "-",  "Bb4", "-", "A4", "F4", "D4", "-", "-", "-"
    ],
    arp: [
      "D4", "F4", "A4", "D5", "A4", "F4", "D4", "F4",  "G3", "B3", "D4", "G4", "D4", "B3", "G3", "B3",
      "Bb3", "D4", "F4", "Bb4", "F4", "D4", "Bb3", "D4", "A3", "C#4", "E4", "A4", "E4", "C#4", "A3", "C#4"
    ],
    bass: [
      "D2", "-", "-", "D2", "D2", "-", "D3", "-",  "G2", "-", "-", "G2", "G2", "-", "G3", "-",
      "Bb2", "-", "-", "Bb2", "Bb2", "-", "Bb2", "-", "A2", "-", "-", "A2", "A2", "-", "A3", "-"
    ],
    drums: [
      "K", "-", "H", "-",  "S", "-", "H", "-",  "K", "-", "K", "H",  "S", "-", "H", "H",
      "K", "-", "H", "-",  "S", "-", "H", "-",  "K", "-", "K", "-",  "S", "H", "S", "H"
    ]
  },
  {
    id: "escape",
    name: "⚡ 긴박한 탈출",
    description: "빠른 템포의 스릴 넘치는 액션 대탈출 (장애물/난관 스테이지)",
    bpm: 142,
    melody: [
      "C5", "C5", "-", "Eb5", "G5", "-", "F5", "Eb5", "D5", "-", "Eb5", "D5", "C5", "-", "-", "-",
      "G4", "-", "Bb4", "C5", "Eb5", "-", "D5", "-",  "C5", "D5", "Eb5", "G5", "C6", "-", "-", "-"
    ],
    arp: [
      "C4", "Eb4", "G4", "C5", "C4", "Eb4", "G4", "C5", "Ab3", "C4", "Eb4", "Ab4", "Ab3", "C4", "Eb4", "Ab4",
      "Bb3", "D4", "F4", "Bb4", "Bb3", "D4", "F4", "Bb4", "G3", "B3", "D4", "G4", "G3", "B3", "D4", "G4"
    ],
    bass: [
      "C2", "C2", "C3", "C2", "C2", "C2", "C3", "C2", "Ab2", "Ab2", "Ab3", "Ab2", "Ab2", "Ab2", "Ab3", "Ab2",
      "Bb2", "Bb2", "Bb3", "Bb2", "Bb2", "Bb2", "Bb3", "Bb2", "G2", "G2", "G3", "G2", "G2", "G2", "G3", "G2"
    ],
    drums: [
      "K", "H", "K", "H",  "S", "H", "K", "H",  "K", "H", "K", "H",  "S", "H", "K", "S",
      "K", "H", "K", "H",  "S", "H", "K", "H",  "K", "H", "K", "K",  "S", "S", "K", "S"
    ]
  },
  {
    id: "march",
    name: "🎉 피코 행진곡",
    description: "옹기종기 머리 위에 타고 걸어가는 유쾌한 협동 행진 (보스/단체 스테이지)",
    bpm: 122,
    melody: [
      "C5", "-", "E5", "-",  "G5", "G5", "A5", "G5", "E5", "-", "C5", "-",  "D5", "E5", "D5", "-",
      "C5", "-", "E5", "-",  "G5", "-", "C6", "-",   "B5", "A5", "G5", "E5", "C5", "-", "-", "-"
    ],
    arp: [
      "C4", "E4", "G4", "E4", "C4", "E4", "G4", "E4", "A3", "C4", "E4", "C4", "A3", "C4", "E4", "C4",
      "F3", "A3", "C4", "A3", "F3", "A3", "C4", "A3", "G3", "B3", "D4", "B3", "G3", "B3", "D4", "B3"
    ],
    bass: [
      "C2", "-", "G2", "-", "C2", "-", "G2", "-",  "A2", "-", "E2", "-", "A2", "-", "E2", "-",
      "F2", "-", "C2", "-", "F2", "-", "C2", "-",  "G2", "-", "D2", "-", "G2", "-", "G2", "-"
    ],
    drums: [
      "K", "-", "H", "H",  "S", "-", "H", "H",  "K", "-", "H", "K",  "S", "H", "S", "H",
      "K", "-", "H", "H",  "S", "-", "H", "H",  "K", "K", "H", "K",  "S", "H", "S", "S"
    ]
  }
];

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;

    this.isMuted = false;
    this.volume = 0.7; // 기본 음량 70%

    // BGM 상태 관리
    this.isPlayingBGM = false;
    this.currentThemeIndex = 0;
    this.isAutoStageTheme = true; // 스테이지 진행에 따른 자동 테마 전환 활성화 여부
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.timerId = null;

    // 노이즈 버퍼 (드럼 스네어/하이햇용)
    this.noiseBuffer = null;
  }

  // 오디오 컨텍스트 및 오디오 그래프 초기화
  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // 마스터 게인 노드
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 효과음 전용 게인
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // 배경음악 전용 게인 (자연스러운 밸런스를 위해 0.45)
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.createNoiseBuffer();
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // 노이즈 버퍼 생성 (퍼커션용)
  createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.0;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  // 사용자 인터랙션 시 자동 재생 언락 및 BGM 시작
  ensureStarted() {
    this.init();
    if (!this.isPlayingBGM) {
      this.startBGM();
    }
  }

  // 음소거 토글
  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // 볼륨 변경 (delta: +0.1 또는 -0.1)
  changeVolume(delta) {
    this.init();
    this.volume = Math.round(Math.min(1.0, Math.max(0.0, this.volume + delta)) * 10) / 10;
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return Math.round(this.volume * 100);
  }

  getVolumePercent() {
    return Math.round((this.isMuted ? 0 : this.volume) * 100);
  }

  // 테마 다음 트랙으로 전환 (수동)
  nextTheme() {
    this.init();
    this.currentThemeIndex = (this.currentThemeIndex + 1) % BGM_THEMES.length;
    this.restartThemeSchedule();
    return BGM_THEMES[this.currentThemeIndex];
  }

  // 특정 테마 번호 지정
  setTheme(index, isAuto = false) {
    this.init();
    const targetIdx = Math.max(0, Math.min(BGM_THEMES.length - 1, index));
    if (this.currentThemeIndex !== targetIdx) {
      this.currentThemeIndex = targetIdx;
      this.restartThemeSchedule();
    }
    if (!isAuto) {
      this.isAutoStageTheme = false; // 수동 선택 시 자동 변경 일시 잠금
    }
    return BGM_THEMES[this.currentThemeIndex];
  }

  // 현재 테마 객체 반환
  getCurrentTheme() {
    return BGM_THEMES[this.currentThemeIndex];
  }

  // 스테이지 변경 시 자동 테마 전환
  onStageChange(stageIndex) {
    if (!this.isAutoStageTheme) return;

    // 50개 스테이지 풀에 맞춰 테마 매핑
    let targetThemeIdx = 0;
    if (stageIndex >= 0 && stageIndex < 10) {
      // 2인 협동: 초원(0~4) -> 신비한 유적/밧줄(5~7) -> 탈출(8~9)
      if (stageIndex >= 3 && stageIndex <= 6) targetThemeIdx = 1; // 신비한 유적/밧줄
      else if (stageIndex >= 7) targetThemeIdx = 2; // 긴박한 탈출
      else targetThemeIdx = 0; // 초원 탐험
    } else if (stageIndex >= 10 && stageIndex < 20) {
      // 3인 협동: 신비한 유적 중심
      targetThemeIdx = 1;
    } else if (stageIndex >= 20 && stageIndex < 30) {
      // 4인 협동: 스피디한 긴박 탈출
      targetThemeIdx = 2;
    } else if (stageIndex >= 30 && stageIndex < 40) {
      // 5~6인 협동: 왁자지껄 피코 행진곡
      targetThemeIdx = 3;
    } else if (stageIndex >= 40 && stageIndex < 50) {
      // 8~30인 학급 단체: 피코 대행진곡
      targetThemeIdx = 3;
    } else {
      // 십계명 특별 스테이지 (50~59): 웅장한 고대 탐험 신비 테마 & 최종 계명 행진곡
      targetThemeIdx = (stageIndex === 59) ? 3 : 1;
    }

    if (this.currentThemeIndex !== targetThemeIdx) {
      this.currentThemeIndex = targetThemeIdx;
      this.restartThemeSchedule();
    }
  }

  // BGM 연주 스케줄 재설정
  restartThemeSchedule() {
    this.currentStep = 0;
    if (this.ctx) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
  }

  // BGM 시퀀서 시작
  startBGM() {
    this.init();
    if (!this.ctx) return;
    this.isPlayingBGM = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;

    if (this.timerId) clearInterval(this.timerId);
    // 25ms 간격으로 스케줄링 (웹 오디오 룩어헤드 기법: 끊김이나 렉 없이 완벽 박자 유지)
    this.timerId = setInterval(() => this.scheduleNotes(), 25);
  }

  // BGM 시퀀서 중지
  stopBGM() {
    this.isPlayingBGM = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // 시퀀서 룩어헤드 스케줄러
  scheduleNotes() {
    if (!this.ctx || !this.isPlayingBGM) return;

    const theme = BGM_THEMES[this.currentThemeIndex];
    const secondsPerBeat = 60.0 / theme.bpm;
    const stepDuration = secondsPerBeat / 4; // 16분음표 길이

    // 현재 시간 기준 0.15초 앞까지 미리 노트를 스케줄링
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      this.playStep(this.currentStep, this.nextNoteTime, stepDuration, theme);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 32; // 32스텝 루프
    }
  }

  // 한 스텝(16분음표) 동안 각 채널(멜로디, 아르페지오, 베이스, 드럼) 노트 발음
  playStep(step, time, duration, theme) {
    if (this.isMuted) return;

    // 1. 드럼 채널
    const drumHit = theme.drums[step % theme.drums.length];
    if (drumHit && drumHit !== "-") {
      this.playDrumSound(drumHit, time);
    }

    // 2. 베이스 채널 (저음 삼각파/톱니파)
    const bassNote = theme.bass[step % theme.bass.length];
    if (bassNote && bassNote !== "-" && NOTE_FREQS[bassNote]) {
      this.playBassTone(NOTE_FREQS[bassNote], time, duration * 1.1);
    }

    // 3. 아르페지오/화음 채널 (맑은 삼각파 분산화음)
    const arpNote = theme.arp[step % theme.arp.length];
    if (arpNote && arpNote !== "-" && NOTE_FREQS[arpNote]) {
      this.playArpTone(NOTE_FREQS[arpNote], time, duration * 0.85);
    }

    // 4. 리드 멜로디 채널 (사각파 + 필터)
    const melNote = theme.melody[step % theme.melody.length];
    if (melNote && melNote !== "-" && NOTE_FREQS[melNote]) {
      this.playLeadTone(NOTE_FREQS[melNote], time, duration * 1.3);
    }
  }

  // 리드 멜로디 발음 (풍성하고 따뜻한 칩튠 리드)
  playLeadTone(freq, time, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, time);

    // 필터로 부드럽고 둥글둥글한 모험 사운드 연출
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(1200, time + duration);

    // 어택 및 디케이 엔벨로프
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // 화음 아르페지오 발음 (맑은 벨/오르골 사운드)
  playArpTone(freq, time, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // 베이스라인 발음 (통통 튀는 탄력 있는 저음)
  playBassTone(freq, time, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(380, time);

    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  // 드럼 사운드 발음
  playDrumSound(type, time) {
    if (type === "K") {
      // 킥 드럼: 피치 다운 사인파
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.08);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + 0.1);
    } else if (type === "S") {
      // 스네어 드럼: 노이즈 버스트 + 바디 톤
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = "highpass";
        noiseFilter.frequency.setValueAtTime(800, time);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.18, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.bgmGain);

        noise.start(time);
        noise.stop(time + 0.12);
      }

      // 스네어 바디 톤
      const body = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      body.type = "triangle";
      body.frequency.setValueAtTime(200, time);
      body.frequency.exponentialRampToValueAtTime(80, time + 0.08);

      bodyGain.gain.setValueAtTime(0.15, time);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      body.connect(bodyGain);
      bodyGain.connect(this.bgmGain);

      body.start(time);
      body.stop(time + 0.08);
    } else if (type === "H") {
      // 하이햇: 짧은 고주파 틱 사운드
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(6000, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.07, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start(time);
        noise.stop(time + 0.04);
      }
    }
  }

  // ==========================================
  // 효과음 (SFX) - 완벽 보존 및 sfxGain 연동
  // ==========================================

  // 점프음 (통통 튀는 뿅 소리)
  playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 열쇠 획득음 (챠링~ 맑은 벨소리)
  playKeyCollect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + (idx * 0.05);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  // 스위치 딸깍 소리
  playSwitch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = "square";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.setValueAtTime(300, now + 0.03);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 스테이지 클리어 팡파레
  playStageClear() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + (i * 0.1);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  }
}

export const sound = new SoundManager();
