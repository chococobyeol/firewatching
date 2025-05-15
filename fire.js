window.addEventListener('load', () => {
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
  // 배경 이미지 로드 (밤하늘 다음 레이어)에러 방지를 위해 drawStars 전에 선언
  const bgImg = new Image();
  bgImg.src = 'images/background.png';
  const bgCtx = bgCanvas.getContext('2d');

  // 밤하늘 설정
  let isSkyEnabled = true;
  // 배경 이미지 표시 여부
  let isBgEnabled = true;
  const numStars = 300;
  let stars = [];

  function generateStars() {
    stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({ x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, radius: Math.random() * 1.2 + 0.3, alpha: Math.random() * 0.8 + 0.2 });
    }
  }

  function drawStars() {
    if (!isSkyEnabled) {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      return;
    }
    // 배경 클리어 및 기본 검은 배경 채우기
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = '#000';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    // 별 그리기 (밤하늘)
    stars.forEach(star => {
      bgCtx.beginPath();
      bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      bgCtx.fill();
    });
    // 배경 이미지 그리기 (배경 레이어)
    if (isBgEnabled && bgImg.complete) {
      // 화면이 가로로 넓을 때는 가로 stretch, 세로는 canvas 높이에 맞춤
      if (bgCanvas.width > bgCanvas.height) {
        bgCtx.drawImage(bgImg, 0, 0, bgCanvas.width, bgCanvas.height);
      } else {
        // 화면이 세로로 길 때는 높이에 맞춰 비율 유지, 가로는 center
        const scale = bgCanvas.height / bgImg.height;
        const w = bgImg.width * scale;
        const h = bgCanvas.height;
        const x = (bgCanvas.width - w) / 2;
        bgCtx.drawImage(bgImg, x, 0, w, h);
      }
    }
  }

  generateStars();
  drawStars();
  // 캔버스 생성 및 초기 설정
  const canvas = document.createElement('canvas');
  // 캠프파이어 캔버스는 밤하늘 위에 표시
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '1';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // 오디오 컨텍스트 생성 (Web Audio API)
  let audioContext;
  
  // 오디오 버퍼 저장소
  let ignitionBuffer = null;
  
  // 오디오 객체 생성 및 설정
  const fireNormalSound = new Audio('sounds/fire_normal.wav');
  const fireIgnitionSound = new Audio('sounds/fire_ignition.wav');
  
  fireNormalSound.loop = true;
  fireNormalSound.volume = 0.5;
  
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
    return Promise.resolve();
  }
  
  function updateLayout() {
    const dpr = window.devicePixelRatio || 1;
    // 배경 캔버스 리사이징 및 밤하늘 재생성
    bgCanvas.width = window.innerWidth * dpr;
    bgCanvas.height = window.innerHeight * dpr;
    bgCanvas.style.width = window.innerWidth + 'px';
    bgCanvas.style.height = window.innerHeight + 'px';
    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.scale(dpr, dpr);
    generateStars();
    drawStars();

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 변환 초기화
    ctx.scale(dpr, dpr);

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
  canvas.addEventListener('click', async () => {
    if (!isFireLit) {
      // 처음 클릭 시 불 켜기
      isFireLit = true;
      clickEffect = 1;
      
      // 오디오 초기화
      try {
        await initAudio();
      } catch (e) {
        console.error('오디오 초기화 실패:', e);
      }
      
      // 불소리 시작
      if (fireNormalSound.paused) {
        fireNormalSound.volume = soundVolume;
        fireNormalSound.play().catch(e => console.log('오디오 재생 실패:', e));
      }
      
      // 불이 화륵 타오르는 소리 재생
      if (!isMuted) {
        fireIgnitionSound.currentTime = 0;
        fireIgnitionSound.volume = soundVolume;
        fireIgnitionSound.play().catch(e => console.log('오디오 재생 실패:', e));
      }
    } else {
      // 이미 불이 켜져있는 상태에서 클릭 시
      clickEffect = 1;
      
      // 클릭 시 불이 화륵 커지는 소리 재생
      if (!isMuted) {
        fireIgnitionSound.currentTime = 0;
        fireIgnitionSound.volume = soundVolume;
        fireIgnitionSound.play().catch(e => console.log('오디오 재생 실패:', e));
      }
    }
  });

  // 슬라이더 기본값 초기화
  let fireStrength = 2.75;
  let glowSize = 0.5;
  let glowAlpha = 0.05;
  let soundVolume = 0.5; // 기본 볼륨값 추가

  // 설정 버튼 및 사이드바 추가
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'settingsBtn';
  settingsBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
  settingsBtn.style.position = 'fixed';
  settingsBtn.style.top = '20px';
  settingsBtn.style.right = '20px';
  settingsBtn.style.padding = '12px';
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

  // 사이드바 내용 스타일링 개선
  sidebar.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:16px;">
      <h3 style="color:#fff;margin:0;font-size:18px;font-weight:600;">캠프파이어 설정</h3>
      <button id="closeSettings" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;padding:0;">&times;</button>
    </div>
    
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div class="setting-group">
        <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">불꽃 강도</label>
        <input id="fireStrength" type="range" min="0.5" max="5.0" step="0.01" value="${fireStrength}" 
               style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
      </div>
      
      <div class="setting-group">
        <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">빛무리 크기</label>
        <input id="glowSize" type="range" min="0" max="1" step="0.01" value="${glowSize}" 
               style="width:100%;height:5px;-webkit-appearance:none;background:linear-gradient(to right, #ff6b00, #ffc107);border-radius:3px;outline:none;">
      </div>
      
      <div class="setting-group">
        <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">빛무리 밝기</label>
        <input id="glowAlpha" type="range" min="0" max="0.1" step="0.01" value="${glowAlpha}" 
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
            <input type="checkbox" id="soundToggle" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <label style="color:#fff;font-size:14px;font-weight:500;">연기 효과</label>
          <label class="toggle-switch">
            <input type="checkbox" id="smokeToggle" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <label style="color:#fff;font-size:14px;font-weight:500;">밤하늘</label>
          <label class="toggle-switch">
            <input type="checkbox" id="skyToggle" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <label style="color:#fff;font-size:14px;font-weight:500;">배경 이미지</label>
          <label class="toggle-switch">
            <input type="checkbox" id="bgToggle" checked>
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
      </div>
    </div>
    
    <div style="position:absolute;bottom:20px;left:20px;right:20px;text-align:center;color:rgba(255,255,255,0.5);font-size:12px;">
      <p>화면을 클릭하여 불을 켜보세요!</p>
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
      fireNormalSound.volume = soundVolume;
      fireNormalSound.play().catch(e => console.log('오디오 재생 실패:', e));
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
  });
  document.getElementById('glowSize').addEventListener('input', e => {
    glowSize = parseFloat(e.target.value);
  });
  document.getElementById('glowAlpha').addEventListener('input', e => {
    glowAlpha = parseFloat(e.target.value);
  });
  document.getElementById('soundVolume').addEventListener('input', e => {
    soundVolume = parseFloat(e.target.value);
    // 볼륨 업데이트
    if (!isMuted) {
      fireNormalSound.volume = soundVolume;
      fireIgnitionSound.volume = soundVolume;
    }
  });

  // 음소거/음소거 해제 버튼 기능 대신 토글 스위치 사용
  const soundToggle = document.getElementById('soundToggle');
  soundToggle.checked = !isMuted; // 초기 상태 설정 (음소거가 아닌 상태면 체크)
  soundToggle.addEventListener('change', () => {
    isMuted = !soundToggle.checked; // 토글이 켜져 있으면 소리 켜짐, 꺼져있으면 소리 꺼짐
    if (isMuted) {
      fireNormalSound.volume = 0;
      fireIgnitionSound.volume = 0;
    } else {
      fireNormalSound.volume = soundVolume;
      fireIgnitionSound.volume = soundVolume;
    }
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
  });

  // 밤하늘 온/오프 토글
  const skyToggle = document.getElementById('skyToggle');
  skyToggle.checked = isSkyEnabled;
  skyToggle.addEventListener('change', () => {
    isSkyEnabled = skyToggle.checked;
    bgCanvas.style.display = isSkyEnabled ? 'block' : 'none';
  });

  // 배경 이미지 온/오프 토글 기능
  const bgToggle = document.getElementById('bgToggle');
  bgToggle.checked = isBgEnabled;
  bgToggle.addEventListener('change', () => {
    isBgEnabled = bgToggle.checked;
    // 배경이미지가 꺼져있으면 빈 화면 유지
    // drawStars() 내에서 제어됨
  });

  // 모닥불 위치 슬라이더 이벤트
  const offsetXSlider = document.getElementById('offsetX');
  offsetXSlider.addEventListener('input', e => {
    campfireOffsetX = parseFloat(e.target.value);
    updateLayout();
  });
  const offsetYSlider = document.getElementById('offsetY');
  offsetYSlider.addEventListener('input', e => {
    campfireOffsetY = parseFloat(e.target.value);
    updateLayout();
  });

  // 파티클 클래스 정의
  class Particle {
    constructor() {
      // 타원 형태로 시작 위치 분포
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.sqrt(Math.random());
      const rx = 30 * SCALE;
      const ry = 10 * SCALE;
      this.x = fireCenterX + Math.cos(angle) * rx * radius;
      this.y = fireCenterY - 10 * SCALE + Math.sin(angle) * ry * radius;
      
      // 초기 속도를 매우 느리게 설정
      this.vx = (Math.random() - 0.5) * 0.1;
      
      // 목표 속도(terminal velocity)를 설정
      this.vTerminal = -(Math.random() * 2 + 1.8) * SCALE;
      
      // 초기 속도 설정
      this.vy = 0.5;
      
      // 시간 상수(Frame 수) 설정: 속도 회복 속도 제어
      this.tau = 30;
      
      // 수명 및 크기 설정
      this.life = Math.random() * 30 + 30;
      this.size = (Math.random() * 10 + 10) * (1 + clickEffect * 2) * SCALE;
      this.maxLife = this.life;
      
      // 난류 모델 파라미터 - 불꽃에 적합한 주파수와 진폭 설정 (진폭 감소)
      this.turbPhase1 = Math.random() * Math.PI * 2;
      this.turbPhase2 = Math.random() * Math.PI * 2;
      this.turbFreq1 = 0.04 + Math.random() * 0.03; // 더 낮은 주파수
      this.turbFreq2 = 0.02 + Math.random() * 0.02; // 더 낮은 주파수
      this.turbAmplitude = 0.05 + (Math.random() * 0.1) * SCALE; // 진폭 감소
      
      // 상승 패턴에 영향을 주는 파라미터
      this.flickerPhase = Math.random() * Math.PI * 2;
      this.flickerFreq = 0.08 + Math.random() * 0.1; // 더 낮은 주파수
      this.flickerAmplitude = 0.03 + Math.random() * 0.05; // 진폭 감소
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
      const grad = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.size
      );
      
      // 부드럽고 은은한 애니메이션 캠프파이어 색상
      grad.addColorStop(0, `rgba(255, 230, 120, ${lifeRatio * flickerValue * 0.6})`);
      grad.addColorStop(0.3, `rgba(255, 140,  50, ${lifeRatio * flickerValue * 0.5})`);
      grad.addColorStop(0.6, `rgba(200,  70,  20, ${lifeRatio * flickerValue * 0.3})`);
      grad.addColorStop(1, `rgba(0,    0,    0, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const particles = [];
  function spawnParticle() {
    // 불이 꺼져있으면 파티클 생성 안함
    if (!isFireLit) return;
    
    // 매 프레임마다 몇 개의 파티클 생성 (생성 속도 감소)
    // 클릭 효과에 따라 파티클 수 증가
    // 기본 파티클 수를 줄여 깜빡임 완화
    const count = Math.floor((Math.random() * 2) * (1 + clickEffect * 5) * fireStrength);
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
      
      // 투명도와 크기 (투명도 매우 낮게 설정)
      this.alpha = 0.03 + Math.random() * 0.03;
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
      
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      // 더 부드러운 그라디언트 생성을 위해 더 많은 색상 단계 사용
      const smokeGrad = ctx.createRadialGradient(
        0, 0, 0,
        0, 0, this.size
      );
      
      // 연기 색상 - 더 부드러운 그라디언트와 더 많은 색상 단계, 매우 옅은 알파값
      const alphaValue = this.alpha * lifeRatio;
      smokeGrad.addColorStop(0, `rgba(180, 180, 180, ${alphaValue * 0.7})`);
      smokeGrad.addColorStop(0.2, `rgba(170, 170, 170, ${alphaValue * 0.65})`);
      smokeGrad.addColorStop(0.4, `rgba(150, 150, 150, ${alphaValue * 0.5})`);
      smokeGrad.addColorStop(0.6, `rgba(130, 130, 130, ${alphaValue * 0.4})`);
      smokeGrad.addColorStop(0.8, `rgba(100, 100, 100, ${alphaValue * 0.2})`);
      smokeGrad.addColorStop(1, `rgba(80, 80, 80, 0)`);
      
      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  const smokeParticles = [];
  function spawnSmoke() {
    if (!isFireLit || !isSmokeEnabled) return;
    
    // 연기 생성 빈도 감소
    if (Math.random() < 0.05 * fireStrength) {
      smokeParticles.push(new SmokeParticle());
    }
  }

  function drawGlow() {
    const glowX = fireCenterX;
    const glowY = fireCenterY - 60 * SCALE;
    const maxGlow = Math.min(canvas.width, canvas.height) * 0.18 * SCALE * glowSize;
    const grad = ctx.createRadialGradient(
      glowX, glowY, 0,
      glowX, glowY, maxGlow
    );
    grad.addColorStop(0, `rgba(255, 230, 120, ${glowAlpha})`);
    grad.addColorStop(0.25, `rgba(255, 180, 60, ${glowAlpha * 0.55})`);
    grad.addColorStop(0.6, `rgba(255, 120, 30, ${glowAlpha * 0.22})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(glowX, glowY, maxGlow, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  // 스파크(불똥) 클래스 정의
  class Spark {
    constructor() {
      // 퍼짐 영역을 축소하여 너무 멀리 튀어나가지 않도록 설정
      const spread = 40 * SCALE;
      this.x = fireCenterX + (Math.random() - 0.5) * spread;
      this.y = fireCenterY;
      // 수평 속도 범위를 줄여 멀리 튀지 않도록 설정
      this.vx = (Math.random() - 0.5) * 4;
      // 초기 상승 속도를 줄여 비행 거리를 제한
      this.vy = -(Math.random() * 7 + 1) * SCALE;
      this.life = Math.random() * 20 + 20;
      // 크기를 줄여 좀 더 작은 스파크 표현
      this.size = Math.random() * 3 + 0.5;
      // 관성: 크기에 비례 (입자가 크면 난류·항력·소용돌이 영향 감소)
      this.inertia = this.size;
      // Ornstein–Uhlenbeck 난류 모델 파라미터 초기화
      this.ouTau = 20;   // 에디스 시간 상수 (프레임 단위)
      this.ouSigma = 0.2 * SCALE;   // 난류 강도를 줄여 궤적 범위 제한
      this.ouVx = 0;     // x 방향 난류 속도 편차
      this.ouVy = 0;     // y 방향 난류 속도 편차
      // 소용돌이 방향 랜덤 설정 (1 또는 -1)
      this.swirlDir = Math.random() < 0.5 ? 1 : -1;
      this.maxLife = this.life;
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
      ctx.fillStyle = `rgba(255,220,150,${alpha})`;
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
  }

  const sparks = [];
  function spawnSpark() {
    if (isFireLit && Math.random() < 0.02 * fireStrength) {
      sparks.push(new Spark());
      // 불똥 소리 제거 - 크래클링 사운드 구현을 제거함
    }
  }

  function animate(currentTime) {
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
    
    // 이전 프레임 클리어 (불멍만 초기화)
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    clickEffect *= 0.95 ** (deltaTime / FRAME_TIME);

    if (logsImg.complete) {
      ctx.drawImage(logsImg, logsX, logsY, logsWidth, logsHeight);
    }

    if (isFireLit) {
      drawGlow();
    }

    ctx.globalCompositeOperation = 'lighter';
    spawnParticle();
    spawnSpark();
    spawnSmoke();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(deltaTime);
      p.draw();
      if (p.life <= 0) particles.splice(i, 1);
    }

    // 스파크 업데이트 및 그리기
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.update(deltaTime);
      s.draw();
      if (s.life <= 0) sparks.splice(i, 1);
    }
    
    // 연기 파티클 렌더링 (source-over 블렌딩 모드로 변경)
    ctx.globalCompositeOperation = 'source-over';
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const sp = smokeParticles[i];
      sp.update(deltaTime);
      sp.draw();
      if (sp.life <= 0) smokeParticles.splice(i, 1);
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});