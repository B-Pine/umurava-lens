'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ScreeningProgressBanner from '../screening/ScreeningProgressBanner';
import { useAppSelector } from '../../store/hooks';

const PUBLIC_PREFIXES = ['/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { user, bootstrapped } = useAppSelector((s) => s.auth);

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (!bootstrapped) return;
    if (!isPublic && !user) {
      router.replace('/login');
    }
  }, [isPublic, user, bootstrapped, router]);

  // Public routes: render without admin chrome
  if (isPublic) {
    return <>{children}</>;
  }

  // Gate while auth bootstraps OR while redirecting
  if (!bootstrapped || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Umurava Lens...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <Topbar />
        <div className="pt-24 px-8 pb-12">{children}</div>
      </main>
      <ScreeningProgressBanner />
    </>
  );
}
