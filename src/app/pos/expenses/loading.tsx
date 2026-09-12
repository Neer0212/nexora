export default function ExpensesLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="animate-pulse">
        <div className="h-10 bg-zinc-200 rounded-xl w-48 mb-2"></div>
        <div className="h-5 bg-zinc-200 rounded-lg w-64"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-white rounded-xl border border-zinc-200 p-6 animate-pulse"></div>
        ))}
      </div>
      <div className="h-[400px] bg-white rounded-xl border border-zinc-200 animate-pulse"></div>
    </div>
  )
}
