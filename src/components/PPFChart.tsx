import { fmt } from '../format'
import { useI18n } from '../i18n'
import type { CountryResult } from '../model/ricardian'
import { Frame, LegendItem } from './chart'
import { linear, MARGIN } from './scale'

const W = 360
const H = 280

interface Props {
  slot: 'A' | 'B'
  title: string
  result: CountryResult
  price: number
  goods: { X: string; Y: string }
  showTrade: boolean
}

export function PPFChart({ slot, title, result, price, goods, showTrade }: Props) {
  const { lang, t } = useI18n()
  const { ppfMax, autarky, trade } = result
  const xMax = Math.max(ppfMax.X, showTrade ? trade.consumption.X : 0) * 1.2
  const yMax = Math.max(ppfMax.Y, showTrade ? trade.consumption.Y : 0) * 1.2
  const x = linear(0, xMax, MARGIN.left, W - MARGIN.right)
  const y = linear(0, yMax, H - MARGIN.bottom, MARGIN.top)

  const prod = trade.production
  const cons = trade.consumption
  // Trade line: all bundles worth the same as production at the world price (slope −p).
  const income = prod.Y + price * prod.X
  const stroke = slot === 'A' ? 'stroke-a' : 'stroke-b'
  const fill = slot === 'A' ? 'fill-a' : 'fill-b'

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <figcaption className="mb-2 text-sm font-semibold">{title}</figcaption>
      <Frame
        width={W}
        height={H}
        xMax={xMax}
        yMax={yMax}
        xLabel={goods.X}
        yLabel={goods.Y}
        format={(v) => fmt(v, lang)}
      >
        <polygon
          points={`${x(0)},${y(0)} ${x(ppfMax.X)},${y(0)} ${x(0)},${y(ppfMax.Y)}`}
          className={slot === 'A' ? 'fill-a/10' : 'fill-b/10'}
        />
        <line
          x1={x(ppfMax.X)}
          y1={y(0)}
          x2={x(0)}
          y2={y(ppfMax.Y)}
          strokeWidth={2.5}
          className={stroke}
        />

        {showTrade && (
          <>
            <line
              x1={x(0)}
              y1={y(income)}
              x2={x(income / price)}
              y2={y(0)}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              className="stroke-slate-500 dark:stroke-slate-400"
            />
            {/* Trade triangle: exports and imports between production and consumption. */}
            <path
              d={`M${x(prod.X)},${y(prod.Y)} L${x(cons.X)},${y(prod.Y)} L${x(cons.X)},${y(cons.Y)}`}
              fill="none"
              strokeWidth={1.5}
              className="stroke-emerald-500"
            />
            <rect x={x(prod.X) - 6} y={y(prod.Y) - 6} width={12} height={12} className={fill} stroke="white" strokeWidth={1.5} />
            <circle cx={x(cons.X)} cy={y(cons.Y)} r={7} className="fill-emerald-500" stroke="white" strokeWidth={1.5} />
          </>
        )}
        <circle
          cx={x(autarky.consumption.X)}
          cy={y(autarky.consumption.Y)}
          r={6}
          className="fill-white stroke-slate-700 dark:fill-slate-900 dark:stroke-slate-200"
          strokeWidth={2}
        />
      </Frame>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
        <LegendItem
          swatch={<circle r={5} className="fill-white stroke-slate-700 dark:fill-slate-900 dark:stroke-slate-200" strokeWidth={2} />}
          label={t.autarky}
        />
        {showTrade && (
          <>
            <LegendItem swatch={<rect x={-5} y={-5} width={10} height={10} className={fill} />} label={t.production} />
            <LegendItem swatch={<circle r={5} className="fill-emerald-500" />} label={t.consumption} />
            <LegendItem
              swatch={<line x1={-6} x2={6} className="stroke-slate-500" strokeWidth={1.5} strokeDasharray="3 2" />}
              label={t.tradeLine}
            />
          </>
        )}
      </div>
    </figure>
  )
}
