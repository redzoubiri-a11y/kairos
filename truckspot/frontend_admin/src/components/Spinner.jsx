export default function Spinner({ size = 16, label }) {
  const circle = (
    <span
      className="spinner"
      style={{ width: size, height: size, borderWidth: size > 20 ? 3 : 2 }}
      aria-hidden="true"
    />
  );

  if (!label) return circle;

  return (
    <div className="spinner-block" role="status">
      {circle}
      <span>{label}</span>
    </div>
  );
}
