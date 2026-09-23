import type { Lang } from '../i18n'
import type { CountryInput } from '../model/ricardian'
import type { GoodChoice } from './goods'

export interface Preset {
  id: string
  title: Record<Lang, string>
  description: Record<Lang, string>
  /** ISO 3166-1 numeric codes, matching the world-atlas feature ids. */
  countries: [string, string]
  goods: [GoodChoice, GoodChoice]
  A: CountryInput
  B: CountryInput
  beta: number
}

export const PRESETS: Preset[] = [
  {
    id: 'ricardo',
    title: { ko: '리카도의 원래 예시', en: "Ricardo's original example" },
    description: {
      ko: '1817년 리카도의 예시입니다. 포르투갈은 두 재화 모두 더 적은 노동으로 만들지만, 와인에 특화하고 영국에서 직물을 수입하는 편이 이득입니다.',
      en: 'From Ricardo (1817). Portugal makes both goods with less labour, yet still gains by specialising in wine and importing cloth from England.',
    },
    countries: ['826', '620'],
    goods: [
      { kind: 'preset', id: 'cloth' },
      { kind: 'preset', id: 'wine' },
    ],
    A: { aX: 100, aY: 120, labor: 2200 },
    B: { aX: 90, aY: 80, labor: 1700 },
    beta: 0.5,
  },
  {
    id: 'korea-vietnam',
    title: { ko: '한국·베트남: 반도체와 쌀', en: 'Korea & Vietnam: chips and rice' },
    description: {
      ko: '생산성 수치는 예시로 정한 값입니다. 한국은 반도체의 기회비용이 낮고, 베트남은 쌀의 기회비용이 낮습니다.',
      en: 'Illustrative numbers. Korea has the lower opportunity cost in semiconductors, Vietnam in rice.',
    },
    countries: ['410', '704'],
    goods: [
      { kind: 'preset', id: 'chips' },
      { kind: 'preset', id: 'rice' },
    ],
    A: { aX: 2, aY: 4, labor: 100 },
    B: { aX: 8, aY: 3, labor: 150 },
    beta: 0.5,
  },
  {
    id: 'large-country',
    title: { ko: '큰 나라 케이스', en: 'Large-country case' },
    description: {
      ko: '미국이 커서 교역가격이 미국의 자급자족 가격과 같아집니다. 미국은 두 재화를 계속 생산하고, 교역이익은 작은 나라가 모두 가져갑니다.',
      en: 'The US is so large that the world price equals its autarky price. It keeps producing both goods and the small country captures all the gains.',
    },
    countries: ['840', '372'],
    goods: [
      { kind: 'preset', id: 'aircraft' },
      { kind: 'preset', id: 'cheese' },
    ],
    A: { aX: 1, aY: 2, labor: 1000 },
    B: { aX: 6, aY: 3, labor: 30 },
    beta: 0.5,
  },
  {
    id: 'no-trade',
    title: { ko: '교역이 일어나지 않는 경우', en: 'No gains from trade' },
    description: {
      ko: '독일이 두 재화 모두 정확히 두 배 생산적이라 기회비용이 같습니다. 절대우위만으로는 교역이 일어나지 않습니다.',
      en: 'Germany is exactly twice as productive in both goods, so opportunity costs are equal. Absolute advantage alone does not create trade.',
    },
    countries: ['276', '616'],
    goods: [
      { kind: 'preset', id: 'cars' },
      { kind: 'preset', id: 'wheat' },
    ],
    A: { aX: 2, aY: 3, labor: 100 },
    B: { aX: 4, aY: 6, labor: 100 },
    beta: 0.5,
  },
]
