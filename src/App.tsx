import { useEffect, useMemo, useState } from 'react'
import { CountryPicker } from './components/CountryPicker'
import { LearnGuide } from './components/LearnGuide'
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
import { LEARN_TEXT, STEP, STEP_FOCUS, type LearnFocus } from './learn/content'
import { reveal, type LearnState, type TaskId } from './learn/logic'
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
  const [learn, setLearn] = useState<LearnState | null>(null)

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

  // Tick off lesson tasks as soon as the user's changes satisfy them. Updating state during render
  // (rather than in an effect) is React's pattern for state that reacts to other state.
  if (learn) {
    const done: TaskId[] = []
    if (learn.step === STEP.price && priceMode === 'manual') {
      done.push('price-manual')
      if (result.tradeCase === 'A-large' || result.tradeCase === 'B-large') done.push('price-edge')
    }
    if (learn.step === STEP.challenge) {
      const x = result.comparativeAdvantage.X
      if (x && learn.challengeStart && x !== learn.challengeStart) done.push('flip')
      if (result.tradeCase === 'no-trade') done.push('equal')
    }
    const fresh = done.filter((id) => !learn.achieved.has(id))
    if (fresh.length) setLearn({ ...learn, achieved: new Set([...learn.achieved, ...fresh]) })
  }

  // Bring the highlighted part of the page into view when the lesson moves on.
  const learnStep = learn?.step
  useEffect(() => {
    if (learnStep === undefined) return
    const target = STEP_FOCUS[learnStep][0]
    const el = target ? document.getElementById(`learn-${target}`) : null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [learnStep])

  const show = reveal(learn)
  const focus = (area: LearnFocus) =>
    'scroll-mt-4 rounded-2xl transition-shadow duration-300 ' +
    (learn && STEP_FOCUS[learn.step].includes(area)
      ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-50 dark:ring-offset-slate-950'
      : '')

  const startLearn = () => {
    setPriceMode('equilibrium')
    setLearn({ step: 0, answers: {}, achieved: new Set(), challengeStart: null })
  }

  const goToStep = (step: number) => {
    if (!learn) return
    setLearn({
      ...learn,
      step,
      challengeStart: step === STEP.challenge ? result.comparativeAdvantage.X : learn.challengeStart,
    })
  }

  const names = {
    A: selected.A ? countryName(selected.A, lang) : `${lang === 'ko' ? '국가' : 'Country'} A`,
    B: selected.B ? countryName(selected.B, lang) : `${lang === 'ko' ? '국가' : 'Country'} B`,
    X: goodLabel(goods.X, lang),
    Y: goodLabel(goods.Y, lang),
  }
  const icons = { X: goodIcon(goods.X), Y: goodIcon(goods.Y) }
  const ready = selected.A !== null && selected.B !== null && result.errors.length === 0

  const flows: Flow[] = []
  if (ready && show.flows && result.tradeCase !== 'no-trade') {
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
      <div className={'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10 ' + (learn ? 'pb-[60vh]' : '')}>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => (learn ? setLearn(null) : startLearn())}
              className={
                'rounded-lg px-3 py-2 text-sm font-semibold transition ' +
                (learn
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300')
              }
              aria-pressed={learn !== null}
            >
              {LEARN_TEXT[lang].toggle}
            </button>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section id="learn-map" className={'space-y-3 ' + focus('map')}>
            <div className="flex items-stretch gap-2">
              <CountryPicker
                slot="A"
                value={selected.A}
                active={activeSlot === 'A'}
                onActivate={() => setActiveSlot('A')}
                onPick={pick}
              />
              <button
                type="button"
                onClick={swap}
                title={t.swap}
                aria-label={t.swap}
                className="self-center rounded-full border border-slate-200 bg-white px-2.5 py-2 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-white"
              >
                ⇄
              </button>
              <CountryPicker
                slot="B"
                value={selected.B}
                active={activeSlot === 'B'}
                onActivate={() => setActiveSlot('B')}
                onPick={pick}
              />
            </div>
            <WorldMap selected={selected} activeSlot={activeSlot} flows={flows} onPick={pick} />
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">{t.mapHint(activeSlot)}</p>
            {ready && show.flows && <Headline names={names} icons={icons} result={result} />}
          </section>

          <aside
            id="learn-inputs"
            className={`${focus(learn?.step === STEP.price ? 'price' : 'inputs')} border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900`}
          >
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
        ) : !show.results ? (
          <p className="mt-10 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-12 text-center text-slate-400 dark:border-slate-800">
            🎓 {LEARN_TEXT[lang].locked}
          </p>
        ) : (
          <main className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {(['A', 'B'] as const).map((k) => (
                <div key={k} id={k === 'A' ? 'learn-ppf' : undefined} className={focus('ppf')}>
                  <PPFChart
                    slot={k}
                    title={`${countryFlag(selected[k]!)} ${t.ppfTitle(names[k])}`}
                    result={result.countries[k]}
                    price={result.price}
                    goods={{ X: `${icons.X} ${names.X}`, Y: `${icons.Y} ${names.Y}` }}
                    showTrade={show.price && result.tradeCase !== 'no-trade'}
                  />
                </div>
              ))}
              {show.price ? (
                <div id="learn-rsrd" className={focus('rsrd')}>
                  <RSRDChart result={result} beta={beta} priceMode={priceMode} goods={{ X: names.X, Y: names.Y }} />
                </div>
              ) : (
                <div className="grid place-items-center rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-slate-800">
                  🔒 {t.rsrdTitle}
                </div>
              )}
            </div>

            {show.cards > 0 && (
              <section id="learn-explain" className={focus('explain')}>
                <h2 className="mb-3 text-lg font-bold">{t.explainTitle}</h2>
                <Explanation names={names} inputs={inputs} result={result} priceMode={priceMode} upTo={show.cards} />
              </section>
            )}

            {show.table && (
              <div id="learn-table" className={focus('table')}>
                <SummaryTable names={names} result={result} />
              </div>
            )}
          </main>
        )}

        {learn && (
          <LearnGuide
            step={learn.step}
            vars={{
              n: names,
              aXA: fmt(inputs.A.aX, lang),
              aYA: fmt(inputs.A.aY, lang),
              lo: fmt(result.priceBand[0], lang),
              hi: fmt(result.priceBand[1], lang),
              gainA: signed(result.countries.A.gainPct, lang),
              gainB: signed(result.countries.B.gainPct, lang),
            }}
            icons={icons}
            result={result}
            answers={learn.answers}
            achieved={learn.achieved}
            onAnswer={(step, choice) => setLearn({ ...learn, answers: { ...learn.answers, [step]: choice } })}
            onStep={goToStep}
            onExit={() => setLearn(null)}
          />
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
      <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold dark:bg-slate-800">
        {t.noTradeBadge}
      </div>
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
      {stat(
        t.exports(names[ca.X!], names.X),
        `${icons.X} ${fmt(countries[ca.X!].trade.netExports.X, lang)}`,
        ca.X === 'A' ? 'text-a' : 'text-b',
      )}
      {stat(
        t.exports(names[ca.Y!], names.Y),
        `${icons.Y} ${fmt(countries[ca.Y!].trade.netExports.Y, lang)}`,
        ca.Y === 'A' ? 'text-a' : 'text-b',
      )}
      {stat(t.tradePrice, `${icons.X}1 = ${icons.Y}${fmt(result.price, lang)}`)}
      {stat(
        t.gain,
        `${signed(countries.A.gainPct, lang)}% / ${signed(countries.B.gainPct, lang)}%`,
        'text-emerald-600 dark:text-emerald-400',
      )}
    </div>
  )
}
