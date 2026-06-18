export default function FleetLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-36 bg-[#0d1520] rounded" />
      <div className="h-20 rounded-xl bg-[#0d1520]" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-[#0d1520]" />
        ))}
      </div>
    </div>
  )
}
