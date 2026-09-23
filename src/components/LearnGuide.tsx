import { useState } from 'react'
import { useI18n } from '../i18n'
import { LEARN_STEPS, LEARN_TEXT, STEP, type LearnVars } from '../learn/content'
import { quizAnswer, STEP_TASKS, type TaskId } from '../learn/logic'
import type { ModelResult } from '../model/ricardian'

interface Props {
  step: number
  vars: LearnVars
  icons: { X: string; Y: string }
  result: ModelResult
  answers: Record<number, string>
  achieved: Set<TaskId>
  onAnswer: (step: number, choice: string) => void
  onStep: (step: number) => void
  onExit: () => void
}

export function LearnGuide({ step, vars, icons, result, answers, achieved, onAnswer, onStep, onExit }: Props) {
  const { lang } = useI18n()
  const L = LEARN_TEXT[lang]
  const [collapsed, setCollapsed] = useState(false)
  const s = L.steps[step]
  const { n } = vars

  const answer = quizAnswer(step, result)
  const chosen = answers[step]
  const solved = chosen !== undefined && chosen === answer

  const options: [string, string][] =
    step === STEP.trade
      ? [
          ['X', `${icons.X} ${n.X}`],
          ['Y', `${icons.Y} ${n.Y}`],
          ['none', L.noExport],
        ]
      : [
          ['A', n.A],
          ['B', n.B],
          ['same', L.same],
        ]

  const tasks = STEP_TASKS[step] ?? []
  const last = step === LEARN_STEPS - 1

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-6 sm:pb-6" role="dialog" aria-label={L.toggle}>
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-5 dark:border-amber-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex flex-1 gap-1" aria-hidden>
            {Array.from({ length: LEARN_STEPS }, (_, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                onClick={() => onStep(i)}
                className={
                  'h-1.5 flex-1 rounded-full transition ' +
                  (i < step ? 'bg-amber-400' : i === step ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700')
                }
              />
            ))}
          </div>
          <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">{L.stepOf(step + 1, LEARN_STEPS)}</span>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? L.expand : L.collapse}
            title={collapsed ? L.expand : L.collapse}
            className="grid h-6 w-6 place-items-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {collapsed ? '▴' : '▾'}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="text-xs text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
          >
            {L.exit}
          </button>
        </div>

        <h2 className="cursor-pointer text-lg font-bold" onClick={() => collapsed && setCollapsed(false)}>
          {s.title}
        </h2>
        {!collapsed && (
          <>
            <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{s.body(vars)}</p>

            {s.quiz && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-sm font-semibold">❓ {s.quiz(vars)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.map(([value, label]) => {
                    const picked = chosen === value
                    const tone = !picked
                      ? 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900'
                      : value === answer
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onAnswer(step, value)}
                        className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition ${tone}`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                {chosen !== undefined && (
                  <p
                    className={`mt-2 text-sm ${solved ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}
                  >
                    {solved ? `✅ ${L.correct} ${s.after ?? ''}` : `🤔 ${L.wrong} ${s.hint?.(vars) ?? ''}`}
                  </p>
                )}
              </div>
            )}

            {tasks.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {tasks.map((id, i) => {
                  const done = achieved.has(id)
                  return (
                    <li key={id} className="flex items-start gap-2 text-sm">
                      <span
                        className={
                          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-xs ' +
                          (done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600')
                        }
                      >
                        {done ? '✓' : ''}
                      </span>
                      <span className={done ? 'text-slate-400 line-through' : ''}>{s.tasks?.[i]}</span>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="mt-4 flex justify-between gap-2">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => onStep(step - 1)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ← {L.prev}
              </button>
              <button
                type="button"
                onClick={() => (last ? onExit() : onStep(step + 1))}
                className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
              >
                {last ? `🎉 ${L.finish}` : `${L.next} →`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
