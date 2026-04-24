import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '../store/Provider';
import AppShell from '../components/layout/AppShell';
import NavigationOriginProvider from '../components/layout/NavigationOrigin';

export const metadata: Metadata = {
  title: 'Umurava Lens | AI Talent Intelligence',
  description: 'AI-powered recruitment screening platform built for the Umurava AI Hackathon.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-surface text-on-surface font-[family-name:var(--font-body)]">
        <ReduxProvider>
          <NavigationOriginProvider>
            <AppShell>{children}</AppShell>
          </NavigationOriginProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
