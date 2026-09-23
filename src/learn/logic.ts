import type { ModelResult } from '../model/ricardian'
import { STEP } from './content'

export type TaskId = 'price-manual' | 'price-edge' | 'flip' | 'equal'

export const STEP_TASKS: Partial<Record<number, TaskId[]>> = {
  [STEP.price]: ['price-manual', 'price-edge'],
  [STEP.challenge]: ['flip', 'equal'],
}

/** The correct answer to each quiz, derived from the current model result. */
export function quizAnswer(step: number, result: ModelResult): string | null {
  const { comparativeAdvantage: ca, absoluteAdvantage: aa } = result
  if (step === STEP.oc) return ca.X ?? 'same'
  if (step === STEP.absolute) return aa.X === 'tie' ? 'same' : aa.X
  if (step === STEP.trade) return ca.X === 'A' ? 'X' : ca.Y === 'A' ? 'Y' : 'none'
  return null
}

export interface LearnState {
  step: number
  answers: Record<number, string>
  achieved: Set<TaskId>
  /** Which country exported X when the challenge step began, to detect a flip. */
  challengeStart: 'A' | 'B' | null
}

/** How much of the results each part of the lesson reveals. Outside learn mode everything is shown. */
export function reveal(learn: LearnState | null) {
  if (!learn) return { results: true, cards: 5, flows: true, price: true, table: true }
  const { step, answers } = learn
  const answered = (s: number) => answers[s] !== undefined
  const cards =
    step < STEP.oc
      ? 0
      : step === STEP.oc
        ? answered(STEP.oc)
          ? 1
          : 0
        : step === STEP.absolute
          ? answered(STEP.absolute)
            ? 3
            : 2
          : step === STEP.trade
            ? 3
            : step === STEP.price
              ? 4
              : 5
  return {
    results: step >= STEP.oc,
    cards,
    flows: step > STEP.trade || (step === STEP.trade && answered(STEP.trade)),
    price: step >= STEP.price,
    table: step >= STEP.gains,
  }
}
