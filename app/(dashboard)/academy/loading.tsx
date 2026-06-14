export default function AcademyLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="h-8 w-32 bg-[#0d1520] rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-[#0d1520]" />
        ))}
      </div>
    </div>
  )
}
