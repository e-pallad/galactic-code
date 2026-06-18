export default function ArmoryLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-40 bg-[#0d1520] rounded" />
        <div className="h-10 w-32 bg-[#0d1520] rounded" />
      </div>
      <div className="h-9 w-48 bg-[#0d1520] rounded" />
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-[#0d1520]" />
        ))}
      </div>
    </div>
  )
}
