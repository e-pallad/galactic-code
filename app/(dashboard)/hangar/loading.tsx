export default function HangarLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 bg-[#0d1520] rounded" />
        <div className="h-8 w-28 bg-[#0d1520] rounded" />
      </div>
      <div className="h-40 rounded-xl bg-[#0d1520]" />
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[#0d1520]" />
        ))}
      </div>
    </div>
  )
}
