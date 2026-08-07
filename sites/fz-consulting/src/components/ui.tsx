import type { ReactNode } from 'react'
import type { Case, Phase, Stat } from '@/lib/content'

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.3-1.7c-.2-.3 0-.4.1-.6l.4-.5a1.8 1.8 0 0 0 .3-.4.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2A5 5 0 0 0 8 12.3a11.4 11.4 0 0 0 4.4 3.9 14.8 14.8 0 0 0 1.5.5 3.5 3.5 0 0 0 1.6.1 2.7 2.7 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.2-.3-.2-.5-.3Z" />
    </svg>
  )
}

export function WhatsAppButton({
  href,
  children,
  className = 'btn btn-primary',
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a className={className} href={href} rel="noopener" target="_blank">
      <WhatsAppIcon />
      <span className="lbl">{children}</span>
    </a>
  )
}

export function Stats({ items }: { items: Stat[] }) {
  return (
    <div className="proof">
      {items.map((s) => (
        <div className="item" key={s.label}>
          <span className="v">{s.value}</span>
          <span className="l">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Phases({ items }: { items: Phase[] }) {
  return (
    <div className="phases">
      {items.map((p) => (
        <div className="phase" key={p.title}>
          <span className="n">{p.n}</span>
          <h3>{p.title}</h3>
          <p>{p.body}</p>
          <p className="deliv">{p.deliverable}</p>
        </div>
      ))}
    </div>
  )
}

export function CaseCard({
  item,
  ctaHref,
  ctaLabel,
  compact = false,
}: {
  item: Case
  ctaHref?: string
  ctaLabel?: string
  compact?: boolean
}) {
  return (
    <div className="case">
      <p className="tag">
        {item.draft && <span className="ex">À valider</span>}
        {item.tag}
      </p>
      <span className="figure">{item.figure ?? '—'}</span>
      <p className="figure-l">{item.figureLabel}</p>
      <dl>
        <dt>Contexte</dt>
        <dd>{item.context}</dd>
        <dt>Intervention</dt>
        <dd>{item.intervention}</dd>
        {!compact && (
          <>
            <dt>Résultat</dt>
            <dd>{item.result}</dd>
          </>
        )}
      </dl>
      {ctaHref && ctaLabel && !item.draft && (
        <a className="link" href={ctaHref} rel="noopener" target="_blank">
          {ctaLabel} →
        </a>
      )}
    </div>
  )
}
