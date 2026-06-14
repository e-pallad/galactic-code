export default function Loading() {
  return (
    <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[#06B6D4]/30" />
          <div className="absolute inset-0 rounded-full border-t-2 border-[#06B6D4] animate-spin" />
        </div>
        <p className="text-sm text-[#94a3b8] font-medium">Initializing Systems...</p>
      </div>
    </div>
  )
}
