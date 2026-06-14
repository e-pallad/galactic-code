export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="h-8 w-48 bg-[#0d1520] rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg bg-[#0d1520]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-48 rounded-lg bg-[#0d1520]" />
        <div className="h-48 rounded-lg bg-[#0d1520]" />
      </div>
    </div>
  )
}
