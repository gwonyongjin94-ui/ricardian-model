import type { Lang } from './i18n'

/** Round to a readable number of significant digits. */
export function fmt(n: number, lang: Lang, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  const max = abs >= 100 ? 0 : abs >= 10 ? 1 : digits
  const v = Math.abs(n) < 1e-9 ? 0 : n
  return v.toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', { maximumFractionDigits: max })
}

export const signed = (n: number, lang: Lang) => (n > 1e-9 ? '+' : '') + fmt(n, lang)
