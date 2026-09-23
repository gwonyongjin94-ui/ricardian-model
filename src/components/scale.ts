export const linear = (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
  r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0)

/** A handful of round tick values covering [0, max]. */
export function ticks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0]
  const raw = max / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = 0; v <= max + 1e-9; v += step) out.push(+v.toPrecision(10))
  return out
}

export const MARGIN = { top: 16, right: 16, bottom: 44, left: 52 }
