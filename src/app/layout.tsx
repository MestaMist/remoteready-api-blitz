import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DbStatusBanner } from '@/components/common/DbStatusBanner';

export const metadata: Metadata = {
  title: 'RemoteReady | Career Dashboard for Remote Developers',
  description:
    'A unified remote job discovery engine, salary converter, tech trends radar, and smart application planner powered by 5 APIs and Neon PostgreSQL.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-navy-950 text-slate-100 min-h-screen flex antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <DbStatusBanner />
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
