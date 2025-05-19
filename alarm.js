// alarm.js
// 좌측 알람 버튼 및 사이드바 생성, 알람 설정 로직
(function() {
  // 페이지 활성화/비활성화 상태 추적 변수
  let isPageVisible = !document.hidden;
  let pendingAlarmPopup = null;

  // 페이지 가시성 변화 이벤트 리스너 추가
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    
    // 페이지가 다시 활성화되었고 대기 중인 알람 팝업이 있으면 표시
    if (isPageVisible && pendingAlarmPopup) {
      document.body.appendChild(pendingAlarmPopup.containerDiv);
      // 이벤트 리스너 다시 바인딩
      setupAlarmPopupEvents(pendingAlarmPopup);
      pendingAlarmPopup = null;
    }
  });

  // 알람 버튼 생성
  const alarmBtn = document.createElement('button');
  alarmBtn.id = 'alarmBtn';
  alarmBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
  Object.assign(alarmBtn.style, {
    position: 'fixed', top: '20px', left: '20px',
    padding: '12px', borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
    border: 'none', cursor: 'pointer', zIndex: '100',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s ease, background-color 0.3s'
  });
  alarmBtn.addEventListener('mouseover', () => {
    alarmBtn.style.backgroundColor = 'rgba(50,50,50,0.8)';
    alarmBtn.style.transform = 'scale(1.1)';
  });
  alarmBtn.addEventListener('mouseout', () => {
    alarmBtn.style.backgroundColor = 'rgba(0,0,0,0.6)';
    alarmBtn.style.transform = 'scale(1)';
  });
  document.body.appendChild(alarmBtn);

  // 알람 사이드바 생성
  const sidebar = document.createElement('div');
  sidebar.id = 'alarmSidebar';
  Object.assign(sidebar.style, {
    position: 'fixed', top: '0', left: '-300px',
    width: '300px', height: '100%',
    background: 'rgba(20,20,20,0.9)', padding: '20px',
    boxShadow: '2px 0 15px rgba(0,0,0,0.5)',
    transition: 'left 0.3s ease', zIndex: '101',
    backdropFilter: 'blur(10px)', overflowY: 'auto',
    fontFamily: "'Arial', sans-serif", color: '#fff'
  });
  sidebar.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:16px;">
      <h3 style="margin:0;font-size:18px;font-weight:600;">알람 설정</h3>
      <button id="closeAlarmSidebar" style="background:none;border:none;color:#fff;cursor:pointer;font-size:24px;padding:0;">&times;</button>
    </div>
    <div id="alarmContent" style="display:flex;flex-direction:column;gap:18px;">
      <div class="setting-group">
        <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">시간</label>
        <div style="display:flex;align-items:center;gap:5px;">
          <select id="alarmHour" style="flex:1;padding:8px;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;"></select>
          <span style="font-size:18px;">:</span>
          <select id="alarmMinute" style="flex:1;padding:8px;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;"></select>
        </div>
      </div>
      
      <div class="setting-group">
        <label style="color:#fff;margin-bottom:8px;display:block;font-size:14px;font-weight:500;">제목</label>
        <input type="text" id="alarmTitle" placeholder="알람 제목" style="width:100%;padding:8px;background-color:rgba(60,60,60,0.8);color:#fff;border:none;border-radius:4px;">
      </div>
      
      <div class="setting-group" style="display:flex;justify-content:space-between;align-items:center;">
        <label style="color:#fff;font-size:14px;font-weight:500;">반복</label>
        <label class="toggle-switch">
          <input type="checkbox" id="alarmRepeat">
          <span class="toggle-slider"></span>
        </label>
      </div>
      
      <div class="setting-group" style="display:flex;justify-content:space-between;align-items:center;">
        <label style="color:#fff;font-size:14px;font-weight:500;">알림소리</label>
        <label class="toggle-switch">
          <input type="checkbox" id="alarmSound" checked>
          <span class="toggle-slider"></span>
        </label>
      </div>
      
      <div class="setting-group" style="display:flex;gap:10px;margin-top:10px;">
        <button id="testAlarm" style="flex:1;padding:10px;background-color:#555;color:#fff;border:none;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          테스트
        </button>
        <button id="addAlarm" style="flex:2;padding:10px;background:linear-gradient(to right, #ff6b00, #ff9800);color:#fff;border:none;border-radius:4px;cursor:pointer;">
          알람 추가
        </button>
      </div>
      
      <div class="setting-group" style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.2);padding-top:16px;">
        <label style="color:#fff;margin-bottom:12px;display:block;font-size:14px;font-weight:500;">알람 목록</label>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:12px;color:rgba(255,255,255,0.6);" id="alarmCount">0개 알람</span>
          <button id="resetAlarms" style="background:rgba(255,80,80,0.2);color:rgba(255,80,80,0.9);border:none;border-radius:3px;padding:5px 10px;cursor:pointer;font-size:12px;">초기화</button>
        </div>
        <ul id="alarmList" style="list-style:none;padding:0;margin:0;"></ul>
      </div>
      
      <audio id="alarmAudio" src="sounds/alarm.wav" preload="auto"></audio>
    </div>
  `;
  document.body.appendChild(sidebar);

  // CSS 스타일 추가
  const style = document.createElement('style');
  style.textContent = `
    #alarmSidebar select::-webkit-scrollbar {
      width: 8px;
      background-color: rgba(60,60,60,0.4);
    }
    #alarmSidebar select::-webkit-scrollbar-thumb {
      background-color: rgba(200,200,200,0.4);
      border-radius: 4px;
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
    #alarmList li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      margin-bottom: 8px;
      background-color: rgba(60,60,60,0.5);
      border-radius: 4px;
      font-size: 14px;
    }
    #alarmList li button {
      background: none;
      border: none;
      color: rgba(255,100,100,0.7);
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
      transition: all 0.2s;
    }
    #alarmList li button:hover {
      background-color: rgba(255,100,100,0.2);
      color: rgba(255,100,100,1);
    }
    #resetAlarms:hover {
      background-color: rgba(255,80,80,0.3) !important;
      color: rgba(255,100,100,1) !important;
    }
    @keyframes pulseScale {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    .alarm-status {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 5px;
    }
    .alarm-active {
      background-color: #4CAF50;
    }
    .alarm-muted {
      background-color: #9E9E9E;
    }
  `;
  document.head.appendChild(style);

  // 사이드바 토글 이벤트
  alarmBtn.addEventListener('click', () => {
    sidebar.style.left = sidebar.style.left === '0px' ? '-300px' : '0px';
  });
  document.getElementById('closeAlarmSidebar').addEventListener('click', () => {
    sidebar.style.left = '-300px';
  });

  // 알람 로직
  const hourSelect = document.getElementById('alarmHour');
  const minuteSelect = document.getElementById('alarmMinute');
  const titleInput = document.getElementById('alarmTitle');
  const repeatCheckbox = document.getElementById('alarmRepeat');
  const soundCheckbox = document.getElementById('alarmSound');
  const testBtn = document.getElementById('testAlarm');
  const addBtn = document.getElementById('addAlarm');
  const alarmList = document.getElementById('alarmList');
  const alarmAudioEl = document.getElementById('alarmAudio');
  const resetBtn = document.getElementById('resetAlarms');
  const alarmCountEl = document.getElementById('alarmCount');
  
  let alarms = [];
  let testTimeout = null;
  const STORAGE_KEY = 'bulmeong_alarms';

  // 알람 로컬 스토리지 저장 함수
  function saveAlarms() {
    // 타이머 ID는 저장하지 않음 (복원 시 새로 설정)
    const alarmsToSave = alarms.map(alarm => ({
      id: alarm.id,
      hour: alarm.hour,
      minute: alarm.minute,
      title: alarm.title,
      repeat: alarm.repeat,
      sound: alarm.sound
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarmsToSave));
    updateAlarmCount();
  }

  // 알람 로컬 스토리지에서 불러오기
  function loadAlarms() {
    const savedAlarms = localStorage.getItem(STORAGE_KEY);
    if (savedAlarms) {
      const parsedAlarms = JSON.parse(savedAlarms);
      // 저장된 알람들 복원하고 타이머 새로 설정
      alarms = parsedAlarms.map(alarm => {
        const now = new Date();
        const target = new Date();
        target.setHours(alarm.hour, alarm.minute, 0, 0);
        
        // sound 속성이 없는 오래된 알람 데이터 처리
        if (alarm.sound === undefined) {
          alarm.sound = true;
        }
        
        // 이미 지난 시간이면 다음 날로 설정
        if (target <= now) target.setDate(target.getDate() + 1);
        const diff = target.getTime() - now.getTime();
        
        // 타이머 설정
        const timeoutId = setTimeout(createAlarmCallback(alarm), diff);
        
        return {
          ...alarm,
          timeoutId
        };
      });
      renderAlarms();
    }
  }

  // 알람 팝업 이벤트 설정 함수 (이벤트 위임을 위해 별도 함수로 분리)
  function setupAlarmPopupEvents(popupData) {
    const { containerDiv, alarm } = popupData;
    
    // 페이지 전체에 이벤트 리스너 추가 (이벤트 위임 방식)
    const stopAlarmBtn = containerDiv.querySelector('#stopAlarm');
    if (stopAlarmBtn) {
      // 기존 리스너 제거 (중복 방지)
      stopAlarmBtn.removeEventListener('click', popupData.clickHandler);
      
      // 새 리스너 추가 및 참조 저장
      popupData.clickHandler = () => {
        if (alarm.sound) {
          alarmAudioEl.pause();
          alarmAudioEl.currentTime = 0;
          alarmAudioEl.loop = false;
        }
        
        try {
          document.body.removeChild(containerDiv);
        } catch (e) {
          console.log('알람 컨테이너가 이미 제거됨');
        }
        
        // 알람 목록에서 제거 (반복이 아닌 경우)
        if (!alarm.repeat) {
          removeAlarm(alarm.id);
        } else {
          // 반복 알람 재설정
          const existingAlarm = alarms.find(a => a.id === alarm.id);
          if (existingAlarm) {
            const newTarget = new Date();
            newTarget.setHours(alarm.hour, alarm.minute, 0, 0);
            newTarget.setDate(newTarget.getDate() + 1);
            const newDiff = newTarget.getTime() - new Date().getTime();
            
            existingAlarm.timeoutId = setTimeout(createAlarmCallback(alarm), newDiff);
            saveAlarms();
          }
        }
      };
      
      stopAlarmBtn.addEventListener('click', popupData.clickHandler);
      
      // 중요: 이벤트 위임 방식으로 버튼 클릭 대체 핸들러 추가
      // 경우에 따라 버튼 이벤트가 작동하지 않을 때를 대비
      containerDiv.addEventListener('click', (e) => {
        if (e.target === stopAlarmBtn || stopAlarmBtn.contains(e.target)) {
          popupData.clickHandler();
        }
      });
      
      // 키보드 이벤트도 추가 (Enter 또는 Space 키로 확인 가능)
      containerDiv.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          popupData.clickHandler();
        }
      });
    }
  }

  // 알람 콜백 생성 함수 (클로저로 알람 정보 유지)
  function createAlarmCallback(alarm) {
    return () => {
      // 오디오 컨텍스트 초기화 확인
      if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume();
      }
      
      // 알람 소리 재생 (소리 설정이 켜져 있을 때만)
      if (alarm.sound) {
        alarmAudioEl.currentTime = 0;
        alarmAudioEl.loop = false; // 반복 재생하지 않음
        
        // 소리가 끝나는 이벤트 핸들러 재설정
        alarmAudioEl.onended = () => {
          alarmAudioEl.pause();
          alarmAudioEl.currentTime = 0;
        };
        
        // 소리 재생 시도
        const playPromise = alarmAudioEl.play().catch(e => {
          console.log('오디오 재생 실패:', e);
          // 자동 재생 정책으로 실패했을 수 있음, 페이지가 활성화될 때 다시 시도
        });
      }
      
      // 알람 창을 표시하는 커스텀 함수 만들기
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
      
      const alarmPopup = document.createElement('div');
      alarmPopup.style.cssText = `
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
      
      const alarmTime = `${String(alarm.hour).padStart(2,'0')}:${String(alarm.minute).padStart(2,'0')}`;
      
      alarmPopup.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;">
          <div style="width:80px;height:80px;background:#ff6b00;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(255,107,0,0.4);animation:pulseScale 1.5s infinite;margin-bottom:5px;">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          
          <div style="display:flex;justify-content:center;align-items:center;margin:5px 0;">
            ${alarm.sound 
              ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`
              : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"></path></svg>`
            }
          </div>
          
          <div style="display:flex;justify-content:center;margin:8px 0;">
            <div style="width:10px;height:10px;background:#fff;border-radius:50%;margin:0 5px;opacity:0.8;"></div>
            <div style="width:10px;height:10px;background:#fff;border-radius:50%;margin:0 5px;opacity:0.8;"></div>
            <div style="width:10px;height:10px;background:#fff;border-radius:50%;margin:0 5px;opacity:0.8;"></div>
          </div>
          
          <h1 style="margin:0;color:#ff6b00;font-size:60px;font-weight:700;line-height:1;">${alarmTime}</h1>
          
          ${alarm.title ? `<p style="margin:5px 0 0 0;color:#fff;font-size:18px;font-weight:500;">${alarm.title}</p>` : ''}
          
          <button id="stopAlarm" style="width:100%;padding:14px;margin-top:20px;background:#ff6b00;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:16px;">확인</button>
        </div>
      `;
      
      containerDiv.appendChild(alarmPopup);
      
      // 팝업 데이터 객체 생성
      const popupData = {
        containerDiv,
        alarm,
        clickHandler: null // 이벤트 핸들러 참조를 저장할 속성
      };
      
      // 페이지가 보이는 상태면 바로 표시, 아니면 보류
      if (isPageVisible) {
        document.body.appendChild(containerDiv);
        setupAlarmPopupEvents(popupData);
      } else {
        // 페이지가 비활성화된 상태이면 알람 팝업을 보류
        pendingAlarmPopup = popupData;
        
        // 애니메이션 프레임 재개를 위한 플래그 설정
        if (window.fireAnimationPaused) {
          window.fireAnimationPaused = false;
          // 이 시점에서 애니메이션 프레임이 다시 시작될 수 있도록 알림
          if (typeof window.resumeFireAnimation === 'function') {
            window.resumeFireAnimation();
          }
        }
      }
    };
  }

  // 알람 개수 업데이트
  function updateAlarmCount() {
    alarmCountEl.textContent = `${alarms.length}개 알람`;
  }

  for (let i = 0; i < 24; i++) {
    const o = document.createElement('option'); 
    o.value = i; 
    o.textContent = String(i).padStart(2,'0'); 
    hourSelect.appendChild(o);
  }
  for (let i = 0; i < 60; i++) {
    const o = document.createElement('option'); 
    o.value = i; 
    o.textContent = String(i).padStart(2,'0'); 
    minuteSelect.appendChild(o);
  }

  testBtn.addEventListener('click', () => {
    if (testTimeout) clearTimeout(testTimeout);
    
    // 알림소리 설정이 켜져있는 경우에만 소리 재생
    if (soundCheckbox.checked) {
      alarmAudioEl.currentTime = 0; 
      alarmAudioEl.play();
      testTimeout = setTimeout(() => { 
        alarmAudioEl.pause(); 
        alarmAudioEl.currentTime = 0; 
      }, 1000);
    }
  });

  addBtn.addEventListener('click', () => {
    const hour = +hourSelect.value, minute = +minuteSelect.value;
    const title = titleInput.value || '알람';
    const repeat = repeatCheckbox.checked;
    const sound = soundCheckbox.checked;
    const now = new Date(), target = new Date(); 
    target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate()+1);
    const diff = target.getTime() - now.getTime();
    
    // 고유 ID 생성
    const alarmId = Date.now().toString();
    
    // 알람 객체 생성
    const newAlarm = {
      id: alarmId,
      hour, 
      minute, 
      title, 
      repeat,
      sound
    };
    
    // 타이머 설정 및 알람 추가
    newAlarm.timeoutId = setTimeout(createAlarmCallback(newAlarm), diff);
    alarms.push(newAlarm);
    
    // 로컬 스토리지 저장 및 화면 렌더링
    saveAlarms();
    renderAlarms();
    
    // 추가 후 입력 필드 초기화
    titleInput.value = '';
  });
  
  // 초기화 버튼 클릭 이벤트
  resetBtn.addEventListener('click', () => {
    if (confirm('모든 알람을 초기화하시겠습니까?')) {
      // 모든 타이머 취소
      alarms.forEach(alarm => {
        if (alarm.timeoutId) {
          clearTimeout(alarm.timeoutId);
        }
      });
      
      // 알람 목록 비우기
      alarms = [];
      localStorage.removeItem(STORAGE_KEY);
      renderAlarms();
      updateAlarmCount();
    }
  });
  
  // 알람 삭제 함수
  function removeAlarm(id) {
    const index = alarms.findIndex(a => a.id === id);
    if (index !== -1) {
      // 타이머 취소
      clearTimeout(alarms[index].timeoutId);
      // 배열에서 제거
      alarms.splice(index, 1);
      saveAlarms();
      renderAlarms();
    }
  }

  function renderAlarms() {
    alarmList.innerHTML = '';
    updateAlarmCount();
    
    if (alarms.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = '등록된 알람이 없습니다';
      emptyMsg.style.color = 'rgba(255,255,255,0.5)';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '10px 0';
      alarmList.appendChild(emptyMsg);
      return;
    }
    
    alarms.forEach(alarm => {
      const li = document.createElement('li');
      
      const alarmInfo = document.createElement('div');
      
      // 알람 소리 상태에 따른 표시
      const soundStatus = alarm.sound ? 
        '<span class="alarm-status alarm-active" title="알림소리 켜짐"></span>' : 
        '<span class="alarm-status alarm-muted" title="알림소리 꺼짐"></span>';
        
      alarmInfo.innerHTML = `
        ${soundStatus}
        <strong>${String(alarm.hour).padStart(2,'0')}:${String(alarm.minute).padStart(2,'0')}</strong> 
        ${alarm.repeat ? '<span style="color:#ff9800;font-size:12px;margin-left:5px;">반복</span>' : ''}
        <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:2px;">${alarm.title}</div>
      `;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
      deleteBtn.title = '알람 삭제';
      deleteBtn.addEventListener('click', () => removeAlarm(alarm.id));
      
      li.appendChild(alarmInfo);
      li.appendChild(deleteBtn);
      alarmList.appendChild(li);
    });
  }
  
  // 페이지 로드 시 저장된 알람 불러오기
  loadAlarms();
})(); 