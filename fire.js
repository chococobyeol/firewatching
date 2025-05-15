window.addEventListener('load', () => {
  // 캔버스 생성 및 초기 설정
  const canvas = document.createElement('canvas');
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

  let fireCenterX, fireCenterY, logsX, logsY, logsWidth, logsHeight;
  const logsScale = 0.1;
  const SCALE = 1.3;

  // 오디오 컨텍스트 초기화 (사용자 상호작용 발생 시)
  function initAudio() {
    if (audioContext) return Promise.resolve(); // 이미 초기화됨
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return Promise.resolve();
  }
  
  function updateLayout() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 변환 초기화
    ctx.scale(dpr, dpr);

    logsWidth = 150 * SCALE;
    logsHeight = 150 * SCALE;
    fireCenterX = window.innerWidth / 2;
    fireCenterY = window.innerHeight / 2;
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
  settingsBtn.textContent = '⚙️ 설정';
  settingsBtn.style.position = 'fixed';
  settingsBtn.style.top = '20px';
  settingsBtn.style.right = '20px';
  settingsBtn.style.padding = '8px 12px';
  settingsBtn.style.zIndex = '100';
  document.body.appendChild(settingsBtn);

  const sidebar = document.createElement('div');
  sidebar.id = 'settingsSidebar';
  sidebar.style.position = 'fixed';
  sidebar.style.top = '0';
  sidebar.style.right = '-280px';
  sidebar.style.width = '280px';
  sidebar.style.height = '100%';
  sidebar.style.background = 'rgba(0,0,0,0.8)';
  sidebar.style.padding = '20px';
  sidebar.style.boxShadow = '-2px 0 8px rgba(0,0,0,0.5)';
  sidebar.style.transition = 'right 0.3s ease';
  sidebar.innerHTML = `
    <h3 style="color:#fff; margin-bottom:16px;">설정</h3>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <label style="color:#fff;">불꽃 강도
        <input id="fireStrength" type="range" min="0.5" max="5.0" step="0.01" value="${fireStrength}" style="width:100%;">
      </label>
      <label style="color:#fff;">빛무리 크기
        <input id="glowSize" type="range" min="0" max="1" step="0.01" value="${glowSize}" style="width:100%;">
      </label>
      <label style="color:#fff;">빛무리 밝기
        <input id="glowAlpha" type="range" min="0" max="0.1" step="0.01" value="${glowAlpha}" style="width:100%;">
      </label>
      <label style="color:#fff;">소리 볼륨
        <input id="soundVolume" type="range" min="0" max="1" step="0.01" value="${soundVolume}" style="width:100%;">
      </label>
      <button id="muteBtn" style="margin-top:8px;padding:8px 12px;">🔇 음소거</button>
    </div>
  `;
  document.body.appendChild(sidebar);

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
      sidebar.style.right = '-280px';
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

  // 음소거/음소거 해제 버튼 기능
  const muteBtn = document.getElementById('muteBtn');
  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
      fireNormalSound.volume = 0;
      fireIgnitionSound.volume = 0;
      muteBtn.textContent = '🔊 음소거 해제';
    } else {
      fireNormalSound.volume = soundVolume;
      fireIgnitionSound.volume = soundVolume;
      muteBtn.textContent = '🔇 음소거';
    }
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
      // 초기 속도를 매우 느리게 설정 (더 느리게)
      this.vx = (Math.random() - 0.5) * 0.1;
      // 지수적 상승 모델 적용
      // 목표 속도(terminal velocity)를 설정
      this.vTerminal = -(Math.random() * 2 + 1.8) * SCALE;
      // 초기 속도 0으로 시작
      this.vy = 0.5;
      // 시간 상수(Frame 수) 설정: 속도 회복 속도 제어
      this.tau = 30;
      this.life = Math.random() * 30 + 30;
      // 클릭 효과 크기 반영
      this.size = (Math.random() * 10 + 10) * (1 + clickEffect * 2) * SCALE;
      this.maxLife = this.life;
    }
    update() {
      // 지수 모델: vy를 vTerminal로 지수 수렴
      this.vy += (this.vTerminal - this.vy) / this.tau;
      // 난류 효과: 생명비율 감소에 따라 난류 강도 증가
      const lifeRatio = this.life / this.maxLife;
      const turbulence = 0.3 * SCALE * (1 - lifeRatio);
      this.vx += (Math.random() - 0.5) * turbulence;
      this.vy += (Math.random() - 0.5) * turbulence * 0.5;
      // 위치 업데이트
      this.x += this.vx;
      this.y += this.vy;
      // 수명 및 크기 변화
      this.life--;
      this.size += 0.1;
    }
    draw() {
      // 생명비율 계산 및 플리커 효과 추가
      const lifeRatio = this.life / this.maxLife;
      const flick = 0.7 + Math.random() * 0.3;
      // 그라데이션 생성
      const grad = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.size
      );
      // 부드럽고 은은한 애니메이션 캠프파이어 색상
      grad.addColorStop(0, `rgba(255, 230, 120, ${lifeRatio * flick * 0.6})`);
      grad.addColorStop(0.3, `rgba(255, 140,  50, ${lifeRatio * flick * 0.5})`);
      grad.addColorStop(0.6, `rgba(200,  70,  20, ${lifeRatio * flick * 0.3})`);
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
    update() {
      // Ornstein–Uhlenbeck 난류 모델 적용 (관성 반영)
      const dt = 1;
      const sigmaScaled = this.ouSigma / this.inertia;
      const randVx = (Math.random() - 0.5) * 1;
      const randVy = (Math.random() - 0.5) * 1;
      this.ouVx += -(this.ouVx / this.ouTau) * dt + sigmaScaled * randVx * Math.sqrt(dt);
      this.ouVy += -(this.ouVy / this.ouTau) * dt + sigmaScaled * randVy * Math.sqrt(dt);
      this.vx += this.ouVx;
      this.vy += this.ouVy;

      // 공기 저항 및 난류, 중력 적용 (관성 반영)
      const drag = 0.02 / this.inertia;
      const turbulence = ((Math.random() - 0.5) * 0.2) / this.inertia;
      this.vx = this.vx * (1 - drag) + turbulence;
      this.vy += 0.1 * SCALE;
      this.vy *= (1 - drag);

      // 소용돌이 효과 (관성 반영)
      const swirlStrength = (0.01 * SCALE) / this.inertia;
      const vxOld = this.vx;
      const vyOld = this.vy;
      this.vx += -vyOld * swirlStrength * this.swirlDir;
      this.vy += vxOld * swirlStrength * this.swirlDir;

      // 위치 업데이트 및 생명 감소
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
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

  function animate() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    clickEffect *= 0.95;

    if (logsImg.complete) {
      ctx.drawImage(logsImg, logsX, logsY, logsWidth, logsHeight);
    }

    if (isFireLit) {
      drawGlow();
    }

    ctx.globalCompositeOperation = 'lighter';
    spawnParticle();
    spawnSpark();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.life <= 0) particles.splice(i, 1);
    }

    // 스파크 업데이트 및 그리기
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.update();
      s.draw();
      if (s.life <= 0) sparks.splice(i, 1);
    }

    requestAnimationFrame(animate);
  }

  animate();
});