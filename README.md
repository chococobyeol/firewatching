# 불멍

간단한 HTML5 Canvas와 순수 자바스크립트를 이용한 모닥불 애니메이션 MVP입니다.

## 실행 방법

1. 이 디렉토리에서 `index.html` 파일을 더블 클릭하거나 브라우저로 열면 바로 실행됩니다.

## 프로젝트 구조

- `index.html`: 캔버스 설정 및 스크립트 로드
- `styles.css`: 전체화면 캔버스 스타일
- `fire.js`: `Particle` 클래스, 애니메이션 루프, 상호작용 로직

## 주요 파라미터

- `fireIntensity`: 기본 파티클 생성 개수 및 속도 배율 (클릭/터치 시 일시적으로 2배 증가)
- `Particle` 속성:
  - `size`: 초기 파티클 크기 (랜덤값)
  - `hue`: 색상 범위 (0~60 사이, 노랑→빨강)
  - `life`: 파티클 수명 (프레임 수)
- 트레일 효과 강도: `ctx.fillStyle = 'rgba(0,0,0,0.1)'`
- 블렌딩 모드: `ctx.globalCompositeOperation = 'lighter'`

원하는 대로 파라미터를 조정하여 다양한 화염 효과를 실험해 보세요! 