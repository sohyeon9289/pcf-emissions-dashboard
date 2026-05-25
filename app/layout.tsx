import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PCF Emissions Dashboard',
  description: '활동 데이터에서 배출계수를 적용한 PCF(제품 탄소 발자국) 대시보드.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">{children}</body>
    </html>
  );
}
