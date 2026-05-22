import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Techub Arbitrades',
  description: 'TRN/USDT Arbitrage Trading Bot - Poloniex & MEXC',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2D6A4F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-beige-gradient">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
