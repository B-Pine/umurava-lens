'use client';

export default function Topbar() {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-50 flex justify-between items-center px-8 h-16 glass-header border-b border-slate-100 shadow-sm text-sm">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full focus:ring-2 focus:ring-secondary/20 transition-all text-on-surface"
            placeholder="Search for jobs or candidates..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
          <button className="text-slate-600 hover:text-indigo-500 transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="text-slate-600 hover:text-indigo-500 transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-semibold text-on-surface leading-none">Alex Sterling</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Senior Recruiter</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-secondary to-secondary-container flex items-center justify-center text-white font-bold text-sm">
            AS
          </div>
        </div>
      </div>
    </header>
  );
}
