// alarm.js
// 좌측 알람 버튼 및 사이드바 생성, 알람 설정 로직
(function() {
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
  const testBtn = document.getElementById('testAlarm');
  const addBtn = document.getElementById('addAlarm');
  const alarmList = document.getElementById('alarmList');
  const alarmAudioEl = document.getElementById('alarmAudio');
  let alarms = [];
  let testTimeout = null;

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
    alarmAudioEl.currentTime = 0; 
    alarmAudioEl.play();
    testTimeout = setTimeout(() => { 
      alarmAudioEl.pause(); 
      alarmAudioEl.currentTime = 0; 
    }, 1000);
  });

  addBtn.addEventListener('click', () => {
    const hour = +hourSelect.value, minute = +minuteSelect.value;
    const title = titleInput.value || '알람';
    const repeat = repeatCheckbox.checked;
    const now = new Date(), target = new Date(); 
    target.setHours(hour, minute, 0, 0);
    if (target <= now) target.setDate(target.getDate()+1);
    const diff = target.getTime() - now.getTime();
    
    // 고유 ID 생성
    const alarmId = Date.now().toString();
    
    const timeoutId = setTimeout(() => {
      alarmAudioEl.currentTime = 0; 
      alarmAudioEl.play(); 
      // 알람 소리를 재생하고 확인창 표시
      const isConfirmed = window.confirm(title);
      // 확인창을 누르면 알람 소리 종료
      alarmAudioEl.pause();
      alarmAudioEl.currentTime = 0;
      
      // 알람 목록에서 제거 (반복이 아닌 경우)
      if (!repeat) {
        removeAlarm(alarmId);
      } else {
        // 반복 알람 재설정
        const alarm = alarms.find(a => a.id === alarmId);
        if (alarm) {
          const newTarget = new Date();
          newTarget.setHours(hour, minute, 0, 0);
          newTarget.setDate(newTarget.getDate() + 1);
          const newDiff = newTarget.getTime() - new Date().getTime();
          
          alarm.timeoutId = setTimeout(() => {
            alarmAudioEl.currentTime = 0;
            alarmAudioEl.play();
            // 알람 소리를 재생하고 확인창 표시
            const isConfirmed = window.confirm(title);
            // 확인창을 누르면 알람 소리 종료
            alarmAudioEl.pause();
            alarmAudioEl.currentTime = 0;
          }, newDiff);
        }
      }
    }, diff);
    
    alarms.push({
      id: alarmId,
      hour, 
      minute, 
      title, 
      repeat, 
      timeoutId
    });
    
    renderAlarms();
    
    // 추가 후 입력 필드 초기화
    titleInput.value = '';
  });
  
  // 알람 삭제 함수
  function removeAlarm(id) {
    const index = alarms.findIndex(a => a.id === id);
    if (index !== -1) {
      // 타이머 취소
      clearTimeout(alarms[index].timeoutId);
      // 배열에서 제거
      alarms.splice(index, 1);
      renderAlarms();
    }
  }

  function renderAlarms() {
    alarmList.innerHTML = '';
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
      alarmInfo.innerHTML = `
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
})(); 