export default function BattleLoading() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-[#0d1520] rounded" />
        <div className="h-6 w-20 bg-[#0d1520] rounded" />
      </div>
      <div className="h-40 rounded-xl bg-[#0d1520]" />
      <div className="h-64 rounded-xl bg-[#0d1520]" />
      <div className="h-10 rounded-lg bg-[#0d1520]" />
    </div>
  )
}
