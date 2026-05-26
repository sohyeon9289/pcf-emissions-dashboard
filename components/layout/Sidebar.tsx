'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ListChecks,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type NavItem = {
  href: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const ITEMS: NavItem[] = [
  { href: '/', label: '대시보드', description: '월별·Scope별 PCF 요약', icon: LayoutDashboard },
  { href: '/companies', label: '회사', description: '회사·국가 분포', icon: Building2 },
  { href: '/activities', label: '활동 데이터', description: '입력·수정·삭제', icon: ListChecks },
  { href: '/factors', label: '배출계수', description: '버전 이력 관리', icon: Sliders },
  { href: '/imports', label: 'Excel 임포트', description: '원본 그대로 업로드', icon: FileSpreadsheet },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주 메뉴"
      className="flex h-full w-full flex-col gap-1 overflow-y-auto p-3"
    >
      <div className="px-2 py-3">
        <Link
          href="/"
          className="block text-sm font-bold tracking-tight"
          onClick={onNavigate}
        >
          <span className="text-primary">PCF</span>
          <span className="ml-1 text-foreground">Emissions</span>
        </Link>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          Dashboard
        </p>
      </div>
      <ul className="flex-1 space-y-0.5">
        {ITEMS.map((it) => {
          const active = pathname === it.href || (it.href !== '/' && pathname?.startsWith(it.href));
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                onClick={onNavigate}
                className={cn(
                  'group flex items-start gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <Icon
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{it.label}</p>
                  {it.description ? (
                    <p
                      className={cn(
                        'truncate text-[11px]',
                        active ? 'text-primary/80' : 'text-muted-foreground',
                      )}
                    >
                      {it.description}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
