import { josa, type Lang } from '../i18n'

type N = { A: string; B: string; X: string; Y: string }

export type LearnFocus = 'map' | 'inputs' | 'price' | 'ppf' | 'rsrd' | 'explain' | 'table'

/** Numbers the step texts refer to, formatted by the caller. */
export interface LearnVars {
  n: N
  aXA: string
  aYA: string
  lo: string
  hi: string
  gainA: string
  gainB: string
}

interface StepText {
  title: string
  body: (v: LearnVars) => string
  quiz?: (v: LearnVars) => string
  hint?: (v: LearnVars) => string
  /** Shown once the quiz has been answered correctly. */
  after?: string
  tasks?: string[]
}

const ko = {
  toggle: '🎓 학습 모드',
  exit: '학습 종료',
  collapse: '안내 접기',
  expand: '안내 펼치기',
  prev: '이전',
  next: '다음',
  finish: '학습 마치기',
  stepOf: (i: number, total: number) => `${i} / ${total}`,
  locked: '학습을 진행하면 결과가 여기에 하나씩 나타납니다.',
  correct: '정답이에요!',
  wrong: '다시 생각해 보세요.',
  same: '두 나라가 같다',
  noExport: '수출하지 않는다',
  taskDone: '완료',
  steps: [
    {
      title: '리카도 모형이란?',
      body: () =>
        '데이비드 리카도(1817)는 한 나라가 모든 재화를 더 효율적으로 만들더라도 교역으로 두 나라 모두 이득을 볼 수 있음을 보였습니다. 이 모형에서는 노동이 유일한 생산요소이고, 나라마다 생산성이 다릅니다. 한 단계씩 따라가 봅시다.',
    },
    {
      title: '두 나라 고르기',
      body: ({ n }: LearnVars) =>
        `지도에서 ${n.A}(파랑)와 ${n.B}(주황)가 선택되어 있습니다. 다른 나라로 바꾸고 싶다면 위의 A·B 카드를 누른 뒤 지도를 클릭하거나 이름을 검색하세요.`,
    },
    {
      title: '생산 조건 읽기',
      body: ({ n, aXA, aYA }: LearnVars) =>
        `표의 숫자는 재화 1단위를 만드는 데 필요한 노동시간입니다. 숫자가 작을수록 생산성이 높습니다. 예를 들어 ${josa(n.A, '은/는')} ${n.X} 1단위에 ${aXA}시간, ${n.Y} 1단위에 ${aYA}시간이 걸립니다. 숫자는 언제든 바꿔 볼 수 있습니다.`,
    },
    {
      title: '기회비용',
      body: ({ n }: LearnVars) =>
        `${josa(n.X, '을/를')} 1단위 더 만들려면 그만큼의 노동을 ${n.Y} 생산에서 빼 와야 합니다. 이때 포기하는 ${n.Y}의 양이 기회비용이고, 생산가능곡선 기울기의 크기와 같습니다.`,
      quiz: ({ n }: LearnVars) => `${n.X}의 기회비용이 더 낮은 나라는?`,
      hint: ({ n }: LearnVars) => `기회비용 = ${n.X} 노동시간 ÷ ${n.Y} 노동시간`,
      after: '아래 ① 카드에서 두 나라의 계산을 확인해 보세요.',
    },
    {
      title: '절대우위와 비교우위',
      body: () =>
        '절대우위는 같은 재화를 더 적은 노동으로 만드는 것, 비교우위는 기회비용이 더 낮은 것입니다. 둘은 서로 다를 수 있습니다.',
      quiz: ({ n }: LearnVars) => `${josa(n.X, '을/를')} 더 적은 노동으로 만드는 나라는?`,
      hint: ({ n }: LearnVars) => `생산 조건 표에서 ${n.X} 1단위당 노동시간을 비교해 보세요.`,
      after: '교역 패턴을 정하는 것은 절대우위가 아니라 비교우위입니다. 아래 ③번 카드를 확인해 보세요.',
    },
    {
      title: '특화와 교역',
      body: () => '각 나라는 기회비용이 낮은 재화에 특화해 생산하고, 나머지 재화는 수입합니다.',
      quiz: ({ n }: LearnVars) => `${josa(n.A, '은/는')} 무엇을 수출할까요?`,
      hint: () => '앞 단계에서 찾은 비교우위를 떠올려 보세요.',
      after: '지도에 나타난 화살표가 실제 교역 방향과 양입니다.',
    },
    {
      title: '교역가격',
      body: ({ lo, hi }: LearnVars) =>
        `교역가격은 두 자급자족 가격(${lo}~${hi}) 사이에 있어야 두 나라 모두 교역에 참여합니다. 시장균형에서는 세계 상대공급(RS)과 상대수요(RD)가 만나는 점에서 정해집니다.`,
      tasks: ['「직접 설정」으로 바꿔 보세요', '가격을 한쪽 끝까지 움직여 한 나라의 이익이 0이 되는 것을 확인하세요'],
    },
    {
      title: '교역이익',
      body: ({ n, gainA, gainB }: LearnVars) =>
        `초록 점(교역 후 소비)이 생산가능곡선 바깥에 있습니다. 혼자서는 닿을 수 없던 소비가 교역으로 가능해진 것입니다. 효용 변화: ${n.A} ${gainA}%, ${n.B} ${gainB}%.`,
    },
    {
      title: '도전 과제',
      body: ({ n }: LearnVars) =>
        `이제 직접 숫자를 바꿔 보세요. 힌트: ${n.B}의 두 노동시간을 ${n.A}의 정확히 2배로 만들면 어떻게 될까요?`,
      tasks: ['노동시간을 바꿔 교역 방향을 뒤집어 보세요', '두 나라의 기회비용을 같게 만들어 교역이 사라지게 해 보세요'],
    },
  ] as StepText[],
}

