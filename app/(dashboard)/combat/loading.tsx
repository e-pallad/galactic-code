export default function CombatLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-10 w-52 bg-[#0d1520] rounded" />
      <div className="h-9 w-56 bg-[#0d1520] rounded" />
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl bg-[#0d1520]" />
        ))}
      </div>
    </div>
  )
}
