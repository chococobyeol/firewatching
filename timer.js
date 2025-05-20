// timer.js - 스톱워치와 타이머 기능
(function() {
  // 상태 변수
  let isTimerTabActive = false;
  let isStopwatchRunning = false;
  let isTimerRunning = false;
  let stopwatchInterval = null;
  let timerInterval = null;
  let stopwatchStartTime = 0;
  let stopwatchElapsedTime = 0;
  let timerEndTime = 0;
  let timerDuration = 0;
  
  // 페이지 로드 시 DOM 요소가 모두 로드된 후 초기화 (중요)
  window.addEventListener('DOMContentLoaded', function() {
    initTimerUI();
  });
  
  // 타이머 UI 초기화 함수
  function initTimerUI() {
    // 사이드바에 타이머 버튼 추가
    const timerBtn = document.createElement('button');
    timerBtn.id = 'timerBtn';
    timerBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4V2z"></path></svg>';
    Object.assign(timerBtn.style, {
      position: 'fixed', 
      top: '80px', 
      left: '20px',
      width: '44px',
      height: '44px',
      padding: '0', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: 'rgba(0,0,0,0.6)', 
      color: '#fff',
      border: 'none', 
      cursor: 'pointer', 
      zIndex: '100',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      transition: 'transform 0.3s ease, background-color 0.3s'
    });
    
    timerBtn.addEventListener('mouseover', () => {
      timerBtn.style.backgroundColor = 'rgba(50,50,50,0.8)';
      timerBtn.style.transform = 'scale(1.1)';
    });
    
    timerBtn.addEventListener('mouseout', () => {
      timerBtn.style.backgroundColor = 'rgba(0,0,0,0.6)';
      timerBtn.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(timerBtn);
  
    // 타이머/스톱워치 사이드바 생성
    const timerSidebar = document.createElement('div');
    timerSidebar.id = 'timerSidebar';
    Object.assign(timerSidebar.style, {
      position: 'fixed', 
      top: '0', 
      left: '-300px', // 초기 위치 명시적 설정 
      width: '300px', 
      height: '100%',
      background: 'rgba(20,20,20,0.9)', 
      padding: '20px',
      boxShadow: '2px 0 15px rgba(0,0,0,0.5)',
      transition: 'left 0.3s ease', 
      zIndex: '101',
      backdropFilter: 'blur(10px)', 
      overflowY: 'auto',
      fontFamily: "'Arial', sans-serif", 
      color: '#fff'
    });
    
    timerSidebar.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:16px;">
        <h3 style="margin:0;font-size:18px;font-weight:600;">타이머 / 스톱워치</h3>
        <button id="closeTimerSidebar" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;padding:0;">&times;</button>
      </div>
      
      <div class="timer-content" style="display:flex;flex-direction:column;gap:18px;">
        <!-- 탭 네비게이션 -->
        <div class="tab-navigation" style="display:flex;border-radius:4px;overflow:hidden;margin-bottom:10px;">
          <button id="stopwatchTab" class="tab-button active" style="flex:1;padding:10px;background-color:#444;color:#fff;border:none;cursor:pointer;transition:background-color 0.3s;">
            <div style="display:flex;align-items:center;justify-content:center;gap:5px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="6" x2="12" y2="12"></line>
                <line x1="12" y1="12" x2="16" y2="14"></line>
                <circle cx="12" cy="2" r="1.5"></circle>
              </svg>
              스톱워치
            </div>
          </button>
          <button id="timerTab" class="tab-button" style="flex:1;padding:10px;background-color:#222;color:#ccc;border:none;cursor:pointer;transition:background-color 0.3s;">
            <div style="display:flex;align-items:center;justify-content:center;gap:5px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4V2z"></path>
              </svg>
              타이머
            </div>
          </button>
        </div>
        
        <!-- 스톱워치 컨텐츠 -->
        <div id="stopwatchContent" class="tab-content" style="display:block;">
          <div class="time-display" style="text-align:center;margin:20px 0;font-size:42px;font-family:'Courier New',monospace;font-weight:300;">
            <span id="stopwatchDisplay">00:00.00</span>
          </div>
          
          <div class="controls" style="display:flex;gap:10px;margin-top:20px;">
            <button id="stopwatchStartStop" style="flex:1;padding:12px;background:linear-gradient(to right, #FF7043, #E64A19);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;">
              시작
            </button>
            <button id="stopwatchReset" style="flex:1;padding:12px;background-color:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;">
              리셋
            </button>
          </div>
          
          <div id="lapContainer" style="margin-top:20px;max-height:200px;overflow-y:auto;">
            <ul id="lapTimes" style="list-style:none;padding:0;margin:0;"></ul>
          </div>
        </div>
        
        <!-- 타이머 컨텐츠 -->
        <div id="timerTabContent" class="tab-content" style="display:none;">
          <div class="timer-setup" style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:5px;justify-content:center;margin-bottom:15px;">
              <input id="timerHours" type="number" min="0" max="23" value="0" style="width:60px;padding:10px;text-align:center;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;font-size:18px;">
              <span style="font-size:24px;">:</span>
              <input id="timerMinutes" type="number" min="0" max="59" value="0" style="width:60px;padding:10px;text-align:center;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;font-size:18px;">
              <span style="font-size:24px;">:</span>
              <input id="timerSeconds" type="number" min="0" max="59" value="0" style="width:60px;padding:10px;text-align:center;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;font-size:18px;">
            </div>
            
            <div class="preset-buttons" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px;">
              <button class="timer-preset" data-minutes="1" style="flex:1;min-width:70px;padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">1분</button>
              <button class="timer-preset" data-minutes="3" style="flex:1;min-width:70px;padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">3분</button>
              <button class="timer-preset" data-minutes="5" style="flex:1;min-width:70px;padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">5분</button>
              <button class="timer-preset" data-minutes="10" style="flex:1;min-width:70px;padding:8px;background-color:#333;color:#fff;border:none;border-radius:4px;cursor:pointer;">10분</button>
            </div>
          </div>
          
          <div class="time-display" style="text-align:center;margin:20px 0;font-size:42px;font-family:'Courier New',monospace;font-weight:300;">
            <span id="timerDisplay">00:00:00</span>
          </div>
          
          <div class="controls" style="display:flex;gap:10px;margin-top:20px;">
            <button id="timerStartStop" style="flex:1;padding:12px;background:linear-gradient(to right, #BF360C, #8D2700);color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;">
              시작
            </button>
            <button id="timerReset" style="flex:1;padding:12px;background-color:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px;">
              리셋
            </button>
          </div>
        </div>
      </div>
      
      <audio id="timerAudio" src="sounds/alarm.wav" preload="auto"></audio>
    `;
    
    document.body.appendChild(timerSidebar);
    
    // CSS 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .tab-button.active {
        background-color: #444 !important;
        color: #fff !important;
        font-weight: 500;
      }
      
      #lapTimes li {
        display: flex;
        justify-content: space-between;
        padding: 8px 10px;
        margin-bottom: 8px;
        background-color: rgba(60,60,60,0.5);
        border-radius: 4px;
        font-size: 14px;
      }
      
      input[type=number]::-webkit-inner-spin-button, 
      input[type=number]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
      }
      
      .timer-preset:hover {
        background-color: #444 !important;
      }
      
      #timerSidebar::-webkit-scrollbar {
        width: 8px;
        background-color: rgba(60,60,60,0.4);
      }
      
      #timerSidebar::-webkit-scrollbar-thumb {
        background-color: rgba(200,200,200,0.4);
        border-radius: 4px;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes pulseScale {
        0% { transform: translate(-50%, -50%) scale(1); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      
      .time-ending {
        color: #ff5252;
        animation: pulse 1s infinite;
      }
      
      .mini-timer {
        position: fixed;
        left: 80px;
        top: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-family: 'Courier New', monospace;
        font-size: 18px;
        z-index: 100;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        user-select: none;
        display: none;
      }
    `;
    
    document.head.appendChild(style);
    
    // 미니 타이머 생성 (초기에는 화면에 표시되지 않음)
    const miniTimer = document.createElement('div');
    miniTimer.className = 'mini-timer';
    miniTimer.id = 'miniTimer';
    miniTimer.textContent = '00:00:00';
    miniTimer.addEventListener('click', toggleTimerSidebar);
    document.body.appendChild(miniTimer);
  
    // 이벤트 리스너 설정
    setupEventListeners();
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 타이머 사이드바 열기/닫기
    const timerBtn = document.getElementById('timerBtn');
    if (timerBtn) {
      timerBtn.addEventListener('click', toggleTimerSidebar);
    }
    
    const closeBtn = document.getElementById('closeTimerSidebar');
    if (closeBtn) {
      closeBtn.addEventListener('click', toggleTimerSidebar);
    }
    
    // 탭 전환
    const stopwatchTab = document.getElementById('stopwatchTab');
    const timerTab = document.getElementById('timerTab');
    
    if (stopwatchTab) {
      stopwatchTab.addEventListener('click', () => switchTab('stopwatch'));
    }
    
    if (timerTab) {
      timerTab.addEventListener('click', () => switchTab('timer'));
    }
    
    // 스톱워치 컨트롤
    const stopwatchStartStop = document.getElementById('stopwatchStartStop');
    const stopwatchReset = document.getElementById('stopwatchReset');
    
    if (stopwatchStartStop) {
      stopwatchStartStop.addEventListener('click', toggleStopwatch);
    }
    
    if (stopwatchReset) {
      stopwatchReset.addEventListener('click', resetStopwatch);
    }
    
    // 타이머 컨트롤
    const timerStartStop = document.getElementById('timerStartStop');
    const timerReset = document.getElementById('timerReset');
    
    if (timerStartStop) {
      timerStartStop.addEventListener('click', toggleTimer);
    }
    
    if (timerReset) {
      timerReset.addEventListener('click', resetTimer);
    }
    
    // 타이머 프리셋 버튼들
    document.querySelectorAll('.timer-preset').forEach(button => {
      button.addEventListener('click', function() {
        const minutes = parseInt(this.getAttribute('data-minutes'));
        const hoursInput = document.getElementById('timerHours');
        const minutesInput = document.getElementById('timerMinutes');
        const secondsInput = document.getElementById('timerSeconds');
        
        if (hoursInput) hoursInput.value = 0;
        if (minutesInput) minutesInput.value = minutes;
        if (secondsInput) secondsInput.value = 0;
        
        updateTimerDisplay();
      });
    });
  }

  // 타이머 사이드바 토글
  function toggleTimerSidebar() {
    const timerSidebar = document.getElementById('timerSidebar');
    const alarmSidebar = document.getElementById('alarmSidebar');
    
    if (!timerSidebar) return;
    
    // 알람 사이드바가 열려있으면 닫기
    if (alarmSidebar && alarmSidebar.style.left === '0px') {
      alarmSidebar.style.left = '-300px';
    }
    
    // 명시적인 비교로 변경 (초기값을 계산해 비교)
    const sidebarLeft = timerSidebar.style.left;
    if (sidebarLeft === '0px') {
      timerSidebar.style.left = '-300px';
      isTimerTabActive = false;
    } else {
      timerSidebar.style.left = '0px';
      isTimerTabActive = true;
    }
  }

  // 탭 전환
  function switchTab(tab) {
    const stopwatchTab = document.getElementById('stopwatchTab');
    const timerTab = document.getElementById('timerTab');
    const stopwatchContent = document.getElementById('stopwatchContent');
    const timerTabContent = document.getElementById('timerTabContent');
    
    if (!stopwatchTab || !timerTab || !stopwatchContent || !timerTabContent) return;
    
    if (tab === 'stopwatch') {
      stopwatchTab.classList.add('active');
      timerTab.classList.remove('active');
      stopwatchContent.style.display = 'block';
      timerTabContent.style.display = 'none';
      stopwatchTab.style.backgroundColor = '#444';
      stopwatchTab.style.color = '#fff';
      timerTab.style.backgroundColor = '#222';
      timerTab.style.color = '#ccc';
    } else {
      stopwatchTab.classList.remove('active');
      timerTab.classList.add('active');
      stopwatchContent.style.display = 'none';
      timerTabContent.style.display = 'block';
      timerTab.style.backgroundColor = '#444';
      timerTab.style.color = '#fff';
      stopwatchTab.style.backgroundColor = '#222';
      stopwatchTab.style.color = '#ccc';
    }
  }

  // 스톱워치 기능
  function toggleStopwatch() {
    const button = document.getElementById('stopwatchStartStop');
    const resetButton = document.getElementById('stopwatchReset');
    
    if (!button || !resetButton) return;
    
    if (isStopwatchRunning) {
      // 중지
      clearInterval(stopwatchInterval);
      button.textContent = '재개';
      button.style.background = 'linear-gradient(to right, #F57F17, #D84315)';
      resetButton.textContent = '리셋';
      isStopwatchRunning = false;
    } else {
      // 시작 또는 재개
      if (stopwatchElapsedTime === 0) {
        stopwatchStartTime = Date.now();
      } else {
        stopwatchStartTime = Date.now() - stopwatchElapsedTime;
      }
      
      stopwatchInterval = setInterval(updateStopwatch, 10);
      button.textContent = '중지';
      button.style.background = 'linear-gradient(to right, #B71C1C, #7F0000)';
      resetButton.textContent = '랩';
      isStopwatchRunning = true;
    }
  }

  // 리셋 또는 랩 기능
  function resetStopwatch() {
    const button = document.getElementById('stopwatchReset');
    
    if (!button) return;
    
    if (isStopwatchRunning) {
      // 랩 기록 (스톱워치 실행 중일 때)
      const lapsList = document.getElementById('lapTimes');
      if (lapsList) {
        const lapItem = document.createElement('li');
        const currentTime = formatStopwatchTime(stopwatchElapsedTime);
        const lapNumber = lapsList.children.length + 1;
        lapItem.innerHTML = `<span>랩 ${lapNumber}</span><span>${currentTime}</span>`;
        lapsList.prepend(lapItem);
      }
    } else {
      // 리셋 (스톱워치 정지 상태일 때)
      clearInterval(stopwatchInterval);
      stopwatchElapsedTime = 0;
      
      const display = document.getElementById('stopwatchDisplay');
      const startButton = document.getElementById('stopwatchStartStop');
      const lapTimes = document.getElementById('lapTimes');
      
      if (display) display.textContent = '00:00.00';
      
      if (startButton) {
        startButton.textContent = '시작';
        startButton.style.background = 'linear-gradient(to right, #FF7043, #E64A19)';
      }
      
      if (button) {
        button.textContent = '리셋';
      }
      
      if (lapTimes) lapTimes.innerHTML = '';
      
      isStopwatchRunning = false;
    }
  }

  function updateStopwatch() {
    const display = document.getElementById('stopwatchDisplay');
    if (!display) {
      clearInterval(stopwatchInterval);
      return;
    }
    
    const now = Date.now();
    stopwatchElapsedTime = now - stopwatchStartTime;
    display.textContent = formatStopwatchTime(stopwatchElapsedTime);
  }

  function formatStopwatchTime(timeMs) {
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    const milliseconds = Math.floor((timeMs % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }

  // 타이머 기능
  function toggleTimer() {
    const button = document.getElementById('timerStartStop');
    const display = document.getElementById('timerDisplay');
    const miniTimer = document.getElementById('miniTimer');
    
    if (!button || !display || !miniTimer) return;
    
    if (isTimerRunning) {
      // 중지
      clearInterval(timerInterval);
      button.textContent = '재개';
      button.style.background = 'linear-gradient(to right, #F57F17, #D84315)';
      isTimerRunning = false;
    } else {
      // 시작
      if (timerEndTime === 0) {
        // 새 타이머 설정
        const hoursInput = document.getElementById('timerHours');
        const minutesInput = document.getElementById('timerMinutes');
        const secondsInput = document.getElementById('timerSeconds');
        
        const hours = parseInt(hoursInput?.value) || 0;
        const minutes = parseInt(minutesInput?.value) || 0;
        const seconds = parseInt(secondsInput?.value) || 0;
        
        timerDuration = (hours * 3600 + minutes * 60 + seconds) * 1000;
        
        if (timerDuration <= 0) {
          alert('시간을 설정해주세요.');
          return;
        }
        
        // 타이머 설정 시간 저장 (타이머 완료 메시지용)
        window.lastTimerSettings = {
          hours: hours,
          minutes: minutes,
          seconds: seconds
        };
        
        timerEndTime = Date.now() + timerDuration;
      } else {
        // 일시정지된 타이머 재개
        const remainingTime = timerEndTime - Date.now();
        timerEndTime = Date.now() + remainingTime;
      }
      
      timerInterval = setInterval(updateTimer, 500);
      button.textContent = '일시정지';
      button.style.background = 'linear-gradient(to right, #BF360C, #8D2700)';
      isTimerRunning = true;
      
      // 미니 타이머 표시
      miniTimer.style.display = 'block';
    }
  }

  function updateTimer() {
    const display = document.getElementById('timerDisplay');
    const miniTimer = document.getElementById('miniTimer');
    const timerStartStop = document.getElementById('timerStartStop');
    
    if (!display || !miniTimer || !timerStartStop) {
      clearInterval(timerInterval);
      return;
    }
    
    const now = Date.now();
    const remainingTime = timerEndTime - now;
    
    if (remainingTime <= 0) {
      // 타이머 완료
      clearInterval(timerInterval);
      display.textContent = '00:00:00';
      timerStartStop.textContent = '시작';
      timerStartStop.style.background = 'linear-gradient(to right, #BF360C, #8D2700)';
      miniTimer.style.display = 'none';
      isTimerRunning = false;
      timerEndTime = 0;
      
      // 알람 소리 재생
      const timerAudio = document.getElementById('timerAudio');
      if (timerAudio) {
        timerAudio.play().catch(err => console.error('타이머 알림 소리 재생 실패:', err));
      }
      
      // 타이머 완료 알림
      showTimerCompleteNotification();
      
      return;
    }
    
    const formattedTime = formatTimerTime(remainingTime);
    
    display.textContent = formattedTime;
    miniTimer.textContent = formattedTime;
    
    // 1분 미만일 때 색상 변경 및 애니메이션
    if (remainingTime < 60000) {
      display.classList.add('time-ending');
      miniTimer.classList.add('time-ending');
    } else {
      display.classList.remove('time-ending');
      miniTimer.classList.remove('time-ending');
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerEndTime = 0;
    
    const display = document.getElementById('timerDisplay');
    const button = document.getElementById('timerStartStop');
    const miniTimer = document.getElementById('miniTimer');
    
    if (display) {
      display.textContent = '00:00:00';
      display.classList.remove('time-ending');
    }
    
    if (button) {
      button.textContent = '시작';
      button.style.background = 'linear-gradient(to right, #BF360C, #8D2700)';
    }
    
    if (miniTimer) {
      miniTimer.style.display = 'none';
      miniTimer.classList.remove('time-ending');
    }
    
    isTimerRunning = false;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const hoursInput = document.getElementById('timerHours');
    const minutesInput = document.getElementById('timerMinutes');
    const secondsInput = document.getElementById('timerSeconds');
    const display = document.getElementById('timerDisplay');
    
    if (!display) return;
    
    const hours = parseInt(hoursInput?.value) || 0;
    const minutes = parseInt(minutesInput?.value) || 0;
    const seconds = parseInt(secondsInput?.value) || 0;
    
    display.textContent = 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function formatTimerTime(timeMs) {
    const hours = Math.floor(timeMs / 3600000);
    const minutes = Math.floor((timeMs % 3600000) / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function showTimerCompleteNotification() {
    // 타이머 완료 알람 팝업 (알람 스타일과 일관성 있게)
    const containerDiv = document.createElement('div');
    containerDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(5px);
    `;
    
    const popupDiv = document.createElement('div');
    popupDiv.style.cssText = `
      background: linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%);
      border-radius: 16px;
      padding: 30px;
      text-align: center;
      max-width: 400px;
      width: 80%;
      box-shadow: 0 20px 25px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
      border: 1px solid rgba(255,255,255,0.1);
      animation: fadeIn 0.3s ease-out forwards;
    `;
    
    // 타이머 아이콘 색상
    const iconColor = '#BF360C';
    
    // 설정한 시간 정보 가져오기
    let timerDescription = '설정한 시간이 끝났습니다.';
    if (window.lastTimerSettings) {
      const { hours, minutes, seconds } = window.lastTimerSettings;
      let timeText = [];
      
      if (hours > 0) {
        timeText.push(`${hours}시간`);
      }
      
      if (minutes > 0) {
        timeText.push(`${minutes}분`);
      }
      
      if (seconds > 0 || (hours === 0 && minutes === 0)) {
        timeText.push(`${seconds}초`);
      }
      
      timerDescription = `${timeText.join(' ')} 타이머가 완료되었습니다.`;
    }
    
    popupDiv.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;">
        <div style="width:80px;height:80px;background:${iconColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(191, 54, 12, 0.4);animation:pulse 1.5s infinite;margin-bottom:5px;">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        
        <div style="display:flex;justify-content:center;align-items:center;margin:5px 0;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        </div>
        
        <h1 style="margin:0;color:${iconColor};font-size:36px;font-weight:700;line-height:1.2;">타이머 완료!</h1>
        <p style="margin:5px 0 0 0;color:#fff;font-size:18px;font-weight:500;">${timerDescription}</p>
        
        <button id="closeTimerAlert" style="width:100%;padding:14px;margin-top:20px;background:${iconColor};color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:16px;">확인</button>
      </div>
    `;
    
    containerDiv.appendChild(popupDiv);
    document.body.appendChild(containerDiv);
    
    // 확인 버튼 클릭 이벤트
    const closeButton = document.getElementById('closeTimerAlert');
    if (closeButton) {
      const clickHandler = () => {
        // 알람 소리 중지
        const timerAudio = document.getElementById('timerAudio');
        if (timerAudio) {
          timerAudio.pause();
          timerAudio.currentTime = 0;
        }
        
        // 팝업 제거
        try {
          document.body.removeChild(containerDiv);
        } catch (e) {
          console.log('타이머 알림 이미 제거됨');
        }
      };
      
      closeButton.addEventListener('click', clickHandler);
      
      // 키보드 이벤트 추가 (Enter 또는 Space 키로 확인 가능)
      containerDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          clickHandler();
        }
      });
    }
  }
})(); 