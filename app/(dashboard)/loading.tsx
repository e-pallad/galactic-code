export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-[#1e2d3d]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-[#0d1520] border border-[#1e2d3d]" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-[#0d1520] border border-[#1e2d3d]" />
    </div>
  )
}
