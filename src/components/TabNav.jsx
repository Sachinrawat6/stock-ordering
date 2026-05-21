export default function TabNav({ tabs, active, onChange, alertCount }) {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex gap-0 -mb-px overflow-x-auto">
        {tabs.map(tab => {
          const isActive = active === tab.id
          const showBadge = tab.badge && alertCount > 0
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              {showBadge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {alertCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
