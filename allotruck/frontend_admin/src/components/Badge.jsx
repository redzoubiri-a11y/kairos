export default function Badge({ tone = 'neutral', sealed = false, children }) {
  const classes = ['badge', `badge--${tone}`, sealed ? 'badge--sealed' : ''].filter(Boolean).join(' ');
  return <span className={classes}>{children}</span>;
}