type LearnText = typeof ko

const en: LearnText = {
  toggle: '🎓 Learn mode',
  exit: 'Exit',
  collapse: 'Collapse',
  expand: 'Expand',
  prev: 'Back',
  next: 'Next',
  finish: 'Finish',
  stepOf: (i: number, total: number) => `${i} / ${total}`,
  locked: 'Results appear here one by one as you go through the lesson.',
  correct: 'Correct!',
  wrong: 'Not quite. Try again.',
  same: 'Both are the same',
  noExport: 'Nothing',
  taskDone: 'Done',
  steps: [
    {
      title: 'What is the Ricardian model?',
      body: () =>
        'David Ricardo (1817) showed that two countries can both gain from trade even when one of them is better at making everything. Labour is the only factor of production, and productivity differs across countries. Let’s go step by step.',
    },
    {
      title: 'Pick two countries',
      body: ({ n }: LearnVars) =>
        `${n.A} (blue) and ${n.B} (orange) are selected. To change them, click the A or B card above, then click a country on the map or search by name.`,
    },
    {
      title: 'Read the production table',
      body: ({ n, aXA, aYA }: LearnVars) =>
        `Each number is the labour hours needed for one unit of a good. Smaller means more productive. For example, ${n.A} needs ${aXA} hours per unit of ${n.X} and ${aYA} hours per unit of ${n.Y}. You can change the numbers at any time.`,
    },
    {
      title: 'Opportunity cost',
      body: ({ n }: LearnVars) =>
        `To make one more unit of ${n.X}, labour must be taken away from ${n.Y}. The ${n.Y} given up is the opportunity cost, and it equals the slope of the production possibility frontier.`,
      quiz: ({ n }: LearnVars) => `Which country has the lower opportunity cost of ${n.X}?`,
      hint: ({ n }: LearnVars) => `Opportunity cost = hours for ${n.X} ÷ hours for ${n.Y}`,
      after: 'See card ① below for both calculations.',
    },
    {
      title: 'Absolute vs comparative advantage',
      body: () =>
        'Absolute advantage means making a good with less labour. Comparative advantage means a lower opportunity cost. The two can differ.',
      quiz: ({ n }: LearnVars) => `Which country makes ${n.X} with less labour?`,
      hint: ({ n }: LearnVars) => `Compare the hours per unit of ${n.X} in the production table.`,
      after: 'Trade follows comparative advantage, not absolute advantage. See card ③ below.',
    },
    {
      title: 'Specialisation and trade',
      body: () => 'Each country specialises in the good with the lower opportunity cost and imports the other.',
      quiz: ({ n }: LearnVars) => `What does ${n.A} export?`,
      hint: () => 'Think back to the comparative advantage you found.',
      after: 'The arrows on the map show the direction and size of trade.',
    },
    {
      title: 'The world price',
      body: ({ lo, hi }: LearnVars) =>
        `The world price must lie between the two autarky prices (${lo} to ${hi}) for both countries to trade. In market equilibrium it is where world relative supply (RS) meets relative demand (RD).`,
      tasks: ['Switch to “Set manually”', 'Move the price to one end and see one country’s gain drop to 0'],
    },
    {
      title: 'Gains from trade',
      body: ({ n, gainA, gainB }: LearnVars) =>
        `The green dot (consumption with trade) lies outside the PPF: trade makes consumption possible that neither country could reach alone. Change in utility: ${n.A} ${gainA}%, ${n.B} ${gainB}%.`,
    },
    {
      title: 'Challenges',
      body: ({ n }: LearnVars) =>
        `Now change the numbers yourself. Hint: what happens if both of ${n.B}’s labour hours are exactly twice ${n.A}’s?`,
      tasks: ['Change labour hours so the direction of trade flips', 'Make the opportunity costs equal so trade disappears'],
    },
  ],
}

export const LEARN_TEXT: Record<Lang, LearnText> = { ko, en }

/** What each step points at and how much of the results it reveals. */
export const STEP_FOCUS: LearnFocus[][] = [
  [],
  ['map'],
  ['inputs'],
  ['ppf'],
  ['explain'],
  ['map'],
  ['rsrd', 'price'],
  ['ppf', 'table'],
  ['inputs'],
]

export const LEARN_STEPS = STEP_FOCUS.length

/** Step indices with a special role. */
export const STEP = { oc: 3, absolute: 4, trade: 5, price: 6, gains: 7, challenge: 8 } as const
