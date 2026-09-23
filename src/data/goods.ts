import type { Lang } from '../i18n'

export interface Good {
  id: string
  icon: string
  name: Record<Lang, string>
}

export const GOODS: Good[] = [
  { id: 'cloth', icon: '🧵', name: { ko: '직물', en: 'Cloth' } },
  { id: 'wine', icon: '🍷', name: { ko: '와인', en: 'Wine' } },
  { id: 'rice', icon: '🌾', name: { ko: '쌀', en: 'Rice' } },
  { id: 'wheat', icon: '🌾', name: { ko: '밀', en: 'Wheat' } },
  { id: 'chips', icon: '💾', name: { ko: '반도체', en: 'Semiconductors' } },
  { id: 'phones', icon: '📱', name: { ko: '스마트폰', en: 'Smartphones' } },
  { id: 'cars', icon: '🚗', name: { ko: '자동차', en: 'Cars' } },
  { id: 'aircraft', icon: '✈️', name: { ko: '항공기', en: 'Aircraft' } },
  { id: 'coffee', icon: '☕', name: { ko: '커피', en: 'Coffee' } },
  { id: 'bananas', icon: '🍌', name: { ko: '바나나', en: 'Bananas' } },
  { id: 'cheese', icon: '🧀', name: { ko: '치즈', en: 'Cheese' } },
  { id: 'clothing', icon: '👕', name: { ko: '의류', en: 'Clothing' } },
  { id: 'oil', icon: '🛢️', name: { ko: '원유', en: 'Crude oil' } },
  { id: 'software', icon: '💻', name: { ko: '소프트웨어', en: 'Software' } },
]

export const CUSTOM_ICON = '📦'

/** A good as chosen by the user: either a preset id or a free-text name. */
export type GoodChoice = { kind: 'preset'; id: string } | { kind: 'custom'; label: string }

export function goodLabel(choice: GoodChoice, lang: Lang): string {
  if (choice.kind === 'custom') return choice.label.trim() || (lang === 'ko' ? '재화' : 'Good')
  return GOODS.find((g) => g.id === choice.id)?.name[lang] ?? choice.id
}

export function goodIcon(choice: GoodChoice): string {
  if (choice.kind === 'custom') return CUSTOM_ICON
  return GOODS.find((g) => g.id === choice.id)?.icon ?? CUSTOM_ICON
}
