'use client'

import { useMemo, useState } from 'react'
import { WhatsAppButton } from './ui'
import type { Diagnostic as DiagContent } from '@/lib/content'
import { flatten, score, type Answer } from '@/lib/diagnostic'

type Step = 'intro' | 'quiz' | 'result'
type Capture = 'idle' | 'sending' | 'sent' | 'error'

export default function Diagnostic({
  content,
  waHref,
}: {
  content: DiagContent
  waHref: string
}) {
  const questions = useMemo(() => flatten(content.phases), [content.phases])

  const [step, setStep] = useState<Step>('intro')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => null))

  const [capture, setCapture] = useState<Capture>('idle')
  const [captureError, setCaptureError] = useState('')

  const result = useMemo(() => score(content, answers), [content, answers])

  function answer(value: number) {
    const next = [...answers]
    next[current] = value
    setAnswers(next)

    if (current + 1 < questions.length) setCurrent(current + 1)
    else setStep('result')
  }

  function restart() {
    setAnswers(questions.map(() => null))
    setCurrent(0)
    setCapture('idle')
    setStep('intro')
  }

  async function sendDetail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCapture('sending')
    setCaptureError('')

    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          entreprise: form.get('entreprise'),
          consent: form.get('consent'),
          website: form.get('website'),
          score: result.pct,
          phases: result.phases.map((p) => ({ key: p.key, pct: p.pct })),
          answers,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "L'envoi n'a pas abouti.")
      }
      setCapture('sent')
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : "L'envoi n'a pas abouti.")
      setCapture('error')
    }
  }

  /* ---------------------------------------------------------------- intro */

  if (step === 'intro') {
    return (
      <div className="diag">
        <p className="eyebrow">Auto-diagnostic</p>
        <h1 className="sm">{content.title}</h1>
        <p className="sub">{content.subtitle}</p>
        <div className="diag-phases">
          {content.phases.map((p, i) => (
            <span key={p.key}>
              {i + 1}. {p.title}
            </span>
          ))}
        </div>
        <div className="cta-row">
          <button className="btn btn-primary" type="button" onClick={() => setStep('quiz')}>
            {content.start}
          </button>
        </div>
        <p className="form-note">{content.note}</p>
      </div>
    )
  }

  /* ----------------------------------------------------------------- quiz */

  if (step === 'quiz') {
    const q = questions[current]
    const pct = Math.round((current / questions.length) * 100)

    return (
      <div className="diag">
        <div className="diag-progress" role="group" aria-label="Progression">
          <div className="diag-progress-head">
            <span>
              {q.phase.title} · question {current + 1} sur {questions.length}
            </span>
            <span>{pct} %</span>
          </div>
          <div className="diag-track">
            <div className="diag-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <h2 className="diag-q">{q.question}</h2>

        <div className="diag-options">
          {content.scale.map((s) => (
            <button
              key={s.value}
              type="button"
              className={answers[current] === s.value ? 'diag-opt on' : 'diag-opt'}
              onClick={() => answer(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {current > 0 && (
          <button className="diag-back" type="button" onClick={() => setCurrent(current - 1)}>
            ← Question précédente
          </button>
        )}
      </div>
    )
  }

  /* --------------------------------------------------------------- résultat */

  return (
    <div className="diag">
      <p className="eyebrow">{content.resultTitle}</p>
      <div className="diag-score">
        <span className="diag-score-v">{result.pct}<small>/100</small></span>
        <div>
          <h2 style={{ marginBottom: '.5rem' }}>{result.band.title}</h2>
          <p>{result.band.body}</p>
        </div>
      </div>

      <div className="diag-bars">
        {result.phases.map((p) => (
          <div className="diag-bar" key={p.key}>
            <div className="diag-bar-head">
              <span>{p.title}</span>
              <span>{p.pct} %</span>
            </div>
            <div className="diag-track">
              <div className={p.weak ? 'diag-fill weak' : 'diag-fill'} style={{ width: `${p.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: '2.5rem' }}>{content.resultPriority}</h3>
      {result.priorities.length === 0 ? (
        <p>{content.resultNone}</p>
      ) : (
        <div className="diag-advice">
          {result.priorities.map((p) => (
            <div key={p.key}>
              <h4>
                {p.title} — {p.pct} %
              </h4>
              <p>{p.advice}</p>
              <p className="diag-offer">Offre correspondante — {p.offer}</p>
            </div>
          ))}
        </div>
      )}

      <div className="cta-row">
        <WhatsAppButton href={waHref}>{content.cta}</WhatsAppButton>
        <button className="btn btn-ghost" type="button" onClick={restart}>
          {content.restart}
        </button>
      </div>

      <div className="diag-capture">
        <h3>{content.capture.title}</h3>
        {capture === 'sent' ? (
          <p className="form-msg">{content.capture.success}</p>
        ) : (
          <>
            <p>{content.capture.body}</p>
            <form className="contact" onSubmit={sendDetail}>
              <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                <label htmlFor="d-site">Site web</label>
                <input id="d-site" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="d-mail">Adresse professionnelle</label>
                <input id="d-mail" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="field">
                <label htmlFor="d-ent">Entreprise</label>
                <input id="d-ent" name="entreprise" type="text" autoComplete="organization" />
              </div>
              <label className="consent">
                <input type="checkbox" name="consent" required />
                <span>{content.capture.consent}</span>
              </label>
              {capture === 'error' && <p className="form-msg err">{captureError}</p>}
              <div>
                <button className="btn btn-primary" type="submit" disabled={capture === 'sending'}>
                  {capture === 'sending' ? 'Envoi…' : content.capture.button}
                </button>
              </div>
              <p className="form-note">{content.capture.note}</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
