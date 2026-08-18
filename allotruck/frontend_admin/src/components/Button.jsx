import Spinner from './Spinner';

const VARIANTS = {
  default: '',
  primary: 'btn--primary',
  success: 'btn--success',
  danger: 'btn--danger',
  ghost: 'btn--ghost',
};

export default function Button({
  variant = 'default',
  size,
  block = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'btn',
    VARIANTS[variant] || '',
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <Spinner size={13} />}
      {children}
    </button>
  );
}
