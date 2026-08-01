export default function Loader({ label = 'Loading…', full = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: full ? '25vh 0' : '48px 0',
      }}
    >
      <span className="spinner" />
      <span className="text-muted">{label}</span>
    </div>
  );
}
