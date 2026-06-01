import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IRON ACADEMY — Тести для тренера',
  description: 'Інтерактивні тести з анатомії та біомеханіки для фітнес-тренерів',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
