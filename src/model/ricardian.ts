/**
 * Two-country, two-good Ricardian model.
 *
 * Conventions
 * - Goods are X and Y. Prices are relative: p = P_X / P_Y, with P_Y normalised to 1,
 *   so every value (wages, incomes) is measured in units of good Y.
 * - a_X, a_Y are unit labour requirements (hours of labour per unit of output).
 * - Demand is Cobb-Douglas and identical in both countries: a share `beta` of income
 *   is spent on X. This gives the world relative demand curve RD: Q_X / Q_Y = beta / ((1 - beta) p).
 */

export type CountryKey = 'A' | 'B'
export type GoodKey = 'X' | 'Y'
export type PriceMode = 'equilibrium' | 'manual'

export interface CountryInput {
  /** Unit labour requirement for good X (a_LX). */
  aX: number
  /** Unit labour requirement for good Y (a_LY). */
  aY: number
  /** Labour endowment (L). */
  labor: number
}

export interface ModelInput {
  A: CountryInput
  B: CountryInput
  /** Share of income spent on good X, strictly between 0 and 1. */
  beta: number
  priceMode: PriceMode
  /** Relative price P_X / P_Y used when priceMode is 'manual'. Clamped to the autarky price band. */
  manualPrice?: number
}

export interface Bundle {
  X: number
  Y: number
}

export type Specialization = 'X' | 'Y' | 'both'

/**
 * Where the trading price lands relative to the two autarky prices.
 * - complete: strictly between them, both countries specialise completely
 * - A-large / B-large: equal to that country's autarky price, so it keeps producing both goods
 *   and gains nothing from trade
 * - no-trade: both countries have the same opportunity cost
 */
export type TradeCase = 'complete' | 'A-large' | 'B-large' | 'no-trade'

export interface CountryResult {
  /** Autarky relative price of X, equal to the opportunity cost of X (a_X / a_Y). */
  autarkyPrice: number
  /** Opportunity cost of one unit of each good, measured in units of the other good. */
  opportunityCost: Bundle
  /** Intercepts of the production possibility frontier (L / a_X, L / a_Y). */
  ppfMax: Bundle
  autarky: { production: Bundle; consumption: Bundle; utility: number }
  trade: {
    production: Bundle
    consumption: Bundle
    /** Positive means exported, negative means imported. */
    netExports: Bundle
    utility: number
  }
  specialization: Specialization
  /** Wage in units of good Y. */
  wage: number
  /** Income (wage × labour) in units of good Y. */
  income: number
  /** Welfare gain from trade, as a percentage change in utility. */
  gainPct: number
}

export interface ModelResult {
  errors: string[]
  absoluteAdvantage: Record<GoodKey, CountryKey | 'tie'>
  /** Which country has the comparative advantage in each good; null when opportunity costs are equal. */
  comparativeAdvantage: Record<GoodKey, CountryKey | null>
  tradeCase: TradeCase
  /** Relative price actually used (P_X / P_Y). */
  price: number
  /** Price where RD meets the flat middle of RS, before clamping to the autarky price band. */
  unclampedPrice: number
  /** [lower, upper] autarky prices; the trading price must lie in this band. */
  priceBand: [number, number]
  /** Relative supply of X when both countries specialise completely (the flat middle of RS). */
  rsFlat: number
  relativeWage: { value: number; bounds: [number, number] }
  countries: Record<CountryKey, CountryResult>
  world: {
    production: Bundle
    consumption: Bundle
    /** Production minus consumption. Non-zero only in manual price mode. */
    excessSupply: Bundle
  }
}

const EPS = 1e-9

const other = (c: CountryKey): CountryKey => (c === 'A' ? 'B' : 'A')

const nearlyEqual = (a: number, b: number) => Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b))

const utility = (c: Bundle, beta: number) => Math.pow(c.X, beta) * Math.pow(c.Y, 1 - beta)

/** Cobb-Douglas demand for a given income (in Y units) at relative price p. */
const demand = (income: number, p: number, beta: number): Bundle => ({
  X: (beta * income) / p,
  Y: (1 - beta) * income,
})

