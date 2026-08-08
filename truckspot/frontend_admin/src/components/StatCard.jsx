import { Link } from 'react-router-dom';

export default function StatCard({ label, value, hint, icon, to, tone = 'accent' }) {
  const toneStyle =
    tone === 'accent'
      ? undefined
      : { background: `var(--${tone}-soft)`, color: `var(--${tone})` };

  const content = (
    <>
      <div className="stat-card__top">
        {icon && (
          <span className="stat-card__icon" style={toneStyle}>
            {icon}
          </span>
        )}
        <span className="stat-card__label">{label}</span>
      </div>
      <span className="stat-card__value">{value}</span>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="stat-card">
        {content}
      </Link>
    );
  }

  return <div className="stat-card">{content}</div>;
}
