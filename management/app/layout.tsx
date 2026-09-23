import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Airavat Security — Management System',
  description:
    'Internal management system for Airavat Security Service — guard registration, attendance tracking, and invoice generation.',
  icons: {
    icon: 'https://www.airavatsecurity.in/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
