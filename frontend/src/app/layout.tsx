import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '双色球数据中心 - 历史开奖查询 & 智能选号',
  description: '双色球历史数据查询、走势分析、智能随机选号系统',
  keywords: '双色球,开奖查询,历史数据,走势分析,随机选号',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
