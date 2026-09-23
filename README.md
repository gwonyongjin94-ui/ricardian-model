# Ricardian Model Explorer · 리카도 모형 탐색기

**▶ 바로 사용하기 · Live demo: https://gwonyongjin94-ui.github.io/ricardian-model/**

세계지도에서 두 나라와 두 재화를 골라 **비교우위 → 특화 → 교역가격 → 교역이익**을 눈으로 따라가는 인터랙티브 웹 앱입니다.

An interactive web app for the two-country, two-good Ricardian model. Pick two countries on a world map and two goods, and follow the logic from opportunity cost to gains from trade.

## 기능 · Features

- **세계지도에서 국가 선택**: 클릭 또는 검색으로 고르면 두 나라에 맞춰 지도가 자동으로 확대됩니다. 수출 방향은 재화 아이콘이 날아가는 화살표로 표시합니다.
- **재화**: 아이콘이 있는 프리셋 목록에서 고르거나 이름을 직접 입력합니다.
- **교역가격 결정 방식 토글**
  - *시장균형*: 세계 상대공급(RS)과 상대수요(RD)의 교점에서 가격이 정해집니다. 큰 나라 케이스도 처리합니다.
  - *직접 설정*: 두 자급자족 가격 사이에서 슬라이더로 교역가격을 움직이며 교역이익이 어떻게 나뉘는지 봅니다.
- **차트**: 두 나라의 생산가능곡선(자급자족점, 교역 후 생산점과 소비점, 교역선)과 RS–RD 그래프를 보여줍니다.
- **단계별 해설**: 실제 입력값을 대입한 수식으로 기회비용, 절대우위, 비교우위, 교역가격, 교역이익을 차례로 설명합니다.
- **예시 시나리오**: 리카도의 원래 예시(영국·포르투갈), 한국·베트남, 큰 나라 케이스, 교역이 일어나지 않는 경우를 불러올 수 있습니다.
- **🎓 학습 모드**: 9단계 가이드가 관련 화면을 차례로 강조합니다. 퀴즈 3개(기회비용, 절대우위, 수출품)에 답해야 해당 결과가 공개되고, 직접 조작하면 자동으로 체크되는 과제(가격을 끝까지 움직이기, 교역 방향 뒤집기, 교역 없애기)가 있습니다.
- **한국어 / English** 전환

## 모형 · The model

| 기호 | 의미 |
|---|---|
| `a_X`, `a_Y` | 재화 1단위를 만드는 데 드는 노동시간 (unit labour requirement) |
| `L` | 총 노동량 |
| `β` | 소득 중 X재에 쓰는 비중 (Cobb-Douglas 선호, 두 나라 동일) |

- 자급자족 상대가격 = X재의 기회비용 = `a_X / a_Y`
- 기회비용이 더 낮은 나라가 X재에 비교우위를 가집니다.
- RS는 계단 모양이고, RD는 `Q_X/Q_Y = β / ((1-β) p)`입니다.
- 두 곡선의 교점이 자급자족 가격 사이에 있으면 두 나라 모두 완전특화합니다. 교점이 한쪽 끝에 걸리면 그 나라(큰 나라)는 두 재화를 모두 생산하고 교역이익을 얻지 못합니다.
- 임금은 `w = max(p / a_X, 1 / a_Y)`이며 Y재 단위로 표시합니다. 교역이익은 효용 변화율로 계산합니다.

계산 엔진은 [src/model/ricardian.ts](src/model/ricardian.ts)에 순수 함수로 분리되어 있고, [단위 테스트](src/model/ricardian.test.ts)로 검증합니다.

## 실행 · Development

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # model unit tests
npm run build    # production build in dist/
```

## 배포 · Deployment

`main` 브랜치에 push하면 [GitHub Actions](.github/workflows/deploy.yml)가 테스트와 빌드를 거쳐 GitHub Pages에 배포합니다. 저장소의 **Settings → Pages → Source**를 **GitHub Actions**로 설정해 주세요.

## 기술 스택 · Stack

React 19, TypeScript, Vite, Tailwind CSS 4, d3-geo, world-atlas (Natural Earth 1:110m), i18n-iso-countries, Vitest
