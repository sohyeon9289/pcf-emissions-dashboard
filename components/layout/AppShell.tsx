'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * AppShell — Drawer (모바일) + 고정 Sidebar (md 이상) + Topbar 레이아웃.
 *
 * 상태 경계:
 *  - layout state: 본 컴포넌트 안의 드로어 open/close.
 *  - filter/data state는 페이지·feature 모듈이 보유 (이곳에 침투 금지).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* 모바일 드로어 */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity',
            open ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          className={cn(
            'absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-border bg-card shadow-xl transition-transform',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      {/* 데스크탑 고정 사이드바 */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card md:block">
        <Sidebar />
      </aside>

      <div className="md:pl-64">
        <Topbar onOpenSidebar={() => setOpen(true)} />
        <main className="px-3 py-4 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
