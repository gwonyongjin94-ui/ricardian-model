import { describe, expect, it } from 'vitest'
import { solve, type ModelInput } from '../model/ricardian'
import { STEP } from './content'
import { quizAnswer, reveal, type LearnState } from './logic'

// Ricardo's example: Portugal (B) has the absolute advantage in both goods,
// but England (A) has the comparative advantage in cloth (X).
const ricardo: ModelInput = {
  A: { aX: 100, aY: 120, labor: 2200 },
  B: { aX: 90, aY: 80, labor: 1700 },
  beta: 0.5,
  priceMode: 'equilibrium',
}

const state = (step: number, answers: Record<number, string> = {}): LearnState => ({
  step,
  answers,
  achieved: new Set(),
  challengeStart: null,
})

describe('quiz answers', () => {
  const r = solve(ricardo)

  it('separates comparative from absolute advantage', () => {
    expect(quizAnswer(STEP.oc, r)).toBe('A')
    expect(quizAnswer(STEP.absolute, r)).toBe('B')
    expect(quizAnswer(STEP.trade, r)).toBe('X')
  })

  it('handles equal opportunity costs', () => {
    const none = solve({ ...ricardo, B: { aX: 200, aY: 240, labor: 100 } })
    expect(quizAnswer(STEP.oc, none)).toBe('same')
    expect(quizAnswer(STEP.absolute, none)).toBe('A')
    expect(quizAnswer(STEP.trade, none)).toBe('none')
  })

  it('has no quiz on other steps', () => {
    expect(quizAnswer(0, r)).toBeNull()
  })
})

describe('reveal', () => {
  it('shows everything outside learn mode', () => {
    expect(reveal(null)).toEqual({ results: true, cards: 5, flows: true, price: true, table: true })
  })

  it('hides results before the opportunity cost step', () => {
    expect(reveal(state(STEP.oc - 1)).results).toBe(false)
    expect(reveal(state(STEP.oc)).results).toBe(true)
  })

  it('keeps the trade arrows hidden until the export quiz is answered', () => {
    expect(reveal(state(STEP.trade)).flows).toBe(false)
    expect(reveal(state(STEP.trade, { [STEP.trade]: 'Y' })).flows).toBe(true)
  })

  it('reveals the opportunity cost card only after the first quiz', () => {
    expect(reveal(state(STEP.oc)).cards).toBe(0)
    expect(reveal(state(STEP.oc, { [STEP.oc]: 'B' })).cards).toBe(1)
  })

  it('reveals comparative advantage only after the absolute advantage quiz', () => {
    expect(reveal(state(STEP.absolute)).cards).toBe(2)
    expect(reveal(state(STEP.absolute, { [STEP.absolute]: 'A' })).cards).toBe(3)
  })
})
