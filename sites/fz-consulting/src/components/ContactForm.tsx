'use client'

import { useState } from 'react'

type State = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm({ responseTime }: { responseTime: string }) {
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('sending')
    setError('')

    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || "L'envoi n'a pas abouti.")
      }
      setState('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi n'a pas abouti.")
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <p className="form-msg">
        <strong>Message reçu.</strong> {responseTime}
      </p>
    )
  }

  return (
    <form className="contact" onSubmit={onSubmit}>
      {/* Piège à robots : un humain ne remplit jamais ce champ. */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="f-site">Site web</label>
        <input id="f-site" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor="f-nom">Nom et prénom</label>
        <input id="f-nom" name="nom" type="text" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="f-ent">Entreprise</label>
        <input id="f-ent" name="entreprise" type="text" autoComplete="organization" />
      </div>
      <div className="field">
        <label htmlFor="f-con">E-mail ou téléphone</label>
        <input id="f-con" name="contact" type="text" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="f-suj">Sujet</label>
        <select id="f-suj" name="sujet" defaultValue="Diagnostic achats & supply chain">
          <option>Diagnostic achats &amp; supply chain</option>
          <option>Mission de conseil</option>
          <option>Formation intra-entreprise</option>
          <option>Formation inter-entreprises</option>
          <option>Autre</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-msg">Votre situation en quelques lignes</label>
        <textarea id="f-msg" name="message" />
      </div>

      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          J&apos;accepte que ces informations soient utilisées pour répondre à ma demande. Voir la{' '}
          <a href="/fr/confidentialite">politique de confidentialité</a>.
        </span>
      </label>

      {state === 'error' && <p className="form-msg err">{error}</p>}

      <div>
        <button className="btn btn-primary" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
      <p className="form-note">Protégé contre les envois automatisés.</p>
    </form>
  )
}
