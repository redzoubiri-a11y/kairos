import type { Diagnostic, DiagPhase } from './content'

export type Answer = number | null

export type PhaseScore = {
  key: string
  title: string
  /** Score en pourcentage du maximum atteignable sur la phase. */
  pct: number
  raw: number
  max: number
  weak: boolean
  advice: string
  offer: string
}

export type Result = {
  pct: number
  raw: number
  max: number
  band: { title: string; body: string }
  phases: PhaseScore[]
  /** Phases faibles, de la plus faible à la moins faible, trois au maximum. */
  priorities: PhaseScore[]
}

/** Seuil au-dessous duquel une phase est signalée comme chantier prioritaire. */
export const WEAK_BELOW = 60

/** Toutes les questions, à plat, dans l'ordre d'affichage. */
export function flatten(phases: DiagPhase[]) {
  return phases.flatMap((p, pi) =>
    p.questions.map((q, qi) => ({ phaseIndex: pi, phase: p, question: q, index: qi })),
  )
}

export function score(diag: Diagnostic, answers: Answer[]): Result {
  const maxPerAnswer = Math.max(...diag.scale.map((s) => s.value))
  let cursor = 0

  const phases: PhaseScore[] = diag.phases.map((p) => {
    const slice = answers.slice(cursor, cursor + p.questions.length)
    cursor += p.questions.length

    const raw = slice.reduce<number>((sum, a) => sum + (a ?? 0), 0)
    const max = p.questions.length * maxPerAnswer
    const pct = max === 0 ? 0 : Math.round((raw / max) * 100)

    return {
      key: p.key,
      title: p.title,
      pct,
      raw,
      max,
      weak: pct < WEAK_BELOW,
      advice: p.weakAdvice,
      offer: p.offer,
    }
  })

  const raw = phases.reduce((s, p) => s + p.raw, 0)
  const max = phases.reduce((s, p) => s + p.max, 0)
  const pct = max === 0 ? 0 : Math.round((raw / max) * 100)

  const band =
    diag.bands.find((b) => pct <= b.max) ?? diag.bands[diag.bands.length - 1]

  const priorities = phases
    .filter((p) => p.weak)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3)

  return { pct, raw, max, band, phases, priorities }
}
