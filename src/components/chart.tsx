import type { ReactNode } from 'react'
import { linear, MARGIN, ticks } from './scale'

interface FrameProps {
  width: number
  height: number
  xMax: number
  yMax: number
  xLabel: string
  yLabel: string
  format: (v: number) => string
  children: ReactNode
}

/** Axes, grid and labels shared by the charts. Children draw in data space via the scales they compute. */
export function Frame({ width, height, xMax, yMax, xLabel, yLabel, format, children }: FrameProps) {
  const x = linear(0, xMax, MARGIN.left, width - MARGIN.right)
  const y = linear(0, yMax, height - MARGIN.bottom, MARGIN.top)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full overflow-visible text-slate-500 dark:text-slate-400">
      {ticks(xMax).map((v) => (
        <g key={`x${v}`}>
          <line x1={x(v)} x2={x(v)} y1={MARGIN.top} y2={height - MARGIN.bottom} className="stroke-slate-200 dark:stroke-slate-800" />
          <text x={x(v)} y={height - MARGIN.bottom + 16} textAnchor="middle" className="fill-current text-[11px]">
            {format(v)}
          </text>
        </g>
      ))}
      {ticks(yMax).map((v) => (
        <g key={`y${v}`}>
          <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(v)} y2={y(v)} className="stroke-slate-200 dark:stroke-slate-800" />
          <text x={MARGIN.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-current text-[11px]">
            {format(v)}
          </text>
        </g>
      ))}
      <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(0)} y2={y(0)} className="stroke-slate-400 dark:stroke-slate-600" />
      <line x1={x(0)} x2={x(0)} y1={MARGIN.top} y2={y(0)} className="stroke-slate-400 dark:stroke-slate-600" />
      <text x={(MARGIN.left + width - MARGIN.right) / 2} y={height - 6} textAnchor="middle" className="fill-current text-[12px]">
        {xLabel}
      </text>
      <text
        transform={`translate(14,${(MARGIN.top + height - MARGIN.bottom) / 2}) rotate(-90)`}
        textAnchor="middle"
        className="fill-current text-[12px]"
      >
        {yLabel}
      </text>
      <defs>
        <clipPath id={`plot-${width}-${height}`}>
          <rect x={MARGIN.left} y={MARGIN.top} width={width - MARGIN.left - MARGIN.right} height={height - MARGIN.top - MARGIN.bottom} />
        </clipPath>
      </defs>
      <g clipPath={`url(#plot-${width}-${height})`}>{children}</g>
    </svg>
  )
}

export function LegendItem({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden>
        {swatch}
      </svg>
      {label}
    </span>
  )
}
