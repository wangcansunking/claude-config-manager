export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-[#1e1e28]" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-[#1e1e28]" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-[#1e1e28]" />
    </div>
  );
}
