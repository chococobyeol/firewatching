window.addEventListener('load', () => {
    // 페이지 활성화/비활성화 상태 관리 변수
    window.fireAnimationPaused = false;
    let animationFrameId = null;
  
    // 단순한 DPR 제한 (고해상도 디스플레이 지원하되 성능 고려)
    const MAX_DPR = 2.0;
    
    const getOptimalDPR = () => {
      const rawDPR = window.devicePixelRatio || 1;
      return Math.min(rawDPR, MAX_DPR);
    };
  
    // visibilitychange 이벤트 리스너 추가
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 페이지가 비활성화되면 애니메이션 상태 저장
        window.fireAnimationPaused = true;
        // 성능 최적화: 애니메이션 프레임 취소
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else {
        // 페이지가 다시 활성화되면 애니메이션 재개
        if (window.fireAnimationPaused) {
          window.fireAnimationPaused = false;
          if (!animationFrameId) {
            // 애니메이션 재시작
            animationFrameId = requestAnimationFrame(animate);
          }
        }
      }
    });
  
    // 애니메이션 재개 함수 (알람에서 호출할 수 있도록 전역으로 노출)
    window.resumeFireAnimation = () => {
      if (window.fireAnimationPaused === false && !animationFrameId) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
  
    // 기존 HTML의 빈 canvas 제거 (id="fireCanvas")
    const oldCanvas = document.getElementById('fireCanvas');
    if (oldCanvas) oldCanvas.remove();
    
    // 밤하늘 배경용 캔버스 생성 (z-index 0)
    const bgCanvas = document.createElement('canvas');
    bgCanvas.id = 'bgCanvas';
    bgCanvas.style.position = 'absolute';
    bgCanvas.style.top = '0';
    bgCanvas.style.left = '0';
    bgCanvas.style.width = '100%';
    bgCanvas.style.height = '100%';
    bgCanvas.style.pointerEvents = 'none';
    bgCanvas.style.zIndex = '0';
    document.body.appendChild(bgCanvas);
    
    // 장작 이미지용 캔버스 생성 (z-index 1) - 가장 아래 레이어
    const logsCanvas = document.createElement('canvas');
    logsCanvas.id = 'logsCanvas';
    logsCanvas.style.position = 'absolute';
    logsCanvas.style.top = '0';
    logsCanvas.style.left = '0';
    logsCanvas.style.width = '100%';
    logsCanvas.style.height = '100%';
    logsCanvas.style.pointerEvents = 'auto'; // 클릭 이벤트 허용
    logsCanvas.style.zIndex = '1';
    logsCanvas.style.willChange = 'transform';
    logsCanvas.style.transform = 'translateZ(0)'; // GPU 레이어 강제 생성
    logsCanvas.style.backfaceVisibility = 'hidden';
    logsCanvas.style.perspective = '1000px';
    document.body.appendChild(logsCanvas);
    
    // 불꽃 전용 캔버스 생성 (z-index 2) - 약한 블러 또는 블러 없음
    const fireCanvas = document.createElement('canvas');
    fireCanvas.id = 'fireCanvas';
    fireCanvas.style.position = 'absolute';
    fireCanvas.style.top = '0';
    fireCanvas.style.left = '0';
    fireCanvas.style.width = '100%';
    fireCanvas.style.height = '100%';
    fireCanvas.style.pointerEvents = 'none';
    fireCanvas.style.zIndex = '2';
    // 불꽃에는 약한 블러만 적용 (격자무늬 최소화)
    fireCanvas.style.filter = 'blur(0.2px)';
    fireCanvas.style.willChange = 'transform, filter';
    fireCanvas.style.transform = 'translateZ(0)'; // GPU 레이어 강제 생성
    fireCanvas.style.backfaceVisibility = 'hidden';
    fireCanvas.style.perspective = '1000px';
    fireCanvas.style.imageRendering = 'auto';
    fireCanvas.style.isolation = 'isolate';
    document.body.appendChild(fireCanvas);
    
    // 연기 전용 캔버스 생성 (z-index 3) - 강한 블러 적용 (2px)
    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.id = 'smokeCanvas';
    smokeCanvas.style.position = 'absolute';
    smokeCanvas.style.top = '0';
    smokeCanvas.style.left = '0';
    smokeCanvas.style.width = '100%';
    smokeCanvas.style.height = '100%';
    smokeCanvas.style.pointerEvents = 'none';
    smokeCanvas.style.zIndex = '3';
    // 연기에는 강한 블러 적용 (2px)
    smokeCanvas.style.filter = 'blur(2px) contrast(1.05)';
    smokeCanvas.style.willChange = 'transform, filter';
    smokeCanvas.style.transform = 'translateZ(0)'; // GPU 레이어 강제 생성
    smokeCanvas.style.backfaceVisibility = 'hidden';
    smokeCanvas.style.perspective = '1000px';
    smokeCanvas.style.imageRendering = 'auto';
    smokeCanvas.style.isolation = 'isolate';
    document.body.appendChild(smokeCanvas);
    
    // 불똥과 글로우용 캔버스 생성 (z-index 4) - 가장 위, 블러 적용 안함
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.id = 'sparkCanvas';
    sparkCanvas.style.position = 'absolute';
    sparkCanvas.style.top = '0';
    sparkCanvas.style.left = '0';
    sparkCanvas.style.width = '100%';
    sparkCanvas.style.height = '100%';
    sparkCanvas.style.pointerEvents = 'none';
    sparkCanvas.style.zIndex = '4';
    sparkCanvas.style.willChange = 'transform';
    sparkCanvas.style.transform = 'translateZ(0)'; // GPU 레이어 강제 생성
    sparkCanvas.style.backfaceVisibility = 'hidden';
    sparkCanvas.style.perspective = '1000px';
    document.body.appendChild(sparkCanvas);
    
    // 앞쪽 장작 이미지용 캔버스 생성 (z-index 5) - 가장 위 레이어, 약한 투명도
    const frontLogsCanvas = document.createElement('canvas');
    frontLogsCanvas.id = 'frontLogsCanvas';
    frontLogsCanvas.style.position = 'absolute';
    frontLogsCanvas.style.top = '0';
    frontLogsCanvas.style.left = '0';
    frontLogsCanvas.style.width = '100%';
    frontLogsCanvas.style.height = '100%';
    frontLogsCanvas.style.pointerEvents = 'none';
    frontLogsCanvas.style.zIndex = '5';
    frontLogsCanvas.style.willChange = 'transform';
    frontLogsCanvas.style.transform = 'translateZ(0)'; // GPU 레이어 강제 생성
    frontLogsCanvas.style.backfaceVisibility = 'hidden';
    frontLogsCanvas.style.perspective = '1000px';
    document.body.appendChild(frontLogsCanvas);
    
    // 배경 이미지 로드 (밤하늘 다음 레이어)에러 방지를 위해 drawStars 전에 선언
    const bgImg = new Image();
    bgImg.src = 'images/background.png';
    
    // 고성능 GPU 최적화된 캔버스 컨텍스트 설정
    const bgCtx = bgCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false
    });
  
    // 불꽃 전용 컨텍스트 (격자무늬 방지 최적화)
    const fireCtx = fireCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
      colorSpace: 'srgb',
      antialias: true
    });
  
    // 연기 전용 컨텍스트 (부드러운 블러 최적화)
    const smokeCtx = smokeCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
      colorSpace: 'srgb',
      antialias: true
    });
  
    // 불똥용 컨텍스트
    const sparkCtx = sparkCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
      colorSpace: 'srgb'
    });
  
    // 장작용 컨텍스트
    const logsCtx = logsCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false
    });
  
    // 앞쪽 장작용 컨텍스트
    const frontLogsCtx = frontLogsCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false
    });
  
    // 모든 컨텍스트에 기본 품질 설정 적용
    [bgCtx, fireCtx, smokeCtx, sparkCtx, logsCtx, frontLogsCtx].forEach(ctx => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    });
    
    // 불꽃 컨텍스트에 추가 설정 (선명도 향상)
    fireCtx.lineWidth = 0.5;
    fireCtx.lineCap = 'round';
    fireCtx.lineJoin = 'round';
    
    // 밤하늘 설정
    let isSkyEnabled = true;
    // 배경 이미지 표시 여부
    let isBgEnabled = true;
    const numStars = 300;
    let stars = [];
  
    function generateStars() {
      stars = [];
      // CSS 픽셀 기준 크기 계산
      const cssWidth = window.innerWidth;
      const cssHeight = window.innerHeight;
      for (let i = 0; i < numStars; i++) {
        // 기본 알파, 깜빡임 주파수와 위상 설정
        const baseAlpha = Math.random() * 0.8 + 0.2;
        stars.push({ x: Math.random() * cssWidth, y: Math.random() * cssHeight, radius: Math.random() * 1.2 + 0.3,
                     baseAlpha: baseAlpha,
                     twinkleFreq: Math.random() * 2 + 1, // 1~3Hz 범위
                     twinklePhase: Math.random() * Math.PI * 2 });
      }
    }
  
    function drawStars() {
      const cssWidth = window.innerWidth;
      const cssHeight = window.innerHeight;
      // 캔버스 초기화
      bgCtx.clearRect(0, 0, cssWidth, cssHeight);
  
      // 밤하늘(그라디언트와 별)만 isSkyEnabled일 때 그리기
      if (isSkyEnabled) {
        // 대체: Rayleigh 산란 기반 그라디언트 (출처: https://en.wikipedia.org/wiki/Rayleigh_scattering)
        const skyGradient = bgCtx.createLinearGradient(0, 0, 0, cssHeight);
        skyGradient.addColorStop(0, '#0b1a34');
        skyGradient.addColorStop(1, '#000007');
        bgCtx.fillStyle = skyGradient;
        bgCtx.fillRect(0, 0, cssWidth, cssHeight);
        // 별 그리기 (밤하늘)
        const t = performance.now() / 1000;
        stars.forEach(star => {
          // 트윙클: 기압 굴절로 인한 밝기 변동 (Scintillation)
          const flick = 0.5 + 0.5 * Math.sin(star.twinkleFreq * t + star.twinklePhase);
          const alpha = star.baseAlpha * flick;
          bgCtx.beginPath();
          bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          bgCtx.fillStyle = `rgba(255,255,255,${alpha})`;
          bgCtx.fill();
        });
      }
      // 배경 이미지 그리기 (배경 레이어)
      if (isBgEnabled && bgImg.complete) {
        // 배경 이미지 그리기 (CSS 픽셀 기준)
        if (cssWidth > cssHeight) {
          bgCtx.drawImage(bgImg, 0, 0, cssWidth, cssHeight);
        } else {
          const scale = cssHeight / bgImg.height;
          const w = bgImg.width * scale;
          const h = cssHeight;
          const x = (cssWidth - w) / 2;
          bgCtx.drawImage(bgImg, x, 0, w, h);
        }
      }
    }
  
    generateStars();
    drawStars();
  
    // body 스타일 설정
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    
    // 오디오 컨텍스트 생성 (Web Audio API)
    let audioContext;
    
    // 오디오 버퍼 저장소
    let ignitionBuffer = null;
    let soundVolume = 0.5; // 기본 볼륨값 추가
  
    // 오디오 객체 생성 및 설정 (크로스페이드용으로 변경)
    const fireNormalSound1 = new Audio('sounds/fire_normal.wav');
    const fireNormalSound2 = new Audio('sounds/fire_normal.wav');
    const fireIgnitionSound = new Audio('sounds/fire_ignition.wav');
  
    // 크로스페이드 설정
    const crossFadeTime = 0.5; // 초
    let currentAudio = fireNormalSound1;
    let nextAudio = fireNormalSound2;
    let fireNormalSound = currentAudio; // 기조 코드 호환용 alias
  
    // 초기 볼륨 설정 (soundVolume 은 이후 선언됨)
    fireNormalSound.volume = soundVolume;
    nextAudio.volume = 0;
  
    // 볼륨 페이드 헬퍼 함수
    function fadeVolume(audio, from, to, duration) {
      const stepTime = 50;
      const steps = duration * 1000 / stepTime;
      let step = 0;
      const diff = to - from;
      const interval = setInterval(() => {
        step++;
        audio.volume = Math.min(Math.max(from + diff * step / steps, 0), 1);
        if (step >= steps) clearInterval(interval);
      }, stepTime);
    }
  
    // 교차 페이드 모니터링 및 루프 함수
    let nextStarted = false;
    function crossFadeLoop() {
      // 다음 오디오 시작을 아직 못했으면 타이밍 체크
      if (!nextStarted && currentAudio.currentTime >= currentAudio.duration - crossFadeTime) {
        nextStarted = true;
        nextAudio.currentTime = 0;
        nextAudio.volume = 0;
        
        // 음소거 상태가 아닐 때만 소리 재생
        if (!isMuted) {
          nextAudio.play().catch(e => console.log('오디오 재생 실패:', e));
          // 크로스페이드
          fadeVolume(currentAudio, soundVolume, 0, crossFadeTime);
          fadeVolume(nextAudio, 0, soundVolume, crossFadeTime);
        } else {
          // 음소거 상태라면 소리 없이 재생
          nextAudio.volume = 0;
          nextAudio.play().catch(e => console.log('오디오 재생 실패:', e));
        }
        
        // 페이드 끝나면 swap
        setTimeout(() => {
          currentAudio.pause();
          [currentAudio, nextAudio] = [nextAudio, currentAudio];
          fireNormalSound = currentAudio;
          nextStarted = false;
        }, crossFadeTime * 1000);
      }
      requestAnimationFrame(crossFadeLoop);
    }
  
    // 재생 시작 및 교차페이드 루프 실행
    function scheduleLoop() {
      currentAudio.currentTime = 0;
      // 음소거 상태가 아닐 때만 볼륨 설정
      currentAudio.volume = isMuted ? 0 : soundVolume;
      
      currentAudio.play().catch(e => console.log('오디오 재생 실패:', e));
      nextStarted = false;
      requestAnimationFrame(crossFadeLoop);
    }
  
    // 불이 켜져있는지 여부
    let isFireLit = false;
    // 자동 재생 대신 사용자 상호작용 후 재생 시작
    let isMuted = false;
    // 연기 효과 활성화 여부
    let isSmokeEnabled = true;
  
    // 시간 기반 애니메이션을 위한 변수
    let lastTime = 0;
    const FPS = 60; // 목표 FPS
    const FRAME_TIME = 1000 / FPS; // 프레임당 목표 시간 (ms)
    const SPEED_FACTOR = 0.8; // 애니메이션 속도 조절 (1.0이 원래 속도, 작을수록 느림)
  
    // 성능 모니터링 및 적응형 품질 조절
    let frameCount = 0;
    let lastFPSCheck = 0;
    let currentFPS = 60;
    let performanceMode = 'normal'; // 'normal', 'reduced', 'minimal'
    
    // GPU 리소스 경합 방지를 위한 프레임 스킵
    let frameSkipCounter = 0;
    const FRAME_SKIP_THRESHOLD = 30; // 30fps 이하일 때 프레임 스킵 시작
  
    let fireCenterX, fireCenterY, logsX, logsY, logsWidth, logsHeight;
    const logsScale = 0.1;
    const SCALE = 1.3;
    // 캠프파이어 오프셋 (px)
    let campfireOffsetX = 0;
    let campfireOffsetY = 230; // 위치를 더 아래로 조정
  
    // 오디오 컨텍스트 초기화 (사용자 상호작용 발생 시)
    function initAudio() {
      if (audioContext) return Promise.resolve(); // 이미 초기화됨
      
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // 전역에서 접근할 수 있도록 노출
      window.audioContext = audioContext;
      return Promise.resolve();
    }
    
    function updateLayout() {
      const dpr = getOptimalDPR();
      
      // 배경 캔버스 리사이징 및 밤하늘 재생성
      bgCanvas.width = window.innerWidth * dpr;
      bgCanvas.height = window.innerHeight * dpr;
      bgCanvas.style.width = window.innerWidth + 'px';
      bgCanvas.style.height = window.innerHeight + 'px';
      bgCtx.setTransform(1, 0, 0, 1, 0, 0);
      bgCtx.scale(dpr, dpr);
      generateStars();
      drawStars();
  
      // 연기와 불꽃 캔버스 리사이징
      smokeCanvas.width = window.innerWidth * dpr;
      smokeCanvas.height = window.innerHeight * dpr;
      smokeCanvas.style.width = window.innerWidth + 'px';
      smokeCanvas.style.height = window.innerHeight + 'px';
      smokeCtx.setTransform(1, 0, 0, 1, 0, 0);
      smokeCtx.scale(dpr, dpr);
  
      // 불꽃 캔버스 리사이징
      fireCanvas.width = window.innerWidth * dpr;
      fireCanvas.height = window.innerHeight * dpr;
      fireCanvas.style.width = window.innerWidth + 'px';
      fireCanvas.style.height = window.innerHeight + 'px';
      fireCtx.setTransform(1, 0, 0, 1, 0, 0);
      fireCtx.scale(dpr, dpr);
  
      // 불똥 캔버스 리사이징
      sparkCanvas.width = window.innerWidth * dpr;
      sparkCanvas.height = window.innerHeight * dpr;
      sparkCanvas.style.width = window.innerWidth + 'px';
      sparkCanvas.style.height = window.innerHeight + 'px';
      sparkCtx.setTransform(1, 0, 0, 1, 0, 0);
      sparkCtx.scale(dpr, dpr);
  
      // 장작 캔버스 리사이징
      logsCanvas.width = window.innerWidth * dpr;
      logsCanvas.height = window.innerHeight * dpr;
      logsCanvas.style.width = window.innerWidth + 'px';
      logsCanvas.style.height = window.innerHeight + 'px';
      logsCtx.setTransform(1, 0, 0, 1, 0, 0);
      logsCtx.scale(dpr, dpr);
  
      // 앞쪽 장작 캔버스 리사이징
      frontLogsCanvas.width = window.innerWidth * dpr;
      frontLogsCanvas.height = window.innerHeight * dpr;
      frontLogsCanvas.style.width = window.innerWidth + 'px';
      frontLogsCanvas.style.height = window.innerHeight + 'px';
      frontLogsCtx.setTransform(1, 0, 0, 1, 0, 0);
      frontLogsCtx.scale(dpr, dpr);
  
      logsWidth = 150 * SCALE;
      logsHeight = 150 * SCALE;
      fireCenterX = window.innerWidth / 2 + campfireOffsetX;
      fireCenterY = window.innerHeight / 2 + campfireOffsetY;
      logsX = fireCenterX - logsWidth / 2;
      logsY = fireCenterY - logsHeight * 0.6;
    }
  
    updateLayout();
    window.addEventListener('resize', updateLayout);
  
    // 장작 이미지 로드 및 크기/위치 설정
    const logsImg = new Image();
    logsImg.src = 'images/logs.png';
  
    // 클릭 효과: 불꽃이 커졌다가 원래 크기로 돌아옴
    let clickEffect = 0;
    let clickEffectDecay = 0.95; // 감소 속도 (기본값)
    let clickColorEffect = 0;    // 클릭 시 색상 변화 효과
    let sparkBurst = false;      // 스파크 폭발 효과 제어
    let sparkBurstTimer = 0;     // 스파크 폭발 타이머
    
    logsCanvas.addEventListener('click', async () => {
      if (!isFireLit) {
        // 처음 클릭 시 불 켜기
        isFireLit = true;
        clickEffect = 0.8; // 초기 클릭 효과 감소 (1.0 → 0.7 → 0.8)
        clickEffectDecay = 0.975; // 효과가 더 천천히 감소하도록 조정
        clickColorEffect = 1.0;   // 색상 효과 활성화
        sparkBurst = true;        // 스파크 폭발 효과 활성화
        sparkBurstTimer = 60;     // 약 1초간 스파크 폭발 지속
        
        // 오디오 초기화
        try {
          await initAudio();
        } catch (e) {
          console.error('오디오 초기화 실패:', e);
        }
        
        // 불소리 시작
        if (fireNormalSound.paused) {
          scheduleLoop();
        }
        
        // 불이 화륵 타오르는 소리 재생
        if (!isMuted) {
          fireIgnitionSound.currentTime = 0;
          fireIgnitionSound.volume = soundVolume;
          fireIgnitionSound.play().catch(e => console.log('오디오 재생 실패:', e));
        }
      } else {
        // 이미 불이 켜져있는 상태에서 클릭 시
        clickEffect = 0.6; // 클릭 효과 감소 (1.0 → 0.5 → 0.6)
        clickEffectDecay = 0.96; // 기본 감소 속도 약간 증가
        clickColorEffect = 0.8;  // 색상 효과 활성화 (약간 약하게)
        sparkBurst = true;       // 스파크 폭발 효과 활성화
        sparkBurstTimer = 40;    // 약 0.7초간 스파크 폭발 지속
        
        // 클릭 시 불이 화륵 커지는 소리 재생
        if (!isMuted) {
          fireIgnitionSound.currentTime = 0;
          fireIgnitionSound.volume = soundVolume;
          fireIgnitionSound.play().catch(e => console.log('오디오 재생 실패:', e));
        }
      }
    });
  
    // 슬라이더 기본값 초기화
    let fireStrength = 5;
    let glowSize = 1.5;
    let glowAlpha = 0.15;
    let smokeStrength = 1.0; // 연기 강도 추가
    soundVolume = 0.5; // 기본 볼륨값 추가
  
    // 로컬스토리지에서 설정 불러오기
    function loadSettings() {
      try {
        const saved = localStorage.getItem('campfireSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          fireStrength = settings.fireStrength ?? 5;
          glowSize = settings.glowSize ?? 1.5;
          glowAlpha = settings.glowAlpha ?? 0.15;
          smokeStrength = settings.smokeStrength ?? 1.0;
          soundVolume = settings.soundVolume ?? 0.5;
          isMuted = settings.isMuted ?? false;
          isSmokeEnabled = settings.isSmokeEnabled ?? true;
          isSkyEnabled = settings.isSkyEnabled ?? true;
          isBgEnabled = settings.isBgEnabled ?? true;
          campfireOffsetX = settings.campfireOffsetX ?? 0;
          campfireOffsetY = settings.campfireOffsetY ?? 230;
        }
      } catch (e) {
        console.log('설정 불러오기 실패:', e);
      }
    }
  
    // 로컬스토리지에 설정 저장
    function saveSettings() {
      try {
        const settings = {
          fireStrength,
          glowSize,
          glowAlpha,
          smokeStrength,
          soundVolume,
          isMuted,
          isSmokeEnabled,
          isSkyEnabled,
          isBgEnabled,
          campfireOffsetX,
          campfireOffsetY
        };
        localStorage.setItem('campfireSettings', JSON.stringify(settings));
      } catch (e) {
        console.log('설정 저장 실패:', e);
      }
    }
  
    // 설정 초기화
    function resetSettings() {
      fireStrength = 5;
      glowSize = 1.5;
      glowAlpha = 0.15;
      smokeStrength = 1.0;
      soundVolume = 0.5;
      isMuted = false;
      isSmokeEnabled = true;
      isSkyEnabled = true;
      isBgEnabled = true;
      campfireOffsetX = 0;
      campfireOffsetY = 230;
      
      // UI 업데이트
      updateSettingsUI();
      updateLayout();
      saveSettings();
    }
  
    // 설정 UI 업데이트
    function updateSettingsUI() {
      const fireStrengthSlider = document.getElementById('fireStrength');
      const glowSizeSlider = document.getElementById('glowSize');
      const glowAlphaSlider = document.getElementById('glowAlpha');
      const smokeStrengthSlider = document.getElementById('smokeStrength');
      const soundVolumeSlider = document.getElementById('soundVolume');
      const soundToggle = document.getElementById('soundToggle');
      const smokeToggle = document.getElementById('smokeToggle');
      const skyToggle = document.getElementById('skyToggle');
      const bgToggle = document.getElementById('bgToggle');
      const offsetXSlider = document.getElementById('offsetX');
      const offsetYSlider = document.getElementById('offsetY');
  
      if (fireStrengthSlider) fireStrengthSlider.value = fireStrength;
      if (glowSizeSlider) glowSizeSlider.value = glowSize;
      if (glowAlphaSlider) glowAlphaSlider.value = glowAlpha;
      if (smokeStrengthSlider) smokeStrengthSlider.value = smokeStrength;
      if (soundVolumeSlider) soundVolumeSlider.value = soundVolume;
      if (soundToggle) soundToggle.checked = !isMuted;
      if (smokeToggle) smokeToggle.checked = isSmokeEnabled;
      if (skyToggle) skyToggle.checked = isSkyEnabled;
      if (bgToggle) bgToggle.checked = isBgEnabled;
      if (offsetXSlider) offsetXSlider.value = campfireOffsetX;
      if (offsetYSlider) offsetYSlider.value = campfireOffsetY;
  
      // 볼륨 적용
      if (!isMuted) {
        fireNormalSound.volume = soundVolume;
        fireIgnitionSound.volume = soundVolume;
        currentAudio.volume = soundVolume;
      }
    }
  
    // 설정 불러오기
    loadSettings();
    
    // 설정 불러온 후 레이아웃 업데이트 (캠프파이어 위치 적용)
    updateLayout();
  
    // 설정 버튼 및 사이드바 추가
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'settingsBtn';
    settingsBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
    settingsBtn.style.position = 'fixed';
    settingsBtn.style.top = '20px';
    settingsBtn.style.right = '20px';
    settingsBtn.style.width = '44px';
    settingsBtn.style.height = '44px';
    settingsBtn.style.padding = '0';
    settingsBtn.style.display = 'flex';
    settingsBtn.style.alignItems = 'center';
    settingsBtn.style.justifyContent = 'center';
    settingsBtn.style.borderRadius = '50%';
    settingsBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    settingsBtn.style.color = '#fff';
    settingsBtn.style.border = 'none';
    settingsBtn.style.cursor = 'pointer';
    settingsBtn.style.zIndex = '100';
    settingsBtn.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    settingsBtn.style.transition = 'transform 0.3s ease, background-color 0.3s';
    
    // 호버 효과 추가
    settingsBtn.addEventListener('mouseover', () => {
      settingsBtn.style.backgroundColor = 'rgba(50, 50, 50, 0.8)';
      settingsBtn.style.transform = 'scale(1.1)';
    });
    settingsBtn.addEventListener('mouseout', () => {
      settingsBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      settingsBtn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(settingsBtn);
  
    const sidebar = document.createElement('div');
    sidebar.id = 'settingsSidebar';
    sidebar.style.position = 'fixed';
    sidebar.style.top = '0';
    sidebar.style.right = '-300px';
    sidebar.style.width = '300px';
    sidebar.style.height = '100%';
    sidebar.style.background = 'rgba(20, 20, 20, 0.9)';
    sidebar.style.padding = '20px';
    sidebar.style.boxShadow = '-2px 0 15px rgba(0, 0, 0, 0.5)';
    sidebar.style.transition = 'right 0.3s ease';
    sidebar.style.zIndex = '101';
    sidebar.style.backdropFilter = 'blur(10px)';
    sidebar.style.fontFamily = "'Arial', sans-serif";
    sidebar.style.overflowY = 'auto';
  
    // 사이드바 내용 스타일링 개선
    sidebar.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:16px;">
        <h3 style="color:#fff;margin:0;font-size:18px;font-weight:600;">캠프파이어 설정</h3>
        <button id="closeSettings" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;padding:0;">&times;</button>
      </div>
      
      <div style="max-height:calc(100vh - 200px);overflow-y:auto;padding-right:5px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.3) transparent;">
        <div style="display:flex;flex-direction:column;gap:18px;">
          <div class="setting-group">
            <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">불꽃 강도</label>
            <input id="fireStrength" type="range" min="0.5" max="9.5" step="0.01" value="${fireStrength}" 
                   style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
          </div>
          
          <div class="setting-group">
            <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">빛무리 크기</label>
            <input id="glowSize" type="range" min="0" max="3" step="0.01" value="${glowSize}" 
                   style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
          </div>
          
          <div class="setting-group">
            <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">빛무리 밝기</label>
            <input id="glowAlpha" type="range" min="0" max="0.3" step="0.01" value="${glowAlpha}" 
                   style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
          </div>
          
          <div class="setting-group">
            <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">연기 강도</label>
            <input id="smokeStrength" type="range" min="0" max="3" step="0.01" value="${smokeStrength}" 
                   style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
          </div>
          
          <div class="setting-group" style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;">
            <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">소리 볼륨</label>
            <input id="soundVolume" type="range" min="0" max="1" step="0.01" value="${soundVolume}" 
                   style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
          </div>
          
          <div style="display:flex;flex-direction:column;gap:14px;margin-top:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label style="color:#fff;font-size:14px;font-weight:500;">소리</label>
              <label class="toggle-switch">
                <input type="checkbox" id="soundToggle" ${!isMuted ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label style="color:#fff;font-size:14px;font-weight:500;">연기 효과</label>
              <label class="toggle-switch">
                <input type="checkbox" id="smokeToggle" ${isSmokeEnabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label style="color:#fff;font-size:14px;font-weight:500;">밤하늘</label>
              <label class="toggle-switch">
                <input type="checkbox" id="skyToggle" ${isSkyEnabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <label style="color:#fff;font-size:14px;font-weight:500;">배경 이미지</label>
              <label class="toggle-switch">
                <input type="checkbox" id="bgToggle" ${isBgEnabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-group">
              <label style="color:#fff;font-size:14px;font-weight:500;">모닥불 X 위치</label>
              <input id="offsetX" type="range" min="-500" max="500" step="1" value="${campfireOffsetX}"
                     style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
            </div>
            <div class="setting-group">
              <label style="color:#fff;font-size:14px;font-weight:500;">모닥불 Y 위치</label>
              <input id="offsetY" type="range" min="-500" max="500" step="1" value="${campfireOffsetY}"
                     style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
            </div>
            
            <!-- 설정 초기화 버튼 -->
            <div style="margin-top:20px;border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;margin-bottom:20px;">
              <button id="resetSettings" style="width:100%;padding:10px;background-color:rgba(255,80,80,0.2);color:rgba(255,80,80,0.9);border:none;border-radius:4px;cursor:pointer;font-weight:500;font-size:14px;transition:all 0.2s;">
                설정 초기화
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div style="position:absolute;bottom:20px;left:20px;right:20px;text-align:center;">
        <a href="privacy-policy.html" style="color:rgba(255,255,255,0.5);text-decoration:none;font-size:12px;display:block;transition:color 0.3s;">개인정보처리방침</a>
      </div>
    `;
    document.body.appendChild(sidebar);
    
    // 슬라이더 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 15px;
        width: 15px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
      input[type=range]::-moz-range-thumb {
        height: 15px;
        width: 15px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
      
      /* 토글 스위치 스타일 */
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }
      
      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(80, 80, 80, 0.5);
        transition: .3s;
        border-radius: 24px;
      }
      
      .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .3s;
        border-radius: 50%;
      }
      
      input:checked + .toggle-slider {
        background-color: #ff6b00;
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(26px);
      }
      
      /* 초기화 버튼 호버 효과 */
      #resetSettings:hover {
        background-color: rgba(255,80,80,0.3) !important;
        color: rgba(255,100,100,1) !important;
      }
      
      #resetSettings:active {
        background-color: rgba(255,80,80,0.4) !important;
      }
      
      /* 스크롤바 스타일 */
      #settingsSidebar *::-webkit-scrollbar {
        width: 8px;
      }
      
      #settingsSidebar *::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      
      #settingsSidebar *::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }
      
      #settingsSidebar *::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.4);
      }
    `;
    document.head.appendChild(style);
    
    // 닫기 버튼 이벤트
    document.getElementById('closeSettings').addEventListener('click', () => {
      sidebar.style.right = '-300px';
    });
  
  
    // 첫 클릭시 오디오 재생 시작
    const startAudio = () => {
      if (!fireNormalSound.paused) return; // 이미 재생 중이면 무시
      
      // 불이 켜져 있는 경우에만 소리 재생
      if (isFireLit) {
        scheduleLoop();
      }
    };
  
    settingsBtn.addEventListener('click', () => {
      if (sidebar.style.right === '0px') {
        sidebar.style.right = '-300px';
      } else {
        sidebar.style.right = '0px';
      }
      
      // 불이 꺼져있는 상태에서 설정 버튼 클릭 시에는 불을 켜지 않음
      // 이미 불이 켜져있는 경우에만 오디오 시작
      startAudio();
    });
  
    document.getElementById('fireStrength').addEventListener('input', e => {
      fireStrength = parseFloat(e.target.value);
      saveSettings();
    });
    document.getElementById('glowSize').addEventListener('input', e => {
      glowSize = parseFloat(e.target.value);
      saveSettings();
    });
    document.getElementById('glowAlpha').addEventListener('input', e => {
      glowAlpha = parseFloat(e.target.value);
      saveSettings();
    });
    document.getElementById('smokeStrength').addEventListener('input', e => {
      smokeStrength = parseFloat(e.target.value);
      saveSettings();
    });
    document.getElementById('soundVolume').addEventListener('input', e => {
      soundVolume = parseFloat(e.target.value);
      // 볼륨 업데이트
      if (!isMuted) {
        fireNormalSound.volume = soundVolume;
        fireIgnitionSound.volume = soundVolume;
      }
      saveSettings();
    });
  
    // 음소거/음소거 해제 버튼 기능 대신 토글 스위치 사용
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.checked = !isMuted; // 초기 상태 설정 (음소거가 아닌 상태면 체크)
    soundToggle.addEventListener('change', () => {
      isMuted = !soundToggle.checked; // 토글이 켜져 있으면 소리 켜짐, 꺼져있으면 소리 꺼짐
      
      if (isMuted) {
        // 음소거 활성화 시 즉시 모든 오디오 볼륨을 0으로 설정
        fireNormalSound.volume = 0;
        fireIgnitionSound.volume = 0;
        currentAudio.volume = 0;
        nextAudio.volume = 0;
      } else {
        // 음소거 해제 시 현재 볼륨으로 설정
        fireNormalSound.volume = soundVolume;
        fireIgnitionSound.volume = soundVolume;
        currentAudio.volume = soundVolume;
        nextAudio.volume = 0; // 다음 오디오는 페이드인될 때까지 0
      }
      saveSettings();
    });
  
    // 연기 온오프 버튼 기능 대신 토글 스위치 사용
    const smokeToggle = document.getElementById('smokeToggle');
    smokeToggle.checked = isSmokeEnabled; // 초기 상태 설정
    smokeToggle.addEventListener('change', () => {
      isSmokeEnabled = smokeToggle.checked;
      
      // 연기 끌 때 현재 있는 연기도 함께 제거
      if (!isSmokeEnabled) {
        smokeParticles.length = 0;
      }
      saveSettings();
    });
  
    // 밤하늘 온/오프 토글
    const skyToggle = document.getElementById('skyToggle');
    skyToggle.checked = isSkyEnabled;
    skyToggle.addEventListener('change', () => {
      isSkyEnabled = skyToggle.checked;
      saveSettings();
    });
  
    // 배경 이미지 온/오프 토글 기능
    const bgToggle = document.getElementById('bgToggle');
    bgToggle.checked = isBgEnabled;
    bgToggle.addEventListener('change', () => {
      isBgEnabled = bgToggle.checked;
      // 배경이미지가 꺼져있으면 빈 화면 유지
      // drawStars() 내에서 제어됨
      saveSettings();
    });
  
    // 모닥불 위치 슬라이더 이벤트
    const offsetXSlider = document.getElementById('offsetX');
    offsetXSlider.addEventListener('input', e => {
      campfireOffsetX = parseFloat(e.target.value);
      updateLayout();
      saveSettings();
    });
    const offsetYSlider = document.getElementById('offsetY');
    offsetYSlider.addEventListener('input', e => {
      campfireOffsetY = parseFloat(e.target.value);
      updateLayout();
      saveSettings();
    });
  
    // 파티클 클래스 정의
    class Particle {
      constructor() {
        // 타원 형태로 시작 위치 분포
        const angle = Math.random() * 2 * Math.PI;
        
        // 중앙에서 더 많은 파티클이 생성되도록 분포 조정
        const radius = Math.pow(Math.random(), 0.5); // 제곱근 분포로 중앙 강조
        
        // 클릭 이펙트가 활성화되었을 때 시작 위치 영역 확장
        const spreadFactorX = (1 + clickEffect * 0.6); // 클릭 시 너비 확장
        const spreadFactorY = (1 + clickEffect * 0.3); // 클릭 시 높이 확장
        
        const rx = 30 * SCALE * spreadFactorX;
        const ry = 10 * SCALE * spreadFactorY;
        
        this.x = fireCenterX + Math.cos(angle) * rx * radius;
        this.y = fireCenterY - 10 * SCALE + Math.sin(angle) * ry * radius;
        
        // 초기 속도를 매우 느리게 설정
        this.vx = (Math.random() - 0.5) * 0.1;
        
        // 목표 속도(terminal velocity)를 설정
        // 클릭 효과가 있을 때 상승 속도 증가
        const speedBoost = 1 + clickEffect * 0.5;
        this.vTerminal = -(Math.random() * 2 + 1.8) * SCALE * speedBoost;
        
        // 초기 속도 설정
        this.vy = 0.5 * speedBoost;
        
        // 시간 상수(Frame 수) 설정: 속도 회복 속도 제어
        this.tau = 30;
        
        // 수명 및 크기 설정
        this.life = Math.random() * 30 + 30;
        // 클릭 효과에 따른 크기 조정
        this.size = (Math.random() * 10 + 10) * (1 + clickEffect * 0.5) * SCALE;
        this.maxLife = this.life;
        
        // 난류 모델 파라미터 - 불꽃에 적합한 주파수와 진폭 설정 (진폭 감소)
        this.turbPhase1 = Math.random() * Math.PI * 2;
        this.turbPhase2 = Math.random() * Math.PI * 2;
        this.turbFreq1 = 0.04 + Math.random() * 0.03; // 더 낮은 주파수
        this.turbFreq2 = 0.02 + Math.random() * 0.02; // 더 낮은 주파수
        // 클릭 효과에 따른 난류 증가
        this.turbAmplitude = (0.05 + (Math.random() * 0.1)) * (1 + clickEffect * 0.4) * SCALE;
        
        // 상승 패턴에 영향을 주는 파라미터
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.flickerFreq = 0.08 + Math.random() * 0.1; // 더 낮은 주파수
        this.flickerAmplitude = 0.03 + Math.random() * 0.05; // 진폭 감소
        
        // 색상 파라미터 추가 (클릭 효과에 따른 색상 변화)
        this.colorShift = 0;
        if (clickColorEffect > 0) {
          // 클릭 효과가 강할수록 특별한 색상 확률 증가
          if (Math.random() < clickColorEffect * 0.4) { // 0.6에서 0.4로 줄임
            // 특별한 색상 효과 (0: 일반, 1: 청록색, 2: 파란색, 3: 보라색)
            this.colorShift = Math.floor(Math.random() * 3) + 1;
          }
        }
      }
      
      update(deltaTime) {
        // 시간 기반 계수 (1이면 표준 속도, 2면 두 배 속도 등)
        const timeScale = (deltaTime / FRAME_TIME) * SPEED_FACTOR;
        
        // 1. 기본 상승 속도 모델 - 지수 수렴 (더 강조)
        this.vy += ((this.vTerminal - this.vy) / this.tau) * timeScale;
        
        // 2. 복합 난류 모델 - 수평 움직임 감소, 수직 움직임 유지
        // 수평 방향 난류 (좌우 움직임) - 진폭 감소
        const noiseX1 = Math.sin(this.turbPhase1) * (this.turbAmplitude * 0.6);
        const noiseX2 = Math.sin(this.turbPhase2 * 2.3) * (this.turbAmplitude * 0.2);
        
        // 수직 방향 난류 (위아래 움직임) - 상대적으로 유지
        const noiseY1 = Math.cos(this.turbPhase1 * 1.5) * (this.turbAmplitude * 0.3);
        const noiseY2 = Math.sin(this.turbPhase2 * 3.2) * (this.turbAmplitude * 0.15);
        
        // 3. 깜빡임 효과 - 시간에 따른 진폭 변조 (강도 약화)
        const flicker = Math.sin(this.flickerPhase) * this.flickerAmplitude + 0.98;
        
        // 4. 생명 비율에 따른 난류 강도 증가 - 불꽃 상단이 더 불규칙하게 (강도 감소)
        const lifeRatio = this.life / this.maxLife;
        const turbulenceScale = 0.15 * SCALE * (1 - lifeRatio); // 난류 강도 감소
        
        // 5. 최종 속도 업데이트 - 수평 방향 영향 감소
        // 수평 방향은 더 감쇠시키고 난류 영향 감소
        this.vx = this.vx * (0.92 ** timeScale) + (noiseX1 + noiseX2) * flicker * timeScale + (Math.random() - 0.5) * turbulenceScale * 0.5 * timeScale;
        // 수직 방향은 기본 모델에 더 의존
        this.vy = this.vy * (0.98 ** timeScale) + (noiseY1 + noiseY2) * flicker * timeScale + (Math.random() - 0.5) * turbulenceScale * 0.4 * timeScale;
        
        // 6. 범위 제한 - 수평 방향 속도를 일정 범위로 제한
        const maxHorizontalSpeed = 0.8 * SCALE;
        if (this.vx > maxHorizontalSpeed) this.vx = maxHorizontalSpeed;
        if (this.vx < -maxHorizontalSpeed) this.vx = -maxHorizontalSpeed;
        
        // 난류 위상 업데이트
        this.turbPhase1 += this.turbFreq1 * timeScale;
        this.turbPhase2 += this.turbFreq2 * timeScale;
        this.flickerPhase += this.flickerFreq * timeScale;
        
        // 위치 업데이트
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        
        // 수명 및 크기 변화
        this.life -= timeScale;
        this.size += 0.1 * timeScale;
      }
      
      draw() {
        // 생명비율 계산 및 플리커 효과 추가 - 난류 기반 깜빡임
        const lifeRatio = this.life / this.maxLife;
        const flickerValue = 0.8 + Math.sin(this.flickerPhase * 3) * 0.15 + Math.random() * 0.05;
        
        // 그라데이션 생성
        const grad = fireCtx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        
        // 색상 변화 로직 - 클릭 효과가 있을 때만 밝기 감소
        const brightnessReduction = clickEffect > 0.05 ? 0.85 : 1.0;
        
        if (this.colorShift === 0) {
          // 기본 불꽃 색상 - 밝기 조정
          grad.addColorStop(0, `rgba(255, 230, 120, ${lifeRatio * flickerValue * 0.6 * brightnessReduction})`);
          grad.addColorStop(0.3, `rgba(255, 140,  50, ${lifeRatio * flickerValue * 0.5 * brightnessReduction})`);
          grad.addColorStop(0.6, `rgba(200,  70,  20, ${lifeRatio * flickerValue * 0.3 * brightnessReduction})`);
        } else if (this.colorShift === 1) {
          // 청록색 불꽃 효과 - 밝기 조정
          grad.addColorStop(0, `rgba(200, 255, 220, ${lifeRatio * flickerValue * 0.6 * brightnessReduction})`);
          grad.addColorStop(0.3, `rgba(80, 230, 180, ${lifeRatio * flickerValue * 0.5 * brightnessReduction})`);
          grad.addColorStop(0.6, `rgba(0, 180, 140, ${lifeRatio * flickerValue * 0.4 * brightnessReduction})`);
        } else if (this.colorShift === 2) {
          // 파란색 불꽃 효과 - 밝기 조정
          grad.addColorStop(0, `rgba(200, 230, 255, ${lifeRatio * flickerValue * 0.6 * brightnessReduction})`);
          grad.addColorStop(0.3, `rgba(100, 170, 255, ${lifeRatio * flickerValue * 0.5 * brightnessReduction})`);
          grad.addColorStop(0.6, `rgba(50, 100, 220, ${lifeRatio * flickerValue * 0.4 * brightnessReduction})`);
        } else if (this.colorShift === 3) {
          // 보라색 불꽃 효과 - 밝기 조정
          grad.addColorStop(0, `rgba(230, 190, 255, ${lifeRatio * flickerValue * 0.6 * brightnessReduction})`);
          grad.addColorStop(0.3, `rgba(180, 130, 255, ${lifeRatio * flickerValue * 0.5 * brightnessReduction})`);
          grad.addColorStop(0.6, `rgba(130, 70, 220, ${lifeRatio * flickerValue * 0.4 * brightnessReduction})`);
        }
        
        grad.addColorStop(1, `rgba(0, 0, 0, 0)`);
  
        fireCtx.fillStyle = grad;
        fireCtx.beginPath();
        fireCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        fireCtx.fill();
      }
    }
  
    const particles = [];
    function spawnParticle() {
      // 불이 꺼져있으면 파티클 생성 안함
      if (!isFireLit) return;
      
      // 매 프레임마다 몇 개의 파티클 생성 조정
      // 클릭 효과에 따른 파티클 수 증가 (파티클 폭발 효과 조절)
      const baseCount = Math.random() * 2; // 기본 파티클 수
      const clickBoost = Math.max(0, clickEffect * 3); // 클릭 효과에 따른 추가 파티클 (5 → 3)
      const count = Math.floor(baseCount * (1 + clickBoost) * fireStrength);
      
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }
  
    // 연기 파티클 클래스 정의
    class SmokeParticle {
      constructor() {
        // 불꽃 중심 약간 위에서 생성
        const spread = 25 * SCALE;
        this.x = fireCenterX + (Math.random() - 0.5) * spread;
        this.y = fireCenterY - 50 * SCALE;
        
        // 속도 - 연기는 천천히 상승
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = -(Math.random() * 0.5 + 0.3) * SCALE;
        
        // 투명도와 크기 (모든 GPU에 적합한 중간값 사용)
        const alphaBase = 0.045; // 고성능/일반 GPU 모두에 적합한 중간값
        this.alpha = alphaBase + Math.random() * 0.03;
        this.size = (Math.random() * 15 + 25) * SCALE;
        
        // 수명
        this.life = Math.random() * 180 + 100;
        this.maxLife = this.life;
        
        // 회전
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
        
        // 향상된 난류 모델 파라미터
        this.turbulenceAmplitude = 0.1;
        this.turbulencePhase1 = Math.random() * Math.PI * 2;
        this.turbulencePhase2 = Math.random() * Math.PI * 2;
        this.turbulenceFreq1 = 0.01 + Math.random() * 0.01;
        this.turbulenceFreq2 = 0.01 + Math.random() * 0.01;
      }
      
      update(deltaTime) {
        // 시간 기반 계수
        const timeScale = (deltaTime / FRAME_TIME) * SPEED_FACTOR;
        
        // 복합 난류 계산 (더 자연스러운 움직임을 위해 여러 주파수의 사인파 조합)
        const noise1 = Math.sin(this.turbulencePhase1) * this.turbulenceAmplitude;
        const noise2 = Math.sin(this.turbulencePhase2 * 2.7) * (this.turbulenceAmplitude * 0.6);
        const noise3 = Math.cos(this.turbulencePhase1 * 1.3) * (this.turbulenceAmplitude * 0.4);
        
        // 위치 업데이트 - 복합 난류 적용
        this.x += (this.vx + noise1 + noise2) * timeScale;
        this.y += (this.vy + noise3) * timeScale;
        
        // 난류 페이즈 업데이트 (다른 속도로 업데이트)
        this.turbulencePhase1 += this.turbulenceFreq1 * timeScale;
        this.turbulencePhase2 += this.turbulenceFreq2 * timeScale;
        
        // 회전
        this.rotation += this.rotationSpeed * timeScale;
        
        // 크기 약간 증가 (퍼짐 효과) - 연기가 상승할수록 더 많이 퍼짐
        const lifeRatio = this.life / this.maxLife;
        this.size += 0.2 * (1.2 - lifeRatio) * timeScale; // 수명이 줄어들수록 더 빠르게 퍼짐
        
        // 투명도 감소 - 처음에는 천천히, 나중에는 빠르게
        this.alpha *= 0.985 ** timeScale;
        
        // 수명 감소
        this.life -= timeScale;
      }
      
      draw() {
        const lifeRatio = this.life / this.maxLife;
        
        smokeCtx.save();
        smokeCtx.translate(this.x, this.y);
        smokeCtx.rotate(this.rotation);
        
        // 더 부드러운 그라디언트 생성을 위해 더 많은 색상 단계 사용
        const smokeGrad = smokeCtx.createRadialGradient(
          0, 0, 0,
          0, 0, this.size
        );
        
        // 모든 GPU에 적합한 알파값 사용
        const alphaValue = this.alpha * lifeRatio * 0.85; // 중간값 사용
        
        // 표준 그라디언트 (모든 GPU에서 동일)
        smokeGrad.addColorStop(0, `rgba(180, 180, 180, ${alphaValue * 0.7})`);
        smokeGrad.addColorStop(0.2, `rgba(170, 170, 170, ${alphaValue * 0.65})`);
        smokeGrad.addColorStop(0.4, `rgba(150, 150, 150, ${alphaValue * 0.5})`);
        smokeGrad.addColorStop(0.6, `rgba(130, 130, 130, ${alphaValue * 0.4})`);
        smokeGrad.addColorStop(0.8, `rgba(100, 100, 100, ${alphaValue * 0.2})`);
        smokeGrad.addColorStop(1, `rgba(80, 80, 80, 0)`);
        
        smokeCtx.fillStyle = smokeGrad;
        smokeCtx.beginPath();
        smokeCtx.arc(0, 0, this.size, 0, Math.PI * 2);
        smokeCtx.fill();
        
        smokeCtx.restore();
      }
    }
  
    const smokeParticles = [];
    function spawnSmoke() {
      if (!isFireLit || !isSmokeEnabled) return;
      
      // 연기 생성 빈도에 연기 강도 적용
      if (Math.random() < 0.08 * fireStrength * smokeStrength) {
        smokeParticles.push(new SmokeParticle());
      }
    }
  
    function drawGlow() {
      const glowX = fireCenterX;
      const glowY = fireCenterY - 60 * SCALE;
      
      // 클릭 시 빛무리 크기 증가 (clickEffect가 있을 때 크기 증가)
      const glowSizeMultiplier = clickEffect > 0.05 ? 1 + clickEffect * 0.3 : 1.0;
      const maxGlow = Math.min(sparkCanvas.width, sparkCanvas.height) * 0.18 * SCALE * glowSize * glowSizeMultiplier;
      
      const grad = sparkCtx.createRadialGradient(
        glowX, glowY, 0,
        glowX, glowY, maxGlow
      );
      
      // 클릭 효과가 있을 때 밝기도 증가
      const brightnessMultiplier = clickEffect > 0.05 ? 1 + clickEffect * 0.4 : 1.0;
      
      // 모든 GPU에 적합한 글로우 알파값 사용
      const adjustedGlowAlpha = glowAlpha * brightnessMultiplier * 0.85; // 중간값 사용
      
      // 알파값이 너무 높아지지 않도록 제한 (최대 1.0)
      const cappedAlpha = Math.min(adjustedGlowAlpha, 0.25);
      const cappedAlphaHalf = Math.min(adjustedGlowAlpha * 0.55, 0.15);
      const cappedAlphaQuarter = Math.min(adjustedGlowAlpha * 0.22, 0.06);
      
      grad.addColorStop(0, `rgba(255, 230, 120, ${cappedAlpha})`);
      grad.addColorStop(0.25, `rgba(255, 180, 60, ${cappedAlphaHalf})`);
      grad.addColorStop(0.6, `rgba(255, 120, 30, ${cappedAlphaQuarter})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
      // 표준 블렌딩 모드 사용 (모든 GPU에서 동일)
      sparkCtx.globalCompositeOperation = 'lighter';
      sparkCtx.beginPath();
      sparkCtx.arc(glowX, glowY, maxGlow, 0, Math.PI * 2);
      sparkCtx.fillStyle = grad;
      sparkCtx.fill();
      sparkCtx.globalCompositeOperation = 'source-over';
    }
  
    // 스파크(불똥) 클래스 정의
    class Spark {
      constructor() {
        // 클릭 효과가 있을 때와 없을 때 구분
        if (clickEffect > 0.05) {
          // 클릭했을 때: 퍼짐 범위와 속도 조절
          const spread = 40 * SCALE * (1 + clickEffect * 0.4);
          this.x = fireCenterX + (Math.random() - 0.5) * spread;
          this.y = fireCenterY;
          
          // 클릭 시 속도 감소
          const speedBoost = 1 + clickEffect * 0.8;
          this.vx = (Math.random() - 0.5) * 3 * speedBoost;
          this.vy = -(Math.random() * 4 + 1) * SCALE * speedBoost;
          
          // 스파크 폭발 효과일 때 튀어오르는 불똥 추가 - 높이를 줄임
          if (sparkBurst) {
            this.vy *= 1.1;
            this.vx *= 1.1;
          }
        } else {
          // 클릭하지 않았을 때: 원래 설정 유지
          const spread = 40 * SCALE;
          this.x = fireCenterX + (Math.random() - 0.5) * spread;
          this.y = fireCenterY;
          
          // 원래 속도 유지
          this.vx = (Math.random() - 0.5) * 4;
          this.vy = -(Math.random() * 5 + 1) * SCALE; // 7에서 5로 살짝만 감소
        }
        
        this.life = Math.random() * 20 + 20;
        
        // 크기 설정 (클릭 효과에 따라 조정)
        if (clickEffect > 0.05) {
          this.size = (Math.random() * 3 + 0.5) * (1 + clickEffect * 0.3);
        } else {
          this.size = Math.random() * 3 + 0.5;
        }
        
        // 관성: 크기에 비례
        this.inertia = this.size;
        
        // Ornstein–Uhlenbeck 난류 모델 파라미터 초기화
        this.ouTau = 20;   // 에디스 시간 상수 (프레임 단위)
        
        // 난류 강도 (클릭 효과에 따라 조정)
        if (clickEffect > 0.05) {
          this.ouSigma = 0.2 * SCALE * (1 + clickEffect * 0.2);
        } else {
          this.ouSigma = 0.2 * SCALE;
        }
        
        this.ouVx = 0;     // x 방향 난류 속도 편차
        this.ouVy = 0;     // y 방향 난류 속도 편차
        
        // 소용돌이 방향 랜덤 설정 (1 또는 -1)
        this.swirlDir = Math.random() < 0.5 ? 1 : -1;
        this.maxLife = this.life;
        
        // 색상 효과 추가 (클릭 시 일부 스파크에 특별한 색상)
        this.colorType = 0; // 0: 일반, 1-3: 특별 색상
        if (clickColorEffect > 0 && Math.random() < clickColorEffect * 0.6) {
          this.colorType = Math.floor(Math.random() * 3) + 1;
        }
      }
      
      update(deltaTime) {
        // 시간 기반 계수
        const timeScale = (deltaTime / FRAME_TIME) * SPEED_FACTOR;
        
        // Ornstein–Uhlenbeck 난류 모델 적용 (관성 반영)
        const dt = timeScale;
        const sigmaScaled = this.ouSigma / this.inertia;
        const randVx = (Math.random() - 0.5) * 1;
        const randVy = (Math.random() - 0.5) * 1;
        this.ouVx += -(this.ouVx / this.ouTau) * dt + sigmaScaled * randVx * Math.sqrt(dt);
        this.ouVy += -(this.ouVy / this.ouTau) * dt + sigmaScaled * randVy * Math.sqrt(dt);
        this.vx += this.ouVx * timeScale;
        this.vy += this.ouVy * timeScale;
  
        // 공기 저항 및 난류, 중력 적용 (관성 반영)
        const drag = 0.02 / this.inertia;
        const turbulence = ((Math.random() - 0.5) * 0.2) / this.inertia;
        this.vx = this.vx * ((1 - drag) ** timeScale) + turbulence * timeScale;
        this.vy += 0.1 * SCALE * timeScale;
        this.vy *= ((1 - drag) ** timeScale);
  
        // 소용돌이 효과 (관성 반영)
        const swirlStrength = (0.01 * SCALE) / this.inertia;
        const vxOld = this.vx;
        const vyOld = this.vy;
        this.vx += -vyOld * swirlStrength * this.swirlDir * timeScale;
        this.vy += vxOld * swirlStrength * this.swirlDir * timeScale;
  
        // 위치 업데이트 및 생명 감소
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;
        this.life -= timeScale;
      }
      
      draw() {
        const alpha = this.life / this.maxLife;
        
        // 색상 타입에 따른 불똥 색상 설정
        // 클릭 효과가 있을 때만 밝기 감소
        const reducedAlpha = clickEffect > 0.05 ? alpha * 0.7 : alpha;
        
        if (this.colorType === 0) {
          // 기본 금색 불똥
          sparkCtx.fillStyle = `rgba(255,220,150,${reducedAlpha})`;
        } else if (this.colorType === 1) {
          // 청록색 불똥
          sparkCtx.fillStyle = `rgba(120,255,220,${reducedAlpha})`;
        } else if (this.colorType === 2) {
          // 파란색 불똥
          sparkCtx.fillStyle = `rgba(150,200,255,${reducedAlpha})`;
        } else if (this.colorType === 3) {
          // 보라색 불똥
          sparkCtx.fillStyle = `rgba(230,150,255,${reducedAlpha})`;
        }
        
        sparkCtx.fillRect(this.x, this.y, this.size, this.size);
      }
    }
  
    const sparks = [];
    function spawnSpark() {
      if (!isFireLit) return;
      
      // 기본 스파크 생성 확률 - 원래 확률로 복원
      let sparkChance = 0.02 * fireStrength;
      
      // 스파크 폭발 효과가 활성화된 경우에만 확률 조정
      if (sparkBurst) {
        sparkChance = 0.2 * fireStrength;
      }
      
      if (Math.random() < sparkChance) {
        sparks.push(new Spark());
      }
    }
  
    function animate(currentTime) {
      // 페이지가 비활성화되었으면 애니메이션 중단
      if (window.fireAnimationPaused) {
        return;
      }
      
      // 밤하늘 및 배경 이미지 그리기
      drawStars();
      
      // 델타 타임 계산 (밀리초 단위)
      if (!lastTime) lastTime = currentTime;
      let deltaTime = currentTime - lastTime;
      
      // 최소 및 최대 델타 시간 제한 (프레임 건너뛰기, 브라우저 탭 비활성화 등의 상황 처리)
      const MAX_DELTA = FRAME_TIME * 5; // 최대 5프레임 건너뛰기 허용
      if (deltaTime > MAX_DELTA) deltaTime = MAX_DELTA;
      if (deltaTime < 0) deltaTime = 0;
      
      lastTime = currentTime;
      
      // 각 캔버스 개별적으로 클리어
      fireCtx.globalCompositeOperation = 'source-over';
      fireCtx.clearRect(0, 0, fireCanvas.width / getOptimalDPR(), fireCanvas.height / getOptimalDPR());
      
      smokeCtx.globalCompositeOperation = 'source-over';
      smokeCtx.clearRect(0, 0, smokeCanvas.width / getOptimalDPR(), smokeCanvas.height / getOptimalDPR());
      
      sparkCtx.globalCompositeOperation = 'source-over';
      sparkCtx.clearRect(0, 0, sparkCanvas.width / getOptimalDPR(), sparkCanvas.height / getOptimalDPR());
      
      logsCtx.globalCompositeOperation = 'source-over';
      logsCtx.clearRect(0, 0, logsCanvas.width / getOptimalDPR(), logsCanvas.height / getOptimalDPR());
      
      frontLogsCtx.globalCompositeOperation = 'source-over';
      frontLogsCtx.clearRect(0, 0, frontLogsCanvas.width / getOptimalDPR(), frontLogsCanvas.height / getOptimalDPR());
      
      // 클릭 효과 감소 (사용자 정의 감소 속도 적용)
      clickEffect *= clickEffectDecay ** (deltaTime / FRAME_TIME);
      
      // 색상 효과 감소 (더 빠른 속도로)
      if (clickColorEffect > 0) {
        clickColorEffect *= (0.94 ** (deltaTime / FRAME_TIME));
        if (clickColorEffect < 0.01) clickColorEffect = 0;
      }
      
      // 스파크 폭발 타이머 업데이트
      if (sparkBurst) {
        sparkBurstTimer -= deltaTime / FRAME_TIME;
        if (sparkBurstTimer <= 0) {
          sparkBurst = false;
          sparkBurstTimer = 0;
        }
      }
  
      // 장작 이미지 그리기 (가장 아래 레이어)
      if (logsImg.complete) {
        logsCtx.drawImage(logsImg, logsX, logsY, logsWidth, logsHeight);
      }
  
      // 글로우 효과 그리기 (불똥 캔버스에)
      if (isFireLit) {
        drawGlow();
      }
  
      // 파티클 생성
      spawnParticle();
      spawnSpark();
      spawnSmoke();
  
      // 불꽃 렌더링 (불꽃 전용 캔버스 - 약한 블러)
      fireCtx.globalCompositeOperation = 'lighter';
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(deltaTime);
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
      }
  
      // 연기 파티클 렌더링 (연기 전용 캔버스 - 강한 블러 2px)
      smokeCtx.globalCompositeOperation = 'source-over';
      for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const sp = smokeParticles[i];
        sp.update(deltaTime);
        sp.draw();
        if (sp.life <= 0) smokeParticles.splice(i, 1);
      }
  
      // 불똥 렌더링 (블러 없는 캔버스)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.update(deltaTime);
        s.draw();
        if (s.life <= 0) sparks.splice(i, 1);
      }
  
      // 앞쪽 장작 이미지 그리기 (가장 위 레이어, 0.08 투명도로 자연스러운 효과)
      if (logsImg.complete) {
        frontLogsCtx.globalAlpha = 0.08;
        frontLogsCtx.drawImage(logsImg, logsX, logsY, logsWidth, logsHeight);
        frontLogsCtx.globalAlpha = 1.0; // 투명도 복원
      }
  
      // 애니메이션 프레임 ID 저장
      animationFrameId = requestAnimationFrame(animate);
    }
  
    // 초기 애니메이션 시작
    animationFrameId = requestAnimationFrame(animate);
  
    // 초기화 버튼 이벤트
    document.getElementById('resetSettings').addEventListener('click', () => {
      if (confirm('모든 설정을 초기화하시겠습니까?')) {
        resetSettings();
      }
    });
  });