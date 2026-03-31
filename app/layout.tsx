import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dönerci POS — Bizim Dönerci',
  description: 'Dönerci POS sistemi — Sipariş, müşteri ve menü yönetimi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
