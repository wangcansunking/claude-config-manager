export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded" style={{ backgroundColor: 'var(--input-bg)' }} />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }} />
        ))}
      </div>
      <div className="h-64 rounded-lg" style={{ backgroundColor: 'var(--input-bg)' }} />
    </div>
  );
}
