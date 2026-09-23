import { describe, expect, it } from 'vitest'
import { relativeDemand, relativeSupply, solve, type ModelInput } from './ricardian'

// A: X takes 1 hour, Y takes 2 hours. B: X takes 6 hours, Y takes 3 hours.
// Autarky prices: A = 0.5, B = 2. A has the comparative advantage in X.
const base: ModelInput = {
  A: { aX: 1, aY: 2, labor: 100 },
  B: { aX: 6, aY: 3, labor: 100 },
  beta: 0.75,
  priceMode: 'equilibrium',
}

describe('advantages', () => {
  it('finds absolute and comparative advantage', () => {
    const r = solve(base)
    expect(r.absoluteAdvantage).toEqual({ X: 'A', Y: 'A' })
    expect(r.comparativeAdvantage).toEqual({ X: 'A', Y: 'B' })
    expect(r.countries.A.opportunityCost.X).toBeCloseTo(0.5)
    expect(r.countries.B.opportunityCost.X).toBeCloseTo(2)
    expect(r.priceBand).toEqual([0.5, 2])
  })
})

describe('equilibrium with complete specialisation', () => {
  const r = solve(base)

  it('lands strictly between the autarky prices', () => {
    expect(r.tradeCase).toBe('complete')
    expect(r.rsFlat).toBeCloseTo(3)
    expect(r.price).toBeCloseTo(1)
    expect(relativeDemand(base.beta, r.price)).toBeCloseTo(r.rsFlat)
  })

  it('specialises and clears both markets', () => {
    expect(r.countries.A.specialization).toBe('X')
    expect(r.countries.B.specialization).toBe('Y')
    expect(r.world.excessSupply.X).toBeCloseTo(0)
    expect(r.world.excessSupply.Y).toBeCloseTo(0)
    expect(r.countries.A.trade.netExports.X).toBeGreaterThan(0)
    expect(r.countries.B.trade.netExports.Y).toBeGreaterThan(0)
  })

  it('balances trade for each country', () => {
    for (const c of [r.countries.A, r.countries.B]) {
      expect(c.trade.netExports.X * r.price + c.trade.netExports.Y).toBeCloseTo(0)
    }
  })

  it('makes both countries better off', () => {
    expect(r.countries.A.gainPct).toBeGreaterThan(0)
    expect(r.countries.B.gainPct).toBeGreaterThan(0)
  })

  it('keeps the relative wage within the productivity bounds', () => {
    expect(r.relativeWage.value).toBeCloseTo(3)
    expect(r.relativeWage.bounds).toEqual([1.5, 6])
  })
})

describe('large country case', () => {
  // Low demand for X: RD crosses RS on A's vertical segment.
  const r = solve({ ...base, beta: 0.5 })

  it('sets the price at the large country autarky price', () => {
    expect(r.unclampedPrice).toBeLessThan(0.5)
    expect(r.price).toBeCloseTo(0.5)
    expect(r.tradeCase).toBe('A-large')
  })

  it('has the large country produce both goods and gain nothing', () => {
    expect(r.countries.A.specialization).toBe('both')
    expect(r.countries.A.trade.production.X).toBeCloseTo(250 / 3)
    expect(r.countries.A.trade.production.Y).toBeCloseTo(25 / 3)
    expect(r.countries.A.gainPct).toBeCloseTo(0)
    expect(r.countries.B.gainPct).toBeGreaterThan(0)
  })

  it('still clears the world market', () => {
    expect(r.world.excessSupply.X).toBeCloseTo(0)
    expect(r.world.excessSupply.Y).toBeCloseTo(0)
  })

  it('works when the comparative advantage is reversed', () => {
    const swapped = solve({ ...base, A: base.B, B: base.A, beta: 0.5 })
    expect(swapped.tradeCase).toBe('B-large')
    expect(swapped.comparativeAdvantage).toEqual({ X: 'B', Y: 'A' })
    expect(swapped.world.excessSupply.X).toBeCloseTo(0)
  })

  it('handles a large Y specialist', () => {
    const r2 = solve({ ...base, beta: 0.95 })
    expect(r2.tradeCase).toBe('B-large')
    expect(r2.price).toBeCloseTo(2)
    expect(r2.countries.B.specialization).toBe('both')
    expect(r2.world.excessSupply.X).toBeCloseTo(0)
    expect(r2.world.excessSupply.Y).toBeCloseTo(0)
  })
})

describe('manual price', () => {
  it('uses the given price and reports market imbalance', () => {
    const r = solve({ ...base, priceMode: 'manual', manualPrice: 1.5 })
    expect(r.price).toBeCloseTo(1.5)
    expect(r.tradeCase).toBe('complete')
    expect(r.world.excessSupply.X).not.toBeCloseTo(0)
  })

  it('clamps to the autarky price band', () => {
    expect(solve({ ...base, priceMode: 'manual', manualPrice: 10 }).price).toBeCloseTo(2)
    expect(solve({ ...base, priceMode: 'manual', manualPrice: 0.01 }).price).toBeCloseTo(0.5)
  })

  it('has the indifferent country not trade at its own autarky price', () => {
    const r = solve({ ...base, priceMode: 'manual', manualPrice: 0.5 })
    expect(r.countries.A.trade.netExports.X).toBeCloseTo(0)
    expect(r.countries.A.gainPct).toBeCloseTo(0)
  })
})

describe('no trade', () => {
  it('detects equal opportunity costs', () => {
    const r = solve({ ...base, B: { aX: 3, aY: 6, labor: 50 } })
    expect(r.tradeCase).toBe('no-trade')
    expect(r.comparativeAdvantage).toEqual({ X: null, Y: null })
    expect(r.countries.A.gainPct).toBeCloseTo(0)
    expect(r.countries.B.trade.netExports.Y).toBeCloseTo(0)
  })
})

describe('validation', () => {
  it('rejects non-positive inputs and bad beta', () => {
    const r = solve({ ...base, A: { aX: 0, aY: 2, labor: -1 }, beta: 1 })
    expect(r.errors).toEqual(['A.aX', 'A.labor', 'beta'])
  })
})

describe('relative supply', () => {
  it('is a step function', () => {
    expect(relativeSupply(base, 0.3)).toEqual([0, 0])
    expect(relativeSupply(base, 0.5)[1]).toBeCloseTo(3)
    expect(relativeSupply(base, 1)[0]).toBeCloseTo(3)
    expect(relativeSupply(base, 3)).toEqual([Infinity, Infinity])
  })
})
