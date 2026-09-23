import { useEffect, useMemo, useState } from 'react'
import { CountryPicker } from './components/CountryPicker'
import { Explanation } from './components/Explanation'
import { InputPanel } from './components/InputPanel'
import { PPFChart } from './components/PPFChart'
import { RSRDChart } from './components/RSRDChart'
import { SummaryTable } from './components/SummaryTable'
import { WorldMap, type Flow } from './components/WorldMap'
import { goodIcon, goodLabel, type GoodChoice } from './data/goods'
import { PRESETS, type Preset } from './data/presets'
import { fmt, signed } from './format'
import { countryFlag, countryName, LangContext, STRINGS, useI18n, type Lang } from './i18n'
import { solve, type CountryInput, type PriceMode } from './model/ricardian'

type Slot = 'A' | 'B'

const LANG_KEY = 'ricardian-lang'

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'ko' || saved === 'en') return saved
  } catch {
    // Storage can be unavailable (private mode); fall through to the browser language.
  }
  return navigator.language.startsWith('ko') ? 'ko' : 'en'
}

const START = PRESETS[0]

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = STRINGS[lang]

  const [presetId, setPresetId] = useState<string | null>(START.id)
  const [selected, setSelected] = useState<Record<Slot, string | null>>({ A: START.countries[0], B: START.countries[1] })
  const [activeSlot, setActiveSlot] = useState<Slot>('A')
  const [goods, setGoods] = useState<{ X: GoodChoice; Y: GoodChoice }>({ X: START.goods[0], Y: START.goods[1] })
  const [inputs, setInputs] = useState<Record<Slot, CountryInput>>({ A: START.A, B: START.B })
  const [beta, setBeta] = useState(START.beta)
  const [priceMode, setPriceMode] = useState<PriceMode>('equilibrium')
  const [manualPrice, setManualPrice] = useState(1)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.title
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // Ignore: remembering the language is only a convenience.
    }
  }, [lang, t.title])

  const result = useMemo(
    () => solve({ A: inputs.A, B: inputs.B, beta, priceMode, manualPrice }),
    [inputs, beta, priceMode, manualPrice],
  )

  const names = {
    A: selected.A ? countryName(selected.A, lang) : `${lang === 'ko' ? '국가' : 'Country'} A`,
    B: selected.B ? countryName(selected.B, lang) : `${lang === 'ko' ? '국가' : 'Country'} B`,
    X: goodLabel(goods.X, lang),
    Y: goodLabel(goods.Y, lang),
  }
  const icons = { X: goodIcon(goods.X), Y: goodIcon(goods.Y) }
  const ready = selected.A !== null && selected.B !== null && result.errors.length === 0

  const flows: Flow[] = []
  if (ready && result.tradeCase !== 'no-trade') {
    for (const k of ['A', 'B'] as const) {
      for (const g of ['X', 'Y'] as const) {
        const v = result.countries[k].trade.netExports[g]
        if (v > 1e-6) flows.push({ from: k, icon: icons[g], label: `${icons[g]} ${fmt(v, lang)}` })
      }
    }
  }

  const pick = (id: string) => {
    const other: Slot = activeSlot === 'A' ? 'B' : 'A'
    setSelected((s) => (s[other] === id ? { ...s, [other]: s[activeSlot], [activeSlot]: id } : { ...s, [activeSlot]: id }))
    setActiveSlot(other)
    setPresetId(null)
  }

  const swap = () => {
    setSelected((s) => ({ A: s.B, B: s.A }))
    setInputs((i) => ({ A: i.B, B: i.A }))
    setPresetId(null)
  }

  const loadPreset = (p: Preset) => {
    setPresetId(p.id)
    setSelected({ A: p.countries[0], B: p.countries[1] })
    setGoods({ X: p.goods[0], Y: p.goods[1] })
    setInputs({ A: p.A, B: p.B })
    setBeta(p.beta)
    setActiveSlot('A')
  }

  const changePriceMode = (m: PriceMode) => {
    // Start the manual slider from wherever the equilibrium price currently is.
    if (m === 'manual' && Number.isFinite(result.price)) setManualPrice(result.price)
    setPriceMode(m)
  }

  const preset = PRESETS.find((p) => p.id === presetId)

  return (
    <LangContext.Provider value={{ lang, t }}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={presetId ?? ''}
              onChange={(e) => {
                const p = PRESETS.find((x) => x.id === e.target.value)
                if (p) loadPreset(p)
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              aria-label={t.presets}
            >
              <option value="" disabled>
                📚 {t.presets}
              </option>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title[lang]}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg bg-slate-200 p-1 text-sm dark:bg-slate-800">
              {(['ko', 'en'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={
                    'rounded-md px-2.5 py-1 ' +
                    (lang === l ? 'bg-white font-semibold shadow-sm dark:bg-slate-950' : 'text-slate-500 dark:text-slate-400')
                  }
                >
                  {l === 'ko' ? '한국어' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {preset && (
          <p className="mb-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200">
            <span className="font-semibold">📚 {preset.title[lang]}</span> · {preset.description[lang]}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="space-y-3">
            <div className="flex items-stretch gap-2">
              <CountryPicker slot="A" value={selected.A} active={activeSlot === 'A'} onActivate={() => setActiveSlot('A')} onPick={pick} />
              <button
                type="button"
                onClick={swap}
                title={t.swap}
                aria-label={t.swap}
                className="self-center rounded-full border border-slate-200 bg-white px-2.5 py-2 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-white"
              >
                ⇄
              </button>
              <CountryPicker slot="B" value={selected.B} active={activeSlot === 'B'} onActivate={() => setActiveSlot('B')} onPick={pick} />
            </div>
            <WorldMap selected={selected} activeSlot={activeSlot} flows={flows} onPick={pick} />
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">{t.mapHint(activeSlot)}</p>
            {ready && <Headline names={names} icons={icons} result={result} />}
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <InputPanel
              names={names}
              goods={goods}
              inputs={inputs}
              beta={beta}
              priceMode={priceMode}
              manualPrice={manualPrice}
              result={result}
              onGood={(slot, c) => {
                setGoods((g) => ({ ...g, [slot]: c }))
                setPresetId(null)
              }}
              onInput={(slot, field, v) => {
                setInputs((i) => ({ ...i, [slot]: { ...i[slot], [field]: v } }))
                setPresetId(null)
              }}
              onBeta={setBeta}
              onPriceMode={changePriceMode}
              onManualPrice={setManualPrice}
            />
          </aside>
        </div>

        {!ready ? (
          <p className="mt-10 text-center text-slate-500">{result.errors.length ? t.invalid : t.pickTwo}</p>
        ) : (
          <main className="mt-8 space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {(['A', 'B'] as const).map((k) => (
                <PPFChart
                  key={k}
                  slot={k}
                  title={`${countryFlag(selected[k]!)} ${t.ppfTitle(names[k])}`}
                  result={result.countries[k]}
                  price={result.price}
                  goods={{ X: `${icons.X} ${names.X}`, Y: `${icons.Y} ${names.Y}` }}
                  showTrade={result.tradeCase !== 'no-trade'}
                />
              ))}
              <RSRDChart result={result} beta={beta} priceMode={priceMode} goods={{ X: names.X, Y: names.Y }} />
            </div>

            <section>
              <h2 className="mb-3 text-lg font-bold">{t.explainTitle}</h2>
              <Explanation names={names} inputs={inputs} result={result} priceMode={priceMode} />
            </section>

            <SummaryTable names={names} result={result} />
          </main>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {t.footer}
        </footer>
      </div>
    </LangContext.Provider>
  )
}

/** One-line answer to "who exports what, at what price, and who gains". */
function Headline({
  names,
  icons,
  result,
}: {
  names: { A: string; B: string; X: string; Y: string }
  icons: { X: string; Y: string }
  result: ReturnType<typeof solve>
}) {
  const { t, lang } = useI18n()
  const { comparativeAdvantage: ca, countries } = result
  if (result.tradeCase === 'no-trade') {
    return (
      <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold dark:bg-slate-800">{t.noTradeBadge}</div>
    )
  }
  const stat = (label: string, value: string, tone = '') => (
    <div className="rounded-xl bg-white px-4 py-3 dark:bg-slate-900">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-2 sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-950">
      {stat(t.exports(names[ca.X!], names.X), `${icons.X} ${fmt(countries[ca.X!].trade.netExports.X, lang)}`, ca.X === 'A' ? 'text-a' : 'text-b')}
      {stat(t.exports(names[ca.Y!], names.Y), `${icons.Y} ${fmt(countries[ca.Y!].trade.netExports.Y, lang)}`, ca.Y === 'A' ? 'text-a' : 'text-b')}
      {stat(t.tradePrice, `${icons.X}1 = ${icons.Y}${fmt(result.price, lang)}`)}
      {stat(
        t.gain,
        `${signed(countries.A.gainPct, lang)}% / ${signed(countries.B.gainPct, lang)}%`,
        'text-emerald-600 dark:text-emerald-400',
      )}
    </div>
  )
}
