import type { ReactNode } from 'react'
import { fmt, signed } from '../format'
import { useI18n } from '../i18n'
import type { CountryInput, ModelResult, PriceMode } from '../model/ricardian'

interface Props {
  names: { A: string; B: string; X: string; Y: string }
  inputs: { A: CountryInput; B: CountryInput }
  result: ModelResult
  priceMode: PriceMode
  /** Number of cards to show, for learn mode. */
  upTo?: number
}

export function Explanation({ names, inputs, result, priceMode, upTo = 5 }: Props) {
  const { t, lang } = useI18n()
  const f = (v: number) => fmt(v, lang)
  const { comparativeAdvantage: ca, absoluteAdvantage: aa, countries, tradeCase } = result
  const nameOf = (k: 'A' | 'B' | 'tie' | null) => (k === 'A' ? names.A : k === 'B' ? names.B : null)

  const s = ca.X
  const tt = ca.Y
  const large =
    priceMode === 'equilibrium' ? (tradeCase === 'A-large' ? names.A : tradeCase === 'B-large' ? names.B : null) : null

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Card title={t.step1Title}>
        {(['A', 'B'] as const).map((k) => (
          <p key={k}>
            <Dot slot={k} />
            {t.step1(names, names[k], f(inputs[k].aX), f(inputs[k].aY), f(countries[k].opportunityCost.X))}
          </p>
        ))}
      </Card>

      {upTo >= 2 && (
        <Card title={t.step2Title}>
          <p>{t.step2Good(names.X, nameOf(aa.X))}</p>
          <p>{t.step2Good(names.Y, nameOf(aa.Y))}</p>
          <p className="text-slate-500 dark:text-slate-400">{t.step2Note}</p>
        </Card>
      )}

      {upTo >= 3 && (
        <Card title={t.step3Title} highlight>
          {s && tt ? (
            <p>{t.step3(names, names[s], names[tt], f(countries[s].opportunityCost.X), f(countries[tt].opportunityCost.X))}</p>
          ) : (
            <p>{t.step3None(f(countries.A.opportunityCost.X))}</p>
          )}
        </Card>
      )}

      {upTo >= 4 && tradeCase !== 'no-trade' && (
        <Card title={t.step4Title}>
          <p>{t.step4Band(names, f(result.priceBand[0]), f(result.priceBand[1]))}</p>
          <p className="font-semibold">
            {priceMode === 'equilibrium' ? t.step4Eq(f(result.price)) : t.step4Manual(f(result.price))}
          </p>
          {large && <p className="text-amber-700 dark:text-amber-400">{t.step4Large(large)}</p>}
        </Card>
      )}

      {upTo >= 5 && (
        <Card title={t.step5Title}>
          {(['A', 'B'] as const).map((k) => (
            <p key={k}>
              <Dot slot={k} />
              {countries[k].gainPct > 0.005
                ? t.step5(names[k], signed(countries[k].gainPct, lang).replace('+', ''))
                : t.step5Zero(names[k])}
            </p>
          ))}
          {tradeCase !== 'no-trade' && (
            <p className="text-slate-500 dark:text-slate-400">
              {t.step5Wage(
                names.A,
                names.B,
                f(result.relativeWage.value),
                f(result.relativeWage.bounds[0]),
                f(result.relativeWage.bounds[1]),
              )}
            </p>
          )}
        </Card>
      )}
    </div>
  )
}

function Card({ title, children, highlight }: { title: string; children: ReactNode; highlight?: boolean }) {
  return (
    <article
      className={
        'space-y-2 rounded-2xl border p-4 text-sm leading-relaxed ' +
        (highlight
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900')
      }
    >
      <h3 className="font-semibold">{title}</h3>
      {children}
    </article>
  )
}

function Dot({ slot }: { slot: 'A' | 'B' }) {
  return <span className={`mr-1.5 inline-block h-2 w-2 rounded-full align-middle ${slot === 'A' ? 'bg-a' : 'bg-b'}`} />
}
