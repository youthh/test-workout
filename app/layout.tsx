import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';
import './globals.css';
import './program-editor.css';
import './program-print.css';
import './program-wizard.css';

export const metadata: Metadata = {
  title: 'IRON ACADEMY — Тести для тренера',
  description: 'Інтерактивні тести з анатомії та біомеханіки для фітнес-тренерів',
};

const THEME_SCRIPT = `try{if(localStorage.getItem('theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">{THEME_SCRIPT}</Script>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