export function validate(input: ModelInput): string[] {
  const errors: string[] = []
  for (const key of ['A', 'B'] as const) {
    const c = input[key]
    for (const field of ['aX', 'aY', 'labor'] as const) {
      if (!Number.isFinite(c[field]) || c[field] <= 0) errors.push(`${key}.${field}`)
    }
  }
  if (!Number.isFinite(input.beta) || input.beta <= 0 || input.beta >= 1) errors.push('beta')
  if (input.priceMode === 'manual' && !Number.isFinite(input.manualPrice ?? NaN)) errors.push('manualPrice')
  return errors
}

/** Relative supply of X at price p. Returns [min, max] because RS is vertical at the autarky prices. */
export function relativeSupply(input: ModelInput, p: number): [number, number] {
  const r = baseline(input)
  const [lo, hi] = r.band
  if (r.xSpecialist === null) {
    if (p < lo) return [0, 0]
    if (p > lo) return [Infinity, Infinity]
    return [0, Infinity]
  }
  if (p < lo && !nearlyEqual(p, lo)) return [0, 0]
  if (nearlyEqual(p, lo)) return [0, r.rsFlat]
  if (p < hi && !nearlyEqual(p, hi)) return [r.rsFlat, r.rsFlat]
  if (nearlyEqual(p, hi)) return [r.rsFlat, Infinity]
  return [Infinity, Infinity]
}

/** Relative demand for X at price p. */
export const relativeDemand = (beta: number, p: number) => beta / ((1 - beta) * p)

function baseline(input: ModelInput) {
  const pA = input.A.aX / input.A.aY
  const pB = input.B.aX / input.B.aY
  const xSpecialist: CountryKey | null = nearlyEqual(pA, pB) ? null : pA < pB ? 'A' : 'B'
  const band: [number, number] = [Math.min(pA, pB), Math.max(pA, pB)]
  let rsFlat = NaN
  if (xSpecialist) {
    const s = input[xSpecialist]
    const t = input[other(xSpecialist)]
    rsFlat = s.labor / s.aX / (t.labor / t.aY)
  }
  return { pA, pB, xSpecialist, band, rsFlat }
}

export function solve(input: ModelInput): ModelResult {
  const errors = validate(input)
  if (errors.length) return emptyResult(errors)

  const { beta } = input
  const { pA, pB, xSpecialist, band, rsFlat } = baseline(input)
  const [lo, hi] = band

  // Price where RD crosses the flat part of RS.
  const unclampedPrice = xSpecialist ? beta / ((1 - beta) * rsFlat) : pA

  let price: number
  if (!xSpecialist) price = pA
  else if (input.priceMode === 'manual') price = clamp(input.manualPrice as number, lo, hi)
  else price = clamp(unclampedPrice, lo, hi)

  let tradeCase: TradeCase
  if (!xSpecialist) tradeCase = 'no-trade'
  else if (nearlyEqual(price, lo)) tradeCase = xSpecialist === 'A' ? 'A-large' : 'B-large'
  else if (nearlyEqual(price, hi)) tradeCase = xSpecialist === 'A' ? 'B-large' : 'A-large'
  else tradeCase = 'complete'

  // Wages: labour moves to whichever sector pays more, so w = max(p / a_X, 1 / a_Y).
  const wage = (c: CountryInput) => Math.max(price / c.aX, 1 / c.aY)
  const income = { A: wage(input.A) * input.A.labor, B: wage(input.B) * input.B.labor }

  const consumption: Record<CountryKey, Bundle> = {
    A: demand(income.A, price, beta),
    B: demand(income.B, price, beta),
  }

  const production = produce(input, tradeCase, xSpecialist, consumption)

  const countries = {} as Record<CountryKey, CountryResult>
  for (const key of ['A', 'B'] as const) {
    const c = input[key]
    const autarkyPrice = key === 'A' ? pA : pB
    const autarkyBundle: Bundle = { X: (beta * c.labor) / c.aX, Y: ((1 - beta) * c.labor) / c.aY }
    const prod = production[key]
    const cons = consumption[key]
    const uAut = utility(autarkyBundle, beta)
    const uTrade = utility(cons, beta)
    countries[key] = {
      autarkyPrice,
      opportunityCost: { X: c.aX / c.aY, Y: c.aY / c.aX },
      ppfMax: { X: c.labor / c.aX, Y: c.labor / c.aY },
      autarky: { production: autarkyBundle, consumption: autarkyBundle, utility: uAut },
      trade: {
        production: prod,
        consumption: cons,
        netExports: { X: prod.X - cons.X, Y: prod.Y - cons.Y },
        utility: uTrade,
      },
      specialization: prod.X > EPS && prod.Y > EPS ? 'both' : prod.X > EPS ? 'X' : 'Y',
      wage: wage(c),
      income: income[key],
      gainPct: (uTrade / uAut - 1) * 100,
    }
  }

  const worldProd = add(production.A, production.B)
  const worldCons = add(consumption.A, consumption.B)

  return {
    errors: [],
    absoluteAdvantage: {
      X: compareLower(input.A.aX, input.B.aX),
      Y: compareLower(input.A.aY, input.B.aY),
    },
    comparativeAdvantage: {
      X: xSpecialist,
      Y: xSpecialist ? other(xSpecialist) : null,
    },
    tradeCase,
    price,
    unclampedPrice,
    priceBand: band,
    rsFlat,
    relativeWage: {
      value: countries.A.wage / countries.B.wage,
      // w_A / w_B lies between the productivity ratios of the two goods.
      bounds: sortPair(input.B.aX / input.A.aX, input.B.aY / input.A.aY),
    },
    countries,
    world: {
      production: worldProd,
      consumption: worldCons,
      excessSupply: { X: worldProd.X - worldCons.X, Y: worldProd.Y - worldCons.Y },
    },
  }
}

