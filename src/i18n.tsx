import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'
import ko from 'i18n-iso-countries/langs/ko.json'
import { createContext, useContext } from 'react'

countries.registerLocale(en)
countries.registerLocale(ko)

export type Lang = 'ko' | 'en'

/** Short, commonly used names where the library's choice reads badly in a sentence. */
const NAME_OVERRIDES: Record<Lang, Record<string, string>> = {
  ko: { '620': '포르투갈', '643': '러시아', '410': '한국', '180': '콩고민주공화국' },
  en: { '826': 'United Kingdom', '410': 'South Korea', '180': 'DR Congo', '178': 'Congo' },
}

/** Country name for a world-atlas feature id (ISO numeric), falling back to the atlas name. */
export function countryName(id: string, lang: Lang, fallback = id): string {
  const alias = countries.getName(id, lang, { select: 'alias' })
  return NAME_OVERRIDES[lang][id] ?? (alias && !alias.includes(',') ? alias : countries.getName(id, lang)) ?? fallback
}

/** Flag emoji from an ISO numeric code. */
export function countryFlag(id: string): string {
  const alpha2 = countries.numericToAlpha2(id)
  if (!alpha2) return '🏳️'
  return String.fromCodePoint(...[...alpha2.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
}

/** Attach the right Korean particle, e.g. josa('한국', '은/는') → '한국은'. */
export function josa(word: string, pair: '이/가' | '은/는' | '을/를' | '과/와'): string {
  const [withFinal, withoutFinal] = pair.split('/')
  const code = word.trim().charCodeAt(word.trim().length - 1)
  const isHangul = code >= 0xac00 && code <= 0xd7a3
  const hasFinal = isHangul ? (code - 0xac00) % 28 !== 0 : /[013678lmnLMN]$/.test(word.trim())
  return word + (hasFinal ? withFinal : withoutFinal)
}

type Names = { A: string; B: string; X: string; Y: string }

const ko_ = {
  title: '리카도 모형 탐색기',
  subtitle: '두 나라, 두 재화로 보는 비교우위와 교역이익',
  steps: ['국가 선택', '재화 선택', '생산성 입력', '결과'],
  presets: '예시 불러오기',
  mapHint: (slot: 'A' | 'B') => `지도에서 국가 ${slot}를 클릭하세요`,
  searchCountry: '국가 검색…',
  selectingSlot: '선택 중',
  swap: '두 나라 바꾸기',
  zoomOut: '🌍 전체 지도',
  zoomIn: '🔍 두 나라 확대',
  goodX: '재화 X',
  goodY: '재화 Y',
  customGood: '직접 입력',
  customPlaceholder: '재화 이름',
  inputsTitle: '생산 조건',
  hoursPer: (good: string) => `${good} 1단위당 노동시간`,
  laborForce: '총 노동량 (L)',
  hoursUnit: '시간',
  beta: (x: string) => `${x}에 대한 지출 비중 (β)`,
  betaHelp: '소비자가 소득의 몇 %를 X재에 쓰는지 정합니다. 세계 상대수요곡선(RD)을 결정합니다.',
  priceMode: '교역가격 결정 방식',
  equilibrium: '시장균형',
  manual: '직접 설정',
  manualHelp: '두 나라의 자급자족 가격 사이에서 교역가격을 직접 움직여 보세요.',
  equilibriumHelp: '상대공급(RS)과 상대수요(RD)가 만나는 점에서 가격이 정해집니다.',
  price: (x: string, y: string) => `${x} 1단위 = ${y} 몇 단위`,
  excessWarning: '직접 설정한 가격에서는 세계 시장이 청산되지 않을 수 있습니다 (초과공급 또는 초과수요).',
  invalid: '모든 값은 0보다 커야 합니다.',
  pickTwo: '분석하려면 지도에서 두 나라를 고르세요.',
  sameCountry: '서로 다른 두 나라를 골라야 합니다.',

  // Summary
  exports: (c: string, g: string) => `${c} → ${g} 수출`,
  gain: '교역이익',
  wage: '상대임금',
  tradePrice: '교역가격',
  noTradeBadge: '교역 없음',

  // Charts
  ppfTitle: (c: string) => `${c}의 생산가능곡선`,
  autarky: '자급자족',
  production: '교역 후 생산',
  consumption: '교역 후 소비',
  tradeLine: '교역선',
  rsrdTitle: '세계 상대공급(RS)·상대수요(RD)',
  rsrdX: (x: string, y: string) => `상대수량 Q${x}/Q${y}`,
  rsrdY: (x: string, y: string) => `상대가격 P${x}/P${y}`,
  equilibriumPoint: '교역가격',

  // Explanation
  explainTitle: '단계별 해설',
  step1Title: '① 기회비용',
  step1: (n: Names, c: string, aX: string, aY: string, oc: string) =>
    `${c}에서 ${n.X} 1단위를 만드는 데 ${aX}시간이 듭니다. 그 시간이면 ${josa(n.Y, '을/를')} ${aX}÷${aY} = ${oc}단위 만들 수 있으므로, ${n.X}의 기회비용은 ${n.Y} ${oc}단위입니다.`,
  step2Title: '② 절대우위',
  step2Good: (good: string, who: string | null) =>
    who ? `${good}: ${josa(who, '이/가')} 더 적은 노동으로 생산합니다.` : `${good}: 두 나라의 노동투입이 같습니다.`,
  step2Note: '절대우위는 누가 더 효율적인지를 알려줄 뿐, 교역 패턴을 결정하지는 않습니다.',
  step3Title: '③ 비교우위와 특화',
  step3: (n: Names, s: string, t: string, ocS: string, ocT: string) =>
    `${n.X}의 기회비용은 ${s}(${ocS}) < ${t}(${ocT})입니다. 따라서 ${josa(s, '은/는')} ${n.X}에, ${josa(t, '은/는')} ${n.Y}에 비교우위가 있습니다.`,
  step3None: (ocS: string) =>
    `두 나라의 기회비용이 ${ocS}로 같습니다. 비교우위가 없으므로 교역해도 이익이 생기지 않습니다.`,
  step4Title: '④ 교역가격',
  step4Band: (n: Names, lo: string, hi: string) =>
    `교역가격(${n.X} 1단위당 ${n.Y})은 두 자급자족 가격 사이인 ${lo}와 ${hi} 사이에 있어야 두 나라 모두 교역에 참여합니다.`,
  step4Eq: (p: string) => `RD가 RS와 만나는 균형 교역가격은 ${p}입니다.`,
  step4Manual: (p: string) => `직접 설정한 교역가격은 ${p}입니다.`,
  step4Large: (c: string) =>
    `${c}의 경제 규모가 커서 교역가격이 ${c}의 자급자족 가격과 같아졌습니다. ${josa(c, '은/는')} 두 재화를 모두 계속 생산하고 교역이익을 얻지 못합니다.`,
  step5Title: '⑤ 교역이익',
  step5: (c: string, pct: string) => `${c}: 효용이 ${pct}% 증가합니다. 소비점이 자국의 생산가능곡선 바깥으로 나갑니다.`,
  step5Zero: (c: string) => `${c}: 교역 전후 효용이 같습니다.`,
  step5Wage: (a: string, b: string, w: string, lo: string, hi: string) =>
    `상대임금 w${a}/w${b} = ${w}이며, 두 재화의 생산성 비율 범위(${lo}~${hi}) 안에 있습니다.`,

  // Table
  tableTitle: '수치 요약',
  row: {
    oc: (x: string) => `${x}의 기회비용`,
    autarkyP: '자급자족 상대가격',
    prod: '교역 후 생산',
    cons: '교역 후 소비',
    net: '순수출 (+) / 순수입 (−)',
    wage: (y: string) => `임금 (${y} 단위)`,
    gain: '효용 변화',
  },
  footer: '가정: 노동이 유일한 생산요소이고, 국가 간 이동하지 않으며, 두 나라 소비자는 동일한 Cobb-Douglas 선호를 가집니다.',
}

export type Strings = typeof ko_

const en_: Strings = {
  title: 'Ricardian Model Explorer',
  subtitle: 'Comparative advantage and gains from trade with two countries and two goods',
  steps: ['Countries', 'Goods', 'Productivity', 'Results'],
  presets: 'Load an example',
  mapHint: (slot) => `Click a country on the map for country ${slot}`,
  searchCountry: 'Search country…',
  selectingSlot: 'Selecting',
  swap: 'Swap countries',
  zoomOut: '🌍 Whole world',
  zoomIn: '🔍 Zoom to pair',
  goodX: 'Good X',
  goodY: 'Good Y',
  customGood: 'Custom',
  customPlaceholder: 'Good name',
  inputsTitle: 'Production',
  hoursPer: (good) => `Labour hours per unit of ${good}`,
  laborForce: 'Labour force (L)',
  hoursUnit: 'h',
  beta: (x) => `Spending share on ${x} (β)`,
  betaHelp: 'The share of income consumers spend on good X. It sets the world relative demand curve (RD).',
  priceMode: 'World price',
  equilibrium: 'Market equilibrium',
  manual: 'Set manually',
  manualHelp: 'Move the world price between the two autarky prices.',
  equilibriumHelp: 'The price is where relative supply (RS) meets relative demand (RD).',
  price: (x, y) => `units of ${y} per ${x}`,
  excessWarning: 'At a manually set price the world market may not clear (excess supply or demand).',
  invalid: 'All values must be greater than zero.',
  pickTwo: 'Pick two countries on the map to begin.',
  sameCountry: 'Choose two different countries.',

  exports: (c, g) => `${c} exports ${g}`,
  gain: 'Gain from trade',
  wage: 'Relative wage',
  tradePrice: 'World price',
  noTradeBadge: 'No trade',

  ppfTitle: (c) => `${c} production possibilities`,
  autarky: 'Autarky',
  production: 'Production with trade',
  consumption: 'Consumption with trade',
  tradeLine: 'Trade line',
  rsrdTitle: 'World relative supply (RS) and demand (RD)',
  rsrdX: (x, y) => `Relative quantity Q${x}/Q${y}`,
  rsrdY: (x, y) => `Relative price P${x}/P${y}`,
  equilibriumPoint: 'World price',

  explainTitle: 'Step by step',
  step1Title: '① Opportunity cost',
  step1: (n, c, aX, aY, oc) =>
    `In ${c}, one unit of ${n.X} takes ${aX} hours. Those hours could make ${aX}÷${aY} = ${oc} units of ${n.Y}, so the opportunity cost of ${n.X} is ${oc} ${n.Y}.`,
  step2Title: '② Absolute advantage',
  step2Good: (good, who) => (who ? `${good}: ${who} uses less labour.` : `${good}: both countries use the same labour.`),
  step2Note: 'Absolute advantage says who is more efficient. It does not decide the pattern of trade.',
  step3Title: '③ Comparative advantage',
  step3: (n, s, t, ocS, ocT) =>
    `The opportunity cost of ${n.X} is lower in ${s} (${ocS}) than in ${t} (${ocT}). So ${s} has the comparative advantage in ${n.X} and ${t} in ${n.Y}.`,
  step3None: (ocS) =>
    `Both countries have the same opportunity cost (${ocS}). With no comparative advantage there is nothing to gain from trade.`,
  step4Title: '④ World price',
  step4Band: (n, lo, hi) =>
    `The world price (${n.Y} per ${n.X}) must lie between the autarky prices ${lo} and ${hi} for both countries to want to trade.`,
  step4Eq: (p) => `RD meets RS at a world price of ${p}.`,
  step4Manual: (p) => `You set the world price to ${p}.`,
  step4Large: (c) =>
    `${c} is large enough that the world price equals its autarky price. ${c} keeps producing both goods and gains nothing.`,
  step5Title: '⑤ Gains from trade',
  step5: (c, pct) => `${c}: utility rises by ${pct}%. Consumption moves outside its own PPF.`,
  step5Zero: (c) => `${c}: utility is unchanged.`,
  step5Wage: (a, b, w, lo, hi) =>
    `The relative wage w${a}/w${b} = ${w}, inside the range set by the productivity ratios (${lo} to ${hi}).`,

  tableTitle: 'Numbers',
  row: {
    oc: (x) => `Opportunity cost of ${x}`,
    autarkyP: 'Autarky relative price',
    prod: 'Production with trade',
    cons: 'Consumption with trade',
    net: 'Net exports (+) / imports (−)',
    wage: (y) => `Wage (in ${y})`,
    gain: 'Change in utility',
  },
  footer: 'Assumptions: labour is the only factor, it cannot move between countries, and consumers in both countries share the same Cobb-Douglas preferences.',
}

export const STRINGS: Record<Lang, Strings> = { ko: ko_, en: en_ }

export const LangContext = createContext<{ lang: Lang; t: Strings }>({ lang: 'ko', t: ko_ })
export const useI18n = () => useContext(LangContext)
