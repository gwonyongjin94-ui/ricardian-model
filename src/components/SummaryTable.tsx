import { fmt, signed } from '../format'
import { useI18n } from '../i18n'
import type { Bundle, ModelResult } from '../model/ricardian'

interface Props {
  names: { A: string; B: string; X: string; Y: string }
  result: ModelResult
}

export function SummaryTable({ names, result }: Props) {
  const { t, lang } = useI18n()
  const f = (v: number) => fmt(v, lang)
  const bundle = (b: Bundle, sign = false) => (
    <>
      {names.X} {sign ? signed(b.X, lang) : f(b.X)}
      <br />
      {names.Y} {sign ? signed(b.Y, lang) : f(b.Y)}
    </>
  )
  const { A, B } = result.countries
  const rows: [string, React.ReactNode, React.ReactNode][] = [
    [t.row.oc(names.X), `${f(A.opportunityCost.X)} ${names.Y}`, `${f(B.opportunityCost.X)} ${names.Y}`],
    [t.row.oc(names.Y), `${f(A.opportunityCost.Y)} ${names.X}`, `${f(B.opportunityCost.Y)} ${names.X}`],
    [t.autarky, bundle(A.autarky.consumption), bundle(B.autarky.consumption)],
    [t.row.prod, bundle(A.trade.production), bundle(B.trade.production)],
    [t.row.cons, bundle(A.trade.consumption), bundle(B.trade.consumption)],
    [t.row.net, bundle(A.trade.netExports, true), bundle(B.trade.netExports, true)],
    [t.row.wage(names.Y), f(A.wage), f(B.wage)],
    [t.row.gain, `${signed(A.gainPct, lang)}%`, `${signed(B.gainPct, lang)}%`],
  ]
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <caption className="px-4 pt-4 text-left text-sm font-semibold">{t.tableTitle}</caption>
        <thead className="text-xs text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-2 text-left font-medium" />
            <th className="px-4 py-2 text-right font-medium text-a">{names.A}</th>
            <th className="px-4 py-2 text-right font-medium text-b">{names.B}</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map(([label, a, b]) => (
            <tr key={label} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{label}</td>
              <td className="px-4 py-2 text-right">{a}</td>
              <td className="px-4 py-2 text-right">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
