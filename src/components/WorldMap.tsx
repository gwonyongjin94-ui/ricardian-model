import { useEffect, useMemo, useRef, useState } from 'react'
import { anchor, COUNTRY_FEATURES, fitView, FULL_VIEW, path, WIDTH, type ViewBox } from '../geo'
import { countryName, useI18n } from '../i18n'

export interface Flow {
  from: 'A' | 'B'
  icon: string
  label: string
}

interface Props {
  selected: { A: string | null; B: string | null }
  activeSlot: 'A' | 'B'
  flows: Flow[]
  onPick: (id: string) => void
}

/** Animate the view box towards a target with an ease-out curve. */
function useAnimatedView(target: ViewBox): ViewBox {
  const [view, setView] = useState(target)
  const current = useRef(target)
  useEffect(() => {
    const from = current.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600)
      const e = 1 - Math.pow(1 - t, 3)
      const next = from.map((v, i) => v + (target[i] - v) * e) as ViewBox
      current.current = next
      setView(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return view
}

export function WorldMap({ selected, activeSlot, flows, onPick }: Props) {
  const { lang, t } = useI18n()
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null)
  const [zoomed, setZoomed] = useState(true)

  const paths = useMemo(() => COUNTRY_FEATURES.map((f) => ({ id: f.id, name: f.properties.name, d: path(f) ?? '' })), [])

  const pair = useMemo(() => {
    const find = (id: string | null) => (id ? COUNTRY_FEATURES.find((f) => f.id === id) : undefined)
    const a = find(selected.A)
    const b = find(selected.B)
    return a && b ? { a, b } : null
  }, [selected.A, selected.B])

  const anchors = pair ? { A: anchor(pair.a), B: anchor(pair.b) } : null
  const target = useMemo(() => (pair && zoomed ? fitView([pair.a, pair.b]) : FULL_VIEW), [pair, zoomed])
  const view = useAnimatedView(target)
  // Overlay sizes are divided by the zoom factor so they look the same at every zoom level.
  const k = WIDTH / view[2]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-sky-50/60 dark:border-slate-800 dark:bg-slate-900">
      <svg
        viewBox={view.join(' ')}
        className="block h-auto w-full"
        role="img"
        aria-label={t.mapHint(activeSlot)}
        onMouseLeave={() => setHover(null)}
      >
        <g>
          {paths.map((p) => {
            const slot = p.id === selected.A ? 'A' : p.id === selected.B ? 'B' : null
            return (
              <path
                key={p.id}
                d={p.d}
                vectorEffect="non-scaling-stroke"
                onClick={() => onPick(p.id)}
                onMouseMove={(e) => {
                  const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
                  setHover({ id: p.id, x: e.clientX - box.left, y: e.clientY - box.top })
                }}
                className={
                  'cursor-pointer stroke-white stroke-[0.75] transition-colors duration-200 dark:stroke-slate-900 ' +
                  (slot === 'A'
                    ? 'fill-a'
                    : slot === 'B'
                      ? 'fill-b'
                      : activeSlot === 'A'
                        ? 'fill-slate-300 hover:fill-blue-300 dark:fill-slate-700 dark:hover:fill-blue-800'
                        : 'fill-slate-300 hover:fill-orange-300 dark:fill-slate-700 dark:hover:fill-orange-800')
                }
              />
            )
          })}
        </g>

        {anchors && <TradeArrows anchors={anchors} flows={flows} k={k} />}

        {anchors &&
          (['A', 'B'] as const).map((slot) => (
            <g key={slot} transform={`translate(${anchors[slot][0]},${anchors[slot][1]}) scale(${1 / k})`} pointerEvents="none">
              <circle r={11} className={slot === 'A' ? 'fill-a' : 'fill-b'} stroke="white" strokeWidth={2} />
              <text textAnchor="middle" dy="0.35em" className="fill-white text-[11px] font-bold">
                {slot}
              </text>
            </g>
          ))}
      </svg>

      {pair && (
        <button
          type="button"
          onClick={() => setZoomed((z) => !z)}
          className="absolute top-2 right-2 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/90"
        >
          {zoomed ? t.zoomOut : t.zoomIn}
        </button>
      )}

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-slate-900/90 px-2 py-1 text-xs whitespace-nowrap text-white shadow"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          {countryName(hover.id, lang, paths.find((p) => p.id === hover.id)?.name)}
        </div>
      )}
    </div>
  )
}

/** Curved arrows between the two countries with the traded good's icon moving along each one. */
function TradeArrows({
  anchors,
  flows,
  k,
}: {
  anchors: { A: [number, number]; B: [number, number] }
  flows: Flow[]
  k: number
}) {
  return (
    <g pointerEvents="none">
      <defs>
        {(['A', 'B'] as const).map((slot) => (
          <marker key={slot} id={`arrow-${slot}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className={slot === 'A' ? 'fill-a' : 'fill-b'} />
          </marker>
        ))}
      </defs>
      {flows.map((flow) => {
        const [x1, y1] = anchors[flow.from]
        const [x2, y2] = anchors[flow.from === 'A' ? 'B' : 'A']
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.hypot(dx, dy) || 1
        // Bend each arrow to its own side so the two flows don't overlap.
        const bend = Math.max(len * 0.3, 30 / k)
        const nx = -dy / len
        const ny = dx / len
        const cx = (x1 + x2) / 2 + nx * bend
        const cy = (y1 + y2) / 2 + ny * bend
        // Stop short of the country markers.
        const trim = Math.min(0.3, 16 / k / len)
        const sx = x1 + (cx - x1) * trim * 2
        const sy = y1 + (cy - y1) * trim * 2
        const ex = x2 + (cx - x2) * trim * 2
        const ey = y2 + (cy - y2) * trim * 2
        const d = `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`
        // Point on the curve at t = 0.5, where the label sits.
        const mx = (sx + 2 * cx + ex) / 4
        const my = (sy + 2 * cy + ey) / 4
        const id = `flow-${flow.from}`
        const tone = flow.from === 'A' ? 'a' : 'b'
        return (
          <g key={id}>
            <path
              id={id}
              d={d}
              fill="none"
              strokeWidth={3 / k}
              strokeLinecap="round"
              strokeDasharray={`${6 / k} ${5 / k}`}
              markerEnd={`url(#arrow-${flow.from})`}
              className={tone === 'a' ? 'stroke-a' : 'stroke-b'}
            >
              <animate attributeName="stroke-dashoffset" from={22 / k} to="0" dur="0.8s" repeatCount="indefinite" />
            </path>
            <text fontSize={22 / k} textAnchor="middle" dy="0.35em">
              {flow.icon}
              <animateMotion dur="2.6s" repeatCount="indefinite" rotate="0">
                <mpath href={`#${id}`} />
              </animateMotion>
            </text>
            <text
              x={mx + (nx * 18) / k}
              y={my + (ny * 18) / k}
              textAnchor="middle"
              dy="0.35em"
              fontSize={13 / k}
              className={'font-semibold ' + (tone === 'a' ? 'fill-a' : 'fill-b')}
              stroke="white"
              strokeWidth={4 / k}
              paintOrder="stroke"
            >
              {flow.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}
