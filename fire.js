window.addEventListener('load', () => {
  // 캔버스 생성 및 초기 설정
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let fireCenterX, fireCenterY, logsX, logsY, logsWidth, logsHeight;
  const logsScale = 0.1;
  const SCALE = 1.3;

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
  canvas.addEventListener('click', () => {
    clickEffect = 1;
  });

  // 슬라이더 UI 추가
  const controls = document.createElement('div');
  controls.id = 'controls';
  controls.style.position = 'fixed';
  controls.style.top = '20px';
  controls.style.left = '50%';
  controls.style.transform = 'translateX(-50%)';
  controls.style.background = 'rgba(0,0,0,0.4)';
  controls.style.padding = '16px 24px';
  controls.style.borderRadius = '12px';
  controls.style.zIndex = '100';
  controls.style.color = '#fff';
  controls.style.display = 'flex';
  controls.style.flexDirection = 'row';
  controls.style.alignItems = 'center';
  controls.style.gap = '24px';
  controls.style.fontSize = '16px';
  controls.style.backdropFilter = 'blur(4px)';
  controls.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
  controls.style.maxWidth = '90vw';
  controls.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <label style="margin-bottom:4px;">불꽃 강도</label>
      <input id="fireStrength" type="range" min="0.5" max="2" step="0.01" value="1" style="width:120px;">
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;">
      <label style="margin-bottom:4px;">빛무리 크기</label>
      <input id="glowSize" type="range" min="0.5" max="2" step="0.01" value="1" style="width:120px;">
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;">
      <label style="margin-bottom:4px;">빛무리 밝기</label>
      <input id="glowAlpha" type="range" min="0.05" max="0.5" step="0.01" value="0.18" style="width:120px;">
    </div>
  `;
  document.body.appendChild(controls);

  let fireStrength = 1;
  let glowSize = 1;
  let glowAlpha = 0.18;

  document.getElementById('fireStrength').addEventListener('input', e => {
    fireStrength = parseFloat(e.target.value);
  });
  document.getElementById('glowSize').addEventListener('input', e => {
    glowSize = parseFloat(e.target.value);
  });
  document.getElementById('glowAlpha').addEventListener('input', e => {
    glowAlpha = parseFloat(e.target.value);
  });

  // 파티클 클래스 정의
  class Particle {
    constructor() {
      this.x = fireCenterX + (Math.random() - 0.5) * 50 * SCALE;
      this.y = fireCenterY;
      this.vx = (Math.random() - 0.5) * 1;
      this.vy = -Math.random() * 2 - 1;
      this.life = Math.random() * 30 + 30;
      // 클릭 효과 크기 반영
      this.size = (Math.random() * 10 + 10) * (1 + clickEffect * 2) * SCALE;
      this.maxLife = this.life;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      this.size += 0.1;
    }
    draw() {
      const lifeRatio = this.life / this.maxLife;
      // 그라데이션 생성
      const grad = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.size
      );
      grad.addColorStop(0, `rgba(255, 255, 200, ${lifeRatio})`);
      grad.addColorStop(0.3, `rgba(255, 150,   0, ${lifeRatio * 0.8})`);
      grad.addColorStop(0.6, `rgba(255,  80,   0, ${lifeRatio * 0.6})`);
      grad.addColorStop(1, `rgba(0,    0,    0, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const particles = [];
  function spawnParticle() {
    // 매 프레임마다 몇 개의 파티클 생성
    // 클릭 효과에 따라 파티클 수 증가
    const count = Math.floor((Math.random() * 2 + 1) * (1 + clickEffect * 5) * fireStrength);
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

  function animate() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    clickEffect *= 0.95;

    if (logsImg.complete) {
      ctx.drawImage(logsImg, logsX, logsY, logsWidth, logsHeight);
    }

    drawGlow();

    ctx.globalCompositeOperation = 'lighter';
    spawnParticle();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.life <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(animate);
  }

  animate();
});