/**
 * Production given the trading price.
 * - At a price strictly inside the band each country specialises completely.
 * - A country whose autarky price equals the trading price is indifferent between goods.
 *   In equilibrium mode it produces whatever clears the world market; in manual mode
 *   there is no market clearing, so it simply produces its own consumption (no trade).
 */
function produce(
  input: ModelInput,
  tradeCase: TradeCase,
  xSpecialist: CountryKey | null,
  consumption: Record<CountryKey, Bundle>,
): Record<CountryKey, Bundle> {
  const full = (c: CountryInput, g: GoodKey): Bundle =>
    g === 'X' ? { X: c.labor / c.aX, Y: 0 } : { X: 0, Y: c.labor / c.aY }

  if (!xSpecialist) return { A: consumption.A, B: consumption.B }

  const s = xSpecialist
  const t = other(s)
  const out = {} as Record<CountryKey, Bundle>
  out[s] = full(input[s], 'X')
  out[t] = full(input[t], 'Y')

  if (tradeCase === 'complete') return out

  const large: CountryKey = tradeCase === 'A-large' ? 'A' : 'B'
  const small = other(large)
  const c = input[large]

  if (input.priceMode === 'manual') {
    out[large] = consumption[large]
    return out
  }

  // Equilibrium: the large country fills the gap in world demand for the good the small country doesn't make.
  const worldX = consumption.A.X + consumption.B.X
  const worldY = consumption.A.Y + consumption.B.Y
  if (small === t) {
    // Small country makes only Y; large country supplies all X and the rest of Y.
    const X = worldX
    out[large] = { X, Y: Math.max(0, (c.labor - c.aX * X) / c.aY) }
  } else {
    // Small country makes only X; large country supplies all Y and the rest of X.
    const Y = worldY
    out[large] = { X: Math.max(0, (c.labor - c.aY * Y) / c.aX), Y }
  }
  return out
}

function emptyResult(errors: string[]): ModelResult {
  const zero: Bundle = { X: 0, Y: 0 }
  const country: CountryResult = {
    autarkyPrice: NaN,
    opportunityCost: zero,
    ppfMax: zero,
    autarky: { production: zero, consumption: zero, utility: 0 },
    trade: { production: zero, consumption: zero, netExports: zero, utility: 0 },
    specialization: 'both',
    wage: NaN,
    income: NaN,
    gainPct: NaN,
  }
  return {
    errors,
    absoluteAdvantage: { X: 'tie', Y: 'tie' },
    comparativeAdvantage: { X: null, Y: null },
    tradeCase: 'no-trade',
    price: NaN,
    unclampedPrice: NaN,
    priceBand: [NaN, NaN],
    rsFlat: NaN,
    relativeWage: { value: NaN, bounds: [NaN, NaN] },
    countries: { A: country, B: country },
    world: { production: zero, consumption: zero, excessSupply: zero },
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const add = (a: Bundle, b: Bundle): Bundle => ({ X: a.X + b.X, Y: a.Y + b.Y })
const sortPair = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a])
const compareLower = (a: number, b: number): CountryKey | 'tie' =>
  nearlyEqual(a, b) ? 'tie' : a < b ? 'A' : 'B'
