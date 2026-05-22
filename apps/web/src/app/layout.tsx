import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Techub Arbitrades App',
  description: 'TRN/USDT Arbitrage Trading Bot - Poloniex & MEXC',
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
