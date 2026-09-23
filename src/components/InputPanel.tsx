import { useId } from 'react'
import { GOODS, goodIcon, goodLabel, type GoodChoice } from '../data/goods'
import { fmt } from '../format'
import { useI18n } from '../i18n'
import type { CountryInput, ModelResult, PriceMode } from '../model/ricardian'

interface Props {
  names: { A: string; B: string }
  goods: { X: GoodChoice; Y: GoodChoice }
  inputs: { A: CountryInput; B: CountryInput }
  beta: number
  priceMode: PriceMode
  manualPrice: number
  result: ModelResult
  onGood: (slot: 'X' | 'Y', choice: GoodChoice) => void
  onInput: (slot: 'A' | 'B', field: keyof CountryInput, value: number) => void
  onBeta: (v: number) => void
  onPriceMode: (m: PriceMode) => void
  onManualPrice: (p: number) => void
}

export function InputPanel(props: Props) {
  const { t, lang } = useI18n()
  const { names, goods, inputs, result } = props
  const gX = goodLabel(goods.X, lang)
  const gY = goodLabel(goods.Y, lang)
  const [lo, hi] = result.priceBand
  const canSetPrice = result.errors.length === 0 && result.tradeCase !== 'no-trade'

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3">
        <GoodPicker label={t.goodX} value={goods.X} onChange={(c) => props.onGood('X', c)} />
        <GoodPicker label={t.goodY} value={goods.Y} onChange={(c) => props.onGood('Y', c)} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">{t.inputsTitle}</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium" />
                <th className="px-2 py-2 text-left font-medium">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-a" />
                  {names.A}
                </th>
                <th className="px-2 py-2 text-left font-medium">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-b" />
                  {names.B}
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['aX', `${goodIcon(goods.X)} ${t.hoursPer(gX)}`],
                  ['aY', `${goodIcon(goods.Y)} ${t.hoursPer(gY)}`],
                  ['labor', `👷 ${t.laborForce}`],
                ] as const
              ).map(([field, label]) => (
                <tr key={field} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">{label}</td>
                  {(['A', 'B'] as const).map((slot) => (
                    <td key={slot} className="px-2 py-2">
                      <NumberInput
                        value={inputs[slot][field]}
                        onChange={(v) => props.onInput(slot, field, v)}
                        slot={slot}
                        ariaLabel={`${slot === 'A' ? names.A : names.B} ${label}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.errors.length > 0 && <p className="mt-2 text-xs text-red-600">{t.invalid}</p>}
      </section>

      <section>
        <label className="mb-1 flex items-baseline justify-between text-sm font-semibold">
          <span>{t.beta(gX)}</span>
          <span className="tabular-nums">{Math.round(props.beta * 100)}%</span>
        </label>
        <input
          type="range"
          min={5}
          max={95}
          step={1}
          value={Math.round(props.beta * 100)}
          onChange={(e) => props.onBeta(Number(e.target.value) / 100)}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t.betaHelp}</p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">{t.priceMode}</h3>
        <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
          {(['equilibrium', 'manual'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => props.onPriceMode(m)}
              className={
                'rounded-md px-3 py-1.5 transition ' +
                (props.priceMode === m
                  ? 'bg-white font-semibold shadow-sm dark:bg-slate-950'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100')
              }
            >
              {m === 'equilibrium' ? t.equilibrium : t.manual}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {props.priceMode === 'manual' ? t.manualHelp : t.equilibriumHelp}
        </p>
        {props.priceMode === 'manual' && canSetPrice && (
          <div className="mt-3">
            <div className="mb-1 flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{fmt(lo, lang)}</span>
              <span className="text-base font-semibold text-slate-900 tabular-nums dark:text-slate-100">
                {fmt(result.price, lang)}
              </span>
              <span>{fmt(hi, lang)}</span>
            </div>
            {/* Log scale, so the midpoint of the slider is the geometric mean of the band. */}
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round((Math.log(result.price / lo) / Math.log(hi / lo)) * 1000)}
              onChange={(e) => props.onManualPrice(lo * Math.pow(hi / lo, Number(e.target.value) / 1000))}
              aria-label={t.price(gX, gY)}
            />
            <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">{t.price(gX, gY)}</p>
            <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              {t.excessWarning}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  slot,
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  slot: 'A' | 'B'
  ariaLabel: string
}) {
  return (
    <input
      type="number"
      min={0}
      step="any"
      value={Number.isFinite(value) ? value : ''}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
      className={
        'w-full rounded-md border bg-white px-2 py-1 text-right tabular-nums outline-none focus:ring-2 dark:bg-slate-950 ' +
        (!(value > 0) ? 'border-red-400 ' : 'border-slate-200 dark:border-slate-700 ') +
        (slot === 'A' ? 'focus:ring-a/40' : 'focus:ring-b/40')
      }
    />
  )
}

function GoodPicker({ label, value, onChange }: { label: string; value: GoodChoice; onChange: (c: GoodChoice) => void }) {
  const { t, lang } = useI18n()
  const id = useId()
  const selectValue = value.kind === 'preset' ? value.id : '__custom'
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <select
        id={id}
        value={selectValue}
        onChange={(e) =>
          onChange(e.target.value === '__custom' ? { kind: 'custom', label: '' } : { kind: 'preset', id: e.target.value })
        }
        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
      >
        {GOODS.map((g) => (
          <option key={g.id} value={g.id}>
            {g.icon} {g.name[lang]}
          </option>
        ))}
        <option value="__custom">✏️ {t.customGood}</option>
      </select>
      {value.kind === 'custom' && (
        <input
          type="text"
          value={value.label}
          placeholder={t.customPlaceholder}
          maxLength={24}
          onChange={(e) => onChange({ kind: 'custom', label: e.target.value })}
          className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      )}
    </div>
  )
}
