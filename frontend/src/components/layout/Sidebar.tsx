'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
  { label: 'Jobs', icon: 'work', href: '/jobs' },
  { label: 'Candidates', icon: 'group', href: '/candidates' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col border-r-0 bg-slate-50 z-[60]">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Umurava Lens" width={32} height={32} className="rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight font-[family-name:var(--font-headline)]">Umurava Lens</h1>
            <p className="text-[10px] uppercase tracking-widest text-on-primary-container font-semibold">AI Talent Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 transition-colors font-semibold tracking-tight ${
              isActive(item.href)
                ? 'text-indigo-600 font-bold border-r-4 border-indigo-600 bg-slate-100'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive(item.href) ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button className="w-full bg-secondary text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 hover:opacity-90 transition-all font-semibold text-sm">
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Source Talent</span>
        </button>
      </div>
    </aside>
  );
}
