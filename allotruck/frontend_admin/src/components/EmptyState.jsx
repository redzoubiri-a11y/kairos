export default function EmptyState({
  title = 'Aucun résultat',
  description,
  icon,
  action,
}) {
  return (
    <div className="empty">
      <div className="empty__icon">
        {icon || (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 7h18M3 12h18M3 17h10" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <p className="empty__title">{title}</p>
      {description && <p className="empty__desc">{description}</p>}
      {action}
    </div>
  );
}
