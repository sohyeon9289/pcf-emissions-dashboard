'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="메뉴 열기"
          className="md:hidden"
          onClick={onOpenSidebar}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-sm font-semibold">PCF Emissions Dashboard</p>
          <p className="text-[10px] text-muted-foreground">
            제품 탄소 발자국 시각화 · GHG Scope 1/2/3
          </p>
        </div>
      </div>
    </header>
  );
}
